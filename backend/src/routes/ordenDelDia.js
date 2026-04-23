/* ============================================
   DREAM DAY — Rutas: Orden del día (Admin)
   
   GET /api/admin/orden-del-dia?fecha=YYYY-MM-DD
   
   Retorna cotizaciones confirmadas con horarios
   de entrega/recolección calculados.
   
   Reglas:
   - Comida/Bebidas: entrega 1h ANTES (montaje)
   - Todo lo demás: entrega a la hora del evento
   - Recoger: horaInicio + duracionHoras
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Cotizacion = require('../models/Cotizacion');
var Servicio = require('../models/Servicio');
var logger = require('../config/logger');

router.use(auth);

/**
 * Sumar horas a "HH:mm" → "HH:mm"
 */
function sumarHoras(horaStr, horas) {
  if (!horaStr || typeof horaStr !== 'string') return '--:--';
  var partes = horaStr.split(':');
  var h = parseInt(partes[0]);
  var m = parseInt(partes[1]) || 0;
  if (isNaN(h)) return '--:--';
  var totalMin = h * 60 + m + Math.round(horas * 60);
  if (totalMin < 0) totalMin = 0;
  var nh = Math.floor(totalMin / 60);
  var nm = totalMin % 60;
  return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0');
}

router.get('/', async function (req, res, next) {
  try {
    var fecha = req.query.fecha;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Fecha inválida. Formato: YYYY-MM-DD' });
    }

    // Buscar cotizaciones confirmadas para esa fecha
    var cotizaciones = await Cotizacion.find({
      'evento.fecha': fecha,
      estado: 'confirmada'
    }).sort({ 'evento.horaInicio': 1 });

    var totalEventos = cotizaciones.length;
    var totalPersonas = 0;
    var numServicioGlobal = 0;

    // Para cada cotización, resolver los servicios manualmente
    // (populate anidado en Mongoose 9 puede fallar con subdocumentos)
    var eventosProcessados = [];

    for (var e = 0; e < cotizaciones.length; e++) {
      var cot = cotizaciones[e];
      totalPersonas += cot.evento.personas || 0;
      var horaInicio = cot.evento.horaInicio || '12:00';

      var serviciosDelEvento = [];

      for (var s = 0; s < cot.servicios.length; s++) {
        numServicioGlobal++;
        var servCot = cot.servicios[s];

        // Buscar el servicio completo en la BD con su categoría
        var servDB = null;
        try {
          servDB = await Servicio.findById(servCot.servicioId)
            .populate('categoria', 'nombre slug')
            .select('nombre duracionHoras categoria contenido')
            .lean();
        } catch (err) {
          // Si no se encuentra, usar datos de la cotización
        }

        var nombre = (servDB && servDB.nombre) || servCot.nombre || '—';
        var duracion = (servDB && servDB.duracionHoras) || 2;
        var contenido = (servDB && servDB.contenido) || '';
        var catSlug = (servDB && servDB.categoria && servDB.categoria.slug) || '';
        var catNombre = (servDB && servDB.categoria && servDB.categoria.nombre) || '';

        // Regla: Comida y Bebidas → 1h antes para montaje
        var necesitaMontaje = catSlug === 'comida' || catSlug === 'bebidas';
        var horaEntrega = necesitaMontaje
          ? sumarHoras(horaInicio, -1)
          : horaInicio;
        var horaRecoger = sumarHoras(horaInicio, duracion);

        serviciosDelEvento.push({
          numero: numServicioGlobal,
          nombre: nombre,
          cantidad: servCot.cantidad || 1,
          categoria: catNombre,
          duracionHoras: duracion,
          contenido: contenido,
          horaEntrega: horaEntrega,
          horaRecoger: horaRecoger,
          necesitaMontaje: necesitaMontaje
        });
      }

      eventosProcessados.push({
        codigoReferencia: cot.codigoReferencia,
        cliente: {
          nombre: cot.cliente.nombre,
          telefono: cot.cliente.telefono
        },
        evento: {
          horaInicio: horaInicio,
          personas: cot.evento.personas,
          ubicacion: cot.evento.ubicacion,
          notas: cot.evento.notas
        },
        servicios: serviciosDelEvento
      });
    }

    logger.info('Orden del día consultada', {
      correlationId: req.correlationId,
      context: { fecha: fecha, eventos: totalEventos, adminId: req.usuario._id }
    });

    res.json({
      data: {
        fecha: fecha,
        totalEventos: totalEventos,
        totalPersonas: totalPersonas,
        totalServicios: numServicioGlobal,
        eventos: eventosProcessados
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
