/* ============================================
   DREAM DAY — Admin: Orden del Día
   
   Selecciona una fecha, ve los eventos confirmados
   y descarga el PDF operativo para el staff.
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
  Package,
  AlertCircle,
  Inbox
} from 'lucide-react';
import './OrdenDelDiaPage.css';

function OrdenDelDiaPage() {
  var hoy = new Date().toISOString().split('T')[0];
  var [fecha, setFecha] = useState(hoy);
  var [data, setData] = useState(null);
  var [cargando, setCargando] = useState(false);

  useEffect(function () {
    cargarOrden();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  async function cargarOrden() {
    if (!fecha) return;
    try {
      setCargando(true);
      var res = await adminService.getOrdenDelDia(fecha);
      setData(res.data.data);
      frontendLogger.info('Orden del día cargada', { fecha: fecha });
    } catch (err) {
      showToast('Error al cargar la orden del día', 'error');
      frontendLogger.error('Error cargando orden del día', { message: err.message });
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  function descargarPdf() {
    if (!data || data.totalEventos === 0) {
      showToast('No hay eventos para descargar', 'info');
      return;
    }
    try {
      generarPdfOrdenDelDia(data);
      showToast('PDF generado', 'success');
      frontendLogger.info('PDF orden del día generado', { fecha: fecha, eventos: data.totalEventos });
    } catch (err) {
      showToast('Error al generar PDF', 'error');
      frontendLogger.error('Error generando PDF orden del día', { error: err.message });
    }
  }

  function formatearFecha(f) {
    if (!f) return '';
    var d = new Date(f + 'T12:00:00');
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  return (
    <div className="orden-dia-page">
      <div className="orden-dia-header">
        <div>
          <h1>Orden del día</h1>
          <p>Reporte logístico de eventos confirmados para el staff</p>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="orden-selector-card">
        <div className="orden-selector-row">
          <div className="orden-fecha-field">
            <label>
              <Calendar size={14} /> Fecha del reporte
            </label>
            <input
              type="date"
              value={fecha}
              onChange={function (e) { setFecha(e.target.value); }}
            />
            {fecha && (
              <span className="orden-fecha-humana">{formatearFecha(fecha)}</span>
            )}
          </div>

          <button
            className="btn-descargar-pdf"
            onClick={descargarPdf}
            disabled={!data || data.totalEventos === 0 || cargando}
          >
            <Download size={18} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="orden-loading">
          <div className="orden-spinner"></div>
          <p>Cargando eventos...</p>
        </div>
      ) : !data ? (
        <div className="orden-vacio">
          <AlertCircle size={48} />
          <p>Selecciona una fecha para ver los eventos.</p>
        </div>
      ) : data.totalEventos === 0 ? (
        <div className="orden-vacio">
          <Inbox size={48} />
          <p>No hay eventos confirmados para esta fecha.</p>
        </div>
      ) : (
        <>
          {/* Estadísticas */}
          <div className="orden-stats">
            <div className="orden-stat">
              <span className="orden-stat-num">{data.totalEventos}</span>
              <span className="orden-stat-label">Evento(s)</span>
            </div>
            <div className="orden-stat">
              <span className="orden-stat-num">{data.totalPersonas}</span>
              <span className="orden-stat-label">Personas</span>
            </div>
            <div className="orden-stat">
              <span className="orden-stat-num">{data.totalServicios}</span>
              <span className="orden-stat-label">Servicios</span>
            </div>
          </div>

          {/* Lista de eventos */}
          <div className="orden-eventos">
            {data.eventos.map(function (ev, idx) {
              var cliente = ev.cliente || {};
              var evento = ev.evento || {};
              var servicios = ev.servicios || [];
              return (
                <div key={ev._id} className="orden-evento">
                  {/* Header del evento */}
                  <div className="orden-evento-head">
                    <div className="orden-evento-num">
                      <span className="num-circle">{idx + 1}</span>
                      <div>
                        <span className="orden-evento-hora">
                          <Clock size={14} /> {evento.horaInicio || '—'} hrs
                        </span>
                        <span className="orden-evento-codigo">{ev.codigoReferencia}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info cliente/lugar */}
                  <div className="orden-evento-info">
                    <div className="orden-info-item">
                      <Users size={14} />
                      <div>
                        <strong>{cliente.nombre || '—'}</strong>
                        {cliente.telefono && (
                          <span className="orden-info-sub">
                            <Phone size={11} /> {cliente.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="orden-info-item">
                      <MapPin size={14} />
                      <div>
                        <span>{evento.ubicacion || '—'}</span>
                        {evento.codigoPostal && (
                          <span className="orden-info-sub">CP {evento.codigoPostal}</span>
                        )}
                      </div>
                    </div>
                    <div className="orden-info-item">
                      <Users size={14} />
                      <div>
                        <strong>{evento.personas || '—'}</strong>
                        <span className="orden-info-sub">personas</span>
                      </div>
                    </div>
                  </div>

                  {/* Servicios */}
                  {servicios.length > 0 && (
                    <div className="orden-evento-servicios">
                      <div className="orden-servicios-head">
                        <Package size={14} />
                        <span>Servicios ({servicios.length})</span>
                      </div>
                      <ul className="orden-servicios-list">
                        {servicios.map(function (s, si) {
                          var nombre = s.nombre || (s.servicioId && s.servicioId.nombre) || '—';
                          var dur = s.servicioId && s.servicioId.duracionHoras;
                          return (
                            <li key={si} className="orden-servicio-item">
                              <span className="orden-servicio-nombre">{nombre}</span>
                              <span className="orden-servicio-meta">
                                ×{s.cantidad || 1}
                                {dur && ' · ' + dur + 'h'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Notas del cliente */}
                  {evento.notas && (
                    <div className="orden-evento-notas">
                      <AlertCircle size={14} />
                      <span>{evento.notas}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default OrdenDelDiaPage;
