/* ============================================
   DREAM DAY — Utilidad: Auto-archivar cotizaciones
   
   Tareas automáticas periódicas:
   
   1. ARCHIVAR: Cotizaciones pendientes/en_negociacion con
      fecha de evento pasada → estado 'cancelada' (vencidas).
   
   2. COMPLETAR: Cotizaciones confirmadas cuya fecha de evento
      ya pasó (ayer o antes) → estado 'completada'.
      Se usa "ayer o antes" para dar margen: aunque el evento
      haya sido en la noche, al pasar todo el día completo ya
      es seguro marcar como completada (incluye recolección
      de equipos post-evento).
   
   3. LIMPIEZA: Registros de disponibilidad pasados.
   
   Se ejecuta:
   - Al iniciar el servidor
   - Cada 6 horas automáticamente
   
   Uso en server.js:
     require('./utils/autoArchivar').iniciar();
   ============================================ */

var Cotizacion = require('../models/Cotizacion');
var Disponibilidad = require('../models/Disponibilidad');
var logger = require('../config/logger');

var INTERVALO_HORAS = 6;

/**
 * Retorna la fecha de AYER en formato YYYY-MM-DD.
 * Todo evento cuya fecha sea < hoy (es decir, hasta ayer inclusive)
 * ya puede ser marcado como completado, porque ya pasó
 * todo el día del evento (incluye tiempo post para recoger).
 */
function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

async function archivarVencidas() {
  try {
    var hoy = fechaHoy();

    // Buscar cotizaciones pendientes o en negociación con fecha pasada
    var vencidas = await Cotizacion.find({
      estado: { $in: ['pendiente', 'en_negociacion'] },
      'evento.fecha': { $lt: hoy }
    });

    if (vencidas.length === 0) {
      return { archivadas: 0 };
    }

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

/**
 * Marcar como 'completada' las cotizaciones confirmadas
 * cuyo día de evento ya pasó completo.
 * 
 * Condición: evento.fecha < hoy (es decir, ayer o antes).
 * Esto garantiza que pasó el día completo, cubriendo tanto
 * la entrega del servicio como la recolección posterior.
 */
async function completarConfirmadasPasadas() {
  try {
    var hoy = fechaHoy();

    var confirmadasPasadas = await Cotizacion.find({
      estado: 'confirmada',
      'evento.fecha': { $lt: hoy }
    });

    if (confirmadasPasadas.length === 0) {
      return { completadas: 0 };
    }

    for (var i = 0; i < confirmadasPasadas.length; i++) {
      var cot = confirmadasPasadas[i];
      var notaExistente = cot.notasAdmin || '';
      var notaAuto = '[Auto] Completada: el evento del ' + cot.evento.fecha + ' ya concluyó.';
      var nuevaNota = notaExistente
        ? notaExistente + '\n' + notaAuto
        : notaAuto;

      await Cotizacion.updateOne(
        { _id: cot._id },
        { estado: 'completada', notasAdmin: nuevaNota }
      );
    }

    logger.info('Auto-completar: confirmadas pasadas marcadas como completadas', {
      context: {
        completadas: confirmadasPasadas.length,
        codigos: confirmadasPasadas.map(function (c) { return c.codigoReferencia; })
      }
    });

    return { completadas: confirmadasPasadas.length };

  } catch (err) {
    logger.error('Error en auto-completar cotizaciones', {
      error: { message: err.message, stack: err.stack }
    });
    return { completadas: 0, error: err.message };
  }
}

// Limpiar registros de disponibilidad huérfanos (fechas pasadas)
async function limpiarDisponibilidadHuerfana() {
  try {
    var hoy = fechaHoy();

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

// Ejecutar todas las tareas
async function ejecutar() {
  logger.info('Auto-archivar: iniciando tareas periódicas...');
  var archivado = await archivarVencidas();
  var completado = await completarConfirmadasPasadas();
  var limpieza = await limpiarDisponibilidadHuerfana();
  return { archivado, completado, limpieza };
}

// Iniciar el proceso periódico
function iniciar() {
  setTimeout(function () {
    ejecutar().then(function (result) {
      var tieneActividad =
        (result.archivado && result.archivado.archivadas > 0) ||
        (result.completado && result.completado.completadas > 0) ||
        (result.limpieza && result.limpieza.eliminados > 0);

      if (tieneActividad) {
        console.log('🧹 Auto-archivar: ' +
          (result.archivado.archivadas || 0) + ' vencidas, ' +
          (result.completado.completadas || 0) + ' completadas, ' +
          (result.limpieza.eliminados || 0) + ' registros limpiados');
      }
    });
  }, 10000);

  setInterval(function () {
    ejecutar();
  }, INTERVALO_HORAS * 60 * 60 * 1000);

  logger.info('Auto-archivar: programado cada ' + INTERVALO_HORAS + ' horas');
}

module.exports = {
  iniciar,
  ejecutar,
  archivarVencidas,
  completarConfirmadasPasadas,
  limpiarDisponibilidadHuerfana
};
