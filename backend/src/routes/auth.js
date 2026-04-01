/* ============================================
   DREAM DAY — Rutas: Auth
   Práctica 3 — Sistema completo de autenticación
   
   POST /api/auth/login              — Login (paso 1)
   POST /api/auth/mfa/verificar      — Verificar OTP (paso 2)
   POST /api/auth/refresh            — Renovar access token
   POST /api/auth/logout             — Cerrar sesión actual
   GET  /api/auth/me                 — Datos del usuario actual
   POST /api/auth/password/solicitar — Solicitar recuperación
   POST /api/auth/password/reset     — Cambiar contraseña con token
   POST /api/auth/password/cambiar   — Cambiar contraseña (autenticado)
   POST /api/auth/pregunta-secreta   — Guardar pregunta secreta
   POST /api/auth/pregunta-secreta/verificar — Verificar pregunta
   ============================================ */

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var rateLimit = require('express-rate-limit');
var Usuario = require('../models/Usuario');
var Session = require('../models/Session');
var RefreshToken = require('../models/RefreshToken');
var MfaCode = require('../models/MfaCode');
var PasswordReset = require('../models/PasswordReset');
var auth = require('../middleware/auth');
var emailService = require('../services/emailService');
var logger = require('../config/logger');

// Rate limit estricto para login
var loginLimiter = rateLimit({
  keyGenerator: function(req) { return req.ip + "_login"; },
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit separado para recuperación de contraseña
var recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: { error: 'Demasiadas solicitudes de recuperación. Espera 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false
});


// Generar código OTP de 6 dígitos
function generarOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Generar token único seguro
function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Detectar dispositivo desde User-Agent
function detectarDispositivo(userAgent) {
  if (!userAgent) return 'Desconocido';
  if (/mobile/i.test(userAgent)) return 'Móvil';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Computadora';
}

// Generar par de tokens (access + refresh)
async function generarTokens(usuario, req) {
  var tokenId = crypto.randomUUID();
  var ahora = new Date();
  var expAccess = new Date(ahora.getTime() + 15 * 60 * 1000);    // 15 min
  var expRefresh = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días

  // Access token con jti para revocación
  var accessToken = jwt.sign(
    { id: usuario._id, email: usuario.email, rol: usuario.rol, jti: tokenId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Crear sesión en BD
  var sesion = await Session.create({
    usuarioId: usuario._id,
    tokenId: tokenId,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || '',
    dispositivo: detectarDispositivo(req.headers['user-agent']),
    expiracion: expRefresh
  });

  // Refresh token
  var refreshTokenStr = generarToken();
  await RefreshToken.create({
    usuarioId: usuario._id,
    token: refreshTokenStr,
    sessionId: sesion._id,
    expiracion: expRefresh
  });

  return { accessToken, refreshToken: refreshTokenStr, sesionId: sesion._id };
}

/* ── POST /api/auth/login ──────────────────────────────────── */
router.post('/login', loginLimiter, async function (req, res, next) {
  try {
    var { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    var usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Verificar bloqueo por fuerza bruta
    if (usuario.estaBloqueado()) {
      var minutosRestantes = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
      return res.status(429).json({
        error: 'Cuenta bloqueada por demasiados intentos. Espera ' + minutosRestantes + ' minutos.'
      });
    }

    var passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      // Incrementar intentos fallidos
      usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
      if (usuario.intentosFallidos >= 5) {
        usuario.bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        usuario.intentosFallidos = 0;
        logger.warn('Cuenta bloqueada por fuerza bruta', { context: { email } });
      }
      await usuario.save();
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Resetear intentos fallidos
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();

    // Si tiene MFA activo → enviar OTP y esperar verificación
    if (usuario.mfaActivo) {
      // Eliminar códigos anteriores del mismo usuario
      await MfaCode.deleteMany({ usuarioId: usuario._id, tipo: 'login' });

      var otp = generarOTP();
      await MfaCode.create({ usuarioId: usuario._id, codigo: otp, tipo: 'login' });
      await emailService.enviarCodigoMFA(usuario.email, otp);

      logger.info('MFA requerido — OTP enviado', { context: { email, usuarioId: usuario._id } });

      return res.json({
        data: {
          mfaRequerido: true,
          usuarioId: usuario._id,
          mensaje: 'Se envió un código de verificación a tu correo electrónico.'
        }
      });
    }

    // Sin MFA → generar tokens directamente
    var tokens = await generarTokens(usuario, req);
    usuario.ultimoLogin = new Date();
    await usuario.save();

    logger.info('Login exitoso', { context: { email, rol: usuario.rol } });

    res.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          mfaActivo: usuario.mfaActivo,
          preferencias: usuario.preferencias
        }
      }
    });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/mfa/verificar ──────────────────────────── */
router.post('/mfa/verificar', async function (req, res, next) {
  try {
    var { usuarioId, codigo } = req.body;
    if (!usuarioId || !codigo) {
      return res.status(400).json({ error: 'usuarioId y código son obligatorios.' });
    }

    var mfaDoc = await MfaCode.findOne({ usuarioId, tipo: 'login', usado: false });
    if (!mfaDoc) {
      return res.status(400).json({ error: 'Código expirado o inválido. Inicia sesión de nuevo.' });
    }

    // Limitar intentos
    mfaDoc.intentos = (mfaDoc.intentos || 0) + 1;
    if (mfaDoc.intentos > 3) {
      await MfaCode.deleteOne({ _id: mfaDoc._id });
      return res.status(429).json({ error: 'Demasiados intentos. Solicita un nuevo código.' });
    }

    if (mfaDoc.codigo !== String(codigo).trim()) {
      await mfaDoc.save();
      return res.status(401).json({ error: 'Código incorrecto.' });
    }

    mfaDoc.usado = true;
    await mfaDoc.save();

    var usuario = await Usuario.findById(usuarioId);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no disponible.' });
    }

    var tokens = await generarTokens(usuario, req);
    usuario.ultimoLogin = new Date();
    await usuario.save();

    logger.info('MFA verificado — Login completo', { context: { usuarioId } });

    res.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          mfaActivo: usuario.mfaActivo,
          preferencias: usuario.preferencias
        }
      }
    });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/refresh ────────────────────────────────── */
router.post('/refresh', async function (req, res, next) {
  try {
    var { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido.' });
    }

    var rtDoc = await RefreshToken.findOne({ token: refreshToken, usado: false });
    if (!rtDoc || rtDoc.expiracion < new Date()) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado.' });
    }

    // Invalidar el refresh token usado (rotación)
    rtDoc.usado = true;
    await rtDoc.save();

    // Desactivar la sesión anterior
    await Session.findByIdAndUpdate(rtDoc.sessionId, { activa: false });

    var usuario = await Usuario.findById(rtDoc.usuarioId);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no disponible.' });
    }

    // Generar nuevos tokens
    var tokens = await generarTokens(usuario, req);

    logger.info('Tokens renovados', { context: { usuarioId: usuario._id } });

    res.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/logout ─────────────────────────────────── */
router.post('/logout', auth, async function (req, res, next) {
  try {
    // Revocar sesión actual
    if (req.tokenId) {
      await Session.findOneAndUpdate({ tokenId: req.tokenId }, { activa: false });
    }

    logger.info('Logout exitoso', { context: { usuarioId: req.usuario._id } });
    res.json({ data: { mensaje: 'Sesión cerrada correctamente.' } });
  } catch (err) { next(err); }
});

/* ── GET /api/auth/me ──────────────────────────────────────── */
router.get('/me', auth, function (req, res) {
  res.json({
    data: {
      id: req.usuario._id,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      mfaActivo: req.usuario.mfaActivo,
      telefono: req.usuario.telefono,
      preferencias: req.usuario.preferencias,
      ultimoLogin: req.usuario.ultimoLogin
    }
  });
});

/* ── POST /api/auth/password/solicitar ────────────────────── */
router.post('/password/solicitar', recoveryLimiter, async function (req, res, next) {
  try {
    var { email, metodo } = req.body;
    // metodo: 'email' | 'sms' | 'llamada'
    var metodoValido = ['email', 'sms', 'llamada'].includes(metodo) ? metodo : 'email';

    var usuario = await Usuario.findOne({ email: email ? email.toLowerCase().trim() : '' });

    // Respuesta genérica por seguridad (no revelar si existe el email)
    var respuestaGenerica = { data: { mensaje: 'Si el correo existe, recibirás instrucciones.' } };

    if (!usuario || !usuario.activo) {
      return res.json(respuestaGenerica);
    }

    // Eliminar tokens anteriores
    await PasswordReset.deleteMany({ usuarioId: usuario._id });

    var token = generarToken();
    await PasswordReset.create({ usuarioId: usuario._id, token, tipo: metodoValido });

    if (metodoValido === 'email') {
      await emailService.enviarRecuperacion(usuario.email, token, usuario.nombre);
    } else if (metodoValido === 'sms') {
      var otp = generarOTP();
      // Guardamos el OTP como token para validarlo después
      await PasswordReset.findOneAndUpdate({ token }, { token: otp });
      await emailService.enviarSMS(usuario.telefono || usuario.email, otp);
    } else if (metodoValido === 'llamada') {
      var otpVoz = generarOTP();
      await PasswordReset.findOneAndUpdate({ token }, { token: otpVoz });
      await emailService.enviarLlamada(usuario.telefono || usuario.email, otpVoz);
    }

    logger.info('Recuperación de contraseña solicitada', { context: { email, metodo: metodoValido } });
    res.json(respuestaGenerica);
  } catch (err) { next(err); }
});

/* ── POST /api/auth/password/reset ────────────────────────── */
router.post('/password/reset', async function (req, res, next) {
  try {
    var { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son obligatorios.' });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres.' });
    }

    var resetDoc = await PasswordReset.findOne({ token, usado: false });
    if (!resetDoc) {
      return res.status(400).json({ error: 'Token inválido o expirado.' });
    }

    var usuario = await Usuario.findById(resetDoc.usuarioId);
    if (!usuario) {
      return res.status(400).json({ error: 'Usuario no encontrado.' });
    }

    usuario.password = nuevaPassword;
    await usuario.save();

    // Invalidar token
    resetDoc.usado = true;
    await resetDoc.save();

    // Cerrar todas las sesiones activas por seguridad
    await Session.updateMany({ usuarioId: usuario._id }, { activa: false });

    logger.info('Contraseña restablecida', { context: { usuarioId: usuario._id } });
    res.json({ data: { mensaje: 'Contraseña actualizada correctamente. Inicia sesión de nuevo.' } });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/password/cambiar ──────────────────────── */
router.post('/password/cambiar', auth, async function (req, res, next) {
  try {
    var { passwordActual, nuevaPassword } = req.body;
    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son obligatorias.' });
    }

    var usuario = await Usuario.findById(req.usuario._id);
    var valido = await usuario.compararPassword(passwordActual);
    if (!valido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'Mínimo 6 caracteres.' });
    }

    usuario.password = nuevaPassword;
    await usuario.save();

    logger.info('Contraseña cambiada', { context: { usuarioId: usuario._id } });
    res.json({ data: { mensaje: 'Contraseña actualizada correctamente.' } });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/pregunta-secreta ──────────────────────── */
router.post('/pregunta-secreta', auth, async function (req, res, next) {
  try {
    var { pregunta, respuesta } = req.body;
    if (!pregunta || !respuesta) {
      return res.status(400).json({ error: 'Pregunta y respuesta son obligatorias.' });
    }

    var salt = await bcrypt.genSalt(10);
    var respuestaHash = await bcrypt.hash(respuesta.toLowerCase().trim(), salt);

    await Usuario.findByIdAndUpdate(req.usuario._id, {
      preguntaSecreta: { pregunta, respuestaHash }
    });

    res.json({ data: { mensaje: 'Pregunta secreta guardada.' } });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/pregunta-secreta/verificar ────────────── */
router.post('/pregunta-secreta/verificar', recoveryLimiter, async function (req, res, next) {
  try {
    var { email, respuesta } = req.body;
    var usuario = await Usuario.findOne({ email: email ? email.toLowerCase().trim() : '' })
      .select('+preguntaSecreta');

    if (!usuario || !usuario.preguntaSecreta || !usuario.preguntaSecreta.respuestaHash) {
      return res.status(400).json({ error: 'No se encontró pregunta secreta configurada.' });
    }

    var valido = await bcrypt.compare(respuesta.toLowerCase().trim(), usuario.preguntaSecreta.respuestaHash);
    if (!valido) {
      return res.status(401).json({ error: 'Respuesta incorrecta.' });
    }

    // Generar token de reset
    var token = generarToken();
    await PasswordReset.create({ usuarioId: usuario._id, token, tipo: 'pregunta_secreta' });

    res.json({ data: { token, mensaje: 'Respuesta correcta. Ahora puedes cambiar tu contraseña.' } });
  } catch (err) { next(err); }
});

module.exports = router;
