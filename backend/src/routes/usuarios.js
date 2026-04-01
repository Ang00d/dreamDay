/* ============================================
   DREAM DAY — Rutas: Admin Usuarios
   Práctica 3 — RBAC + gestión de usuarios
   
   GET  /api/admin/usuarios      — Listar (superadmin)
   POST /api/admin/usuarios      — Crear  (superadmin)
   PATCH /api/admin/usuarios/:id — Editar (superadmin)
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var { requireRol } = require('../middleware/auth');
var Usuario = require('../models/Usuario');
var logger = require('../config/logger');

router.use(auth);

/* ── GET /api/admin/usuarios ─────────────────────────────── */
router.get('/', requireRol('superadmin'), async function (req, res, next) {
  try {
    var usuarios = await Usuario.find({}).sort({ createdAt: -1 });
    res.json({ data: usuarios });
  } catch (err) { next(err); }
});

/* ── POST /api/admin/usuarios ────────────────────────────── */
router.post('/', requireRol('superadmin'), async function (req, res, next) {
  try {
    var { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }

    var existe = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (existe) return res.status(400).json({ error: 'Ya existe un usuario con ese email.' });

    var usuario = new Usuario({ nombre, email, password, rol: rol || 'editor' });
    await usuario.save();

    logger.info('Usuario creado', { context: { nombre, email, rol, creadoPor: req.usuario._id } });
    res.status(201).json({ data: usuario });
  } catch (err) { next(err); }
});

/* ── PATCH /api/admin/usuarios/:id ───────────────────────── */
router.patch('/:id', requireRol('superadmin'), async function (req, res, next) {
  try {
    var { activo, rol } = req.body;
    var usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (activo !== undefined) usuario.activo = activo;
    if (rol) usuario.rol = rol;
    await usuario.save();

    logger.info('Usuario actualizado', { context: { usuarioId: usuario._id, creadoPor: req.usuario._id } });
    res.json({ data: usuario });
  } catch (err) { next(err); }
});

module.exports = router;
