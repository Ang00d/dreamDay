/* ============================================
   DREAM DAY — Middleware: Autenticación JWT
   Práctica 3 — Con validación de sesión y roles
   
   Verifica token, sesión activa y permisos.
   ============================================ */

var jwt = require('jsonwebtoken');
var Usuario = require('../models/Usuario');
var Session = require('../models/Session');
var logger = require('../config/logger');

// Middleware base: verifica token y sesión
async function auth(req, res, next) {
  try {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso no autorizado. Token requerido.' });
    }

    var token = authHeader.split(' ')[1];
    var decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que la sesión siga activa en BD (permite revocación remota)
    if (decoded.jti) {
      var sesion = await Session.findOne({ tokenId: decoded.jti, activa: true });
      if (!sesion) {
        return res.status(401).json({ error: 'Sesión revocada o expirada.' });
      }
      // Actualizar última actividad
      sesion.ultimaActividad = new Date();
      await sesion.save();
    }

    var usuario = await Usuario.findById(decoded.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' });
    }

    req.usuario = usuario;
    req.tokenId = decoded.jti;
    next();
  } catch (err) {
    logger.warn('Token JWT inválido', { correlationId: req.correlationId, error: err.message });
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// Middleware de roles: uso -> requireRol('admin', 'superadmin')
function requireRol(...roles) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!roles.includes(req.usuario.rol)) {
      logger.warn('Acceso denegado por rol insuficiente', {
        correlationId: req.correlationId,
        context: { usuarioId: req.usuario._id, rolRequerido: roles, rolActual: req.usuario.rol }
      });
      return res.status(403).json({
        error: 'Acceso denegado. Se requiere rol: ' + roles.join(' o ')
      });
    }
    next();
  };
}

// Middleware: solo superadmin
function soloSuperadmin(req, res, next) {
  return requireRol('superadmin')(req, res, next);
}

module.exports = auth;
module.exports.requireRol = requireRol;
module.exports.soloSuperadmin = soloSuperadmin;
