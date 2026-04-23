/* ============================================
   DREAM DAY — Rutas: Orden del día (Admin)
   
   GET /api/admin/orden-del-dia?fecha=YYYY-MM-DD
   
   Retorna todas las cotizaciones confirmadas para
   esa fecha con información logística completa para
   que el staff pueda operar el día del evento.
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Cotizacion = require('../models/Cotizacion');
var logger = require('../config/logger');

// Todas las rutas requieren autenticacion
router.use(auth);

/**
 * GET /api/admin/orden-del-dia?fecha=2026-04-20
 * Retorna las cotizaciones confirmadas para esa fecha,
 * ordenadas por hora de inicio.
 */
router.get('/', async function (req, res, next) {
  try {
    var fecha = req.query.fecha;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Fecha inválida. Formato: YYYY-MM-DD' });
    }

    var eventos = await Cotizacion.find({
      'evento.fecha': fecha,
      estado: 'confirmada'
    })
      .populate('servicios.servicioId', 'nombre duracionHoras tipoPrecio requisitoMinimo incluye notas categoria')
      .sort({ 'evento.horaInicio': 1 });

    // Calcular estadísticas del día
    var totalEventos = eventos.length;
    var totalPersonas = 0;
    var totalServicios = 0;

    eventos.forEach(function (ev) {
      totalPersonas += ev.evento.personas || 0;
      totalServicios += (ev.servicios || []).length;
    });

    logger.info('Orden del día consultada', {
      correlationId: req.correlationId,
      context: {
        fecha: fecha,
        eventos: totalEventos,
        adminId: req.usuario._id
      }
    });

    res.json({
      data: {
        fecha: fecha,
        totalEventos: totalEventos,
        totalPersonas: totalPersonas,
        totalServicios: totalServicios,
        eventos: eventos
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
