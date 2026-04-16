/* ============================================
   DREAM DAY — Rutas: Cotizaciones (publicas)
   
   POST /api/cotizaciones                  — Crear solicitud
   GET  /api/cotizaciones/consultar/:codigo — Consultar por codigo
   
   ACTUALIZADO: Valida anticipación mínima por categoría.
   Ej: Comida/Bebidas requieren 7 días de anticipación.
   ============================================ */

var express = require('express');
var router = express.Router();
var Cotizacion = require('../models/Cotizacion');
var Servicio = require('../models/Servicio');
var { generarCodigoReferencia } = require('../utils/generarCodigo');
var logger = require('../config/logger');

/**
 * POST /api/cotizaciones
 * Crear una nueva solicitud de cotizacion
 * 
 * Body: {
 *   cliente: { nombre, email, telefono },
 *   evento: { fecha, horaInicio, personas, ubicacion, codigoPostal, notas },
 *   servicios: [{ servicioId, cantidad, notas }]
 * }
 */
router.post('/', async function (req, res, next) {
  try {
    var body = req.body;

    // ---- Validaciones basicas ----
    if (!body.cliente || !body.evento || !body.servicios) {
      return res.status(400).json({ error: 'Faltan datos: cliente, evento y servicios son obligatorios.' });
    }

    if (!body.cliente.nombre || body.cliente.nombre.length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres.' });
    }

    if (!body.cliente.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.cliente.email)) {
      return res.status(400).json({ error: 'Email invalido.' });
    }

    if (!body.cliente.telefono || !/^\d{10}$/.test(body.cliente.telefono)) {
      return res.status(400).json({ error: 'Telefono debe tener 10 digitos.' });
    }

    if (!body.evento.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(body.evento.fecha)) {
      return res.status(400).json({ error: 'Fecha invalida. Formato: YYYY-MM-DD' });
    }

    // Verificar que la fecha no sea pasada
    var hoy = new Date().toISOString().split('T')[0];
    if (body.evento.fecha < hoy) {
      return res.status(400).json({ error: 'La fecha del evento no puede ser en el pasado.' });
    }

    if (!body.evento.personas || body.evento.personas < 1) {
      return res.status(400).json({ error: 'La cantidad de personas debe ser al menos 1.' });
    }

    if (!body.evento.ubicacion || body.evento.ubicacion.length < 5) {
      return res.status(400).json({ error: 'La ubicacion debe tener al menos 5 caracteres.' });
    }

    if (!body.evento.codigoPostal || !/^\d{5}$/.test(body.evento.codigoPostal)) {
      return res.status(400).json({ error: 'Codigo postal debe tener 5 digitos.' });
    }

    if (!Array.isArray(body.servicios) || body.servicios.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un servicio.' });
    }

    // ---- Verificar que los servicios existen ----
    var serviciosIds = body.servicios.map(function (s) { return s.servicioId; });
    var serviciosDB = await Servicio.find({
      _id: { $in: serviciosIds },
      activo: true
    }).populate('categoria', 'nombre anticipacionMinimaDias');

    if (serviciosDB.length !== serviciosIds.length) {
      return res.status(400).json({ error: 'Uno o mas servicios no existen o estan inactivos.' });
    }

    // ---- Validar anticipación mínima por categoría ----
    var fechaEvento = new Date(body.evento.fecha + 'T12:00:00');
    var ahora = new Date();
    // Calcular días naturales de diferencia
    var diffMs = fechaEvento.getTime() - ahora.getTime();
    var diasAnticipacion = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    var violaciones = [];
    serviciosDB.forEach(function (servicio) {
      if (servicio.categoria && servicio.categoria.anticipacionMinimaDias) {
        var minDias = servicio.categoria.anticipacionMinimaDias;
        if (diasAnticipacion < minDias) {
          // Evitar duplicar la misma categoría en el mensaje
          var yaIncluida = violaciones.find(function (v) {
            return v.categoria === servicio.categoria.nombre;
          });
          if (!yaIncluida) {
            violaciones.push({
              categoria: servicio.categoria.nombre,
              diasRequeridos: minDias,
              diasDisponibles: diasAnticipacion
            });
          }
        }
      }
    });

    if (violaciones.length > 0) {
      var mensajes = violaciones.map(function (v) {
        return v.categoria + ' requiere al menos ' + v.diasRequeridos + ' días de anticipación (solo tienes ' + v.diasDisponibles + ')';
      });
      return res.status(400).json({
        error: 'Anticipación insuficiente: ' + mensajes.join('. ') + '.'
      });
    }

    // ---- Preparar servicios con nombre ----
    var serviciosCotizados = body.servicios.map(function (s) {
      var servicioDB = serviciosDB.find(function (db) {
        return db._id.toString() === s.servicioId;
      });
      return {
        servicioId: s.servicioId,
        nombre: servicioDB.nombre,
        cantidad: s.cantidad || 1,
        notas: s.notas || ''
      };
    });

    // ---- Generar codigo de referencia unico ----
    var codigoReferencia = await generarCodigoReferencia();

    // ---- Crear la cotizacion ----
    var cotizacion = new Cotizacion({
      codigoReferencia: codigoReferencia,
      cliente: {
        nombre: body.cliente.nombre.trim(),
        email: body.cliente.email.trim().toLowerCase(),
        telefono: body.cliente.telefono.trim()
      },
      evento: {
        fecha: body.evento.fecha,
        horaInicio: body.evento.horaInicio || '12:00',
        personas: body.evento.personas,
        ubicacion: body.evento.ubicacion.trim(),
        codigoPostal: body.evento.codigoPostal.trim(),
        notas: body.evento.notas || ''
      },
      servicios: serviciosCotizados,
      estado: 'pendiente',
      creadoPorIP: req.ip
    });

    await cotizacion.save();

    logger.info('Cotizacion creada', {
      correlationId: req.correlationId,
      context: {
        codigo: codigoReferencia,
        cliente: body.cliente.email,
        servicios: serviciosCotizados.length,
        fecha: body.evento.fecha
      }
    });

    // Responder con el codigo (NO con precios)
    res.status(201).json({
      data: {
        codigoReferencia: codigoReferencia,
        mensaje: 'Solicitud de cotizacion creada exitosamente. Guarda tu codigo de referencia para dar seguimiento.',
        whatsapp: 'https://wa.me/' + (process.env.WHATSAPP_NUMERO || '524491234567').replace('+', '') + '?text=Hola! Mi codigo de cotizacion es: ' + codigoReferencia
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cotizaciones/consultar/:codigo
 * Consultar el estado de una cotizacion por codigo
 * 
 * Solo muestra: codigo, estado, fecha, servicios (sin precios)
 */
router.get('/consultar/:codigo', async function (req, res, next) {
  try {
    var codigo = req.params.codigo.toUpperCase().trim();

    var cotizacion = await Cotizacion.findOne({
      codigoReferencia: codigo
    }).select('codigoReferencia estado evento.fecha evento.horaInicio servicios.nombre servicios.cantidad createdAt');

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotizacion no encontrada. Verifica el codigo.' });
    }

    logger.info('Cotizacion consultada por cliente', {
      correlationId: req.correlationId,
      context: { codigo: codigo }
    });

    res.json({
      data: {
        codigoReferencia: cotizacion.codigoReferencia,
        estado: cotizacion.estado,
        fechaEvento: cotizacion.evento.fecha,
        horaInicio: cotizacion.evento.horaInicio,
        servicios: cotizacion.servicios.map(function (s) {
          return { nombre: s.nombre, cantidad: s.cantidad };
        }),
        createdAt: cotizacion.createdAt
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
