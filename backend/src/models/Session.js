/* ============================================
   DREAM DAY — Modelo: Session
   Práctica 3 — Gestión de multisesiones
   
   Almacena cada sesión activa por usuario.
   Permite listar y revocar sesiones remotamente.
   ============================================ */

var mongoose = require('mongoose');

var sessionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  // ID único del token JWT (jti claim)
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  // Info del dispositivo
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  dispositivo: { type: String, default: 'Desconocido' },
  // Estado
  activa: {
    type: Boolean,
    default: true
  },
  // Expiración
  expiracion: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  ultimaActividad: {
    type: Date,
    default: Date.now
  }
});

// Índices para consultas rápidas
sessionSchema.index({ usuarioId: 1, activa: 1 });
sessionSchema.index({ tokenId: 1 });
// TTL: eliminar automáticamente sesiones expiradas
sessionSchema.index({ expiracion: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
