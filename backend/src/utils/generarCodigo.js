/* ============================================
   DREAM DAY — Utilidad: Generar Codigo de Referencia
   
   Formato: DD2603-A7K9
   DD = Dream Day
   26 = anio (2026)
   03 = mes (marzo)
   A7K9 = 4 caracteres alfanumericos aleatorios
   
   Cambia automaticamente por anio y mes.
   ============================================ */

var Cotizacion = require('../models/Cotizacion');

var CARACTERES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Genera un codigo de referencia unico
 * @returns {string} Codigo como DD2603-A7K9
 */
async function generarCodigoReferencia() {
  var ahora = new Date();
  var anio = String(ahora.getFullYear()).slice(-2);  // "26"
  var mes = String(ahora.getMonth() + 1).padStart(2, '0');  // "03"

  var prefijo = 'DD' + anio + mes + '-';
  var codigo;
  var existe = true;

  // Intentar hasta encontrar uno que no exista
  while (existe) {
    var aleatorio = '';
    for (var i = 0; i < 4; i++) {
      aleatorio += CARACTERES.charAt(Math.floor(Math.random() * CARACTERES.length));
    }
    codigo = prefijo + aleatorio;

    // Verificar que no exista en la base de datos
    var encontrado = await Cotizacion.findOne({ codigoReferencia: codigo });
    existe = !!encontrado;
  }

  return codigo;
}

module.exports = { generarCodigoReferencia };
