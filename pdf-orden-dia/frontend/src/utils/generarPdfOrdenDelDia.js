/* ============================================
   DREAM DAY — Generador de PDF: Orden del Día
   
   Documento operativo para el staff.
   Lista todos los eventos confirmados de una fecha
   con información logística: horarios, ubicaciones,
   servicios, cliente, notas, personas.
   
   Orientación: landscape (horizontal) para que
   quepa mejor la información en filas.
   ============================================ */

import { jsPDF } from 'jspdf';

var COLORES = {
  cafePrincipal: [201, 166, 141],
  cafePastel: [212, 184, 165],
  cafeClaro: [232, 213, 196],
  cremaSuave: [245, 237, 230],
  cremaClara: [253, 249, 245],
  textoOscuro: [44, 24, 16],
  textoMedio: [139, 115, 85],
  verde: [46, 125, 50],
  rojo: [198, 40, 40],
  amarillo: [245, 127, 23]
};

function formatearFechaLarga(fechaStr) {
  if (!fechaStr) return '—';
  var f = new Date(fechaStr + 'T12:00:00');
  return f.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Generar PDF de Orden del Día
 * @param {Object} data - { fecha, totalEventos, totalPersonas, totalServicios, eventos }
 */
export function generarPdfOrdenDelDia(data) {
  var doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  var pageWidth = doc.internal.pageSize.getWidth();   // 210
  var pageHeight = doc.internal.pageSize.getHeight(); // 297
  var margin = 12;
  var y = 0;

  // ══════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════

  doc.setFillColor.apply(doc, COLORES.cafePrincipal);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Dream Day', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Aguascalientes · Eventos', margin, 20);

  // Título a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ORDEN DEL DÍA', pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Documento operativo - Staff', pageWidth - margin, 20, { align: 'right' });

  y = 38;

  // ══════════════════════════════════════════
  // FECHA + ESTADÍSTICAS
  // ══════════════════════════════════════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  var fechaTexto = formatearFechaLarga(data.fecha);
  // Capitalizar primera letra
  fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
  doc.text(fechaTexto, margin, y);

  y += 8;

  // Caja de estadísticas
  doc.setFillColor.apply(doc, COLORES.cremaSuave);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 16, 3, 3, 'F');

  var colWidth = (pageWidth - 2 * margin) / 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor.apply(doc, COLORES.cafePrincipal);
  doc.text(String(data.totalEventos || 0), margin + colWidth / 2, y + 8, { align: 'center' });

  doc.setFontSize(18);
  doc.text(String(data.totalPersonas || 0), margin + colWidth * 1.5, y + 8, { align: 'center' });

  doc.setFontSize(18);
  doc.text(String(data.totalServicios || 0), margin + colWidth * 2.5, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text('EVENTOS', margin + colWidth / 2, y + 13, { align: 'center' });
  doc.text('PERSONAS', margin + colWidth * 1.5, y + 13, { align: 'center' });
  doc.text('SERVICIOS', margin + colWidth * 2.5, y + 13, { align: 'center' });

  y += 22;

  // ══════════════════════════════════════════
  // LISTA DE EVENTOS
  // ══════════════════════════════════════════

  var eventos = data.eventos || [];

  if (eventos.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    doc.text('No hay eventos confirmados para esta fecha.', pageWidth / 2, y + 10, { align: 'center' });
  } else {
    eventos.forEach(function (ev, idx) {
      y = dibujarEvento(doc, ev, idx + 1, y, pageWidth, pageHeight, margin);
    });
  }

  // ══════════════════════════════════════════
  // FOOTER EN TODAS LAS PÁGINAS
  // ══════════════════════════════════════════

  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor.apply(doc, COLORES.cremaSuave);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    doc.text('Dream Day · Orden del Día · ' + fechaTexto, margin, pageHeight - 3);
    doc.text('Página ' + p + ' de ' + totalPages, pageWidth - margin, pageHeight - 3, { align: 'right' });
  }

  // Descargar
  var nombreArchivo = 'DreamDay_OrdenDelDia_' + data.fecha + '.pdf';
  doc.save(nombreArchivo);
}

/**
 * Dibuja un bloque de evento. Retorna el nuevo y.
 */
function dibujarEvento(doc, ev, numero, y, pageWidth, pageHeight, margin) {
  // Estimar altura del bloque
  var servicios = ev.servicios || [];
  var alturaEstimada = 42 + servicios.length * 5.5;
  if (ev.evento && ev.evento.notas) alturaEstimada += 12;

  // Salto de página si no cabe
  if (y + alturaEstimada > pageHeight - 15) {
    doc.addPage();
    y = 20;
  }

  var cliente = ev.cliente || {};
  var evento = ev.evento || {};

  // Barra del número + hora (destacada en café)
  doc.setFillColor.apply(doc, COLORES.cafePrincipal);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('#' + numero + '  ·  ' + (evento.horaInicio || '—') + ' hrs', margin + 3, y + 5.5);

  doc.text(ev.codigoReferencia || '—', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += 11;

  // Cliente + contacto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  doc.text(cliente.nombre || '—', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  var telefono = cliente.telefono || '—';
  doc.text('Tel: ' + telefono, pageWidth - margin, y, { align: 'right' });

  y += 5;

  // Ubicación + personas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  var ubicacionTexto = '📍 ' + (evento.ubicacion || '—');
  if (evento.codigoPostal) ubicacionTexto += ' · CP ' + evento.codigoPostal;
  // Truncar ubicación si es muy larga
  var ubicacionLineas = doc.splitTextToSize(ubicacionTexto, pageWidth - 2 * margin - 40);
  doc.text(ubicacionLineas[0], margin, y);

  doc.setFont('helvetica', 'bold');
  doc.text('👥 ' + (evento.personas || '—') + ' personas', pageWidth - margin, y, { align: 'right' });

  y += 6;

  // Servicios (tabla compacta)
  if (servicios.length > 0) {
    // Header de servicios
    doc.setFillColor.apply(doc, COLORES.cafeClaro);
    doc.rect(margin, y - 3, pageWidth - 2 * margin, 5.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor.apply(doc, COLORES.textoOscuro);
    doc.text('SERVICIO', margin + 2, y);
    doc.text('CANT', margin + 100, y);
    doc.text('DURACIÓN', margin + 125, y);
    doc.text('INCLUYE / NOTAS', margin + 150, y);

    y += 5;

    // Filas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    servicios.forEach(function (s, si) {
      if (si % 2 === 0) {
        doc.setFillColor.apply(doc, COLORES.cremaClara);
        doc.rect(margin, y - 3, pageWidth - 2 * margin, 5.5, 'F');
      }

      doc.setTextColor.apply(doc, COLORES.textoOscuro);

      var nombre = s.nombre || (s.servicioId && s.servicioId.nombre) || '—';
      var duracion = (s.servicioId && s.servicioId.duracionHoras)
        ? s.servicioId.duracionHoras + 'h'
        : '—';
      var incluye = '';
      if (s.servicioId && Array.isArray(s.servicioId.incluye) && s.servicioId.incluye.length > 0) {
        incluye = s.servicioId.incluye.slice(0, 3).join(', ');
      } else if (s.servicioId && s.servicioId.notas) {
        incluye = s.servicioId.notas;
      }

      // Truncar nombre
      var nombreCort = doc.splitTextToSize(nombre, 95)[0];
      doc.text(nombreCort, margin + 2, y);

      doc.text(String(s.cantidad || 1), margin + 100, y);
      doc.text(duracion, margin + 125, y);

      // Incluye/notas truncado
      var incluyeLineas = doc.splitTextToSize(incluye || '—', pageWidth - margin - 150 - 2);
      doc.setFontSize(7);
      doc.setTextColor.apply(doc, COLORES.textoMedio);
      doc.text(incluyeLineas[0] || '—', margin + 150, y);
      doc.setFontSize(8);

      y += 5.5;
    });
  }

  // Notas del cliente
  if (evento.notas && evento.notas.trim()) {
    y += 1;
    doc.setFillColor.apply(doc, [255, 248, 225]); // Amarillo claro
    var notasLineas = doc.splitTextToSize('⚠ Notas del cliente: ' + evento.notas, pageWidth - 2 * margin - 6);
    var alturaNotas = 3 + notasLineas.length * 4 + 2;
    doc.rect(margin, y - 2, pageWidth - 2 * margin, alturaNotas, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(122, 90, 0);
    doc.text(notasLineas, margin + 3, y + 2);
    y += alturaNotas;
  }

  y += 6;

  // Separador
  doc.setDrawColor.apply(doc, COLORES.cafeClaro);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 2, pageWidth - margin, y - 2);

  return y + 2;
}

export default { generarPdfOrdenDelDia };
