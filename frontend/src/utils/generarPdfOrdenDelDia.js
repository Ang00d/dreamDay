/* ============================================
   DREAM DAY — PDF: Orden del Día (Staff)
   
   Hoja logística con:
   - Horarios de entrega y recolección
   - Contenido (qué subir al camión)
   - Filtro por equipo (1, 2, o completo)
   ============================================ */

import { jsPDF } from 'jspdf';

var COLORES = {
  cafePrincipal: [201, 166, 141],
  cafeClaro: [232, 213, 196],
  cremaSuave: [245, 237, 230],
  cremaClara: [253, 249, 245],
  textoOscuro: [44, 24, 16],
  textoMedio: [139, 115, 85],
  naranja: [230, 126, 34],
  azulEquipo: [52, 152, 219],
  rojoEquipo: [231, 76, 60]
};

function formatearFechaLarga(fechaStr) {
  if (!fechaStr) return '—';
  var f = new Date(fechaStr + 'T12:00:00');
  var texto = f.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Generar PDF de Orden del Día
 * @param {Object} data - { fecha, totalEventos, totalPersonas, totalServicios, eventos }
 * @param {Number|null} equipoFiltro - 1, 2, o null (completo)
 * @param {Object} asignaciones - { servicioNumero: 1|2 }
 */
export function generarPdfOrdenDelDia(data, equipoFiltro, asignaciones) {
  if (!asignaciones) asignaciones = {};

  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  var pageWidth = 210;
  var pageHeight = 297;
  var margin = 14;
  var y = 0;

  // ══════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════

  doc.setFillColor.apply(doc, COLORES.cafePrincipal);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('times', 'italic');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Dream Day', margin, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  var titulo = 'ORDEN DEL DÍA';
  if (equipoFiltro) {
    titulo += ' — EQUIPO ' + equipoFiltro;
  }
  doc.text(titulo, pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Hoja logística — Staff', pageWidth - margin, 18, { align: 'right' });

  y = 32;

  // ══════════════════════════════════════════
  // FECHA + RESUMEN
  // ══════════════════════════════════════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor.apply(doc, COLORES.textoOscuro);
  doc.text(formatearFechaLarga(data.fecha), margin, y);

  // Contar servicios filtrados
  var totalFiltrados = 0;
  if (equipoFiltro) {
    data.eventos.forEach(function (ev) {
      ev.servicios.forEach(function (s) {
        if (asignaciones[s.numero] === equipoFiltro) totalFiltrados++;
      });
    });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  var resumenTexto = data.totalEventos + ' evento(s)  ·  ' +
    (equipoFiltro ? totalFiltrados + ' servicio(s) asignados' : data.totalServicios + ' servicio(s)') +
    '  ·  ' + data.totalPersonas + ' personas';
  doc.text(resumenTexto, margin, y + 5);

  y += 12;
  doc.setDrawColor.apply(doc, COLORES.cafeClaro);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ══════════════════════════════════════════
  // EVENTOS
  // ══════════════════════════════════════════

  var eventos = data.eventos || [];

  eventos.forEach(function (ev) {
    // Filtrar servicios de este evento según equipo
    var serviciosVisibles = ev.servicios;
    if (equipoFiltro) {
      serviciosVisibles = ev.servicios.filter(function (s) {
        return asignaciones[s.numero] === equipoFiltro;
      });
    }

    // Saltar evento si no tiene servicios para este equipo
    if (serviciosVisibles.length === 0) return;

    // Estimar altura
    var alturaEstimada = 18 + serviciosVisibles.length * 12;
    if (ev.evento.notas) alturaEstimada += 7;
    if (y + alturaEstimada > pageHeight - 20) {
      doc.addPage();
      y = 18;
    }

    // ── Header del evento ──
    doc.setFillColor.apply(doc, COLORES.cremaSuave);
    doc.rect(margin, y - 3, pageWidth - 2 * margin, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, COLORES.textoOscuro);
    doc.text(ev.evento.horaInicio + ' hrs  —  ' + ev.cliente.nombre, margin + 2, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    doc.text(
      ev.codigoReferencia + '  ·  ' + ev.evento.personas + ' pers.  ·  Tel: ' + (ev.cliente.telefono || '—'),
      pageWidth - margin - 2, y + 2, { align: 'right' }
    );
    y += 8;

    // Ubicación
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    doc.text(ev.evento.ubicacion || '—', margin + 2, y);
    y += 5;

    // ── Tabla header ──
    doc.setFillColor.apply(doc, COLORES.cafeClaro);
    doc.rect(margin, y - 3, pageWidth - 2 * margin, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor.apply(doc, COLORES.textoOscuro);
    doc.text('#', margin + 2, y);
    doc.text('SERVICIO', margin + 10, y);
    doc.text('CANT', margin + 95, y);
    doc.text('ENTREGA', margin + 115, y);
    doc.text('RECOGER', margin + 142, y);
    doc.text('DUR', margin + 170, y);
    y += 5;

    // ── Filas ──
    serviciosVisibles.forEach(function (s, si) {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 18;
      }

      // Fondo alternado
      if (si % 2 === 0) {
        doc.setFillColor.apply(doc, COLORES.cremaClara);
        doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 7, 'F');
      }

      // Número
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, COLORES.cafePrincipal);
      doc.text(String(s.numero), margin + 2, y);

      // Nombre
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, COLORES.textoOscuro);
      var nombre = doc.splitTextToSize(s.nombre, 80)[0];
      doc.text(nombre, margin + 10, y);

      // Cantidad
      doc.text(String(s.cantidad), margin + 97, y);

      // Entrega (naranja si montaje)
      if (s.necesitaMontaje) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor.apply(doc, COLORES.naranja);
      }
      doc.text(s.horaEntrega, margin + 115, y);

      // Reset
      doc.setFont('helvetica', 'normal');
      doc.setTextColor.apply(doc, COLORES.textoOscuro);
      doc.text(s.horaRecoger, margin + 142, y);

      // Duración
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, COLORES.textoMedio);
      doc.text(s.duracionHoras + 'h', margin + 172, y);

      y += 7;

      // Contenido (qué llevar)
      if (s.contenido) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor.apply(doc, COLORES.textoMedio);
        var contenidoLineas = doc.splitTextToSize('> ' + s.contenido, pageWidth - 2 * margin - 12);
        for (var cl = 0; cl < contenidoLineas.length; cl++) {
          if (y > pageHeight - 20) { doc.addPage(); y = 18; }
          doc.text(contenidoLineas[cl], margin + 10, y);
          y += 3.5;
        }
        y += 1;
      }
    });

    // Notas del cliente
    if (ev.evento.notas && ev.evento.notas.trim()) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor.apply(doc, COLORES.naranja);
      var notaLineas = doc.splitTextToSize('Nota: ' + ev.evento.notas, pageWidth - 2 * margin - 4);
      doc.text(notaLineas[0], margin + 2, y);
      y += 5;
    }

    // Separador
    y += 2;
    doc.setDrawColor.apply(doc, COLORES.cafeClaro);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  });

  // ══════════════════════════════════════════
  // LEYENDA
  // ══════════════════════════════════════════

  if (y + 12 > pageHeight - 18) { doc.addPage(); y = 18; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text('LEYENDA:', margin, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor.apply(doc, COLORES.naranja);
  doc.text('*', margin, y);
  doc.setTextColor.apply(doc, COLORES.textoMedio);
  doc.text(' Hora naranja = 1h antes para montaje (Comida/Bebidas)   > = contenido a cargar', margin + 3, y);

  // ══════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════

  var totalPages = doc.internal.getNumberOfPages();
  for (var p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, COLORES.textoMedio);
    var footerTexto = 'Dream Day · ' + formatearFechaLarga(data.fecha);
    if (equipoFiltro) footerTexto += ' · Equipo ' + equipoFiltro;
    doc.text(footerTexto, margin, pageHeight - 5);
    doc.text('Pág ' + p + '/' + totalPages, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  var nombreArchivo = 'DreamDay_OrdenDelDia_' + data.fecha;
  if (equipoFiltro) nombreArchivo += '_Equipo' + equipoFiltro;
  doc.save(nombreArchivo + '.pdf');
}

export default { generarPdfOrdenDelDia };
