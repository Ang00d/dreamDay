/* ============================================
   DREAM DAY — Rutas: Sessions
   Práctica 3 — Gestión de multisesiones
   
   GET    /api/auth/sessions           — Listar sesiones activas
   DELETE /api/auth/sessions/:id       — Cerrar sesión específica
   DELETE /api/auth/sessions           — Cerrar todas las demás sesiones
   
   Fix: ahora invalida refresh tokens al cerrar sesiones
   para que el otro navegador no pueda re-autenticarse.
   ============================================ */
var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Session = require('../models/Session');
var RefreshToken = require('../models/RefreshToken');
var logger = require('../config/logger');

// Todas las rutas requieren autenticación
router.use(auth);

/* ── GET /api/auth/sessions ────────────────────────────────── */
router.get('/', async function (req, res, next) {
  try {
    var sesiones = await Session.find({
      usuarioId: req.usuario._id,
      activa: true,
      expiracion: { $gt: new Date() }
    }).sort({ ultimaActividad: -1 });

    // Marcar cuál es la sesión actual
    var sesionesConActual = sesiones.map(function (s) {
      return {
        id: s._id,
        ip: s.ip,
        dispositivo: s.dispositivo,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        ultimaActividad: s.ultimaActividad,
        esActual: s.tokenId === req.tokenId
      };
    });

    res.json({ data: sesionesConActual });
  } catch (err) { next(err); }
});

/* ── DELETE /api/auth/sessions/:id ────────────────────────── */
router.delete('/:id', async function (req, res, next) {
  try {
    var sesion = await Session.findOne({
      _id: req.params.id,
      usuarioId: req.usuario._id
    });

    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada.' });
    }

    // No permitir cerrar la sesión actual desde aquí
    if (sesion.tokenId === req.tokenId) {
      return res.status(400).json({ error: 'Usa /logout para cerrar tu sesión actual.' });
    }

    // Desactivar la sesión
    sesion.activa = false;
    await sesion.save();

    // Invalidar TODOS los refresh tokens de esa sesión
    await RefreshToken.updateMany(
      { sessionId: sesion._id, usado: false },
      { usado: true }
    );

    logger.info('Sesión remota cerrada (+ refresh tokens invalidados)', {
      context: { usuarioId: req.usuario._id, sesionId: sesion._id }
    });

    res.json({ data: { mensaje: 'Sesión cerrada correctamente.' } });
  } catch (err) { next(err); }
});

/* ── DELETE /api/auth/sessions ─────────────────────────────── */
// Cerrar todas las sesiones excepto la actual
router.delete('/', async function (req, res, next) {
  try {
    // Obtener IDs de las sesiones que se van a cerrar
    var sesionesACerrar = await Session.find({
      usuarioId: req.usuario._id,
      activa: true,
      tokenId: { $ne: req.tokenId }
    }).select('_id');

    var idsSessiones = sesionesACerrar.map(function (s) { return s._id; });

    // Desactivar sesiones
    var resultado = await Session.updateMany(
      {
        usuarioId: req.usuario._id,
        activa: true,
        tokenId: { $ne: req.tokenId }
      },
      { activa: false }
    );

    // Invalidar refresh tokens de esas sesiones
    if (idsSessiones.length > 0) {
      await RefreshToken.updateMany(
        { sessionId: { $in: idsSessiones }, usado: false },
        { usado: true }
      );
    }

    logger.info('Todas las otras sesiones cerradas (+ refresh tokens)', {
      context: { usuarioId: req.usuario._id, cerradas: resultado.modifiedCount }
    });

    res.json({
      data: { mensaje: resultado.modifiedCount + ' sesión(es) cerrada(s).' }
    });
  } catch (err) { next(err); }
});

module.exports = router;
