/* ============================================
   DREAM DAY — Servicio: Email
   
   En producción: envía emails reales con Gmail SMTP
   En desarrollo: simula en consola
   ============================================ */

var nodemailer = require('nodemailer');
var logger = require('../config/logger');

// ── Configurar transporter de Gmail ──────────────────────────
var transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  logger.info('Email: configurado con Gmail SMTP', { context: { user: process.env.EMAIL_USER } });
} else {
  logger.info('Email: modo simulado (sin EMAIL_USER/EMAIL_PASS)');
}

// ── Enviar email real o simulado ─────────────────────────────
async function enviarEmail(para, asunto, html) {
  // Si hay transporter configurado → enviar real
  if (transporter) {
    try {
      var info = await transporter.sendMail({
        from: '"Dream Day" <' + process.env.EMAIL_USER + '>',
        to: para,
        subject: asunto,
        html: html
      });
      logger.info('Email enviado correctamente', { context: { para, asunto, messageId: info.messageId } });
      return { enviado: true, simulado: false, messageId: info.messageId };
    } catch (err) {
      logger.error('Error enviando email', { error: { message: err.message } });
      // Fallback a simulado si falla
      console.log('\n⚠️  Error enviando email: ' + err.message);
    }
  }

  // Fallback: simulado en consola
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     📧  EMAIL (SIMULADO)             ║');
  console.log('╠══════════════════════════════════════╣');
  console.log('║  Para:   ' + String(para).padEnd(28) + '║');
  console.log('║  Asunto: ' + String(asunto).substring(0, 28).padEnd(28) + '║');
  console.log('╚══════════════════════════════════════╝\n');
  return { enviado: true, simulado: true };
}

// ── Plantilla HTML base ──────────────────────────────────────
function plantillaHTML(titulo, contenido) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#FDF9F5;">' +
    '<div style="background:#fff;border-radius:16px;padding:30px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">' +
    '<div style="text-align:center;margin-bottom:20px;">' +
    '<h1 style="font-family:Georgia,serif;color:#C9A68D;font-size:2rem;margin:0;">Dream Day</h1>' +
    '<p style="color:#999;font-size:0.85rem;margin-top:4px;">Todo para tu evento</p>' +
    '</div>' +
    '<h2 style="color:#5B3A29;font-size:1.2rem;margin-bottom:15px;">' + titulo + '</h2>' +
    contenido +
    '<hr style="border:none;border-top:1px solid #E8D5C4;margin:25px 0 15px;">' +
    '<p style="color:#999;font-size:0.75rem;text-align:center;">Dream Day — Aguascalientes, México<br>Este es un correo automático, no responder a este email.<br>WhatsApp: 449 287 0267</p>' +
    '</div></body></html>';
}

// ══════════════════════════════════════════════════════════════
// SERVICIO DE EMAIL
// ══════════════════════════════════════════════════════════════
var emailService = {

  // ── Enviar código MFA ──────────────────────────────────────
  enviarCodigoMFA: async function (email, codigo) {
    var html = plantillaHTML('Código de Verificación',
      '<p style="color:#555;line-height:1.6;">Usa el siguiente código para completar tu inicio de sesión:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<span style="display:inline-block;background:#F5EDE6;color:#5B3A29;font-size:2rem;font-weight:bold;letter-spacing:8px;padding:15px 30px;border-radius:12px;border:2px solid #E8D5C4;">' + codigo + '</span>' +
      '</div>' +
      '<p style="color:#555;font-size:0.85rem;">Este código expira en <strong>10 minutos</strong>.</p>' +
      '<p style="color:#999;font-size:0.8rem;">Si no solicitaste este código, ignora este mensaje.</p>'
    );

    return await enviarEmail(email, 'Tu código de verificación — Dream Day', html);
  },

  // ── Enviar link de recuperación ────────────────────────────
  enviarRecuperacion: async function (email, token, nombre) {
    var link = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/admin/reset-password?token=' + token;

    var html = plantillaHTML('Recuperar Contraseña',
      '<p style="color:#555;line-height:1.6;">Hola' + (nombre ? ' <strong>' + nombre + '</strong>' : '') + ',</p>' +
      '<p style="color:#555;line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<a href="' + link + '" style="display:inline-block;background:linear-gradient(135deg,#C9A68D,#D4B8A5);color:#fff;text-decoration:none;padding:14px 35px;border-radius:10px;font-weight:bold;font-size:1rem;">Restablecer Contraseña</a>' +
      '</div>' +
      '<p style="color:#999;font-size:0.8rem;">O copia y pega este enlace en tu navegador:</p>' +
      '<p style="color:#C9A68D;font-size:0.8rem;word-break:break-all;">' + link + '</p>' +
      '<p style="color:#555;font-size:0.85rem;">Este enlace expira en <strong>30 minutos</strong>.</p>' +
      '<p style="color:#999;font-size:0.8rem;">Si no solicitaste esto, ignora este mensaje.</p>'
    );

    return await enviarEmail(email, 'Recuperar contraseña — Dream Day', html);
  },

  // ── Enviar OTP por SMS (simulado con email como fallback) ──
  enviarSMS: async function (telefono, codigo) {
    logger.info('📱 [SMS] OTP generado', { context: { para: telefono, codigo: codigo } });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📱  OTP SMS                      ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:   ' + String(telefono).padEnd(28) + '║');
    console.log('║  Código: ' + String(codigo).padEnd(28) + '║');
    console.log('╚══════════════════════════════════════╝\n');

    return { enviado: true, simulado: true };
  },

  // ── Enviar código por "llamada" (simulado) ─────────────────
  enviarLlamada: async function (telefono, codigo) {
    logger.info('📞 [LLAMADA] Código generado', { context: { para: telefono, codigo: codigo } });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📞  LLAMADA                      ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:   ' + String(telefono).padEnd(28) + '║');
    console.log('║  Código: ' + String(codigo).padEnd(28) + '║');
    console.log('╚══════════════════════════════════════╝\n');

    return { enviado: true, simulado: true };
  },

  // ── Notificar cotización aceptada ──────────────────────────
  enviarCotizacionAceptada: async function (email, nombre, codigoReferencia) {
    var whatsappLink = 'https://wa.me/524492870267?text=Hola!%20Mi%20cotización%20' + codigoReferencia + '%20fue%20aceptada.%20Quisiera%20coordinar%20los%20detalles.';

    var html = plantillaHTML('¡Tu cotización fue aceptada! 🎉',
      '<p style="color:#555;line-height:1.6;">Hola <strong>' + (nombre || 'Cliente') + '</strong>,</p>' +
      '<p style="color:#555;line-height:1.6;">¡Excelentes noticias! Tu cotización con código <strong style="color:#C9A68D;">' + codigoReferencia + '</strong> ha sido <strong style="color:#27ae60;">aceptada</strong>.</p>' +
      '<p style="color:#555;line-height:1.6;">El siguiente paso es coordinar los detalles de tu evento por WhatsApp:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<a href="' + whatsappLink + '" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 35px;border-radius:10px;font-weight:bold;font-size:1rem;">💬 Contactar por WhatsApp</a>' +
      '</div>' +
      '<p style="color:#999;font-size:0.85rem;">También puedes llamarnos al <strong>449 287 0267</strong>.</p>'
    );

    return await enviarEmail(email, '¡Cotización aceptada! — Dream Day', html);
  },

  // ── Confirmar recepción de cotización ──────────────────────
  enviarConfirmacionCotizacion: async function (email, nombre, codigoReferencia) {
    var consultarLink = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/mi-cotizacion';

    var html = plantillaHTML('Cotización Recibida',
      '<p style="color:#555;line-height:1.6;">Hola <strong>' + (nombre || 'Cliente') + '</strong>,</p>' +
      '<p style="color:#555;line-height:1.6;">Recibimos tu solicitud de cotización correctamente. Tu código de referencia es:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<span style="display:inline-block;background:#F5EDE6;color:#5B3A29;font-size:1.8rem;font-weight:bold;letter-spacing:4px;padding:15px 30px;border-radius:12px;border:2px solid #E8D5C4;">' + codigoReferencia + '</span>' +
      '</div>' +
      '<p style="color:#555;line-height:1.6;">Revisaremos tu solicitud y te contactaremos por WhatsApp para coordinar los detalles y darte un precio personalizado.</p>' +
      '<div style="text-align:center;margin:20px 0;">' +
      '<a href="' + consultarLink + '" style="display:inline-block;background:linear-gradient(135deg,#C9A68D,#D4B8A5);color:#fff;text-decoration:none;padding:12px 30px;border-radius:10px;font-weight:bold;">Consultar estado de mi cotización</a>' +
      '</div>' +
      '<p style="color:#999;font-size:0.85rem;">Guarda tu código <strong>' + codigoReferencia + '</strong> para dar seguimiento.</p>'
    );

    return await enviarEmail(email, 'Cotización recibida: ' + codigoReferencia + ' — Dream Day', html);
  }
};

module.exports = emailService;
