/* ============================================
   DREAM DAY — Middleware: Upload con Cloudinary
   
   Usa Multer para recibir archivos y
   Cloudinary para almacenarlos en la nube.
   
   Transformaciones automaticas:
   - Original: max 1200px ancho, calidad 85%
   - Thumbnail: 400px ancho, calidad 75% (para tarjetas)
   ============================================ */
var multer = require('multer');
var cloudinary = require('../config/cloudinary');
var logger = require('../config/logger');

// Almacenamiento temporal en memoria
var storage = multer.memoryStorage();

// Filtro: solo imagenes
var fileFilter = function (req, file, cb) {
  var tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.indexOf(file.mimetype) !== -1) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes (JPEG, PNG, WEBP)'), false);
  }
};

// Configuracion de Multer
var upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximo
    files: 5 // maximo 5 archivos por request
  }
});

/**
 * Sube una imagen a Cloudinary con transformaciones
 * Retorna { url, thumbnailUrl, publicId }
 */
var subirACloudinary = function (fileBuffer, opciones) {
  return new Promise(function (resolve, reject) {
    var carpeta = opciones.carpeta || 'dreamday/servicios';
    var nombreBase = opciones.nombre || 'imagen';

    // Limpiar nombre para URL
    var nombreLimpio = nombreBase
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);

    var uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: carpeta,
        public_id: nombreLimpio + '-' + Date.now(),
        resource_type: 'image',
        transformation: [
          { width: 1200, crop: 'limit', quality: 85, format: 'auto' }
        ]
      },
      function (error, result) {
        if (error) {
          logger.error('Error subiendo a Cloudinary', {
            error: { message: error.message }
          });
          reject(error);
        } else {
          // Generar URL de thumbnail usando transformaciones de Cloudinary
          var thumbnailUrl = cloudinary.url(result.public_id, {
            width: 400,
            height: 300,
            crop: 'fill',
            quality: 75,
            format: 'auto'
          });

          resolve({
            url: result.secure_url,
            thumbnailUrl: thumbnailUrl,
            publicId: result.public_id,
            ancho: result.width,
            alto: result.height,
            tamano: result.bytes
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Elimina una imagen de Cloudinary por su publicId
 */
var eliminarDeCloudinary = function (publicId) {
  return new Promise(function (resolve, reject) {
    cloudinary.uploader.destroy(publicId, function (error, result) {
      if (error) {
        logger.error('Error eliminando de Cloudinary', {
          error: { message: error.message },
          context: { publicId: publicId }
        });
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  upload: upload,
  subirACloudinary: subirACloudinary,
  eliminarDeCloudinary: eliminarDeCloudinary
};
