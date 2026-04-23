/* ============================================
   DREAM DAY — Generador de PDF de Cotización
   
   Usa jsPDF para generar un PDF elegante con
   la identidad de marca Dream Day.
   
   Dos modos:
   - 'admin': incluye precios y totales
   - 'cliente': sin precios (resumen de solicitud)
   ============================================ */

import { jsPDF } from 'jspdf';

// Paleta Dream Day (hex a RGB para jsPDF)
var COLORES = {
  cafePrincipal: [201, 166, 141],    // #C9A68D
  cafePastel: [212, 184, 165],       // #D4B8A5
  cafeClaro: [232, 213, 196],        // #E8D5C4
  cremaSuave: [245, 237, 230],       // #F5EDE6
  cremaClara: [253, 249, 245],       // #FDF9F5
  textoOscuro: [44, 24, 16],         // #2c1810
  textoMedio: [139, 115, 85],        // #8b7355
  verde: [46, 125, 50],
  rojo: [198, 40, 40],
  amarillo: [245, 127, 23],
  azul: [52, 152, 219],
  gris: [127, 140, 141]
};

var ESTADO_COLOR = {
  pendiente: COLORES.amarillo,
  en_negociacion: COLORES.azul,
  confirmada: COLORES.verde,
  rechazada: COLORES.rojo,
  cancelada: COLORES.gris,
  conflicto: [142, 68, 173]
};

var ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_negociacion: 'En negociación',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  conflicto: 'En revisión'
};

/**
 * Formatear fecha YYYY-MM-DD a "15 de abril de 2026"
 */
function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  var f = new Date(fechaStr + 'T12:00:00');
  return f.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formatear precio como "$1,234.00"
 */
function formatearPrecio(num) {
  if (typeof num !== 'number') num = parseFloat(num) || 0;
  return '$' + num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formatear tipoPrecio a texto legible
 */
function formatearTipoPrecio(tipo) {
  var map = {
    por_persona: '/persona',
    por_pieza: '/pieza',
    por_orden: '/orden',
    por_juego: '/juego',
    precio_fijo: 'fijo'
  };
  return map[tipo] || '';
}

/**
 * Generar PDF de cotización
 * @param {Object} cotizacion - Objeto cotización completo
 * @param {String} modo - 'admin' o 'cliente'
 */
export function generarPdfCotizacion(cotizacion, modo) {
  if (!modo) modo = 'admin';

  var doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  var pageWidth = doc.internal.pageSize.getWidth();   // 210
  var pageHeight = doc.internal.pageSize.getHeight(); // 297
  var margin = 15;
  var y = 0;

  // ══════════════════════════════════════════
  // HEADER CON MARCA
  // ══════════════════════════════════════════

  // Fondo crema del header
  doc.setFillColor.apply(doc, COLORES.cremaSuave);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Línea decorativa arriba
  doc.setFillColor.apply(doc, COLORES.cafePrincipal);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Brand "Dream Day" (estilo elegante con serif)
  doc.setFont('times', 'italic');
  doc.setFontSize(32);
  doc.setTextColor.apply(doc, COLORES.cafePrincipal);
  doc.text('Dream Day', margin, 22);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text('Hacemos realidad tus sueños', margin, 28);

  // Subtítulo en la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor.apply(doc, COLORES.cafePrincipal);
  doc.text('COTIZACIÓN DE SERVICIOS', pageWidth - margin, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text('Aguascalientes, México', pageWidth - margin, 28, { align: 'right' });

  y = 50;

  // ══════════════════════════════════════════
  // CÓDIGO DE REFERENCIA + ESTADO
  // ══════════════════════════════════════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  doc.text(cotizacion.codigoReferencia || 'SIN CÓDIGO', margin, y);

  // Badge de estado (derecha)
  var estado = cotizacion.estado || 'pendiente';
  var colorEstado = ESTADO_COLOR[estado] || COLORES.gris;
  var labelEstado = ESTADO_LABEL[estado] || estado.toUpperCase();

  doc.setFillColor.apply(doc, colorEstado);
  doc.roundedRect(pageWidth - margin - 38, y - 5, 38, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(labelEstado.toUpperCase(), pageWidth - margin - 19, y - 0.5, { align: 'center' });

  // Fecha de creación
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  var fechaCreacion = cotizacion.createdAt
    ? formatearFecha(cotizacion.createdAt.split('T')[0])
    : '—';
  doc.text('Emitido el ' + fechaCreacion, margin, y);

  y += 8;

  // Línea separadora
  doc.setDrawColor.apply(doc, COLORES.cafeClaro);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ══════════════════════════════════════════
  // DATOS DEL CLIENTE
  // ══════════════════════════════════════════

  y = agregarSeccion(doc, 'DATOS DEL CLIENTE', margin, y);

  var cliente = cotizacion.cliente || {};
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);

  agregarLinea(doc, 'Nombre:', cliente.nombre || '—', margin, y);
  y += 5.5;
  agregarLinea(doc, 'Email:', cliente.email || '—', margin, y);
  y += 5.5;
  agregarLinea(doc, 'Teléfono:', cliente.telefono || '—', margin, y);
  y += 10;

  // ══════════════════════════════════════════
  // DATOS DEL EVENTO
  // ══════════════════════════════════════════

  y = agregarSeccion(doc, 'DETALLES DEL EVENTO', margin, y);

  var evento = cotizacion.evento || {};
  agregarLinea(doc, 'Fecha:', formatearFecha(evento.fecha), margin, y);
  y += 5.5;
  agregarLinea(doc, 'Hora:', (evento.horaInicio || '—') + ' hrs', margin, y);
  y += 5.5;
  agregarLinea(doc, 'Personas:', (evento.personas || '—').toString(), margin, y);
  y += 5.5;
  agregarLinea(doc, 'Ubicación:', evento.ubicacion || '—', margin, y);
  y += 5.5;
  if (evento.codigoPostal) {
    agregarLinea(doc, 'C.P.:', evento.codigoPostal, margin, y);
    y += 5.5;
  }
  if (evento.notas) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    doc.text('Notas del cliente:', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, COLORES.textoOscuro);
    var notasLineas = doc.splitTextToSize(evento.notas, pageWidth - 2 * margin);
    doc.text(notasLineas, margin, y);
    y += notasLineas.length * 4.5;
  }
  y += 5;

  // ══════════════════════════════════════════
  // SERVICIOS COTIZADOS
  // ══════════════════════════════════════════

  y = agregarSeccion(doc, 'SERVICIOS COTIZADOS', margin, y);

  var servicios = cotizacion.servicios || [];

  // Encabezados de la tabla
  var colX = {
    servicio: margin + 2,
    cantidad: modo === 'admin' ? 115 : 150,
    precioUnit: 145,
    total: 180
  };

  // Header de la tabla
  doc.setFillColor.apply(doc, COLORES.cafeClaro);
  doc.rect(margin, y - 4, pageWidth - 2 * margin, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  doc.text('Servicio', colX.servicio, y);
  doc.text('Cantidad', colX.cantidad, y, { align: modo === 'admin' ? 'left' : 'right' });
  if (modo === 'admin') {
    doc.text('P. Unitario', colX.precioUnit, y, { align: 'right' });
    doc.text('Total', colX.total, y, { align: 'right' });
  }
  y += 6;

  // Filas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  var totalCotizacion = 0;

  servicios.forEach(function (s, idx) {
    // Alternar colores de fila
    if (idx % 2 === 0) {
      doc.setFillColor.apply(doc, COLORES.cremaClara);
      doc.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
    }

    doc.setTextColor.apply(doc, COLORES.textoOscuro);

    // Nombre del servicio (truncar si es muy largo)
    var nombreServ = s.nombre || (s.servicioId && s.servicioId.nombre) || 'Servicio';
    var nombreLineas = doc.splitTextToSize(nombreServ, modo === 'admin' ? 92 : 130);
    doc.text(nombreLineas[0], colX.servicio, y);

    // Cantidad
    doc.text((s.cantidad || 1).toString(), colX.cantidad, y, { align: modo === 'admin' ? 'left' : 'right' });

    if (modo === 'admin') {
      var precioUnit = s.precioUnitario || 0;
      var precioTotal = s.precioTotal || 0;

      // Si no tiene precios calculados, usar precio del catálogo como referencia
      if (!precioUnit && s.servicioId && s.servicioId.precio) {
        precioUnit = s.servicioId.precio;
      }
      if (!precioTotal && precioUnit) {
        precioTotal = precioUnit * (s.cantidad || 1);
      }

      totalCotizacion += precioTotal;

      doc.text(formatearPrecio(precioUnit), colX.precioUnit, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatearPrecio(precioTotal), colX.total, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    }

    y += 6;

    // Si necesita salto de página
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }
  });

  // Total (solo admin)
  if (modo === 'admin') {
    y += 2;
    doc.setDrawColor.apply(doc, COLORES.cafePrincipal);
    doc.setLineWidth(0.7);
    doc.line(margin + 100, y, pageWidth - margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, COLORES.textoOscuro);
    doc.text('TOTAL:', colX.precioUnit, y, { align: 'right' });

    var totalFinal = cotizacion.precioTotal || totalCotizacion;
    doc.setTextColor.apply(doc, COLORES.cafePrincipal);
    doc.setFontSize(14);
    doc.text(formatearPrecio(totalFinal), colX.total, y, { align: 'right' });

    // Nota sobre IVA
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    doc.text('Precios sujetos a confirmación final.', pageWidth - margin, y, { align: 'right' });
  }

  y += 10;

  // ══════════════════════════════════════════
  // NOTAS DEL ADMIN (solo modo admin si existen)
  // ══════════════════════════════════════════
  if (modo === 'admin' && cotizacion.notasAdmin) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }
    y = agregarSeccion(doc, 'NOTAS INTERNAS', margin, y);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    var notasAdminLineas = doc.splitTextToSize(cotizacion.notasAdmin, pageWidth - 2 * margin);
    doc.text(notasAdminLineas, margin, y);
    y += notasAdminLineas.length * 4.5 + 5;
  }

  // ══════════════════════════════════════════
  // FOOTER (contacto + términos)
  // ══════════════════════════════════════════

  if (y > pageHeight - 55) { doc.addPage(); y = 20; }

  // Línea
  doc.setDrawColor.apply(doc, COLORES.cafeClaro);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Contacto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, COLORES.cafePrincipal);
  doc.text('CONTÁCTANOS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  doc.text('WhatsApp: +52 449 123 4567', margin, y);
  y += 4.5;
  doc.text('Email: contacto@dreamday.mx', margin, y);
  y += 4.5;
  doc.text('Web: dream-day-six.vercel.app', margin, y);
  y += 8;

  // Términos
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  var terminos = modo === 'admin'
    ? 'Cotización válida por 15 días. Para confirmar, contactar vía WhatsApp. Los precios están sujetos a disponibilidad y pueden variar según la fecha final del evento.'
    : 'Esta es una solicitud de cotización. Los precios finales serán enviados por WhatsApp una vez revisada. Guarda tu código de referencia para dar seguimiento.';
  var terminosLineas = doc.splitTextToSize(terminos, pageWidth - 2 * margin);
  doc.text(terminosLineas, margin, y);

  // Footer del final de página
  doc.setFillColor.apply(doc, COLORES.cremaSuave);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text('© ' + new Date().getFullYear() + ' Dream Day · Aguascalientes, México',
    pageWidth / 2, pageHeight - 4, { align: 'center' });

  // Descargar
  var nombreArchivo = 'DreamDay_' +
    (cotizacion.codigoReferencia || 'cotizacion') +
    '_' + modo + '.pdf';
  doc.save(nombreArchivo);
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Dibuja un título de sección
 */
function agregarSeccion(doc, titulo, x, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, COLORES.cafePrincipal);
  doc.text(titulo, x, y);

  // Línea corta debajo del título
  doc.setDrawColor.apply(doc, COLORES.cafePrincipal);
  doc.setLineWidth(0.7);
  doc.line(x, y + 1.5, x + 35, y + 1.5);

  return y + 7;
}

/**
 * Dibuja una línea tipo "Etiqueta: Valor"
 */
function agregarLinea(doc, etiqueta, valor, x, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text(etiqueta, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  doc.text(valor, x + 27, y);
}

export default { generarPdfCotizacion };
