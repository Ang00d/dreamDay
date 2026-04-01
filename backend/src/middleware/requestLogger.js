/* ============================================
   DREAM DAY — Middleware: Request Logger
   ★ REQUISITO UNIVERSITARIO: Logging
   
   Registra cada request HTTP con:
   - Metodo, ruta, status, latencia
   - Nivel segun el status code:
     500+ = error, 400+ = warn, >500ms = warn, resto = info
   ============================================ */

var logger = require('../config/logger');

function requestLogger(req, res, next) {
  var start = Date.now();

  // Cuando la respuesta termine, registrar el log
  res.on('finish', function () {
    var responseTime = Date.now() - start;

    var logData = {
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: responseTime,
      userAgent: req.get('user-agent'),
      userId: req.usuario ? req.usuario.id : null
    };

    // Determinar nivel segun status
    if (res.statusCode >= 500) {
      logger.error('Request fallido (server error)', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request fallido (client error)', logData);
    } else if (responseTime > 500) {
      logger.warn('Request lento (>500ms)', logData);
    } else {
      logger.info('Request completado', logData);
    }
  });

  next();
}

module.exports = requestLogger;
