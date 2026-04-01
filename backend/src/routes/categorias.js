/* ============================================
   DREAM DAY — Rutas: Categorias (publicas)
   
   GET /api/categorias          — Listar categorias activas
   GET /api/categorias/:slug    — Obtener una categoria por slug
   ============================================ */

var express = require('express');
var router = express.Router();
var Categoria = require('../models/Categoria');
var logger = require('../config/logger');

/**
 * GET /api/categorias
 * Listar todas las categorias activas, ordenadas
 */
router.get('/', async function (req, res, next) {
  try {
    var categorias = await Categoria.find({ activa: true })
      .sort({ orden: 1 })
      .select('-__v');

    logger.info('Categorias consultadas', {
      correlationId: req.correlationId,
      context: { total: categorias.length }
    });

    res.json({ data: categorias });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/categorias/:slug
 * Obtener una categoria por su slug
 */
router.get('/:slug', async function (req, res, next) {
  try {
    var categoria = await Categoria.findOne({
      slug: req.params.slug,
      activa: true
    }).select('-__v');

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria no encontrada' });
    }

    res.json({ data: categoria });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
