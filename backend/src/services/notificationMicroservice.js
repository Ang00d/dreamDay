/* ============================================
   DREAM DAY — Microservicio: NotificationService
   Práctica 2 — Microservicios + Patrón Factory
   
   Gestiona todas las notificaciones del sistema.
   Usa el patrón Factory para crear el tipo de
   notificación correcto según el canal solicitado.
   
   Canales: email, sms, llamada, push (simulados)
   ============================================ */

var logger = require('../config/logger');

// ═══════════════════════════════════════════════════════════════
// PATRÓN FACTORY — Crea notificadores según el canal
// ═══════════════════════════════════════════════════════════════

// ── Notificador base (interfaz) ──────────────────────────────
class Notificador {
  constructor(canal) {
    this.canal = canal;
  }
  async enviar(destinatario, asunto, contenido) {
    throw new Error('Método enviar() debe ser implementado por la subclase');
  }
}

// ── Email Notificador ────────────────────────────────────────
class EmailNotificador extends Notificador {
  constructor() { super('email'); }

  async enviar(destinatario, asunto, contenido) {
    logger.info('📧 [EMAIL SIMULADO] Notificación enviada', {
      context: { para: destinatario, asunto, canal: 'email' }
    });
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📧  EMAIL (SIMULADO)             ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:    ' + String(destinatario).padEnd(27) + '║');
    console.log('║  Asunto:  ' + String(asunto).substring(0, 27).padEnd(27) + '║');
    console.log('╚══════════════════════════════════════╝\n');
    return { enviado: true, canal: 'email', simulado: true };
  }
}

// ── SMS Notificador ──────────────────────────────────────────
class SMSNotificador extends Notificador {
  constructor() { super('sms'); }

  async enviar(destinatario, asunto, contenido) {
    logger.info('📱 [SMS SIMULADO] Notificación enviada', {
      context: { para: destinatario, contenido, canal: 'sms' }
    });
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📱  SMS (SIMULADO)               ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:    ' + String(destinatario).padEnd(27) + '║');
    console.log('║  Mensaje: ' + String(contenido).substring(0, 27).padEnd(27) + '║');
    console.log('╚══════════════════════════════════════╝\n');
    return { enviado: true, canal: 'sms', simulado: true };
  }
}

// ── Llamada Notificador ──────────────────────────────────────
class LlamadaNotificador extends Notificador {
  constructor() { super('llamada'); }

  async enviar(destinatario, asunto, contenido) {
    logger.info('📞 [LLAMADA SIMULADA] Notificación enviada', {
      context: { para: destinatario, contenido, canal: 'llamada' }
    });
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📞  LLAMADA (SIMULADO)           ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:    ' + String(destinatario).padEnd(27) + '║');
    console.log('║  Mensaje: ' + String(contenido).substring(0, 27).padEnd(27) + '║');
    console.log('╚══════════════════════════════════════╝\n');
    return { enviado: true, canal: 'llamada', simulado: true };
  }
}

// ── Push Notificador ─────────────────────────────────────────
class PushNotificador extends Notificador {
  constructor() { super('push'); }

  async enviar(destinatario, asunto, contenido) {
    logger.info('🔔 [PUSH SIMULADO] Notificación enviada', {
      context: { para: destinatario, asunto, canal: 'push' }
    });
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     🔔  PUSH (SIMULADO)              ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:    ' + String(destinatario).padEnd(27) + '║');
    console.log('║  Titulo:  ' + String(asunto).substring(0, 27).padEnd(27) + '║');
    console.log('╚══════════════════════════════════════╝\n');
    return { enviado: true, canal: 'push', simulado: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY — Crea el notificador correcto
// ═══════════════════════════════════════════════════════════════
class NotificadorFactory {
  static crear(canal) {
    switch (canal) {
      case 'email':   return new EmailNotificador();
      case 'sms':     return new SMSNotificador();
      case 'llamada': return new LlamadaNotificador();
      case 'push':    return new PushNotificador();
      default:
        throw new Error('Canal de notificación no soportado: ' + canal);
    }
  }

  static canalesDisponibles() {
    return ['email', 'sms', 'llamada', 'push'];
  }
}

// ═══════════════════════════════════════════════════════════════
// SERVICIO DE NOTIFICACIONES — API principal
// ═══════════════════════════════════════════════════════════════
var NotificationService = {

  // Enviar código MFA
  async enviarCodigoMFA(destinatario, codigo, canal) {
    canal = canal || 'email';
    var notificador = NotificadorFactory.crear(canal);
    return await notificador.enviar(
      destinatario,
      'Tu código de verificación Dream Day',
      'Tu código es: ' + codigo + ' (expira en 10 min)'
    );
  },

  // Enviar link de recuperación
  async enviarRecuperacion(destinatario, token, nombre, canal) {
    canal = canal || 'email';
    var link = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/admin/reset-password?token=' + token;
    var notificador = NotificadorFactory.crear(canal);

    // Para email: enviar link; para SMS/llamada: enviar código
    if (canal === 'email') {
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║     📧  RECUPERACIÓN DE CONTRASEÑA (SIMULADO)    ║');
      console.log('╠══════════════════════════════════════════════════╣');
      console.log('║  Para:    ' + String(destinatario).padEnd(40) + '║');
      console.log('║  Nombre:  ' + String(nombre || '').padEnd(40) + '║');
      console.log('║  Link completo:');
      console.log('║  ' + link);
      console.log('║  Expira:  30 minutos                              ║');
      console.log('╚══════════════════════════════════════════════════╝\n');
      return { enviado: true, canal: 'email', simulado: true, link };
    }

    return await notificador.enviar(destinatario, 'Recuperación', 'Tu código: ' + token);
  },

  // Enviar notificación genérica
  async enviar(canal, destinatario, asunto, contenido) {
    var notificador = NotificadorFactory.crear(canal);
    return await notificador.enviar(destinatario, asunto, contenido);
  },

  // Enviar a múltiples canales
  async enviarMultiple(canales, destinatario, asunto, contenido) {
    var resultados = [];
    for (var i = 0; i < canales.length; i++) {
      try {
        var resultado = await this.enviar(canales[i], destinatario, asunto, contenido);
        resultados.push(resultado);
      } catch (err) {
        resultados.push({ canal: canales[i], enviado: false, error: err.message });
      }
    }
    return resultados;
  }
};

module.exports = NotificationService;
module.exports.NotificadorFactory = NotificadorFactory;
module.exports.Notificador = Notificador;
