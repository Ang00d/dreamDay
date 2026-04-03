/* ============================================
   DREAM DAY — Patrón Singleton
   Práctica 2 — Patrones de diseño
   
   El patrón Singleton garantiza que una clase
   tenga una única instancia global. En Dream Day
   se usa para:
   
   1. Logger   — Una sola instancia de Winston
   2. Config   — Configuración centralizada
   3. Database — Una sola conexión a MongoDB
   
   Node.js implementa Singleton naturalmente con
   el sistema de módulos (require cachea la primera
   importación), pero aquí lo formalizamos.
   ============================================ */

var logger = require('../config/logger');

// ═══════════════════════════════════════════════════════════════
// SINGLETON: ConfigManager — Configuración centralizada
// ═══════════════════════════════════════════════════════════════
class ConfigManager {
  constructor() {
    // Si ya existe una instancia, retornarla
    if (ConfigManager._instancia) {
      return ConfigManager._instancia;
    }

    this.config = {
      // JWT
      jwtSecret: process.env.JWT_SECRET || 'dreamday_secret_dev',
      jwtExpiracion: process.env.JWT_EXPIRACION || '15m',
      refreshExpiracionDias: 7,

      // MongoDB
      mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamday',

      // Servidor
      puerto: process.env.PORT || 5000,
      entorno: process.env.NODE_ENV || 'development',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

      // Seguridad
      bcryptRondas: 12,
      maxIntentosFallidos: 5,
      tiempoBloqueoMinutos: 15,
      otpExpiracionMinutos: 10,
      resetExpiracionMinutos: 30,

      // Rate limiting
      loginMaxIntentos: 5,
      loginVentanaMinutos: 15,
      recoveryMaxIntentos: 10,
      recoveryVentanaMinutos: 60,

      // Roles y permisos
      roles: ['superadmin', 'admin', 'editor', 'user'],
      rolesAdmin: ['superadmin', 'admin'],
      rolesEdicion: ['superadmin', 'admin', 'editor'],
    };

    ConfigManager._instancia = this;
    logger.info('ConfigManager Singleton inicializado', {
      context: { entorno: this.config.entorno }
    });
  }

  get(clave) {
    return this.config[clave];
  }

  getAll() {
    return { ...this.config };
  }

  esProduccion() {
    return this.config.entorno === 'production';
  }

  esDesarrollo() {
    return this.config.entorno === 'development';
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON: Logger ya es Singleton por diseño de Node.js
// Winston se configura una vez en config/logger.js y se
// reutiliza en todo el proyecto con require('../config/logger')
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// SINGLETON: Database Connection
// La conexión a MongoDB se establece una sola vez en
// config/database.js y Mongoose mantiene una única conexión
// pool compartida por todo el proceso.
// ═══════════════════════════════════════════════════════════════

// Exportar instancia única
var configManager = new ConfigManager();

module.exports = configManager;
module.exports.ConfigManager = ConfigManager;
