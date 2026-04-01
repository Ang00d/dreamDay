/* ============================================
   DREAM DAY — Middleware: Error Handler Global
   ★ REQUISITO UNIVERSITARIO: Logging
   
   Atrapa todos los errores no manejados.
   En produccion no revela detalles del error.
   ============================================ */

var logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  // Registrar el error con stack trace
  logger.error('Error no manejado', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    }
  });

  // Responder al cliente
  var statusCode = err.status || 500;
  var mensaje = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({
    error: mensaje
  });
}

module.exports = errorHandler;
