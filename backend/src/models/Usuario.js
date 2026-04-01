/* ============================================
   DREAM DAY — Modelo: Usuario
   Actualizado para Práctica 3 — Autenticación
   
   Roles: superadmin | admin | editor
   MFA:   activable por usuario
   ============================================ */

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'Mínimo 6 caracteres']
  },
  rol: {
    type: String,
    enum: ['superadmin', 'admin', 'editor'],
    default: 'editor'
  },
  activo: {
    type: Boolean,
    default: true
  },
  // MFA
  mfaActivo: {
    type: Boolean,
    default: false
  },
  // Pregunta secreta (hasheada)
  preguntaSecreta: {
    pregunta: { type: String, default: '' },
    respuestaHash: { type: String, default: '' }
  },
  // Teléfono para OTP simulado
  telefono: {
    type: String,
    default: ''
  },
  // Preferencias de usuario
  preferencias: {
    tema: { type: String, enum: ['claro', 'oscuro'], default: 'claro' },
    idioma: { type: String, default: 'es' }
  },
  // Seguridad: intentos fallidos de login
  intentosFallidos: {
    type: Number,
    default: 0
  },
  bloqueadoHasta: {
    type: Date,
    default: null
  },
  ultimoLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hashear password antes de guardar
usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  var salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Comparar passwords
usuarioSchema.methods.compararPassword = async function (passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Verificar si está bloqueado
usuarioSchema.methods.estaBloqueado = function () {
  return this.bloqueadoHasta && this.bloqueadoHasta > new Date();
};

// No devolver el password en JSON
usuarioSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  delete obj.preguntaSecreta;
  delete obj.intentosFallidos;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
