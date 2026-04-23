/* ============================================
   DREAM DAY — Modelo: Servicio
   
   Los 57 servicios del catalogo.
   NOTA: el campo "precio" solo es visible para el admin.
   Al cliente NO se le muestra — se negocia por WhatsApp.
   
   Actualizado: soporte para Cloudinary (thumbnailUrl, publicId)
   ============================================ */
var mongoose = require('mongoose');

var imagenSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' },
  esPrincipal: { type: Boolean, default: false },
  orden: { type: Number, default: 0 }
}, { _id: true });

var servicioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del servicio es obligatorio'],
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripcion es obligatoria']
  },
  descripcionCorta: {
    type: String,
    required: [true, 'La descripcion corta es obligatoria'],
    maxlength: [80, 'Maximo 80 caracteres']
  },
  imagenes: [imagenSchema],
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'La categoria es obligatoria']
  },
  // Solo visible para admin, NUNCA se envia al cliente
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio']
  },
  tipoPrecio: {
    type: String,
    enum: ['por_persona', 'por_pieza', 'por_orden', 'por_juego', 'precio_fijo'],
    required: [true, 'El tipo de precio es obligatorio']
  },
  requisitoMinimo: {
    cantidad: { type: Number, required: true },
    unidad: { type: String, required: true }
  },
  duracionHoras: {
    type: Number,
    required: [true, 'La duracion es obligatoria']
  },
  incluye: [String],
  notas: String,
  contenido: {
    type: String,
    default: ''
    // Qué equipo/material llevar al evento
    // Ej: "2 mesas buffet, 3 chafers, platos, cubiertos, mantel"
    // Solo se muestra en el PDF de Orden del Día (logística)
  },
  tipoDisponibilidad: {
    type: String,
    enum: ['unica', 'multiple'],
    default: 'unica'
  },
  capacidadDiaria: {
    type: Number,
    default: 1
  },
  activo: {
    type: Boolean,
    default: true
  },
  orden: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

servicioSchema.pre('save', function () {
  this.updatedAt = new Date();
});

servicioSchema.index({ categoria: 1, activo: 1, orden: 1 });
servicioSchema.index({ activo: 1 });

module.exports = mongoose.model('Servicio', servicioSchema);
