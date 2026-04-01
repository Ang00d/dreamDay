/* ============================================
   DREAM DAY — Configuracion Cloudinary
   Maneja la conexion y helpers de Cloudinary
   ============================================ */
var cloudinary = require('cloudinary').v2;
var logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verificar conexion al iniciar
cloudinary.api.ping()
  .then(function () {
    logger.info('Cloudinary conectado exitosamente', {
      context: { cloudName: process.env.CLOUDINARY_CLOUD_NAME }
    });
  })
  .catch(function (err) {
    logger.error('Error conectando a Cloudinary', {
      error: { message: err.message }
    });
  });

module.exports = cloudinary;
