/* ============================================
   DREAM DAY — Servicio: Email (Simulado)
   Práctica 3 — MFA y recuperación de contraseña
   
   En producción: reemplazar con nodemailer + SMTP real.
   Por ahora: guarda el código en logs y lo retorna
   para que el admin pueda verlo en consola.
   ============================================ */

var logger = require('../config/logger');

var emailService = {

  // Enviar código MFA por email (simulado)
  enviarCodigoMFA: async function (email, codigo) {
    logger.info('📧 [EMAIL SIMULADO] Código MFA enviado', {
      context: {
        para: email,
        asunto: 'Tu código de verificación Dream Day',
        codigo: codigo,
        expiracion: '10 minutos',
        nota: 'En producción esto llegaría al correo real'
      }
    });

    // En desarrollo: imprimir en consola para que el admin lo vea
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📧  CÓDIGO MFA (SIMULADO)        ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:   ' + email.padEnd(28) + '║');
    console.log('║  Código: ' + String(codigo).padEnd(28) + '║');
    console.log('║  Expira: 10 minutos                  ║');
    console.log('╚══════════════════════════════════════╝\n');

    return { enviado: true, simulado: true };
  },

  // Enviar link de recuperación de contraseña
  enviarRecuperacion: async function (email, token, nombre) {
    var link = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/admin/reset-password?token=' + token;

    logger.info('📧 [EMAIL SIMULADO] Link de recuperación enviado', {
      context: { para: email, link: link }
    });

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║     📧  RECUPERACIÓN DE CONTRASEÑA (SIMULADO)    ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Para:    ' + email.padEnd(40) + '║');
    console.log('║  Nombre:  ' + (nombre || '').padEnd(40) + '║');
    console.log('║  Link:                                            ║');
    console.log('║  Link completo:');
    console.log('║  ' + link);
    console.log('║  Expira:  30 minutos                              ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    return { enviado: true, simulado: true, link: link };
  },

  // Enviar OTP por SMS (simulado)
  enviarSMS: async function (telefono, codigo) {
    logger.info('📱 [SMS SIMULADO] OTP enviado', {
      context: { para: telefono, codigo: codigo }
    });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📱  OTP SMS (SIMULADO)           ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:   ' + String(telefono).padEnd(28) + '║');
    console.log('║  Código: ' + String(codigo).padEnd(28) + '║');
    console.log('╚══════════════════════════════════════╝\n');

    return { enviado: true, simulado: true };
  },

  // Enviar código por "llamada" (simulado)
  enviarLlamada: async function (telefono, codigo) {
    logger.info('📞 [LLAMADA SIMULADA] Código de voz generado', {
      context: { para: telefono, codigo: codigo }
    });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║     📞  LLAMADA (SIMULADO)           ║');
    console.log('╠══════════════════════════════════════╣');
    console.log('║  Para:   ' + String(telefono).padEnd(28) + '║');
    console.log('║  Código: ' + String(codigo).padEnd(28) + '║');
    console.log('╚══════════════════════════════════════╝\n');

    return { enviado: true, simulado: true };
  }
};

module.exports = emailService;
