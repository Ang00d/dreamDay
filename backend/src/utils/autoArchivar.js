/* ============================================
   DREAM DAY — Utilidad: Auto-archivar cotizaciones
   
   Las cotizaciones pendientes o en negociación
   cuya fecha de evento ya pasó se marcan como
   "vencida" automáticamente.
   
   Se ejecuta:
   1. Al iniciar el servidor
   2. Cada 6 horas automáticamente
   
   Uso en server.js:
     require('./utils/autoArchivar').iniciar();
   ============================================ */

var Cotizacion = require('../models/Cotizacion');
var Disponibilidad = require('../models/Disponibilidad');
var logger = require('../config/logger');

var INTERVALO_HORAS = 6;

async function archivarVencidas() {
  try {
    var hoy = new Date().toISOString().split('T')[0];

    // Buscar cotizaciones pendientes o en negociación con fecha pasada
    var vencidas = await Cotizacion.find({
      estado: { $in: ['pendiente', 'en_negociacion'] },
      'evento.fecha': { $lt: hoy }
    });

    if (vencidas.length === 0) {
      return { archivadas: 0 };
    }

    // Marcar como canceladas (vencidas)
    var ids = vencidas.map(function (c) { return c._id; });

    await Cotizacion.updateMany(
      { _id: { $in: ids } },
      {
        estado: 'cancelada',
        notasAdmin: function () { return ''; } // No se puede usar function aquí, se hace abajo
      }
    );

    // Actualizar notasAdmin individualmente para agregar motivo
    for (var i = 0; i < vencidas.length; i++) {
      var cot = vencidas[i];
      var notaExistente = cot.notasAdmin || '';
      var nuevaNota = notaExistente
        ? notaExistente + '\n[Auto] Vencida: la fecha del evento (' + cot.evento.fecha + ') ya pasó.'
        : '[Auto] Vencida: la fecha del evento (' + cot.evento.fecha + ') ya pasó.';

      await Cotizacion.updateOne(
        { _id: cot._id },
        { estado: 'cancelada', notasAdmin: nuevaNota }
      );

      // Liberar disponibilidad si tenía alguna reserva
      for (var j = 0; j < cot.servicios.length; j++) {
        await Disponibilidad.deleteOne({
          servicioId: cot.servicios[j].servicioId,
          fecha: cot.evento.fecha,
          citaId: cot._id
        });
      }
    }

    logger.info('Auto-archivar: cotizaciones vencidas procesadas', {
      context: {
        archivadas: vencidas.length,
        codigos: vencidas.map(function (c) { return c.codigoReferencia; })
      }
    });

    return { archivadas: vencidas.length };

  } catch (err) {
    logger.error('Error en auto-archivar cotizaciones', {
      error: { message: err.message, stack: err.stack }
    });
    return { archivadas: 0, error: err.message };
  }
}

// También limpiar registros de disponibilidad huérfanos
// (registros que apuntan a cotizaciones que ya no existen o fueron canceladas)
async function limpiarDisponibilidadHuerfana() {
  try {
    var hoy = new Date().toISOString().split('T')[0];

    // Eliminar registros de disponibilidad de fechas pasadas (excepto bloqueos admin)
    var resultado = await Disponibilidad.deleteMany({
      fecha: { $lt: hoy },
      estado: 'ocupado'
    });

    if (resultado.deletedCount > 0) {
      logger.info('Limpieza: registros de disponibilidad pasados eliminados', {
        context: { eliminados: resultado.deletedCount }
      });
    }

    return { eliminados: resultado.deletedCount };

  } catch (err) {
    logger.error('Error limpiando disponibilidad huérfana', {
      error: { message: err.message }
    });
    return { eliminados: 0 };
  }
}

// Ejecutar ambas tareas
async function ejecutar() {
  logger.info('Auto-archivar: iniciando limpieza...');
  var archivado = await archivarVencidas();
  var limpieza = await limpiarDisponibilidadHuerfana();
  return { archivado, limpieza };
}

// Iniciar el proceso periódico
function iniciar() {
  // Ejecutar al iniciar (con delay de 10 segundos para que la BD esté lista)
  setTimeout(function () {
    ejecutar().then(function (result) {
      if (result.archivado.archivadas > 0 || result.limpieza.eliminados > 0) {
        console.log('🧹 Auto-archivar: ' + result.archivado.archivadas + ' cotizaciones vencidas, ' + result.limpieza.eliminados + ' registros limpiados');
      }
    });
  }, 10000);

  // Ejecutar periódicamente
  setInterval(function () {
    ejecutar();
  }, INTERVALO_HORAS * 60 * 60 * 1000);

  logger.info('Auto-archivar: programado cada ' + INTERVALO_HORAS + ' horas');
}

module.exports = { iniciar, ejecutar, archivarVencidas, limpiarDisponibilidadHuerfana };
