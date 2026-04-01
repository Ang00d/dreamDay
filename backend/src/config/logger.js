/* ============================================
   DREAM DAY — Configuracion Winston Logger
   ★ REQUISITO UNIVERSITARIO: Sistema de Logging
   
   - Formato JSON consistente
   - Timestamps UTC (ISO 8601)
   - Niveles: error > warn > info > debug
   - Rotacion de archivos por dia
   - Consola con colores en desarrollo
   ============================================ */

var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');
var path = require('path');

var logDir = path.join(__dirname, '../../logs');

var logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'backend',
    env: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Archivo rotativo — todos los logs
    new DailyRotateFile({
      dirname: logDir,
      filename: 'dreamday-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      level: 'info'
    }),
    // Archivo rotativo — solo errores
    new DailyRotateFile({
      dirname: logDir,
      filename: 'dreamday-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

// En desarrollo, mostrar en consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
