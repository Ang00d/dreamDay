/* ============================================
   DREAM DAY — Microservicio: CatalogService
   Práctica 2 — Microservicios
   
   Gestiona el catálogo de servicios, categorías
   y disponibilidad. Toda la lógica de negocio
   del catálogo está centralizada aquí.
   
   Patrón: Service Layer + Repository
   ============================================ */

var { servicioRepository, cotizacionRepository } = require('../repositories');
var Categoria = require('../models/Categoria');
var Disponibilidad = require('../models/Disponibilidad');
var logger = require('../config/logger');

var CatalogService = {

  // ── Categorías ─────────────────────────────────────────────
  async obtenerCategorias() {
    var categorias = await Categoria.find({ activa: true }).sort({ orden: 1 });
    return categorias;
  },

  async obtenerCategoriaPorSlug(slug) {
    return await Categoria.findOne({ slug, activa: true });
  },

  // ── Servicios ──────────────────────────────────────────────
  async obtenerServicios(filtro = {}) {
    var query = { activo: true };
    if (filtro.categoria) query.categoria = filtro.categoria;
    if (filtro.buscar) {
      var regex = new RegExp(filtro.buscar, 'i');
      query.$or = [{ nombre: regex }, { descripcion: regex }];
    }
    return await servicioRepository.findActivos(query);
  },

  async obtenerServicioPorId(id) {
    var servicio = await servicioRepository.findById(id, {
      populate: { path: 'categoria', select: 'nombre slug icono' }
    });
    if (!servicio || !servicio.activo) return null;
    return servicio;
  },

  async actualizarServicio(id, datos) {
    var servicio = await servicioRepository.findById(id);
    if (!servicio) return null;

    if (datos.capacidadDiaria !== undefined) {
      var cap = parseInt(datos.capacidadDiaria);
      if (isNaN(cap) || cap < 1) throw new Error('Capacidad diaria debe ser al menos 1.');
      servicio.capacidadDiaria = cap;
    }
    if (datos.activo !== undefined) servicio.activo = datos.activo;
    if (datos.precio !== undefined) {
      var precio = parseFloat(datos.precio);
      if (!isNaN(precio) && precio >= 0) servicio.precio = precio;
    }
    if (datos.notas !== undefined) servicio.notas = datos.notas;

    await servicio.save();
    return servicio;
  },

  // ── Disponibilidad ─────────────────────────────────────────
  async verificarDisponibilidad(servicioId, fecha) {
    var bloqueo = await Disponibilidad.findOne({
      servicioId, fecha, estado: 'bloqueado_admin'
    });
    if (bloqueo) return { disponible: false, motivo: 'Bloqueado por administrador' };

    var servicio = await servicioRepository.findById(servicioId);
    var capacidad = (servicio && servicio.capacidadDiaria) ? servicio.capacidadDiaria : 1;

    var ocupados = await Disponibilidad.countDocuments({
      servicioId, fecha, estado: 'ocupado'
    });

    return {
      disponible: ocupados < capacidad,
      capacidad,
      ocupados,
      restantes: capacidad - ocupados
    };
  },

  async bloquearFecha(servicioId, fecha, motivo, adminId) {
    var existente = await Disponibilidad.findOne({ servicioId, fecha });
    if (existente) {
      existente.estado = 'bloqueado_admin';
      existente.motivoBloqueo = motivo || 'Bloqueado por admin';
      existente.bloqueadoPor = adminId;
      await existente.save();
    } else {
      await Disponibilidad.create({
        servicioId, fecha,
        estado: 'bloqueado_admin',
        motivoBloqueo: motivo || 'Bloqueado por admin',
        bloqueadoPor: adminId
      });
    }
    return true;
  },

  // ── Dashboard stats ────────────────────────────────────────
  async obtenerEstadisticas() {
    var cotizaciones = await cotizacionRepository.contarPorEstado();
    var recientes = await cotizacionRepository.findRecientes(5);
    var totalServicios = await servicioRepository.count({ activo: true });
    var totalCategorias = await Categoria.countDocuments({ activa: true });

    return {
      cotizaciones,
      recientes,
      catalogo: { servicios: totalServicios, categorias: totalCategorias }
    };
  }
};

module.exports = CatalogService;
