/* ============================================
   DREAM DAY — Patrón Repository (Base)
   Práctica 2 — Patrones de diseño
   
   El patrón Repository abstrae el acceso a datos,
   creando una capa entre la lógica de negocio y
   la base de datos. Permite cambiar la BD sin
   modificar la lógica de negocio.
   
   Uso:
     var repo = new BaseRepository(ModeloMongoose);
     var items = await repo.findAll({ activo: true });
   ============================================ */

class BaseRepository {
  constructor(modelo) {
    this.modelo = modelo;
  }

  // Buscar todos con filtros opcionales
  async findAll(filtro = {}, opciones = {}) {
    var query = this.modelo.find(filtro);
    if (opciones.select) query = query.select(opciones.select);
    if (opciones.populate) query = query.populate(opciones.populate);
    if (opciones.sort) query = query.sort(opciones.sort);
    if (opciones.limit) query = query.limit(opciones.limit);
    if (opciones.skip) query = query.skip(opciones.skip);
    return await query;
  }

  // Buscar uno por ID
  async findById(id, opciones = {}) {
    var query = this.modelo.findById(id);
    if (opciones.select) query = query.select(opciones.select);
    if (opciones.populate) query = query.populate(opciones.populate);
    return await query;
  }

  // Buscar uno con filtro
  async findOne(filtro, opciones = {}) {
    var query = this.modelo.findOne(filtro);
    if (opciones.select) query = query.select(opciones.select);
    if (opciones.populate) query = query.populate(opciones.populate);
    return await query;
  }

  // Crear documento
  async create(datos) {
    var doc = new this.modelo(datos);
    return await doc.save();
  }

  // Actualizar por ID
  async updateById(id, datos) {
    return await this.modelo.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
  }

  // Actualizar con filtro
  async updateOne(filtro, datos) {
    return await this.modelo.findOneAndUpdate(filtro, datos, { new: true });
  }

  // Actualizar múltiples
  async updateMany(filtro, datos) {
    return await this.modelo.updateMany(filtro, datos);
  }

  // Eliminar por ID
  async deleteById(id) {
    return await this.modelo.findByIdAndDelete(id);
  }

  // Eliminar con filtro
  async deleteOne(filtro) {
    return await this.modelo.deleteOne(filtro);
  }

  // Eliminar múltiples
  async deleteMany(filtro) {
    return await this.modelo.deleteMany(filtro);
  }

  // Contar documentos
  async count(filtro = {}) {
    return await this.modelo.countDocuments(filtro);
  }

  // Verificar si existe
  async exists(filtro) {
    var doc = await this.modelo.findOne(filtro).select('_id');
    return !!doc;
  }

  // Paginación
  async paginate(filtro = {}, pagina = 1, limite = 20, opciones = {}) {
    var skip = (pagina - 1) * limite;
    var total = await this.count(filtro);
    var datos = await this.findAll(filtro, { ...opciones, skip, limit: limite });
    return {
      datos,
      paginacion: {
        pagina,
        limite,
        total,
        paginas: Math.ceil(total / limite)
      }
    };
  }
}

module.exports = BaseRepository;
