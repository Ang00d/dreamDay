/* ============================================
   DREAM DAY — Modelo: Disponibilidad
   
   Registra si un servicio esta disponible, ocupado
   o bloqueado en una fecha especifica.
   
   Se crea automaticamente al confirmar una cita,
   o manualmente cuando el admin bloquea fechas.
   ============================================ */

var mongoose = require('mongoose');

var disponibilidadSchema = new mongoose.Schema({
  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  fecha: {
    type: String,        // Formato: YYYY-MM-DD
    required: true
  },
  estado: {
    type: String,
    enum: ['disponible', 'ocupado', 'bloqueado_admin'],
    default: 'disponible'
  },
  citaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    default: null
  },
  motivoBloqueo: {
    type: String,
    default: null
  },
  bloqueadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indice compuesto: buscar rapido por servicio + fecha
disponibilidadSchema.index({ servicioId: 1, fecha: 1 }, { unique: true });
// Buscar por fecha (para ver todo lo de un dia)
disponibilidadSchema.index({ fecha: 1 });

module.exports = mongoose.model('Disponibilidad', disponibilidadSchema);
