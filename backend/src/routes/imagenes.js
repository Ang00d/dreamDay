/* ============================================
   DREAM DAY — Rutas: Imagenes de Servicios
   
   POST   /api/admin/servicios/:id/imagenes  — Subir imagenes
   DELETE /api/admin/servicios/:id/imagenes/:imagenId — Eliminar imagen
   PATCH  /api/admin/servicios/:id/imagenes/:imagenId/principal — Marcar como principal
   ============================================ */
var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var { upload, subirACloudinary, eliminarDeCloudinary } = require('../middleware/upload');
var Servicio = require('../models/Servicio');
var logger = require('../config/logger');

// Todas las rutas requieren autenticacion
router.use(auth);

/**
 * POST /api/admin/servicios/:id/imagenes
 * Subir 1-5 imagenes a un servicio
 */
router.post('/:id/imagenes', upload.array('imagenes', 5), async function (req, res, next) {
  try {
    var servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos una imagen.' });
    }

    // Verificar limite de 5 imagenes por servicio
    var imagenesActuales = servicio.imagenes ? servicio.imagenes.length : 0;
    if (imagenesActuales + req.files.length > 5) {
      return res.status(400).json({
        error: 'Maximo 5 imagenes por servicio. Actualmente tiene ' + imagenesActuales + '.'
      });
    }

    var nuevasImagenes = [];

    for (var i = 0; i < req.files.length; i++) {
      var file = req.files[i];
      var resultado = await subirACloudinary(file.buffer, {
        carpeta: 'dreamday/servicios/' + servicio._id,
        nombre: servicio.nombre
      });

      var esLaPrimera = imagenesActuales === 0 && i === 0;

      nuevasImagenes.push({
        url: resultado.url,
        thumbnailUrl: resultado.thumbnailUrl,
        publicId: resultado.publicId,
        alt: servicio.nombre + ' - imagen ' + (imagenesActuales + i + 1),
        esPrincipal: esLaPrimera,
        orden: imagenesActuales + i
      });
    }

    // Agregar al servicio
    servicio.imagenes = servicio.imagenes.concat(nuevasImagenes);
    await servicio.save();

    logger.info('Imagenes subidas a servicio', {
      correlationId: req.correlationId,
      userId: req.usuario._id,
      context: {
        servicioId: servicio._id,
        servicioNombre: servicio.nombre,
        cantidad: nuevasImagenes.length,
        totalImagenes: servicio.imagenes.length
      }
    });

    res.status(201).json({
      data: {
        mensaje: nuevasImagenes.length + ' imagen(es) subida(s) exitosamente',
        imagenes: servicio.imagenes
      }
    });
  } catch (err) {
    if (err.message && err.message.indexOf('Solo se permiten') !== -1) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * DELETE /api/admin/servicios/:id/imagenes/:imagenId
 * Eliminar una imagen de un servicio
 */
router.delete('/:id/imagenes/:imagenId', async function (req, res, next) {
  try {
    var servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    var imagen = servicio.imagenes.id(req.params.imagenId);
    if (!imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada.' });
    }

    // Eliminar de Cloudinary
    if (imagen.publicId) {
      try {
        await eliminarDeCloudinary(imagen.publicId);
      } catch (cloudErr) {
        logger.warn('No se pudo eliminar imagen de Cloudinary', {
          correlationId: req.correlationId,
          context: { publicId: imagen.publicId, error: cloudErr.message }
        });
      }
    }

    // Eliminar del array
    var eraPrincipal = imagen.esPrincipal;
    servicio.imagenes.pull(req.params.imagenId);

    // Si era la principal, hacer principal a la primera disponible
    if (eraPrincipal && servicio.imagenes.length > 0) {
      servicio.imagenes[0].esPrincipal = true;
    }

    await servicio.save();

    logger.info('Imagen eliminada de servicio', {
      correlationId: req.correlationId,
      userId: req.usuario._id,
      context: {
        servicioId: servicio._id,
        imagenId: req.params.imagenId,
        remainingImages: servicio.imagenes.length
      }
    });

    res.json({
      data: {
        mensaje: 'Imagen eliminada exitosamente',
        imagenes: servicio.imagenes
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/servicios/:id/imagenes/:imagenId/principal
 * Marcar una imagen como principal
 */
router.patch('/:id/imagenes/:imagenId/principal', async function (req, res, next) {
  try {
    var servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    var imagen = servicio.imagenes.id(req.params.imagenId);
    if (!imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada.' });
    }

    // Quitar principal de todas
    servicio.imagenes.forEach(function (img) {
      img.esPrincipal = false;
    });

    // Marcar la seleccionada
    imagen.esPrincipal = true;
    await servicio.save();

    logger.info('Imagen principal cambiada', {
      correlationId: req.correlationId,
      userId: req.usuario._id,
      context: {
        servicioId: servicio._id,
        imagenId: req.params.imagenId
      }
    });

    res.json({
      data: {
        mensaje: 'Imagen principal actualizada',
        imagenes: servicio.imagenes
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
