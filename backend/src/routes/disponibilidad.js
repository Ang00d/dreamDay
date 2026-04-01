/* ============================================
   DREAM DAY — Rutas: Disponibilidad (publicas)
   
   GET /api/disponibilidad?fecha=YYYY-MM-DD              — Estado de un dia
   GET /api/disponibilidad/mes?anio=2026&mes=3            — Calendario del mes
   GET /api/disponibilidad/servicio/:id?fecha=YYYY-MM-DD  — Servicio en fecha
   ============================================ */

var express = require('express');
var router = express.Router();
var Disponibilidad = require('../models/Disponibilidad');
var Servicio = require('../models/Servicio');
var logger = require('../config/logger');

/**
 * GET /api/disponibilidad?fecha=2026-03-15
 * Obtener estado de disponibilidad para una fecha
 * Retorna servicios ocupados/bloqueados ese dia
 */
router.get('/', async function (req, res, next) {
  try {
    var fecha = req.query.fecha;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Fecha invalida. Formato: YYYY-MM-DD' });
    }

    var ocupados = await Disponibilidad.find({
      fecha: fecha,
      estado: { $ne: 'disponible' }
    }).select('servicioId estado -_id');

    // Determinar color del dia para el calendario
    var totalServicios = await Servicio.countDocuments({ activo: true });
    var totalOcupados = ocupados.length;

    var color;
    if (totalOcupados === 0) {
      color = 'verde';       // 🟢 Todo disponible
    } else if (totalOcupados < totalServicios) {
      color = 'amarillo';    // 🟡 Algunos ocupados
    } else {
      color = 'rojo';        // 🔴 Todo ocupado
    }

    res.json({
      data: {
        fecha: fecha,
        color: color,
        serviciosOcupados: ocupados,
        totalOcupados: totalOcupados,
        totalServicios: totalServicios
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/disponibilidad/mes?anio=2026&mes=3
 * Obtener calendario del mes completo con colores
 */
router.get('/mes', async function (req, res, next) {
  try {
    var anio = parseInt(req.query.anio);
    var mes = parseInt(req.query.mes);

    if (!anio || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Parametros invalidos. Enviar anio y mes (1-12).' });
    }

    // Generar rango de fechas del mes
    var mesStr = String(mes).padStart(2, '0');
    var diasEnMes = new Date(anio, mes, 0).getDate();
    var fechaInicio = anio + '-' + mesStr + '-01';
    var fechaFin = anio + '-' + mesStr + '-' + String(diasEnMes).padStart(2, '0');

    // Buscar todas las reservas del mes
    var ocupaciones = await Disponibilidad.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $ne: 'disponible' }
    }).select('fecha servicioId estado -_id');

    var totalServicios = await Servicio.countDocuments({ activo: true });

    // Contar ocupaciones por dia
    var ocupadosPorDia = {};
    ocupaciones.forEach(function (o) {
      if (!ocupadosPorDia[o.fecha]) ocupadosPorDia[o.fecha] = 0;
      ocupadosPorDia[o.fecha]++;
    });

    // Generar calendario con colores
    var calendario = [];
    for (var dia = 1; dia <= diasEnMes; dia++) {
      var fechaDia = anio + '-' + mesStr + '-' + String(dia).padStart(2, '0');
      var numOcupados = ocupadosPorDia[fechaDia] || 0;

      var color;
      if (numOcupados === 0) {
        color = 'verde';
      } else if (numOcupados < totalServicios) {
        color = 'amarillo';
      } else {
        color = 'rojo';
      }

      calendario.push({
        fecha: fechaDia,
        dia: dia,
        color: color,
        ocupados: numOcupados
      });
    }

    logger.info('Calendario consultado', {
      correlationId: req.correlationId,
      context: { anio: anio, mes: mes }
    });

    res.json({
      data: {
        anio: anio,
        mes: mes,
        totalServicios: totalServicios,
        calendario: calendario
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/disponibilidad/servicio/:id?fecha=2026-03-15
 * Verificar si un servicio especifico esta disponible en una fecha
 */
router.get('/servicio/:id', async function (req, res, next) {
  try {
    var servicioId = req.params.id;
    var fecha = req.query.fecha;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: 'Fecha invalida. Formato: YYYY-MM-DD' });
    }

    // Obtener el servicio para conocer su capacidadDiaria
    var servicio = await Servicio.findById(servicioId).select('capacidadDiaria tipoDisponibilidad');
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    var capacidad = servicio.capacidadDiaria || 1;

    // Verificar si hay bloqueo admin (siempre bloquea sin importar capacidad)
    var bloqueado = await Disponibilidad.findOne({
      servicioId: servicioId,
      fecha: fecha,
      estado: 'bloqueado_admin'
    });

    if (bloqueado) {
      return res.json({
        data: {
          servicioId: servicioId,
          fecha: fecha,
          disponible: false,
          estado: 'bloqueado_admin',
          capacidadDiaria: capacidad,
          ocupados: capacidad
        }
      });
    }

    // Contar cuántas cotizaciones confirmadas hay ese día
    var ocupados = await Disponibilidad.countDocuments({
      servicioId: servicioId,
      fecha: fecha,
      estado: 'ocupado'
    });

    var disponible = ocupados < capacidad;

    res.json({
      data: {
        servicioId: servicioId,
        fecha: fecha,
        disponible: disponible,
        estado: disponible ? 'disponible' : 'ocupado',
        capacidadDiaria: capacidad,
        ocupados: ocupados
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
