/* ============================================
   DREAM DAY — Modelo: RefreshToken
   Práctica 3 — Token de renovación
   
   Access token: 15 minutos
   Refresh token: 7 días
   ============================================ */

var mongoose = require('mongoose');

var refreshTokenSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  usado: {
    type: Boolean,
    default: false
  },
  expiracion: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ expiracion: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
