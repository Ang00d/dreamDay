/* ============================================
   DREAM DAY — Middleware: Correlation ID
   ★ REQUISITO UNIVERSITARIO: Logging
   
   Cada request recibe un ID unico (UUID).
   Esto permite rastrear todos los logs de un
   mismo request en Grafana/Loki.
   ============================================ */

var crypto = require('crypto');

function correlationIdMiddleware(req, res, next) {
  // Usar el header si viene del frontend, o generar uno nuevo
  req.correlationId = req.headers['x-correlation-id'] || generarId();

  // Enviar el ID de vuelta en la respuesta
  res.setHeader('x-correlation-id', req.correlationId);

  next();
}

function generarId() {
  return 'req-' + crypto.randomUUID();
}

module.exports = correlationIdMiddleware;
