/* ============================================
   DREAM DAY — Rutas: Cotizaciones (publicas)
   
   POST /api/cotizaciones                  — Crear solicitud
   GET  /api/cotizaciones/consultar/:codigo — Consultar por codigo
   ============================================ */

var express = require('express');
var router = express.Router();
var Cotizacion = require('../models/Cotizacion');
var Servicio = require('../models/Servicio');
var { generarCodigoReferencia } = require('../utils/generarCodigo');
var logger = require('../config/logger');

/**
 * Sumar horas a un string HH:mm → HH:mm
 */
function sumarHorasStr(horaStr, horas) {
  if (!horaStr || typeof horaStr !== 'string') return '--:--';
  var partes = horaStr.split(':');
  var h = parseInt(partes[0]);
  var m = parseInt(partes[1]) || 0;
  if (isNaN(h)) return '--:--';
  var totalMin = h * 60 + m + Math.round(horas * 60);
  if (totalMin < 0) totalMin = 0;
  var nh = Math.floor(totalMin / 60);
  var nm = totalMin % 60;
  return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0');
}

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
    });

    if (serviciosDB.length !== serviciosIds.length) {
      return res.status(400).json({ error: 'Uno o mas servicios no existen o estan inactivos.' });
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
 * Incluye horarios de entrega/recolección calculados.
 */
router.get('/consultar/:codigo', async function (req, res, next) {
  try {
    var codigo = req.params.codigo.toUpperCase().trim();

    var cotizacion = await Cotizacion.findOne({
      codigoReferencia: codigo
    }).select('codigoReferencia estado evento cliente.nombre servicios createdAt');

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotizacion no encontrada. Verifica el codigo.' });
    }

    // Calcular horarios de entrega/recolección por servicio
    var horaInicio = cotizacion.evento.horaInicio || '12:00';

    var serviciosConHorarios = [];
    for (var i = 0; i < cotizacion.servicios.length; i++) {
      var servCot = cotizacion.servicios[i];
      var servDB = null;

      // Buscar info adicional del servicio
      try {
        servDB = await Servicio.findById(servCot.servicioId)
          .populate('categoria', 'slug')
          .select('duracionHoras categoria tipoPrecio requisitoMinimo')
          .lean();
      } catch (e) {
        // Si falla, usar valores por defecto
      }

      var duracion = (servDB && servDB.duracionHoras) || 2;
      var catSlug = (servDB && servDB.categoria && servDB.categoria.slug) || '';
      var necesitaMontaje = catSlug === 'comida' || catSlug === 'bebidas';
      var tipoPrecio = (servDB && servDB.tipoPrecio) || 'precio_fijo';

      var horaEntrega = necesitaMontaje
        ? sumarHorasStr(horaInicio, -1)
        : horaInicio;
      var horaRecoger = sumarHorasStr(horaInicio, duracion);

      // Determinar si este servicio muestra piezas/unidades
      var tienePiezas = tipoPrecio === 'por_pieza' || tipoPrecio === 'por_orden' || tipoPrecio === 'por_juego';
      var unidad = (servDB && servDB.requisitoMinimo && servDB.requisitoMinimo.unidad) || 'piezas';

      serviciosConHorarios.push({
        nombre: servCot.nombre,
        cantidad: servCot.cantidad,
        piezas: tienePiezas ? servCot.cantidad : null,
        unidad: tienePiezas ? unidad : null,
        horaEntrega: horaEntrega,
        horaRecoger: horaRecoger,
        duracionHoras: duracion
      });
    }

    logger.info('Cotizacion consultada por cliente', {
      correlationId: req.correlationId,
      context: { codigo: codigo }
    });

    res.json({
      data: {
        codigoReferencia: cotizacion.codigoReferencia,
        estado: cotizacion.estado,
        evento: {
          fecha: cotizacion.evento.fecha,
          horaInicio: cotizacion.evento.horaInicio,
          personas: cotizacion.evento.personas,
          ubicacion: cotizacion.evento.ubicacion
        },
        cliente: {
          nombre: cotizacion.cliente.nombre
        },
        servicios: serviciosConHorarios,
        createdAt: cotizacion.createdAt
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
