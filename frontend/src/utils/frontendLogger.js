/* ============================================
   DREAM DAY — Frontend Logger
   ★ Requisito universitario: Sistema de Logging
   
   Registra eventos del frontend y los envia
   al backend para centralizar en Winston + Loki
   ============================================ */

var LOG_ENDPOINT = '/api/logs';

var frontendLogger = {
  log: function (level, message, context) {
    if (!context) context = {};

    var logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      service: 'frontend',
      env: import.meta.env.MODE,
      message: message,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      context: context
    };

    if (import.meta.env.DEV) {
      var consoleFn = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleFn]('[' + level.toUpperCase() + ']', message, context);
    }

    try {
      var apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      navigator.sendBeacon(apiUrl + '/logs', JSON.stringify(logEntry));
    } catch (e) {
      // Silencioso si falla
    }
  },

  info: function (message, context) { this.log('info', message, context); },
  warn: function (message, context) { this.log('warn', message, context); },
  error: function (message, context) { this.log('error', message, context); },
  debug: function (message, context) { this.log('debug', message, context); }
};

export default frontendLogger;
