/* ============================================
   DREAM DAY — Rutas: Microservicios Status
   Práctica 2 — Monitoreo de microservicios
   
   GET /api/microservicios/status  — Estado de los 3 microservicios
   GET /api/microservicios/patrones — Patrones de diseño implementados
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var { requireRol } = require('../middleware/auth');
var mongoose = require('mongoose');

/* ── GET /api/microservicios/status ────────────────────────── */
router.get('/status', auth, requireRol('superadmin', 'admin'), function (req, res) {
  var dbEstado = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';

  res.json({
    data: {
      sistema: 'Dream Day API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      entorno: process.env.NODE_ENV || 'development',
      microservicios: [
        {
          nombre: 'AuthService',
          descripcion: 'Autenticación, JWT, MFA, sesiones, SSO',
          estado: 'activo',
          endpoints: [
            'POST /api/auth/login',
            'POST /api/auth/mfa/verificar',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            'GET  /api/auth/me',
            'GET  /api/auth/sessions',
            'POST /api/sso/token',
            'GET  /api/sso/verificar'
          ]
        },
        {
          nombre: 'CatalogService',
          descripcion: 'Categorías, servicios, disponibilidad, cotizaciones',
          estado: 'activo',
          endpoints: [
            'GET  /api/categorias',
            'GET  /api/servicios',
            'POST /api/cotizaciones',
            'GET  /api/disponibilidad',
            'GET  /api/admin/dashboard',
            'GET  /api/admin/cotizaciones'
          ]
        },
        {
          nombre: 'NotificationService',
          descripcion: 'Notificaciones por email, SMS, llamada y push (simulados)',
          estado: 'activo',
          canales: ['email', 'sms', 'llamada', 'push'],
          endpoints: [
            'POST /api/auth/password/solicitar',
            'POST /api/auth/settings/mfa/activar'
          ]
        }
      ],
      baseDatos: {
        tipo: 'MongoDB',
        estado: dbEstado,
        nombre: mongoose.connection.name || 'dreamday'
      },
      seguridad: {
        autenticacion: 'JWT (access 15min + refresh 7 días)',
        rbac: ['superadmin', 'admin', 'editor', 'user'],
        abac: 'Atributos: rol, departamento, región, horario',
        protecciones: ['Helmet', 'CORS', 'Rate Limiting', 'bcrypt', 'Brute Force Lock']
      }
    }
  });
});

/* ── GET /api/microservicios/patrones ──────────────────────── */
router.get('/patrones', auth, requireRol('superadmin', 'admin'), function (req, res) {
  res.json({
    data: {
      patronesImplementados: [
        {
          nombre: 'MVC (Model-View-Controller)',
          descripcion: 'Separación en Modelos (Mongoose), Rutas/Controladores (Express) y Vistas (React)',
          archivos: ['models/*.js', 'routes/*.js', 'frontend/src/pages/*.jsx']
        },
        {
          nombre: 'Singleton',
          descripcion: 'Instancia única para Logger (Winston), ConfigManager y conexión a BD (Mongoose)',
          archivos: ['config/logger.js', 'patterns/singleton.js', 'config/database.js']
        },
        {
          nombre: 'Factory',
          descripcion: 'NotificadorFactory crea el notificador correcto según el canal (email/sms/llamada/push)',
          archivos: ['services/notificationMicroservice.js']
        },
        {
          nombre: 'Repository',
          descripcion: 'Capa de abstracción sobre Mongoose para acceso a datos (BaseRepository + repos específicos)',
          archivos: ['repositories/baseRepository.js', 'repositories/index.js']
        }
      ],
      arquitectura: {
        tipo: 'Microservicios (modular)',
        servicios: ['AuthService', 'CatalogService', 'NotificationService'],
        comunicacion: 'REST API + JSON',
        baseDatos: 'MongoDB (compartida, colecciones separadas por servicio)'
      }
    }
  });
});

module.exports = router;
