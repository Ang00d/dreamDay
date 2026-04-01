/* ============================================
   DREAM DAY — Rutas: Sessions
   Práctica 3 — Gestión de multisesiones
   
   GET    /api/auth/sessions           — Listar sesiones activas
   DELETE /api/auth/sessions/:id       — Cerrar sesión específica
   DELETE /api/auth/sessions           — Cerrar todas las demás sesiones
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Session = require('../models/Session');
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

    sesion.activa = false;
    await sesion.save();

    logger.info('Sesión remota cerrada', {
      context: { usuarioId: req.usuario._id, sesionId: sesion._id }
    });

    res.json({ data: { mensaje: 'Sesión cerrada correctamente.' } });
  } catch (err) { next(err); }
});

/* ── DELETE /api/auth/sessions ─────────────────────────────── */
// Cerrar todas las sesiones excepto la actual
router.delete('/', async function (req, res, next) {
  try {
    var resultado = await Session.updateMany(
      {
        usuarioId: req.usuario._id,
        activa: true,
        tokenId: { $ne: req.tokenId }
      },
      { activa: false }
    );

    logger.info('Todas las otras sesiones cerradas', {
      context: { usuarioId: req.usuario._id, cerradas: resultado.modifiedCount }
    });

    res.json({
      data: { mensaje: resultado.modifiedCount + ' sesión(es) cerrada(s).' }
    });
  } catch (err) { next(err); }
});

module.exports = router;
