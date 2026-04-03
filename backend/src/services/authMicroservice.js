/* ============================================
   DREAM DAY — Microservicio: AuthService
   Práctica 2 — Microservicios
   
   Centraliza toda la lógica de autenticación,
   tokens, MFA y sesiones. Las rutas solo llaman
   a este servicio — nunca acceden a BD directamente.
   
   Patrón: Service Layer + Repository
   ============================================ */

var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var { usuarioRepository, sessionRepository } = require('../repositories');
var MfaCode = require('../models/MfaCode');
var RefreshToken = require('../models/RefreshToken');
var PasswordReset = require('../models/PasswordReset');
var logger = require('../config/logger');

var AuthService = {

  // ── Login: validar credenciales ────────────────────────────
  async validarCredenciales(email, password) {
    var usuario = await usuarioRepository.findByEmail(email);
    if (!usuario || !usuario.activo) {
      return { valido: false, error: 'Credenciales inválidas.' };
    }

    if (usuario.estaBloqueado()) {
      var minutos = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
      return { valido: false, error: 'Cuenta bloqueada. Espera ' + minutos + ' minutos.', bloqueado: true };
    }

    var passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000);
        usuario.intentosFallidos = 0;
        logger.warn('Cuenta bloqueada por fuerza bruta', { context: { email } });
      }
      await usuario.save();
      return { valido: false, error: 'Credenciales inválidas.' };
    }

    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();

    return { valido: true, usuario };
  },

  // ── Generar par de tokens (access + refresh) ───────────────
  async generarTokens(usuario, req) {
    var tokenId = crypto.randomUUID();
    var expRefresh = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    var accessToken = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol, jti: tokenId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    var sesion = await sessionRepository.create({
      usuarioId: usuario._id,
      tokenId: tokenId,
      ip: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      dispositivo: this.detectarDispositivo(req.headers['user-agent']),
      expiracion: expRefresh
    });

    var refreshTokenStr = crypto.randomBytes(32).toString('hex');
    await RefreshToken.create({
      usuarioId: usuario._id,
      token: refreshTokenStr,
      sessionId: sesion._id,
      expiracion: expRefresh
    });

    return { accessToken, refreshToken: refreshTokenStr, sesionId: sesion._id };
  },

  // ── Renovar tokens ─────────────────────────────────────────
  async renovarTokens(refreshToken, req) {
    var rtDoc = await RefreshToken.findOne({ token: refreshToken, usado: false });
    if (!rtDoc || rtDoc.expiracion < new Date()) {
      return { valido: false, error: 'Refresh token inválido o expirado.' };
    }

    rtDoc.usado = true;
    await rtDoc.save();
    await sessionRepository.updateOne({ _id: rtDoc.sessionId }, { activa: false });

    var usuario = await usuarioRepository.findById(rtDoc.usuarioId);
    if (!usuario || !usuario.activo) {
      return { valido: false, error: 'Usuario no disponible.' };
    }

    var tokens = await this.generarTokens(usuario, req);
    return { valido: true, tokens };
  },

  // ── MFA: generar y enviar OTP ──────────────────────────────
  async generarOTP(usuarioId, tipo) {
    await MfaCode.deleteMany({ usuarioId, tipo });
    var otp = String(Math.floor(100000 + Math.random() * 900000));
    await MfaCode.create({ usuarioId, codigo: otp, tipo });
    return otp;
  },

  // ── MFA: verificar OTP ─────────────────────────────────────
  async verificarOTP(usuarioId, codigo, tipo) {
    var mfaDoc = await MfaCode.findOne({ usuarioId, tipo, usado: false });
    if (!mfaDoc) {
      return { valido: false, error: 'Código expirado o inválido.' };
    }

    mfaDoc.intentos = (mfaDoc.intentos || 0) + 1;
    if (mfaDoc.intentos > 3) {
      await MfaCode.deleteOne({ _id: mfaDoc._id });
      return { valido: false, error: 'Demasiados intentos. Solicita un nuevo código.' };
    }

    if (mfaDoc.codigo !== String(codigo).trim()) {
      await mfaDoc.save();
      return { valido: false, error: 'Código incorrecto.' };
    }

    mfaDoc.usado = true;
    await mfaDoc.save();
    return { valido: true };
  },

  // ── Recuperación de contraseña ─────────────────────────────
  async solicitarRecuperacion(email, metodo) {
    var usuario = await usuarioRepository.findByEmail(email);
    if (!usuario || !usuario.activo) return { token: null };

    await PasswordReset.deleteMany({ usuarioId: usuario._id });
    var token = crypto.randomBytes(32).toString('hex');
    await PasswordReset.create({ usuarioId: usuario._id, token, tipo: metodo });

    return { token, usuario };
  },

  async resetearPassword(token, nuevaPassword) {
    var resetDoc = await PasswordReset.findOne({ token, usado: false });
    if (!resetDoc) return { valido: false, error: 'Token inválido o expirado.' };

    var usuario = await usuarioRepository.findById(resetDoc.usuarioId);
    if (!usuario) return { valido: false, error: 'Usuario no encontrado.' };

    usuario.password = nuevaPassword;
    await usuario.save();

    resetDoc.usado = true;
    await resetDoc.save();

    await sessionRepository.updateMany({ usuarioId: usuario._id }, { activa: false });
    return { valido: true };
  },

  // ── Utilidad ───────────────────────────────────────────────
  detectarDispositivo(userAgent) {
    if (!userAgent) return 'Desconocido';
    if (/mobile/i.test(userAgent)) return 'Móvil';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Computadora';
  }
};

module.exports = AuthService;
