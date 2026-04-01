/* ============================================
   DREAM DAY — Rutas: Configuración de Usuario
   Práctica 3 — Settings del perfil
   
   GET   /api/auth/settings            — Obtener configuración
   PATCH /api/auth/settings            — Actualizar preferencias
   POST  /api/auth/mfa/activar         — Activar MFA (envía OTP)
   POST  /api/auth/mfa/confirmar       — Confirmar activación MFA
   POST  /api/auth/mfa/desactivar      — Desactivar MFA
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Usuario = require('../models/Usuario');
var MfaCode = require('../models/MfaCode');
var emailService = require('../services/emailService');
var logger = require('../config/logger');

router.use(auth);

function generarOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ── GET /api/auth/settings ────────────────────────────────── */
router.get('/', function (req, res) {
  var u = req.usuario;
  res.json({
    data: {
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      telefono: u.telefono || '',
      mfaActivo: u.mfaActivo,
      preferencias: u.preferencias,
      tienePreguntaSecreta: !!(u.preguntaSecreta && u.preguntaSecreta.pregunta),
      ultimoLogin: u.ultimoLogin
    }
  });
});

/* ── PATCH /api/auth/settings ──────────────────────────────── */
router.patch('/', async function (req, res, next) {
  try {
    var { nombre, telefono, preferencias } = req.body;
    var usuario = await Usuario.findById(req.usuario._id);

    if (nombre && nombre.trim().length >= 2) usuario.nombre = nombre.trim();
    if (telefono !== undefined) usuario.telefono = telefono.trim();
    if (preferencias) {
      if (preferencias.tema) usuario.preferencias.tema = preferencias.tema;
      if (preferencias.idioma) usuario.preferencias.idioma = preferencias.idioma;
    }

    await usuario.save();
    logger.info('Configuración actualizada', { context: { usuarioId: usuario._id } });

    res.json({ data: { mensaje: 'Configuración guardada.' } });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/mfa/activar ────────────────────────────── */
router.post('/mfa/activar', async function (req, res, next) {
  try {
    if (req.usuario.mfaActivo) {
      return res.status(400).json({ error: 'El MFA ya está activo.' });
    }

    await MfaCode.deleteMany({ usuarioId: req.usuario._id, tipo: 'activar_mfa' });
    var otp = generarOTP();
    await MfaCode.create({ usuarioId: req.usuario._id, codigo: otp, tipo: 'activar_mfa' });
    await emailService.enviarCodigoMFA(req.usuario.email, otp);

    res.json({ data: { mensaje: 'Código enviado a tu correo. Ingrésalo para activar el MFA.' } });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/mfa/confirmar ──────────────────────────── */
router.post('/mfa/confirmar', async function (req, res, next) {
  try {
    var { codigo } = req.body;
    var mfaDoc = await MfaCode.findOne({ usuarioId: req.usuario._id, tipo: 'activar_mfa', usado: false });

    if (!mfaDoc || mfaDoc.codigo !== String(codigo).trim()) {
      return res.status(401).json({ error: 'Código incorrecto o expirado.' });
    }

    mfaDoc.usado = true;
    await mfaDoc.save();

    await Usuario.findByIdAndUpdate(req.usuario._id, { mfaActivo: true });

    logger.info('MFA activado', { context: { usuarioId: req.usuario._id } });
    res.json({ data: { mensaje: 'MFA activado correctamente.' } });
  } catch (err) { next(err); }
});

/* ── POST /api/auth/mfa/desactivar ─────────────────────────── */
router.post('/mfa/desactivar', async function (req, res, next) {
  try {
    var { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Se requiere tu contraseña para desactivar MFA.' });

    var usuario = await Usuario.findById(req.usuario._id);
    var valido = await usuario.compararPassword(password);
    if (!valido) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    await Usuario.findByIdAndUpdate(req.usuario._id, { mfaActivo: false });

    logger.info('MFA desactivado', { context: { usuarioId: req.usuario._id } });
    res.json({ data: { mensaje: 'MFA desactivado.' } });
  } catch (err) { next(err); }
});

module.exports = router;
