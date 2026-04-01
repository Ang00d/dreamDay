/* ============================================
   DREAM DAY — Conexion a MongoDB
   
   Mongoose se conecta a MongoDB y nos permite
   definir modelos (esquemas) para los datos.
   ============================================ */

var mongoose = require('mongoose');
var logger = require('./logger');

async function connectDB() {
  try {
    var uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamday';

    await mongoose.connect(uri);

    logger.info('MongoDB conectado exitosamente', {
      context: { host: mongoose.connection.host, db: mongoose.connection.name }
    });

    // Detectar desconexiones
    mongoose.connection.on('error', function (err) {
      logger.error('Error de MongoDB', {
        error: { message: err.message, stack: err.stack }
      });
    });

    mongoose.connection.on('disconnected', function () {
      logger.warn('MongoDB desconectado');
    });

  } catch (err) {
    logger.error('No se pudo conectar a MongoDB', {
      error: { message: err.message, stack: err.stack }
    });
    process.exit(1);
  }
}

module.exports = connectDB;
