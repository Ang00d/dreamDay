/* ============================================
   DREAM DAY — Constantes del Sistema
   
   Todas las reglas de negocio centralizadas.
   Si algo cambia, solo se modifica aqui.
   ============================================ */

module.exports = {
  // Tipos de precio de los servicios
  TIPOS_PRECIO: ['por_persona', 'por_pieza', 'por_orden', 'por_juego', 'precio_fijo'],

  // Estados posibles de una cotizacion
  ESTADOS_COTIZACION: ['pendiente', 'en_negociacion', 'confirmada', 'rechazada', 'cancelada', 'conflicto'],

  // Estados de una cita (cotizacion ya confirmada)
  ESTADOS_CITA: ['confirmada', 'completada', 'cancelada'],

  // Estados de disponibilidad de un servicio en una fecha
  ESTADOS_DISPONIBILIDAD: ['disponible', 'ocupado', 'bloqueado_admin'],

  // Horarios permitidos para eventos
  HORA_MINIMA: '09:00',
  HORA_MAXIMA: '18:00',

  // Validaciones de formularios
  TELEFONO_DIGITOS: 10,
  CODIGO_POSTAL_DIGITOS: 5,
  NOMBRE_MIN_LENGTH: 3,
  UBICACION_MIN_LENGTH: 5,
  DESCRIPCION_CORTA_MAX: 80,

  // Imagenes de servicios
  IMAGEN_MAX_SIZE_MB: 5,
  IMAGEN_MAX_POR_SERVICIO: 8,
  IMAGEN_TIPOS: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGEN_RESIZE: { width: 800, height: 600 },

  // Seguridad
  JWT_EXPIRACION: '8h',
  RATE_LIMIT_LOGIN: { ventana: 15, max: 5 },       // 5 intentos en 15 min
  RATE_LIMIT_COTIZACION: { ventana: 60, max: 3 },   // 3 cotizaciones por hora

  // Contacto
  WHATSAPP_NUMERO: process.env.WHATSAPP_NUMERO || '+524491234567'
};
