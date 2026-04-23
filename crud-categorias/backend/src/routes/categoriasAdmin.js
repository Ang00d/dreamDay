/* ============================================
   DREAM DAY — Rutas: Categorias (Admin)
   
   Todas requieren: Authorization: Bearer <token>
   
   GET    /api/admin/categorias          — Listar todas (incluso inactivas)
   POST   /api/admin/categorias          — Crear nueva
   PATCH  /api/admin/categorias/:id      — Editar
   DELETE /api/admin/categorias/:id      — Soft delete (marcar inactiva)
   
   NOTA: No hacemos hard delete porque puede haber servicios
   y cotizaciones históricas referenciando la categoría.
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Categoria = require('../models/Categoria');
var Servicio = require('../models/Servicio');
var Cotizacion = require('../models/Cotizacion');
var logger = require('../config/logger');

// Todas las rutas requieren autenticacion
router.use(auth);

/**
 * GET /api/admin/categorias
 * Listar todas las categorías (incluso inactivas) con conteo de servicios
 */
router.get('/', async function (req, res, next) {
  try {
    var categorias = await Categoria.find().sort({ orden: 1, nombre: 1 }).lean();

    // Agregar conteo de servicios por categoría
    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      var totalServicios = await Servicio.countDocuments({ categoria: cat._id });
      var serviciosActivos = await Servicio.countDocuments({
        categoria: cat._id,
        activo: true
      });
      cat.totalServicios = totalServicios;
      cat.serviciosActivos = serviciosActivos;
    }

    res.json({ data: categorias });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/categorias
 * Crear una nueva categoría
 * 
 * Body: { nombre, slug, icono, orden, anticipacionMinimaDias }
 */
router.post('/', async function (req, res, next) {
  try {
    var { nombre, slug, icono, orden, anticipacionMinimaDias } = req.body;

    // Validaciones
    if (!nombre || nombre.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres.' });
    }

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones.' });
    }

    // Verificar unicidad
    var existeNombre = await Categoria.findOne({ nombre: nombre.trim() });
    if (existeNombre) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre.' });
    }

    var existeSlug = await Categoria.findOne({ slug: slug.trim().toLowerCase() });
    if (existeSlug) {
      return res.status(409).json({ error: 'Ya existe una categoría con ese slug.' });
    }

    var nuevaCategoria = new Categoria({
      nombre: nombre.trim(),
      slug: slug.trim().toLowerCase(),
      icono: icono || '✨',
      orden: typeof orden === 'number' ? orden : 0,
      anticipacionMinimaDias: typeof anticipacionMinimaDias === 'number' ? anticipacionMinimaDias : 0,
      activa: true
    });

    await nuevaCategoria.save();

    logger.info('Categoría creada', {
      correlationId: req.correlationId,
      context: {
        categoriaId: nuevaCategoria._id,
        nombre: nuevaCategoria.nombre,
        adminId: req.usuario._id
      }
    });

    res.status(201).json({ data: nuevaCategoria });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/categorias/:id
 * Editar una categoría existente
 */
router.patch('/:id', async function (req, res, next) {
  try {
    var categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    var { nombre, slug, icono, orden, anticipacionMinimaDias, activa } = req.body;

    // Validar y actualizar nombre
    if (nombre !== undefined) {
      if (nombre.trim().length < 2) {
        return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres.' });
      }
      // Verificar unicidad (excluyendo esta categoría)
      var existeNombre = await Categoria.findOne({
        nombre: nombre.trim(),
        _id: { $ne: categoria._id }
      });
      if (existeNombre) {
        return res.status(409).json({ error: 'Ya existe otra categoría con ese nombre.' });
      }
      categoria.nombre = nombre.trim();
    }

    // Validar y actualizar slug
    if (slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'El slug solo puede contener letras minúsculas, números y guiones.' });
      }
      var existeSlug = await Categoria.findOne({
        slug: slug.trim().toLowerCase(),
        _id: { $ne: categoria._id }
      });
      if (existeSlug) {
        return res.status(409).json({ error: 'Ya existe otra categoría con ese slug.' });
      }
      categoria.slug = slug.trim().toLowerCase();
    }

    if (icono !== undefined) categoria.icono = icono;
    if (typeof orden === 'number') categoria.orden = orden;
    if (typeof anticipacionMinimaDias === 'number') {
      if (anticipacionMinimaDias < 0 || anticipacionMinimaDias > 365) {
        return res.status(400).json({ error: 'Anticipación debe estar entre 0 y 365 días.' });
      }
      categoria.anticipacionMinimaDias = anticipacionMinimaDias;
    }
    if (typeof activa === 'boolean') {
      // Si se está DESACTIVANDO, advertir si hay servicios activos
      if (categoria.activa === true && activa === false) {
        var serviciosActivos = await Servicio.countDocuments({
          categoria: categoria._id,
          activo: true
        });
        if (serviciosActivos > 0 && !req.body.forzarDesactivacion) {
          return res.status(409).json({
            error: 'No se puede desactivar. La categoría tiene ' + serviciosActivos +
              ' servicio(s) activo(s). Desactiva los servicios primero o envía forzarDesactivacion=true.',
            serviciosActivos: serviciosActivos
          });
        }
      }
      categoria.activa = activa;
    }

    await categoria.save();

    logger.info('Categoría actualizada', {
      correlationId: req.correlationId,
      context: {
        categoriaId: categoria._id,
        nombre: categoria.nombre,
        adminId: req.usuario._id
      }
    });

    res.json({ data: categoria });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/categorias/:id
 * "Eliminar" una categoría (soft delete: marcar inactiva).
 * Si tiene servicios activos o cotizaciones pendientes, se avisa.
 * Para forzar, enviar ?forzar=true como query param.
 */
router.delete('/:id', async function (req, res, next) {
  try {
    var categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    var forzar = req.query.forzar === 'true';

    // Verificar servicios activos
    var serviciosActivos = await Servicio.countDocuments({
      categoria: categoria._id,
      activo: true
    });

    // Verificar cotizaciones pendientes/en negociación con servicios de esta categoría
    var servicios = await Servicio.find({ categoria: categoria._id }).select('_id');
    var serviciosIds = servicios.map(function (s) { return s._id; });
    var cotizacionesActivas = await Cotizacion.countDocuments({
      'servicios.servicioId': { $in: serviciosIds },
      estado: { $in: ['pendiente', 'en_negociacion'] }
    });

    if (!forzar && (serviciosActivos > 0 || cotizacionesActivas > 0)) {
      return res.status(409).json({
        error: 'La categoría tiene dependencias activas.',
        serviciosActivos: serviciosActivos,
        cotizacionesActivas: cotizacionesActivas,
        mensaje: 'Para desactivar de todas formas, envía ?forzar=true'
      });
    }

    categoria.activa = false;
    await categoria.save();

    logger.info('Categoría desactivada (soft delete)', {
      correlationId: req.correlationId,
      context: {
        categoriaId: categoria._id,
        nombre: categoria.nombre,
        forzado: forzar,
        adminId: req.usuario._id
      }
    });

    res.json({
      data: categoria,
      mensaje: 'Categoría desactivada exitosamente.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
