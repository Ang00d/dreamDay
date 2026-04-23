/* ============================================
   DREAM DAY — Admin: Orden del Día
   
   Hoja logística con:
   - Horarios de entrega/recolección
   - Contenido (qué subir al camión)
   - División en 2 equipos con PDF por equipo
   ============================================ */

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import frontendLogger from '../../utils/frontendLogger';
import { generarPdfOrdenDelDia } from '../../utils/generarPdfOrdenDelDia';
import {
  Calendar,
  Download,
  Users,
  MapPin,
  Phone,
  Clock,
  Truck,
  PackageCheck,
  Inbox,
  AlertCircle
} from 'lucide-react';
import './OrdenDelDiaPage.css';

function OrdenDelDiaPage() {
  var hoy = new Date().toISOString().split('T')[0];
  var [fecha, setFecha] = useState(hoy);
  var [data, setData] = useState(null);
  var [cargando, setCargando] = useState(false);

  // Asignación de equipos: { servicioNumero: 1 | 2 }
  var [equipos, setEquipos] = useState({});

  useEffect(function () {
    cargarOrden();
  }, [fecha]);

  async function cargarOrden() {
    if (!fecha) return;
    try {
      setCargando(true);
      var res = await adminService.getOrdenDelDia(fecha);
      setData(res.data.data);
      // Reset equipos al cambiar fecha
      setEquipos({});
    } catch (err) {
      showToast('Error al cargar la orden del día', 'error');
      frontendLogger.error('Error cargando orden del día', { message: err.message });
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  function asignarEquipo(numServicio, equipo) {
    setEquipos(function (prev) {
      var nuevo = Object.assign({}, prev);
      // Si ya tiene ese equipo, quitar asignación (toggle)
      if (nuevo[numServicio] === equipo) {
        delete nuevo[numServicio];
      } else {
        nuevo[numServicio] = equipo;
      }
      return nuevo;
    });
  }

  function descargarPdf(equipo) {
    if (!data || data.totalEventos === 0) {
      showToast('No hay eventos para descargar', 'info');
      return;
    }
    try {
      generarPdfOrdenDelDia(data, equipo, equipos);
      var label = equipo ? 'Equipo ' + equipo : 'completo';
      showToast('PDF ' + label + ' generado', 'success');
    } catch (err) {
      showToast('Error al generar PDF', 'error');
      frontendLogger.error('Error generando PDF', { error: err.message });
    }
  }

  // Contar servicios por equipo
  var conteoEquipos = { 1: 0, 2: 0, sinAsignar: 0 };
  if (data) {
    data.eventos.forEach(function (ev) {
      ev.servicios.forEach(function (s) {
        var eq = equipos[s.numero];
        if (eq === 1) conteoEquipos[1]++;
        else if (eq === 2) conteoEquipos[2]++;
        else conteoEquipos.sinAsignar++;
      });
    });
  }

  function formatearFecha(f) {
    if (!f) return '';
    var d = new Date(f + 'T12:00:00');
    var t = d.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  return (
    <div className="orden-dia-page">
      <div className="orden-dia-header">
        <h1>Orden del día</h1>
        <p>Horarios de entrega y recolección — asigna equipos y descarga PDFs</p>
      </div>

      {/* Selector + descargas */}
      <div className="orden-selector-card">
        <div className="orden-selector-row">
          <div className="orden-fecha-field">
            <label><Calendar size={14} /> Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={function (e) { setFecha(e.target.value); }}
            />
            {fecha && <span className="orden-fecha-humana">{formatearFecha(fecha)}</span>}
          </div>
        </div>

        {/* Botones de descarga */}
        {data && data.totalEventos > 0 && (
          <div className="orden-descargas">
            <button
              className="btn-descargar-pdf btn-pdf-completo"
              onClick={function () { descargarPdf(null); }}
            >
              <Download size={16} /> PDF Completo
            </button>
            <button
              className="btn-descargar-pdf btn-pdf-equipo1"
              onClick={function () { descargarPdf(1); }}
              disabled={conteoEquipos[1] === 0}
            >
              <Download size={16} /> Equipo 1 ({conteoEquipos[1]})
            </button>
            <button
              className="btn-descargar-pdf btn-pdf-equipo2"
              onClick={function () { descargarPdf(2); }}
              disabled={conteoEquipos[2] === 0}
            >
              <Download size={16} /> Equipo 2 ({conteoEquipos[2]})
            </button>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="orden-loading">
          <div className="orden-spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : !data ? (
        <div className="orden-vacio">
          <AlertCircle size={48} />
          <p>Selecciona una fecha.</p>
        </div>
      ) : data.totalEventos === 0 ? (
        <div className="orden-vacio">
          <Inbox size={48} />
          <p>No hay eventos confirmados para esta fecha.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="orden-resumen">
            <span>{data.totalEventos} evento(s)</span>
            <span>·</span>
            <span>{data.totalServicios} servicio(s)</span>
            <span>·</span>
            <span>{data.totalPersonas} personas</span>
          </div>

          {/* Eventos */}
          <div className="orden-eventos">
            {data.eventos.map(function (ev, evIdx) {
              return (
                <div key={evIdx} className="orden-evento">
                  {/* Header */}
                  <div className="orden-evento-head">
                    <div className="orden-evento-head-left">
                      <Clock size={16} />
                      <span className="orden-evento-hora">{ev.evento.horaInicio} hrs</span>
                      <span className="orden-evento-cliente">{ev.cliente.nombre}</span>
                    </div>
                    <span className="orden-evento-codigo">{ev.codigoReferencia}</span>
                  </div>

                  {/* Meta */}
                  <div className="orden-evento-meta">
                    <span><MapPin size={12} /> {ev.evento.ubicacion || '—'}</span>
                    <span><Phone size={12} /> {ev.cliente.telefono || '—'}</span>
                    <span><Users size={12} /> {ev.evento.personas} personas</span>
                  </div>

                  {/* Tabla de servicios */}
                  <div className="orden-servicios-tabla">
                    <div className="orden-tabla-header">
                      <span className="col-num">#</span>
                      <span className="col-nombre">Servicio</span>
                      <span className="col-entrega">Entrega</span>
                      <span className="col-recoger">Recoger</span>
                      <span className="col-equipo">Equipo</span>
                    </div>

                    {ev.servicios.map(function (s) {
                      var equipoAsignado = equipos[s.numero] || 0;
                      return (
                        <div key={s.numero} className="orden-servicio-bloque">
                          <div className={'orden-tabla-fila' + (s.necesitaMontaje ? ' montaje' : '') + (equipoAsignado ? ' eq-' + equipoAsignado : '')}>
                            <span className="col-num">{s.numero}</span>
                            <span className="col-nombre">
                              {s.nombre}
                              {s.necesitaMontaje && <span className="tag-montaje">montaje</span>}
                              <span className="col-cant-inline">×{s.cantidad} · {s.duracionHoras}h</span>
                            </span>
                            <span className={'col-entrega' + (s.necesitaMontaje ? ' hora-montaje' : '')}>
                              {s.horaEntrega}
                            </span>
                            <span className="col-recoger">
                              {s.horaRecoger}
                            </span>
                            <span className="col-equipo">
                              <button
                                className={'eq-btn' + (equipoAsignado === 1 ? ' eq-activo-1' : '')}
                                onClick={function () { asignarEquipo(s.numero, 1); }}
                                title="Equipo 1"
                              >1</button>
                              <button
                                className={'eq-btn' + (equipoAsignado === 2 ? ' eq-activo-2' : '')}
                                onClick={function () { asignarEquipo(s.numero, 2); }}
                                title="Equipo 2"
                              >2</button>
                            </span>
                          </div>
                          {/* Contenido (qué llevar) */}
                          {s.contenido && (
                            <div className="orden-contenido">
                              <Truck size={12} />
                              <span>{s.contenido}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Notas */}
                  {ev.evento.notas && (
                    <div className="orden-evento-nota">
                      <AlertCircle size={13} />
                      <span>{ev.evento.notas}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="orden-leyenda">
            <div><span className="leyenda-montaje">■</span> Naranja = 1h antes para montaje (Comida/Bebidas)</div>
            <div><span className="leyenda-eq1">■</span> Equipo 1 · <span className="leyenda-eq2">■</span> Equipo 2 — Toca el número para asignar</div>
          </div>
        </>
      )}
    </div>
  );
}

export default OrdenDelDiaPage;
