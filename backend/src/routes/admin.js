/* ============================================
   DREAM DAY — Rutas: Admin (protegidas)
   
   Todas requieren: Authorization: Bearer <token>
   
   GET    /api/admin/dashboard            — Estadisticas
   GET    /api/admin/cotizaciones          — Listar cotizaciones
   GET    /api/admin/cotizaciones/:id      — Detalle cotizacion
   PATCH  /api/admin/cotizaciones/:id      — Actualizar estado/notas
   POST   /api/admin/disponibilidad/bloquear — Bloquear fecha
   DELETE /api/admin/disponibilidad/:id    — Desbloquear fecha
   GET    /api/admin/servicios             — Listar servicios (con precios)
   ============================================ */

var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');
var Cotizacion = require('../models/Cotizacion');
var Cita = require('../models/Cita');
var Disponibilidad = require('../models/Disponibilidad');
var Servicio = require('../models/Servicio');
var Categoria = require('../models/Categoria');
var logger = require('../config/logger');

// Todas las rutas admin requieren autenticacion
router.use(auth);

/* ============================================
   DASHBOARD
   ============================================ */

/**
 * GET /api/admin/dashboard
 * Estadisticas generales del sistema
 */
router.get('/dashboard', async function (req, res, next) {
  try {
    // Conteos basicos
    var totalCotizaciones = await Cotizacion.countDocuments();
    var pendientes = await Cotizacion.countDocuments({ estado: 'pendiente' });
    var enNegociacion = await Cotizacion.countDocuments({ estado: 'en_negociacion' });
    var confirmadas = await Cotizacion.countDocuments({ estado: 'confirmada' });
    var rechazadas = await Cotizacion.countDocuments({ estado: 'rechazada' });

    // Cotizaciones recientes (ultimas 5)
    var recientes = await Cotizacion.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('codigoReferencia cliente.nombre estado evento.fecha createdAt');

    // Citas proximas (futuras confirmadas)
    var hoy = new Date().toISOString().split('T')[0];
    var citasProximas = await Cita.find({
      'evento.fecha': { $gte: hoy },
      estado: 'confirmada'
    })
      .sort({ 'evento.fecha': 1 })
      .limit(5)
      .select('codigoReferencia cliente.nombre evento.fecha evento.personas');

    var totalServicios = await Servicio.countDocuments({ activo: true });
    var totalCategorias = await Categoria.countDocuments({ activa: true });

    logger.info('Dashboard admin consultado', {
      correlationId: req.correlationId,
      context: { adminId: req.usuario._id }
    });

    res.json({
      data: {
        cotizaciones: {
          total: totalCotizaciones,
          pendientes: pendientes,
          enNegociacion: enNegociacion,
          confirmadas: confirmadas,
          rechazadas: rechazadas
        },
        recientes: recientes,
        citasProximas: citasProximas,
        catalogo: {
          servicios: totalServicios,
          categorias: totalCategorias
        }
      }
    });

  } catch (err) {
    next(err);
  }
});

/* ============================================
   COTIZACIONES (Admin)
   ============================================ */

/**
 * GET /api/admin/cotizaciones
 * Listar todas las cotizaciones con filtros
 * 
 * Query: ?estado=pendiente&pagina=1&limite=20
 */
router.get('/cotizaciones', async function (req, res, next) {
  try {
    var filtro = {};
    var pagina = parseInt(req.query.pagina) || 1;
    var limite = parseInt(req.query.limite) || 20;
    var skip = (pagina - 1) * limite;

    if (req.query.estado) {
      filtro.estado = req.query.estado;
    }

    if (req.query.fecha) {
      filtro['evento.fecha'] = req.query.fecha;
    }

    if (req.query.buscar) {
      var regex = new RegExp(req.query.buscar, 'i');
      filtro.$or = [
        { codigoReferencia: regex },
        { 'cliente.nombre': regex },
        { 'cliente.email': regex }
      ];
    }

    var total = await Cotizacion.countDocuments(filtro);
    var cotizaciones = await Cotizacion.find(filtro)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limite)
      .select('-__v');

    res.json({
      data: cotizaciones,
      paginacion: {
        pagina: pagina,
        limite: limite,
        total: total,
        paginas: Math.ceil(total / limite)
      }
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/cotizaciones/:id
 * Detalle completo de una cotizacion (con precios)
 */
router.get('/cotizaciones/:id', async function (req, res, next) {
  try {
    var cotizacion = await Cotizacion.findById(req.params.id)
      .populate('servicios.servicioId', 'nombre precio tipoPrecio');

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotizacion no encontrada.' });
    }

    res.json({ data: cotizacion });

  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/cotizaciones/:id
 * Actualizar estado, precios o notas de una cotizacion
 * 
 * Body: { estado, notasAdmin, servicios: [{ servicioId, precioUnitario, precioTotal }] }
 */
router.patch('/cotizaciones/:id', async function (req, res, next) {
  try {
    var cotizacion = await Cotizacion.findById(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotizacion no encontrada.' });
    }

    var body = req.body;
    var conflictosAutoMarcados = 0;

    // Actualizar estado
    if (body.estado) {
      var estadosValidos = ['pendiente', 'en_negociacion', 'confirmada', 'rechazada', 'cancelada', 'conflicto', 'completada'];
      if (estadosValidos.indexOf(body.estado) === -1) {
        return res.status(400).json({ error: 'Estado invalido.' });
      }
      cotizacion.estado = body.estado;

      // Al confirmar: validar disponibilidad respetando capacidadDiaria
      if (body.estado === 'confirmada' && cotizacion.evento && cotizacion.evento.fecha) {
        // Verificar cada servicio contra su capacidadDiaria
        var conflictos = [];
        for (var i = 0; i < cotizacion.servicios.length; i++) {
          var servCot = cotizacion.servicios[i];

          // Verificar bloqueo admin (siempre bloquea)
          var bloqueado = await Disponibilidad.findOne({
            servicioId: servCot.servicioId,
            fecha: cotizacion.evento.fecha,
            estado: 'bloqueado_admin'
          });
          if (bloqueado) {
            conflictos.push(servCot.nombre || servCot.servicioId);
            continue;
          }

          // Obtener capacidadDiaria del servicio
          var servDB = await Servicio.findById(servCot.servicioId).select('capacidadDiaria');
          var capacidad = (servDB && servDB.capacidadDiaria) ? servDB.capacidadDiaria : 1;

          // Contar cuántas confirmaciones ya existen ese día (excluyendo esta cotización)
          var ocupados = await Disponibilidad.countDocuments({
            servicioId: servCot.servicioId,
            fecha: cotizacion.evento.fecha,
            estado: 'ocupado',
            citaId: { $ne: cotizacion._id }
          });

          if (ocupados >= capacidad) {
            conflictos.push(servCot.nombre || servCot.servicioId);
          }
        }
        if (conflictos.length > 0) {
          return res.status(409).json({
            error: 'No se puede confirmar. Los siguientes servicios ya están al máximo de capacidad el ' + cotizacion.evento.fecha + ': ' + conflictos.join(', ')
          });
        }
        // Sin conflictos: crear registros de disponibilidad
        for (var k = 0; k < cotizacion.servicios.length; k++) {
          var servOk = cotizacion.servicios[k];
          await Disponibilidad.create({
            servicioId: servOk.servicioId,
            fecha: cotizacion.evento.fecha,
            estado: 'ocupado',
            citaId: cotizacion._id
          });
        }
        logger.info('Disponibilidad actualizada al confirmar', { cotizacionId: cotizacion._id, fecha: cotizacion.evento.fecha });

        // ★ DETECCIÓN AUTOMÁTICA DE CONFLICTOS
        // Buscar otras cotizaciones pendientes/en_negociacion en la misma fecha
        // que compartan al menos un servicio con esta que acabamos de confirmar.
        // Marcarlas como 'conflicto' para que el admin las revise.
        try {
          var serviciosIdsConfirmados = cotizacion.servicios.map(function (s) {
            return s.servicioId.toString();
          });

          var otrasCotizaciones = await Cotizacion.find({
            _id: { $ne: cotizacion._id },
            'evento.fecha': cotizacion.evento.fecha,
            estado: { $in: ['pendiente', 'en_negociacion'] },
            'servicios.servicioId': { $in: serviciosIdsConfirmados }
          });

          var marcadas = 0;
          for (var m = 0; m < otrasCotizaciones.length; m++) {
            var otra = otrasCotizaciones[m];

            // Identificar qué servicios están en conflicto
            var serviciosEnConflicto = otra.servicios.filter(function (s) {
              return serviciosIdsConfirmados.indexOf(s.servicioId.toString()) !== -1;
            });

            // Verificar capacidad: si alguno de los servicios en conflicto
            // aún tiene capacidad disponible, NO marcar (aún es viable).
            var hayConflictoReal = false;
            for (var n = 0; n < serviciosEnConflicto.length; n++) {
              var servConf = serviciosEnConflicto[n];
              var servDbConf = await Servicio.findById(servConf.servicioId).select('capacidadDiaria');
              var capConf = (servDbConf && servDbConf.capacidadDiaria) ? servDbConf.capacidadDiaria : 1;

              var ocupadosConf = await Disponibilidad.countDocuments({
                servicioId: servConf.servicioId,
                fecha: otra.evento.fecha,
                estado: { $in: ['ocupado', 'bloqueado_admin'] }
              });

              if (ocupadosConf >= capConf) {
                hayConflictoReal = true;
                break;
              }
            }

            if (hayConflictoReal) {
              otra.estado = 'conflicto';
              // Agregar nota automática (preservando notas existentes)
              var nombresConflicto = serviciosEnConflicto.map(function (s) { return s.nombre; }).join(', ');
              var notaAuto = '[Auto] Conflicto detectado el ' + new Date().toISOString().split('T')[0] +
                ': servicio(s) sin capacidad — ' + nombresConflicto +
                '. Otra cotización fue confirmada para la misma fecha.';
              otra.notasAdmin = otra.notasAdmin
                ? otra.notasAdmin + '\n\n' + notaAuto
                : notaAuto;
              await otra.save();
              marcadas++;
            }
          }

          if (marcadas > 0) {
            conflictosAutoMarcados = marcadas;
            logger.info('Cotizaciones marcadas como conflicto automáticamente', {
              correlationId: req.correlationId,
              context: {
                cotizacionConfirmada: cotizacion._id,
                fecha: cotizacion.evento.fecha,
                marcadas: marcadas
              }
            });
          }
        } catch (conflictErr) {
          // No hacer falla la confirmación si la detección de conflictos falla
          logger.error('Error detectando conflictos automáticos', {
            correlationId: req.correlationId,
            error: conflictErr.message,
            cotizacionId: cotizacion._id
          });
        }
      }

      // Al cancelar/rechazar: liberar registros de Disponibilidad
      if ((body.estado === 'cancelada' || body.estado === 'rechazada') && cotizacion.evento && cotizacion.evento.fecha) {
        for (var j = 0; j < cotizacion.servicios.length; j++) {
          var servCanc = cotizacion.servicios[j];
          await Disponibilidad.deleteOne({
            servicioId: servCanc.servicioId,
            fecha: cotizacion.evento.fecha,
            citaId: cotizacion._id
          });
        }
        logger.info('Disponibilidad liberada al cancelar/rechazar', { cotizacionId: cotizacion._id });
      }
    }

    // Actualizar notas del admin
    if (body.notasAdmin !== undefined) {
      cotizacion.notasAdmin = body.notasAdmin;
    }

    // Actualizar precios de servicios (solo admin)
    if (body.servicios && Array.isArray(body.servicios)) {
      body.servicios.forEach(function (s) {
        var servicioCotizado = cotizacion.servicios.find(function (sc) {
          return sc.servicioId.toString() === s.servicioId;
        });
        if (servicioCotizado) {
          if (s.precioUnitario !== undefined) servicioCotizado.precioUnitario = s.precioUnitario;
          if (s.precioTotal !== undefined) servicioCotizado.precioTotal = s.precioTotal;
        }
      });

      // Recalcular precio total
      var total = 0;
      cotizacion.servicios.forEach(function (s) {
        total += s.precioTotal || 0;
      });
      cotizacion.precioTotal = total;
    }

    await cotizacion.save();

    logger.info('Cotizacion actualizada por admin', {
      correlationId: req.correlationId,
      context: {
        cotizacionId: cotizacion._id,
        codigo: cotizacion.codigoReferencia,
        nuevoEstado: cotizacion.estado,
        adminId: req.usuario._id
      }
    });

    res.json({
      data: cotizacion,
      conflictosAutoMarcados: conflictosAutoMarcados
    });

  } catch (err) {
    next(err);
  }
});

/* ============================================
   DISPONIBILIDAD (Admin)
   ============================================ */

/**
 * POST /api/admin/disponibilidad/bloquear
 * Bloquear un servicio en una fecha
 * 
 * Body: { servicioId, fecha, motivoBloqueo }
 */
router.post('/disponibilidad/bloquear', async function (req, res, next) {
  try {
    var { servicioId, fecha, motivoBloqueo } = req.body;

    if (!servicioId || !fecha) {
      return res.status(400).json({ error: 'servicioId y fecha son obligatorios.' });
    }

    // Verificar si ya existe un registro para esa fecha/servicio
    var existente = await Disponibilidad.findOne({ servicioId: servicioId, fecha: fecha });

    if (existente) {
      existente.estado = 'bloqueado_admin';
      existente.motivoBloqueo = motivoBloqueo || 'Bloqueado por admin';
      existente.bloqueadoPor = req.usuario._id;
      await existente.save();
    } else {
      await Disponibilidad.create({
        servicioId: servicioId,
        fecha: fecha,
        estado: 'bloqueado_admin',
        motivoBloqueo: motivoBloqueo || 'Bloqueado por admin',
        bloqueadoPor: req.usuario._id
      });
    }

    logger.info('Disponibilidad bloqueada', {
      correlationId: req.correlationId,
      context: { servicioId: servicioId, fecha: fecha, adminId: req.usuario._id }
    });

    res.json({ data: { mensaje: 'Fecha bloqueada exitosamente.' } });

  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/disponibilidad/:id
 * Desbloquear una fecha (eliminar registro de disponibilidad)
 */
router.delete('/disponibilidad/:id', async function (req, res, next) {
  try {
    var registro = await Disponibilidad.findById(req.params.id);

    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }

    await registro.deleteOne();

    logger.info('Disponibilidad desbloqueada', {
      correlationId: req.correlationId,
      context: {
        servicioId: registro.servicioId,
        fecha: registro.fecha,
        adminId: req.usuario._id
      }
    });

    res.json({ data: { mensaje: 'Fecha desbloqueada exitosamente.' } });

  } catch (err) {
    next(err);
  }
});

/* ============================================
   SERVICIOS (Admin — con precios)
   ============================================ */

/**
 * GET /api/admin/servicios
 * Listar todos los servicios CON precios (solo admin)
 */
router.get('/servicios', async function (req, res, next) {
  try {
    var filtro = {};

    if (req.query.categoria) {
      filtro.categoria = req.query.categoria;
    }

    if (req.query.activo !== undefined) {
      filtro.activo = req.query.activo === 'true';
    }

    var servicios = await Servicio.find(filtro)
      .populate('categoria', 'nombre slug icono')
      .sort({ categoria: 1, orden: 1 });

    res.json({ data: servicios });

  } catch (err) {
    next(err);
  }
});

module.exports = router;

/**
 * PATCH /api/admin/servicios/:id
 * Actualizar campos editables de un servicio
 */
router.patch('/servicios/:id', async function (req, res, next) {
  try {
    var servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }

    var body = req.body;

    if (body.capacidadDiaria !== undefined) {
      var cap = parseInt(body.capacidadDiaria);
      if (isNaN(cap) || cap < 1) {
        return res.status(400).json({ error: 'La capacidad diaria debe ser al menos 1.' });
      }
      servicio.capacidadDiaria = cap;
    }

    if (body.tipoDisponibilidad !== undefined) {
      servicio.tipoDisponibilidad = body.tipoDisponibilidad;
    }

    if (body.activo !== undefined) {
      servicio.activo = body.activo;
    }

    if (body.precio !== undefined) {
      var precio = parseFloat(body.precio);
      if (!isNaN(precio) && precio >= 0) {
        servicio.precio = precio;
      }
    }

    if (body.notas !== undefined) {
      servicio.notas = body.notas;
    }

    await servicio.save();

    logger.info('Servicio actualizado por admin', {
      correlationId: req.correlationId,
      context: { servicioId: servicio._id, nombre: servicio.nombre, adminId: req.usuario._id }
    });

    res.json({ data: servicio });

  } catch (err) {
    next(err);
  }
});
