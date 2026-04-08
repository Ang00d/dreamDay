/* ============================================
   DREAM DAY — Servicio: Email (Resend)
   
   Usa Resend (HTTP API) para enviar emails reales.
   No requiere SMTP — evita problemas IPv4/IPv6.
   
   En producción: envía emails reales via Resend
   En desarrollo: simula en consola
   ============================================ */

var logger = require('../config/logger');

var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var FROM_EMAIL = process.env.FROM_EMAIL || 'Dream Day <onboarding@resend.dev>';

if (RESEND_API_KEY) {
  logger.info('Email: configurado con Resend API');
} else {
  logger.info('Email: modo simulado (sin RESEND_API_KEY)');
}

// ── Enviar email via Resend HTTP API ─────────────────────────
async function enviarEmail(para, asunto, html) {
  if (RESEND_API_KEY) {
    try {
      var response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + RESEND_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [para],
          subject: asunto,
          html: html
        })
      });

      var data = await response.json();

      if (response.ok) {
        logger.info('Email enviado correctamente via Resend', { context: { para, asunto, id: data.id } });
        return { enviado: true, simulado: false, id: data.id };
      } else {
        logger.error('Resend error: ' + JSON.stringify(data));
        console.log('\n⚠️  Resend error: ' + JSON.stringify(data));
      }
    } catch (err) {
      logger.error('Error enviando email: ' + err.message);
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
var emailService = {

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

  enviarRecuperacion: async function (email, token, nombre) {
    var link = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/admin/reset-password?token=' + token;
    var html = plantillaHTML('Recuperar Contraseña',
      '<p style="color:#555;line-height:1.6;">Hola' + (nombre ? ' <strong>' + nombre + '</strong>' : '') + ',</p>' +
      '<p style="color:#555;line-height:1.6;">Recibimos una solicitud para restablecer tu contraseña:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<a href="' + link + '" style="display:inline-block;background:linear-gradient(135deg,#C9A68D,#D4B8A5);color:#fff;text-decoration:none;padding:14px 35px;border-radius:10px;font-weight:bold;font-size:1rem;">Restablecer Contraseña</a>' +
      '</div>' +
      '<p style="color:#999;font-size:0.8rem;">O copia este enlace:</p>' +
      '<p style="color:#C9A68D;font-size:0.8rem;word-break:break-all;">' + link + '</p>' +
      '<p style="color:#555;font-size:0.85rem;">Expira en <strong>30 minutos</strong>.</p>'
    );
    return await enviarEmail(email, 'Recuperar contraseña — Dream Day', html);
  },

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

  enviarCotizacionAceptada: async function (email, nombre, codigoReferencia) {
    var whatsappLink = 'https://wa.me/524492870267?text=Hola!%20Mi%20cotización%20' + codigoReferencia + '%20fue%20aceptada.%20Quisiera%20coordinar%20los%20detalles.';
    var html = plantillaHTML('¡Tu cotización fue aceptada! 🎉',
      '<p style="color:#555;line-height:1.6;">Hola <strong>' + (nombre || 'Cliente') + '</strong>,</p>' +
      '<p style="color:#555;line-height:1.6;">Tu cotización <strong style="color:#C9A68D;">' + codigoReferencia + '</strong> ha sido <strong style="color:#27ae60;">aceptada</strong>.</p>' +
      '<p style="color:#555;line-height:1.6;">Coordina los detalles por WhatsApp:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<a href="' + whatsappLink + '" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 35px;border-radius:10px;font-weight:bold;font-size:1rem;">💬 Contactar por WhatsApp</a>' +
      '</div>'
    );
    return await enviarEmail(email, '¡Cotización aceptada! — Dream Day', html);
  },

  enviarConfirmacionCotizacion: async function (email, nombre, codigoReferencia) {
    var consultarLink = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/mi-cotizacion';
    var html = plantillaHTML('Cotización Recibida',
      '<p style="color:#555;line-height:1.6;">Hola <strong>' + (nombre || 'Cliente') + '</strong>,</p>' +
      '<p style="color:#555;line-height:1.6;">Recibimos tu solicitud. Tu código:</p>' +
      '<div style="text-align:center;margin:25px 0;">' +
      '<span style="display:inline-block;background:#F5EDE6;color:#5B3A29;font-size:1.8rem;font-weight:bold;letter-spacing:4px;padding:15px 30px;border-radius:12px;border:2px solid #E8D5C4;">' + codigoReferencia + '</span>' +
      '</div>' +
      '<p style="color:#555;line-height:1.6;">Te contactaremos por WhatsApp para los detalles.</p>' +
      '<div style="text-align:center;margin:20px 0;">' +
      '<a href="' + consultarLink + '" style="display:inline-block;background:linear-gradient(135deg,#C9A68D,#D4B8A5);color:#fff;text-decoration:none;padding:12px 30px;border-radius:10px;font-weight:bold;">Consultar estado</a>' +
      '</div>'
    );
    return await enviarEmail(email, 'Cotización recibida: ' + codigoReferencia + ' — Dream Day', html);
  }
};

module.exports = emailService;
