import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import api from '../../services/api';
import { Search, X, ChevronRight, FileText, AlertCircle, Calendar, ChevronLeft } from 'lucide-react';
import './CotizacionesPage.css';

var TABS = [
  { value: 'pendiente',       label: 'Pendientes',   emoji: '🕐' },
  { value: 'en_negociacion',  label: 'Negociación',  emoji: '💬' },
  { value: 'confirmada',      label: 'Confirmadas',  emoji: '✅' },
  { value: 'completada',      label: 'Completadas',  emoji: '🎉' },
  { value: 'conflicto',       label: 'Conflicto',    emoji: '⚠️' },
  { value: 'rechazada',       label: 'Rechazadas',   emoji: '❌' },
  { value: 'cancelada',       label: 'Canceladas',   emoji: '🚫' },
  { value: 'calendario',      label: 'Calendario',   emoji: '📅' },
];

var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function CotizacionesPage() {
  var navigate = useNavigate();
  var hoyDate  = new Date();

  var [tab, setTab]               = useState('pendiente');
  var [cotizaciones, setCotizaciones] = useState([]);
  var [loading, setLoading]       = useState(true);
  var [error, setError]           = useState('');
  var [buscar, setBuscar]         = useState('');
  var [pagina, setPagina]         = useState(1);
  var [totalPages, setTotalPages] = useState(1);
  var [conteos, setConteos]       = useState({});

  var [calAnio, setCalAnio]       = useState(hoyDate.getFullYear());
  var [calMes, setCalMes]         = useState(hoyDate.getMonth() + 1);
  var [calendario, setCalendario] = useState([]);
  var [calCargando, setCalCargando] = useState(false);
  var [diaSeleccionado, setDiaSeleccionado] = useState(null);
  var [cotsDia, setCotsDia]       = useState([]);
  var [cotsDiaCargando, setCotsDiaCargando] = useState(false);

  useEffect(function () {
    async function cargarConteos() {
      var estados = ['pendiente', 'en_negociacion', 'confirmada', 'completada', 'conflicto', 'rechazada', 'cancelada'];
      var nuevos = {};
      await Promise.all(estados.map(async function (est) {
        try {
          var res = await adminService.getCotizaciones({ estado: est, limite: 1, pagina: 1 });
          nuevos[est] = res.data.paginacion ? res.data.paginacion.total : 0;
        } catch (_) { nuevos[est] = 0; }
      }));
      setConteos(nuevos);
    }
    cargarConteos();
  }, []);

  var cargarCotizaciones = useCallback(async function () {
    if (tab === 'calendario') return;
    setLoading(true);
    setError('');
    try {
      var res = await adminService.getCotizaciones({ estado: tab, buscar: buscar.trim(), pagina: pagina, limite: 15 });
      var lista = res.data.data || [];
      var pag   = res.data.paginacion || {};
      setCotizaciones(Array.isArray(lista) ? lista : []);
      setTotalPages(pag.paginas || 1);
    } catch (err) {
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, [tab, buscar, pagina]);

  useEffect(function () { cargarCotizaciones(); }, [cargarCotizaciones]);

  useEffect(function () {
    if (tab !== 'calendario') return;
    async function cargarCal() {
      setCalCargando(true);
      setDiaSeleccionado(null);
      setCotsDia([]);
      try {
        var res = await api.get('/disponibilidad/mes?anio=' + calAnio + '&mes=' + calMes);
        setCalendario(res.data.data.calendario || []);
      } catch (_) { setCalendario([]); }
      finally { setCalCargando(false); }
    }
    cargarCal();
  }, [tab, calAnio, calMes]);

  async function seleccionarDia(dia) {
    if (dia.color === 'verde') return;
    setDiaSeleccionado(dia.fecha);
    setCotsDiaCargando(true);
    setCotsDia([]);
    try {
      var res = await adminService.getCotizaciones({ fecha: dia.fecha, estado: 'confirmada', limite: 50 });
      setCotsDia(res.data.data || []);
    } catch (_) { setCotsDia([]); }
    finally { setCotsDiaCargando(false); }
  }

  function cambiarMes(delta) {
    var nm = calMes + delta;
    if (nm < 1)  { setCalAnio(function (a) { return a - 1; }); setCalMes(12); }
    else if (nm > 12) { setCalAnio(function (a) { return a + 1; }); setCalMes(1); }
    else { setCalMes(nm); }
    setDiaSeleccionado(null); setCotsDia([]);
  }

  function formatFecha(fecha) {
    if (!fecha) return '—';
    try { return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (_) { return fecha; }
  }

  function getBadge(estado) {
    var map = {
      pendiente: { label: 'Pendiente', cls: 'badge-pendiente' },
      en_negociacion: { label: 'En negociación', cls: 'badge-negociacion' },
      confirmada: { label: 'Confirmada', cls: 'badge-confirmada' },
      completada: { label: 'Completada', cls: 'badge-completada' },
      rechazada: { label: 'Rechazada', cls: 'badge-rechazada' },
      cancelada: { label: 'Cancelada', cls: 'badge-cancelada' },
      conflicto: { label: 'Conflicto', cls: 'badge-conflicto' },
    };
    return map[estado] || { label: estado, cls: 'badge-pendiente' };
  }

  function construirGrilla() {
    if (!calendario.length) return [];
    var primerDia = new Date(calAnio, calMes - 1, 1).getDay();
    var grid = [];
    for (var i = 0; i < primerDia; i++) grid.push(null);
    calendario.forEach(function (d) { grid.push(d); });
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }

  var hoyStr = hoyDate.getFullYear() + '-'
    + String(hoyDate.getMonth() + 1).padStart(2,'0') + '-'
    + String(hoyDate.getDate()).padStart(2,'0');

  return (
    <div className="cots-page">
      <div className="cots-header">
        <h1 className="cots-title">Cotizaciones</h1>
        <p className="cots-subtitle">Gestiona las solicitudes de cotización</p>
      </div>

      {/* Tabs */}
      <div className="cots-tabs-scroll">
        <div className="cots-tabs">
          {TABS.map(function (t) {
            var count = t.value !== 'calendario' ? conteos[t.value] : null;
            return (
              <button key={t.value}
                className={'cots-tab' + (tab === t.value ? ' active' : '')}
                onClick={function () { setTab(t.value); setPagina(1); setBuscar(''); }}>
                <span>{t.emoji} {t.label}</span>
                {count != null && count > 0 && <span className="cots-tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista Lista */}
      {tab !== 'calendario' && (
        <>
          <div className="cots-search-bar" style={{ marginBottom: '1rem' }}>
            <div className="cots-search-input-wrapper">
              <Search size={18} className="cots-search-icon" />
              <input type="text" className="cots-search-input"
                placeholder="Buscar por código o nombre..."
                value={buscar}
                onChange={function (e) { setBuscar(e.target.value); setPagina(1); }} />
              {buscar && (
                <button type="button" className="cots-search-clear"
                  onClick={function () { setBuscar(''); setPagina(1); }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="cots-loading"><div className="spinner"></div><p>Cargando...</p></div>
          ) : error ? (
            <div className="cots-error">
              <AlertCircle size={40} /><p>{error}</p>
              <button onClick={cargarCotizaciones} className="cots-retry-btn">Reintentar</button>
            </div>
          ) : cotizaciones.length === 0 ? (
            <div className="cots-empty">
              <FileText size={48} />
              <p>No hay cotizaciones en esta sección</p>
            </div>
          ) : (
            <>
              <div className="cots-list">
                {cotizaciones.map(function (cot) {
                  var badge = getBadge(cot.estado);
                  return (
                    <div key={cot._id} className="cots-item"
                      onClick={function () { navigate('/admin/cotizaciones/' + cot._id); }}>
                      <div className="cots-item-top">
                        <span className="cots-item-codigo">{cot.codigoReferencia}</span>
                        <span className={'dash-badge ' + badge.cls}>{badge.label}</span>
                      </div>
                      <div className="cots-item-mid">
                        <span className="cots-item-cliente">{cot.cliente ? cot.cliente.nombre : '—'}</span>
                        <span className="cots-item-servicios">
                          {(cot.servicios ? cot.servicios.length : 0) + ' servicio' + ((cot.servicios ? cot.servicios.length : 0) !== 1 ? 's' : '')}
                        </span>
                      </div>
                      <div className="cots-item-bottom">
                        <span className="cots-item-fecha">{'📅 ' + formatFecha(cot.evento ? cot.evento.fecha : null)}</span>
                        <ChevronRight size={16} className="cots-item-arrow" />
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="cots-pagination">
                  <button className="cots-page-btn" disabled={pagina <= 1}
                    onClick={function () { setPagina(function (p) { return p - 1; }); }}>← Anterior</button>
                  <span className="cots-page-info">Página {pagina} de {totalPages}</span>
                  <button className="cots-page-btn" disabled={pagina >= totalPages}
                    onClick={function () { setPagina(function (p) { return p + 1; }); }}>Siguiente →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Vista Calendario */}
      {tab === 'calendario' && (
        <div className="cal-container">
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={function () { cambiarMes(-1); }}><ChevronLeft size={20} /></button>
            <span className="cal-mes-label">{MESES[calMes - 1]} {calAnio}</span>
            <button className="cal-nav-btn" onClick={function () { cambiarMes(1); }}><ChevronRight size={20} /></button>
          </div>

          <div className="cal-leyenda">
            <span><span className="cal-dot verde"></span> Disponible</span>
            <span><span className="cal-dot amarillo"></span> Parcial</span>
            <span><span className="cal-dot rojo"></span> Lleno</span>
          </div>

          {calCargando ? (
            <div className="cots-loading" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
          ) : (
            <>
              <div className="cal-grid">
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(function (d) {
                  return <div key={d} className="cal-dia-nombre">{d}</div>;
                })}
                {construirGrilla().map(function (dia, idx) {
                  if (!dia) return <div key={'e' + idx} className="cal-celda vacia"></div>;
                  var esSel = diaSeleccionado === dia.fecha;
                  var esHoy = dia.fecha === hoyStr;
                  return (
                    <button key={dia.fecha}
                      className={'cal-celda ' + dia.color + (esSel ? ' seleccionado' : '') + (esHoy ? ' hoy' : '')}
                      onClick={function () { seleccionarDia(dia); }}
                      disabled={dia.color === 'verde'}>
                      <span className="cal-num">{dia.dia}</span>
                      {dia.color !== 'verde' && <span className="cal-dot-small"></span>}
                    </button>
                  );
                })}
              </div>

              {diaSeleccionado && (
                <div className="cal-panel">
                  <div className="cal-panel-header">
                    <Calendar size={18} />
                    <span>Confirmados el {formatFecha(diaSeleccionado)}</span>
                    <button className="cal-panel-cerrar"
                      onClick={function () { setDiaSeleccionado(null); setCotsDia([]); }}>
                      <X size={16} />
                    </button>
                  </div>
                  {cotsDiaCargando ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                  ) : cotsDia.length === 0 ? (
                    <p className="cal-panel-vacio">No hay cotizaciones confirmadas este día</p>
                  ) : (
                    <div className="cal-panel-lista">
                      {cotsDia.map(function (cot) {
                        return (
                          <div key={cot._id} className="cal-panel-item"
                            onClick={function () { navigate('/admin/cotizaciones/' + cot._id); }}>
                            <div className="cal-panel-item-top">
                              <span className="cal-panel-codigo">{cot.codigoReferencia}</span>
                              <span className="cal-panel-cliente">{cot.cliente ? cot.cliente.nombre : ''}</span>
                            </div>
                            <div className="cal-panel-servicios">
                              {(cot.servicios || []).map(function (s) {
                                return (
                                  <span key={s._id || s.nombre} className="cal-panel-servicio-tag">
                                    {s.nombre}{s.cantidad > 1 ? ' x' + s.cantidad : ''}
                                  </span>
                                );
                              })}
                            </div>
                            <ChevronRight size={14} className="cal-panel-arrow" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
