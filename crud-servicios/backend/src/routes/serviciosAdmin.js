/* ============================================
   DREAM DAY — Rutas: Servicios Admin (CRUD completo)
   
   Todas requieren: Authorization: Bearer <token>
   
   POST   /api/admin/servicios         — Crear nuevo servicio
   PATCH  /api/admin/servicios/:id     — Editar servicio (todos los campos)
   DELETE /api/admin/servicios/:id     — Soft delete con advertencia
   
   NOTA: Este router se monta ANTES que admin.js.
   El GET /servicios se queda en admin.js.
   El PATCH /:id de este router reemplaza el de admin.js
   (que ahora queda inaccesible).
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Servicio = require('../models/Servicio');
var Categoria = require('../models/Categoria');
var Cotizacion = require('../models/Cotizacion');
var Disponibilidad = require('../models/Disponibilidad');
var logger = require('../config/logger');

// Todas las rutas requieren autenticacion
router.use(auth);

// Tipos válidos
var TIPOS_PRECIO = ['por_persona', 'por_pieza', 'por_orden', 'por_juego', 'precio_fijo'];
var TIPOS_DISPONIBILIDAD = ['unica', 'multiple'];

/**
 * Validar body de servicio (usado en POST y PATCH)
 * Retorna null si OK, o un objeto { error } si hay problema
 */
function validarCamposServicio(body, esCreacion) {
  // En creación, estos son obligatorios
  if (esCreacion) {
    if (!body.nombre || body.nombre.trim().length < 3) {
      return { error: 'El nombre debe tener al menos 3 caracteres.' };
    }
    if (!body.descripcion || body.descripcion.trim().length < 10) {
      return { error: 'La descripción debe tener al menos 10 caracteres.' };
    }
    if (!body.descripcionCorta || body.descripcionCorta.trim().length < 5) {
      return { error: 'La descripción corta debe tener al menos 5 caracteres.' };
    }
    if (!body.categoria) {
      return { error: 'La categoría es obligatoria.' };
    }
    if (!body.tipoPrecio) {
      return { error: 'El tipo de precio es obligatorio.' };
    }
    if (typeof body.precio !== 'number' && !body.precio) {
      return { error: 'El precio es obligatorio.' };
    }
    if (!body.duracionHoras) {
      return { error: 'La duración en horas es obligatoria.' };
    }
    if (!body.requisitoMinimo || !body.requisitoMinimo.cantidad || !body.requisitoMinimo.unidad) {
      return { error: 'El requisito mínimo (cantidad y unidad) es obligatorio.' };
    }
  }

  // Validaciones que aplican siempre (si el campo viene)
  if (body.descripcionCorta !== undefined && body.descripcionCorta.length > 80) {
    return { error: 'La descripción corta no puede tener más de 80 caracteres.' };
  }
  if (body.tipoPrecio !== undefined && TIPOS_PRECIO.indexOf(body.tipoPrecio) === -1) {
    return { error: 'Tipo de precio inválido.' };
  }
  if (body.tipoDisponibilidad !== undefined && TIPOS_DISPONIBILIDAD.indexOf(body.tipoDisponibilidad) === -1) {
    return { error: 'Tipo de disponibilidad inválido.' };
  }
  if (body.precio !== undefined) {
    var precio = parseFloat(body.precio);
    if (isNaN(precio) || precio < 0) {
      return { error: 'El precio debe ser un número mayor o igual a 0.' };
    }
  }
  if (body.duracionHoras !== undefined) {
    var dur = parseFloat(body.duracionHoras);
    if (isNaN(dur) || dur <= 0 || dur > 48) {
      return { error: 'La duración debe estar entre 0 y 48 horas.' };
    }
  }
  if (body.capacidadDiaria !== undefined) {
    var cap = parseInt(body.capacidadDiaria);
    if (isNaN(cap) || cap < 1) {
      return { error: 'La capacidad diaria debe ser al menos 1.' };
    }
  }

  return null;
}

/**
 * POST /api/admin/servicios
 * Crear un nuevo servicio
 */
router.post('/', async function (req, res, next) {
  try {
    var body = req.body;

    var errorValidacion = validarCamposServicio(body, true);
    if (errorValidacion) {
      return res.status(400).json(errorValidacion);
    }

    // Verificar que la categoría exista y esté activa
    var categoria = await Categoria.findById(body.categoria);
    if (!categoria) {
      return res.status(400).json({ error: 'La categoría no existe.' });
    }
    if (!categoria.activa) {
      return res.status(400).json({ error: 'La categoría está desactivada. Actívala antes de crear servicios.' });
    }

    // Verificar unicidad del nombre
    var existe = await Servicio.findOne({ nombre: body.nombre.trim() });
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un servicio con ese nombre.' });
    }

    var nuevoServicio = new Servicio({
      nombre: body.nombre.trim(),
      descripcion: body.descripcion.trim(),
      descripcionCorta: body.descripcionCorta.trim(),
      categoria: body.categoria,
      tipoPrecio: body.tipoPrecio,
      precio: parseFloat(body.precio),
      requisitoMinimo: {
        cantidad: parseInt(body.requisitoMinimo.cantidad),
        unidad: body.requisitoMinimo.unidad.trim()
      },
      duracionHoras: parseFloat(body.duracionHoras),
      incluye: Array.isArray(body.incluye) ? body.incluye.filter(function (i) { return i && i.trim(); }) : [],
      notas: body.notas || '',
      tipoDisponibilidad: body.tipoDisponibilidad || 'unica',
      capacidadDiaria: body.capacidadDiaria ? parseInt(body.capacidadDiaria) : 1,
      orden: typeof body.orden === 'number' ? body.orden : 0,
      activo: body.activo !== undefined ? body.activo : true,
      imagenes: []
    });

    await nuevoServicio.save();

    logger.info('Servicio creado', {
      correlationId: req.correlationId,
      context: {
        servicioId: nuevoServicio._id,
        nombre: nuevoServicio.nombre,
        adminId: req.usuario._id
      }
    });

    // Populate categoría para devolver al frontend
    await nuevoServicio.populate('categoria', 'nombre slug icono');

    res.status(201).json({ data: nuevoServicio });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/servicios/:id
 * Editar cualquier campo de un servicio existente
 * (Reemplaza el PATCH básico que estaba en admin.js)
 */
router.patch('/:id', async function (req, res, next) {
  try {
    var servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    var body = req.body;

    var errorValidacion = validarCamposServicio(body, false);
    if (errorValidacion) {
      return res.status(400).json(errorValidacion);
    }

    // Nombre: validar unicidad si cambia
    if (body.nombre !== undefined && body.nombre.trim() !== servicio.nombre) {
      var existe = await Servicio.findOne({
        nombre: body.nombre.trim(),
        _id: { $ne: servicio._id }
      });
      if (existe) {
        return res.status(409).json({ error: 'Ya existe otro servicio con ese nombre.' });
      }
      servicio.nombre = body.nombre.trim();
    }

    // Categoría: validar que exista y esté activa si cambia
    if (body.categoria !== undefined && body.categoria.toString() !== servicio.categoria.toString()) {
      var catNueva = await Categoria.findById(body.categoria);
      if (!catNueva) {
        return res.status(400).json({ error: 'La categoría no existe.' });
      }
      if (!catNueva.activa) {
        return res.status(400).json({ error: 'La categoría está desactivada.' });
      }
      servicio.categoria = body.categoria;
    }

    // Campos simples
    if (body.descripcion !== undefined) servicio.descripcion = body.descripcion.trim();
    if (body.descripcionCorta !== undefined) servicio.descripcionCorta = body.descripcionCorta.trim();
    if (body.tipoPrecio !== undefined) servicio.tipoPrecio = body.tipoPrecio;
    if (body.precio !== undefined) servicio.precio = parseFloat(body.precio);
    if (body.duracionHoras !== undefined) servicio.duracionHoras = parseFloat(body.duracionHoras);
    if (body.incluye !== undefined) {
      servicio.incluye = Array.isArray(body.incluye)
        ? body.incluye.filter(function (i) { return i && i.trim(); })
        : [];
    }
    if (body.notas !== undefined) servicio.notas = body.notas;
    if (body.tipoDisponibilidad !== undefined) servicio.tipoDisponibilidad = body.tipoDisponibilidad;
    if (body.capacidadDiaria !== undefined) servicio.capacidadDiaria = parseInt(body.capacidadDiaria);
    if (typeof body.orden === 'number') servicio.orden = body.orden;

    // requisitoMinimo
    if (body.requisitoMinimo !== undefined) {
      if (body.requisitoMinimo.cantidad !== undefined) {
        servicio.requisitoMinimo.cantidad = parseInt(body.requisitoMinimo.cantidad);
      }
      if (body.requisitoMinimo.unidad !== undefined) {
        servicio.requisitoMinimo.unidad = body.requisitoMinimo.unidad.trim();
      }
    }

    // Desactivar: advertir si hay cotizaciones pendientes
    if (body.activo !== undefined && servicio.activo === true && body.activo === false) {
      var cotizacionesActivas = await Cotizacion.countDocuments({
        'servicios.servicioId': servicio._id,
        estado: { $in: ['pendiente', 'en_negociacion'] }
      });
      if (cotizacionesActivas > 0 && !body.forzarDesactivacion) {
        return res.status(409).json({
          error: 'El servicio tiene ' + cotizacionesActivas +
            ' cotización(es) pendiente(s) o en negociación. Envía forzarDesactivacion=true para continuar.',
          cotizacionesActivas: cotizacionesActivas
        });
      }
      servicio.activo = false;
    } else if (body.activo !== undefined) {
      servicio.activo = body.activo;
    }

    await servicio.save();
    await servicio.populate('categoria', 'nombre slug icono');

    logger.info('Servicio editado', {
      correlationId: req.correlationId,
      context: {
        servicioId: servicio._id,
        nombre: servicio.nombre,
        adminId: req.usuario._id
      }
    });

    res.json({ data: servicio });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/servicios/:id
 * Soft delete: marca el servicio como inactivo.
 * Advierte si tiene cotizaciones pendientes o confirmadas futuras.
 * Para forzar: ?forzar=true
 */
router.delete('/:id', async function (req, res, next) {
  try {
    var servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    var forzar = req.query.forzar === 'true';

    // Verificar cotizaciones activas
    var cotizacionesActivas = await Cotizacion.countDocuments({
      'servicios.servicioId': servicio._id,
      estado: { $in: ['pendiente', 'en_negociacion'] }
    });

    // Verificar confirmaciones futuras (registros en Disponibilidad con fecha >= hoy)
    var hoy = new Date().toISOString().split('T')[0];
    var confirmacionesFuturas = await Disponibilidad.countDocuments({
      servicioId: servicio._id,
      fecha: { $gte: hoy },
      estado: 'ocupado'
    });

    if (!forzar && (cotizacionesActivas > 0 || confirmacionesFuturas > 0)) {
      return res.status(409).json({
        error: 'El servicio tiene dependencias activas.',
        cotizacionesActivas: cotizacionesActivas,
        confirmacionesFuturas: confirmacionesFuturas,
        mensaje: 'Para desactivar de todas formas, envía ?forzar=true'
      });
    }

    servicio.activo = false;
    await servicio.save();

    logger.info('Servicio desactivado (soft delete)', {
      correlationId: req.correlationId,
      context: {
        servicioId: servicio._id,
        nombre: servicio.nombre,
        forzado: forzar,
        adminId: req.usuario._id
      }
    });

    res.json({
      data: servicio,
      mensaje: 'Servicio desactivado exitosamente.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
