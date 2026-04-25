/* ============================================
   DREAM DAY — Servicio: Google Calendar
   
   Crea eventos en Google Calendar al confirmar
   cotizaciones. Elimina eventos al cancelar.
   
   Usa cuenta de servicio (JWT) para autenticarse.
   Si las credenciales no están configuradas,
   simplemente no hace nada (feature opcional).
   
   Variables de entorno requeridas:
   - GOOGLE_CALENDAR_ID
   - GOOGLE_SERVICE_ACCOUNT_EMAIL
   - GOOGLE_PRIVATE_KEY
   ============================================ */

var { google } = require('googleapis');
var fs = require('fs');
var path = require('path');
var logger = require('../config/logger');

var CREDENTIALS_PATH = path.join(__dirname, '../../google-credentials.json');

/**
 * Verificar si Google Calendar está configurado.
 * Funciona con:
 * - Archivo google-credentials.json en backend/ (local)
 * - Variable GOOGLE_CREDENTIALS con el JSON completo (producción)
 */
function estaConfigurado() {
  if (!process.env.GOOGLE_CALENDAR_ID) return false;
  if (fs.existsSync(CREDENTIALS_PATH)) return true;
  if (process.env.GOOGLE_CREDENTIALS) return true;
  return false;
}

/**
 * Obtener cliente autenticado de Google Calendar
 */
async function obtenerCliente() {
  if (!estaConfigurado()) return null;

  var authOptions = {
    scopes: ['https://www.googleapis.com/auth/calendar']
  };

  // Opción 1: archivo JSON local
  if (fs.existsSync(CREDENTIALS_PATH)) {
    authOptions.keyFile = CREDENTIALS_PATH;
  }
  // Opción 2: variable de entorno con JSON completo (producción/Render)
  else if (process.env.GOOGLE_CREDENTIALS) {
    try {
      var creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      authOptions.credentials = creds;
    } catch (e) {
      logger.error('Error parseando GOOGLE_CREDENTIALS', { error: e.message });
      return null;
    }
  }

  var auth = new google.auth.GoogleAuth(authOptions);
  var client = await auth.getClient();
  return google.calendar({ version: 'v3', auth: client });
}

/**
 * Sumar horas a un string HH:mm
 */
function sumarHoras(horaStr, horas) {
  if (!horaStr) return '12:00';
  var partes = horaStr.split(':');
  var h = parseInt(partes[0]) || 12;
  var m = parseInt(partes[1]) || 0;
  var totalMin = h * 60 + m + Math.round(horas * 60);
  if (totalMin < 0) totalMin = 0;
  var nh = Math.floor(totalMin / 60);
  var nm = totalMin % 60;
  return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0');
}

/**
 * Crear evento en Google Calendar al confirmar cotización
 * 
 * @param {Object} cotizacion - Cotización confirmada (con populate de servicios)
 * @returns {String|null} - ID del evento creado, o null si falla
 */
async function crearEvento(cotizacion) {
  if (!estaConfigurado()) {
    logger.info('Google Calendar no configurado, saltando creación de evento');
    return null;
  }

  try {
    var calendar = await obtenerCliente();
    if (!calendar) return null;

    var cliente = cotizacion.cliente || {};
    var evento = cotizacion.evento || {};
    var servicios = cotizacion.servicios || [];

    var horaInicio = evento.horaInicio || '12:00';

    // Calcular duración máxima para el fin del evento
    var maxDuracion = 2;
    servicios.forEach(function (s) {
      var dur = 2;
      if (s.servicioId && s.servicioId.duracionHoras) {
        dur = s.servicioId.duracionHoras;
      }
      if (dur > maxDuracion) maxDuracion = dur;
    });

    var horaFin = sumarHoras(horaInicio, maxDuracion);

    // Construir lista de servicios para la descripción
    var listaServicios = servicios.map(function (s, idx) {
      var nombre = s.nombre || (s.servicioId && s.servicioId.nombre) || 'Servicio';
      return (idx + 1) + '. ' + nombre + ' (x' + (s.cantidad || 1) + ')';
    }).join('\n');

    // Descripción del evento
    var descripcion =
      'COTIZACION: ' + cotizacion.codigoReferencia + '\n' +
      '---\n' +
      'CLIENTE: ' + (cliente.nombre || '-') + '\n' +
      'TEL: ' + (cliente.telefono || '-') + '\n' +
      'EMAIL: ' + (cliente.email || '-') + '\n' +
      'PERSONAS: ' + (evento.personas || '-') + '\n' +
      'UBICACION: ' + (evento.ubicacion || '-') + '\n' +
      (evento.codigoPostal ? 'CP: ' + evento.codigoPostal + '\n' : '') +
      '---\n' +
      'SERVICIOS:\n' + listaServicios +
      (evento.notas ? '\n---\nNOTAS: ' + evento.notas : '');

    // Título del evento
    var titulo = 'Dream Day - ' + (cliente.nombre || 'Evento') +
      ' (' + (evento.personas || '?') + ' pers.) - ' +
      cotizacion.codigoReferencia;

    var eventoGoogle = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: {
        summary: titulo,
        description: descripcion,
        location: evento.ubicacion || '',
        start: {
          dateTime: evento.fecha + 'T' + horaInicio + ':00',
          timeZone: 'America/Mexico_City'
        },
        end: {
          dateTime: evento.fecha + 'T' + horaFin + ':00',
          timeZone: 'America/Mexico_City'
        },
        colorId: '9', // Azul uva (Dream Day color)
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 1440 }, // 1 día antes
            { method: 'popup', minutes: 120 }    // 2 horas antes
          ]
        }
      }
    };

    var resultado = await calendar.events.insert(eventoGoogle);

    logger.info('Evento creado en Google Calendar', {
      context: {
        googleEventId: resultado.data.id,
        cotizacion: cotizacion.codigoReferencia,
        fecha: evento.fecha
      }
    });

    return resultado.data.id;

  } catch (err) {
    logger.error('Error creando evento en Google Calendar', {
      error: { message: err.message, stack: err.stack },
      cotizacion: cotizacion.codigoReferencia
    });
    return null;
  }
}

/**
 * Eliminar evento de Google Calendar al cancelar cotización
 * 
 * @param {String} googleEventId - ID del evento en Google Calendar
 * @returns {Boolean} - true si se eliminó correctamente
 */
async function eliminarEvento(googleEventId) {
  if (!estaConfigurado() || !googleEventId) return false;

  try {
    var calendar = await obtenerCliente();
    if (!calendar) return false;

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      eventId: googleEventId
    });

    logger.info('Evento eliminado de Google Calendar', {
      context: { googleEventId: googleEventId }
    });

    return true;

  } catch (err) {
    logger.error('Error eliminando evento de Google Calendar', {
      error: { message: err.message },
      googleEventId: googleEventId
    });
    return false;
  }
}

module.exports = {
  estaConfigurado: estaConfigurado,
  crearEvento: crearEvento,
  eliminarEvento: eliminarEvento
};
