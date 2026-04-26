/* ============================================
   DREAM DAY — Servidor Express (actualizado Paso 10)
   
   Punto de entrada principal del backend.
   Ahora con todas las rutas activas.
   
   Para iniciar: node src/server.js
   ============================================ */

require('dotenv').config();

var express = require('express');
var cors = require('cors');
var helmet = require('helmet');
var path = require('path');
var sessionsRouter  = require('./routes/sessions');
var settingsRouter  = require('./routes/settings');
var ssoRouter       = require('./routes/sso');
var microserviciosRouter = require('./routes/microservicios');
var usuariosRouter  = require('./routes/usuarios');

// Configuracion
var connectDB = require('./config/database');
var logger = require('./config/logger');

// Middleware
var correlationIdMiddleware = require('./middleware/correlationId');
var requestLogger = require('./middleware/requestLogger');
var errorHandler = require('./middleware/errorHandler');

// Crear la app de Express
var app = express();
app.set('trust proxy', 1);
var PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE GLOBALES
// ============================================

app.use(helmet());

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || 'https://dream-day-six.vercel.app')
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(correlationIdMiddleware);
app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth/sessions', sessionsRouter);
app.use('/api/auth/settings', settingsRouter);
app.use('/api/sso', ssoRouter);
app.use('/api/microservicios', microserviciosRouter);
app.use('/api/admin/usuarios', usuariosRouter);

// ============================================
// RUTAS
// ============================================

app.get('/api/health', function (req, res) {
  res.json({
    status: 'OK',
    service: 'Dream Day API',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/logs', function (req, res) {
  var logData = req.body;
  if (logData && logData.level && logData.message) {
    var level = logData.level === 'error' ? 'error'
      : logData.level === 'warn' ? 'warn' : 'info';

    logger[level]('Frontend: ' + logData.message, {
      correlationId: req.correlationId,
      context: logData.context || {},
      path: logData.path,
      service: 'frontend'
    });
  }
  res.status(204).end();
});

// --- Rutas publicas ---
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/disponibilidad', require('./routes/disponibilidad'));
app.use('/api/cotizaciones', require('./routes/cotizaciones'));

// --- Rutas auth ---
app.use('/api/auth', require('./routes/auth'));

// --- Rutas admin (protegidas) ---
// ORDEN IMPORTANTE: routers específicos ANTES del admin general
app.use('/api/admin/categorias', require('./routes/categoriasAdmin'));
app.use('/api/admin/servicios', require('./routes/serviciosAdmin'));
app.use('/api/admin/orden-del-dia', require('./routes/ordenDelDia'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/servicios', require('./routes/imagenes'));

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use(function (req, res) {
  res.status(404).json({ error: 'Ruta no encontrada: ' + req.originalUrl });
});

app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

async function iniciar() {
  try {
    await connectDB();

    require("./utils/autoArchivar").iniciar();
    app.listen(PORT, function () {
      logger.info('Servidor Dream Day iniciado', {
        context: {
          port: PORT,
          env: process.env.NODE_ENV || 'development',
          node: process.version
        }
      });
      console.log('\n========================================');
      console.log('  DREAM DAY API');
      console.log('  Puerto: ' + PORT);
      console.log('  URL: http://localhost:' + PORT);
      console.log('  Health: http://localhost:' + PORT + '/api/health');
      console.log('========================================\n');
    });

  } catch (err) {
    logger.error('Error al iniciar servidor', {
      error: { message: err.message, stack: err.stack }
    });
    process.exit(1);
  }
}

iniciar();
