/* ============================================
   DREAM DAY — Rutas: SSO Simulado
   Práctica 3 — Single Sign-On
   
   Simula dos aplicaciones (App A = Dream Day Admin,
   App B = Dream Day Reports) compartiendo autenticación.
   
   POST /api/sso/token           — App A obtiene token SSO
   GET  /api/sso/verificar       — App B verifica el token SSO
   GET  /api/sso/demo            — Info de la demo SSO
   ============================================ */

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var auth = require('../middleware/auth');
var logger = require('../config/logger');

// Almacén en memoria de tokens SSO (en producción: Redis o BD)
var tokensSSOActivos = new Map();

/* ── POST /api/sso/token ───────────────────────────────────── */
// App A solicita un token SSO para acceder a App B
router.post('/token', auth, async function (req, res, next) {
  try {
    var ssoToken = crypto.randomBytes(16).toString('hex');
    var expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    tokensSSOActivos.set(ssoToken, {
      usuarioId: req.usuario._id.toString(),
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      expiracion: expiracion
    });

    logger.info('SSO token generado', { context: { usuarioId: req.usuario._id } });

    res.json({
      data: {
        ssoToken,
        expiracion,
        urlAppB: 'http://localhost:5173/sso-demo?token=' + ssoToken,
        mensaje: 'Token SSO válido por 5 minutos para acceder a App B'
      }
    });
  } catch (err) { next(err); }
});

/* ── GET /api/sso/verificar ────────────────────────────────── */
// App B verifica el token SSO recibido de App A
router.get('/verificar', async function (req, res, next) {
  try {
    var { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token SSO requerido.' });
    }

    var datos = tokensSSOActivos.get(token);
    if (!datos) {
      return res.status(401).json({ error: 'Token SSO inválido.' });
    }

    if (datos.expiracion < new Date()) {
      tokensSSOActivos.delete(token);
      return res.status(401).json({ error: 'Token SSO expirado.' });
    }

    // Token válido — App B puede crear su propia sesión
    // Eliminar el token para que sea de un solo uso
    tokensSSOActivos.delete(token);

    logger.info('SSO verificado', { context: { usuarioId: datos.usuarioId } });

    res.json({
      data: {
        autenticado: true,
        usuario: {
          id: datos.usuarioId,
          nombre: datos.nombre,
          email: datos.email,
          rol: datos.rol
        },
        mensaje: 'Usuario autenticado vía SSO desde App A'
      }
    });
  } catch (err) { next(err); }
});

/* ── GET /api/sso/demo ─────────────────────────────────────── */
router.get('/demo', function (req, res) {
  res.json({
    data: {
      descripcion: 'Dream Day SSO Simulado',
      appA: { nombre: 'Dream Day Admin', url: 'http://localhost:5173/admin/dashboard' },
      appB: { nombre: 'Dream Day Reports', url: 'http://localhost:5173/sso-demo' },
      flujo: [
        '1. Usuario inicia sesión en App A (Dream Day Admin)',
        '2. App A solicita token SSO: POST /api/sso/token',
        '3. App A redirige a App B con el token en la URL',
        '4. App B verifica el token: GET /api/sso/verificar?token=xxx',
        '5. Usuario accede a App B sin volver a autenticarse'
      ]
    }
  });
});

module.exports = router;
