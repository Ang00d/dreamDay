/* ============================================
   DREAM DAY — Modelo: PasswordReset
   Práctica 3 — Recuperación de contraseña
   
   Token único, un solo uso, expira en 30 minutos.
   ============================================ */

var mongoose = require('mongoose');

var passwordResetSchema = new mongoose.Schema({
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
  tipo: {
    type: String,
    enum: ['email', 'sms', 'llamada', 'pregunta_secreta'],
    default: 'email'
  },
  usado: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800  // TTL: 30 minutos
  }
});

passwordResetSchema.index({ token: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
