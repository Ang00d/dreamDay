/* ============================================
   DREAM DAY — Modelo: Cita
   
   Cita confirmada (viene de una cotizacion).
   Al crear una cita, se bloquea la disponibilidad
   de los servicios tipo "unica" para esa fecha.
   ============================================ */

var mongoose = require('mongoose');

var servicioCitaSchema = new mongoose.Schema({
  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  horaInicio: { type: String, required: true },  // HH:mm
  horaFin: { type: String, required: true },      // HH:mm
  precioTotal: { type: Number }
}, { _id: true });

var citaSchema = new mongoose.Schema({
  cotizacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: true
  },
  codigoReferencia: {
    type: String,
    required: true
  },
  cliente: {
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String, required: true }
  },
  evento: {
    fecha: { type: String, required: true },       // YYYY-MM-DD
    horaInicio: { type: String, required: true },   // HH:mm
    personas: { type: Number, required: true },
    ubicacion: { type: String, required: true },
    codigoPostal: { type: String, required: true },
    notas: { type: String, default: '' }
  },
  servicios: [servicioCitaSchema],
  estado: {
    type: String,
    enum: ['confirmada', 'completada', 'cancelada'],
    default: 'confirmada'
  },
  precioTotal: {
    type: Number,
    default: 0
  },
  notasStaff: {
    type: String,
    default: ''
  },
  confirmadaPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

citaSchema.pre('save', function () {
  this.updatedAt = new Date();
});

// Indices
citaSchema.index({ 'evento.fecha': 1 });
citaSchema.index({ estado: 1 });
citaSchema.index({ codigoReferencia: 1 });

module.exports = mongoose.model('Cita', citaSchema);
