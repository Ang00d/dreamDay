/* ============================================
   DREAM DAY — Modelo: MfaCode
   Práctica 3 — Códigos OTP para MFA
   
   Expira en 10 minutos automáticamente (TTL).
   Un solo uso.
   ============================================ */

var mongoose = require('mongoose');

var mfaCodeSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  codigo: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['login', 'cambio_password', 'activar_mfa'],
    default: 'login'
  },
  usado: {
    type: Boolean,
    default: false
  },
  intentos: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600  // TTL: 10 minutos
  }
});

mfaCodeSchema.index({ usuarioId: 1, tipo: 1 });

module.exports = mongoose.model('MfaCode', mfaCodeSchema);
