/* ============================================
   DREAM DAY — Modelo: Cotizacion
   
   Solicitud de cotizacion del cliente.
   NO bloquea disponibilidad — es solo una solicitud.
   El admin decide si confirmar, rechazar o negociar.
   
   Codigo de referencia: DD2603-A7K9
   (DD + anio + mes + 4 alfanumericos aleatorios)
   ============================================ */

var mongoose = require('mongoose');

var servicioCotizadoSchema = new mongoose.Schema({
  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number },    // Solo admin
  precioTotal: { type: Number },       // Solo admin
  notas: { type: String, default: '' }
}, { _id: true });

var cotizacionSchema = new mongoose.Schema({
  codigoReferencia: {
    type: String,
    required: true,
    unique: true
    // Formato: DD2603-A7K9
  },
  cliente: {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [3, 'Minimo 3 caracteres']
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      trim: true,
      lowercase: true
    },
    telefono: {
      type: String,
      required: [true, 'El telefono es obligatorio']
    }
  },
  evento: {
    fecha: {
      type: String,        // YYYY-MM-DD
      required: [true, 'La fecha es obligatoria']
    },
    horaInicio: {
      type: String,        // HH:mm
      required: [true, 'La hora es obligatoria']
    },
    personas: {
      type: Number,
      required: [true, 'La cantidad de personas es obligatoria'],
      min: [1, 'Minimo 1 persona']
    },
    ubicacion: {
      type: String,
      required: [true, 'La ubicacion es obligatoria'],
      minlength: [5, 'Minimo 5 caracteres']
    },
    codigoPostal: {
      type: String,
      required: [true, 'El codigo postal es obligatorio']
    },
    notas: { type: String, default: '' }
  },
  servicios: [servicioCotizadoSchema],
  estado: {
    type: String,
    enum: ['pendiente', 'en_negociacion', 'confirmada', 'rechazada', 'cancelada', 'conflicto', 'completada'],
    default: 'pendiente'
  },
  precioTotal: {
    type: Number,
    default: 0
    // Solo visible para admin
  },
  pdfUrl: {
    type: String,
    default: null
  },
  notasAdmin: {
    type: String,
    default: ''
  },
  creadoPorIP: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Actualizar updatedAt al guardar
cotizacionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

// Indices
cotizacionSchema.index({ codigoReferencia: 1 });
cotizacionSchema.index({ estado: 1, createdAt: -1 });
cotizacionSchema.index({ 'evento.fecha': 1 });
cotizacionSchema.index({ 'cliente.email': 1 });

module.exports = mongoose.model('Cotizacion', cotizacionSchema);
