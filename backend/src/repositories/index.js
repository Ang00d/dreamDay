/* ============================================
   DREAM DAY — Repositorios específicos
   Práctica 2 — Patrón Repository
   
   Cada repositorio extiende BaseRepository y
   añade métodos específicos del dominio.
   ============================================ */

var BaseRepository = require('./baseRepository');
var Usuario = require('../models/Usuario');
var Cotizacion = require('../models/Cotizacion');
var Servicio = require('../models/Servicio');
var Session = require('../models/Session');

// ── Usuario Repository ──────────────────────────────────────
class UsuarioRepository extends BaseRepository {
  constructor() {
    super(Usuario);
  }

  async findByEmail(email) {
    return await this.findOne({ email: email.toLowerCase().trim() });
  }

  async findActivos() {
    return await this.findAll({ activo: true }, { sort: { createdAt: -1 } });
  }

  async findByRol(rol) {
    return await this.findAll({ rol, activo: true });
  }

  async desactivar(id) {
    return await this.updateById(id, { activo: false });
  }

  async resetearIntentos(id) {
    return await this.updateById(id, { intentosFallidos: 0, bloqueadoHasta: null });
  }
}

// ── Cotización Repository ───────────────────────────────────
class CotizacionRepository extends BaseRepository {
  constructor() {
    super(Cotizacion);
  }

  async findByCodigo(codigo) {
    return await this.findOne({ codigoReferencia: codigo.toUpperCase().trim() });
  }

  async findByEstado(estado, pagina = 1, limite = 20) {
    return await this.paginate({ estado }, pagina, limite, { sort: { createdAt: -1 } });
  }

  async findRecientes(limite = 5) {
    return await this.findAll({}, {
      sort: { createdAt: -1 },
      limit: limite,
      select: 'codigoReferencia cliente.nombre estado evento.fecha createdAt'
    });
  }

  async contarPorEstado() {
    var total = await this.count();
    var pendientes = await this.count({ estado: 'pendiente' });
    var enNegociacion = await this.count({ estado: 'en_negociacion' });
    var confirmadas = await this.count({ estado: 'confirmada' });
    var rechazadas = await this.count({ estado: 'rechazada' });
    return { total, pendientes, enNegociacion, confirmadas, rechazadas };
  }
}

// ── Servicio Repository ─────────────────────────────────────
class ServicioRepository extends BaseRepository {
  constructor() {
    super(Servicio);
  }

  async findActivos(filtro = {}) {
    return await this.findAll({ ...filtro, activo: true }, {
      populate: { path: 'categoria', select: 'nombre slug icono' },
      sort: { orden: 1 }
    });
  }

  async findByCategoria(categoriaId) {
    return await this.findActivos({ categoria: categoriaId });
  }

  async buscar(texto) {
    var regex = new RegExp(texto, 'i');
    return await this.findActivos({ $or: [{ nombre: regex }, { descripcion: regex }] });
  }
}

// ── Session Repository ──────────────────────────────────────
class SessionRepository extends BaseRepository {
  constructor() {
    super(Session);
  }

  async findActivasByUsuario(usuarioId) {
    return await this.findAll(
      { usuarioId, activa: true, expiracion: { $gt: new Date() } },
      { sort: { ultimaActividad: -1 } }
    );
  }

  async revocarPorTokenId(tokenId) {
    return await this.updateOne({ tokenId }, { activa: false });
  }

  async revocarTodasExcepto(usuarioId, tokenIdActual) {
    return await this.updateMany(
      { usuarioId, activa: true, tokenId: { $ne: tokenIdActual } },
      { activa: false }
    );
  }
}

// ── Exportar instancias (Singleton por módulo) ──────────────
module.exports = {
  usuarioRepository: new UsuarioRepository(),
  cotizacionRepository: new CotizacionRepository(),
  servicioRepository: new ServicioRepository(),
  sessionRepository: new SessionRepository()
};
