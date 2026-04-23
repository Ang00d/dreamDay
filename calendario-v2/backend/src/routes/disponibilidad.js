/* ============================================
   DREAM DAY — Rutas: Disponibilidad (publicas)
   
   GET /api/disponibilidad?fecha=YYYY-MM-DD              — Estado de un dia
   GET /api/disponibilidad/mes?anio=2026&mes=3            — Calendario del mes
   GET /api/disponibilidad/mes-carrito?anio=X&mes=Y&servicios=id1,id2  — Calendario filtrado por servicios del carrito
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
 * GET /api/disponibilidad/mes-carrito?anio=2026&mes=4&servicios=id1,id2,id3
 * Calendario del mes filtrado por servicios específicos del carrito.
 * 
 * Combina DOS fuentes de datos:
 * 1. Disponibilidad (ocupado/bloqueado_admin) — confirmaciones y bloqueos
 * 2. Cotizaciones pendientes/en_negociación — solicitudes activas
 * 
 * Colores basados SOLO en los servicios enviados:
 *   🟢 verde: todos disponibles, sin solicitudes
 *   🟡 amarillo: algunos ocupados o con solicitudes pendientes
 *   🔴 rojo: todos los servicios del carrito ocupados/bloqueados
 */
router.get('/mes-carrito', async function (req, res, next) {
  try {
    var anio = parseInt(req.query.anio);
    var mes = parseInt(req.query.mes);
    var serviciosParam = req.query.servicios;

    if (!anio || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'Parametros invalidos. Enviar anio y mes (1-12).' });
    }

    if (!serviciosParam) {
      return res.status(400).json({ error: 'Enviar servicios como IDs separados por coma.' });
    }

    var serviciosIds = serviciosParam.split(',').filter(function (id) { return id.trim(); });

    if (serviciosIds.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un servicio.' });
    }

    // ★ Castear explícitamente a ObjectId para evitar problemas con $in
    var mongoose = require('mongoose');
    var serviciosObjectIds = [];
    for (var idx = 0; idx < serviciosIds.length; idx++) {
      try {
        serviciosObjectIds.push(new mongoose.Types.ObjectId(serviciosIds[idx].trim()));
      } catch (e) {
        // ID inválido, ignorar
      }
    }

    if (serviciosObjectIds.length === 0) {
      return res.status(400).json({ error: 'IDs de servicios invalidos.' });
    }

    var totalCarrito = serviciosObjectIds.length;

    // Generar rango de fechas del mes
    var mesStr = String(mes).padStart(2, '0');
    var diasEnMes = new Date(anio, mes, 0).getDate();
    var fechaInicio = anio + '-' + mesStr + '-01';
    var fechaFin = anio + '-' + mesStr + '-' + String(diasEnMes).padStart(2, '0');

    // ★ FUENTE 1: Registros de Disponibilidad (confirmados + bloqueados)
    var ocupaciones = await Disponibilidad.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      servicioId: { $in: serviciosObjectIds },
      estado: { $ne: 'disponible' }
    }).select('fecha servicioId estado -_id');

    // ★ FUENTE 2: Cotizaciones pendientes/en negociación que incluyen estos servicios
    var Cotizacion = require('../models/Cotizacion');
    var cotizacionesActivas = await Cotizacion.find({
      'evento.fecha': { $gte: fechaInicio, $lte: fechaFin },
      'servicios.servicioId': { $in: serviciosObjectIds },
      estado: { $in: ['pendiente', 'en_negociacion'] }
    }).select('evento.fecha servicios.servicioId -_id');

    // Contar servicios afectados por día (sin duplicar el mismo servicio)
    var ocupadosPorDia = {};

    // Registros de Disponibilidad (confirmados/bloqueados) — peso fuerte
    ocupaciones.forEach(function (o) {
      var f = o.fecha;
      if (!ocupadosPorDia[f]) ocupadosPorDia[f] = { confirmados: new Set(), pendientes: new Set() };
      ocupadosPorDia[f].confirmados.add(o.servicioId.toString());
    });

    // Cotizaciones activas (pendientes/negociación) — peso informativo
    cotizacionesActivas.forEach(function (cot) {
      var f = cot.evento.fecha;
      if (!ocupadosPorDia[f]) ocupadosPorDia[f] = { confirmados: new Set(), pendientes: new Set() };
      cot.servicios.forEach(function (s) {
        var sid = s.servicioId.toString();
        // Solo contar si es uno de los servicios del carrito
        var esDelCarrito = serviciosObjectIds.some(function (oid) {
          return oid.toString() === sid;
        });
        if (esDelCarrito) {
          ocupadosPorDia[f].pendientes.add(sid);
        }
      });
    });

    // Generar calendario con colores
    var calendario = [];
    for (var dia = 1; dia <= diasEnMes; dia++) {
      var fechaDia = anio + '-' + mesStr + '-' + String(dia).padStart(2, '0');
      var datos = ocupadosPorDia[fechaDia];
      var numConfirmados = datos ? datos.confirmados.size : 0;
      var numPendientes = datos ? datos.pendientes.size : 0;
      var totalAfectados = numConfirmados + numPendientes;

      var color;
      if (numConfirmados >= totalCarrito) {
        color = 'rojo';          // Todos confirmados → rojo
      } else if (numConfirmados > 0) {
        color = 'amarillo';      // Algunos confirmados → amarillo
      } else if (numPendientes > 0) {
        color = 'amarillo';      // Solo pendientes → amarillo (informativo)
      } else {
        color = 'verde';         // Nada → verde
      }

      calendario.push({
        fecha: fechaDia,
        dia: dia,
        color: color,
        ocupados: numConfirmados,
        pendientes: numPendientes
      });
    }

    logger.info('Calendario carrito consultado', {
      correlationId: req.correlationId,
      context: { anio: anio, mes: mes, servicios: totalCarrito }
    });

    res.json({
      data: {
        anio: anio,
        mes: mes,
        totalServicios: totalCarrito,
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
