/* ============================================
   DREAM DAY — Rutas: Servicios (publicas)
   
   GET /api/servicios                — Listar servicios (con filtros)
   GET /api/servicios/:id            — Detalle de un servicio
   
   NOTA: El campo "precio" NUNCA se envia al cliente.
   Solo el admin lo ve (rutas admin).
   
   ACTUALIZADO: populate incluye anticipacionMinimaDias
   para validación de fechas en el wizard.
   ============================================ */

var express = require('express');
var router = express.Router();
var Servicio = require('../models/Servicio');
var logger = require('../config/logger');

// Campos que se envian al cliente (SIN precio)
var CAMPOS_PUBLICOS = 'nombre descripcion descripcionCorta imagenes categoria tipoPrecio requisitoMinimo duracionHoras incluye notas tipoDisponibilidad capacidadDiaria activo orden';

/**
 * GET /api/servicios
 * Listar servicios activos con filtros opcionales
 * 
 * Query params:
 *   categoria=ObjectId  — filtrar por categoria
 *   buscar=texto        — buscar en nombre/descripcion
 */
router.get('/', async function (req, res, next) {
  try {
    var filtro = { activo: true };

    // Filtrar por categoria
    if (req.query.categoria) {
      filtro.categoria = req.query.categoria;
    }

    // Buscar por texto
    if (req.query.buscar) {
      var regex = new RegExp(req.query.buscar, 'i');
      filtro.$or = [
        { nombre: regex },
        { descripcion: regex }
      ];
    }

    var servicios = await Servicio.find(filtro)
      .select(CAMPOS_PUBLICOS)
      .populate('categoria', 'nombre slug icono anticipacionMinimaDias')
      .sort({ orden: 1 });

    logger.info('Servicios consultados', {
      correlationId: req.correlationId,
      context: {
        total: servicios.length,
        categoria: req.query.categoria || 'todas',
        buscar: req.query.buscar || null
      }
    });

    res.json({ data: servicios });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/servicios/:id
 * Detalle de un servicio (sin precio)
 */
router.get('/:id', async function (req, res, next) {
  try {
    var servicio = await Servicio.findOne({
      _id: req.params.id,
      activo: true
    })
      .select(CAMPOS_PUBLICOS)
      .populate('categoria', 'nombre slug icono anticipacionMinimaDias');

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ data: servicio });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
