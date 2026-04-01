/* ============================================
   DREAM DAY — Modelo: Categoria
   
   Las 5 categorias dinamicas de servicios.
   El admin puede crear, editar y desactivar categorias.
   
   Ejemplo: { nombre: "Comida", slug: "comida", icono: "🍽", orden: 1 }
   ============================================ */

var mongoose = require('mongoose');

var categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la categoria es obligatorio'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'El slug es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  icono: {
    type: String,
    default: '✨'
  },
  orden: {
    type: Number,
    default: 0
  },
  activa: {
    type: Boolean,
    default: true
  },
  anticipacionMinimaDias: {
    type: Number,
    default: 0
    // 7 para comida/bebidas, 0 para postres/inflables/extras
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indice para ordenar rapido
categoriaSchema.index({ orden: 1 });
categoriaSchema.index({ activa: 1, orden: 1 });

module.exports = mongoose.model('Categoria', categoriaSchema);
