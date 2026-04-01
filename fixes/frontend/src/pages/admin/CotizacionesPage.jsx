import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import frontendLogger from '../../utils/frontendLogger';
import {
  Search,
  Filter,
  ChevronRight,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import './CotizacionesPage.css';

var ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_negociacion', label: 'En negociación' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'conflicto', label: 'Conflicto' },
];

export default function CotizacionesPage() {
  var navigate = useNavigate();
  var [cotizaciones, setCotizaciones] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [buscar, setBuscar] = useState('');
  var [estadoFiltro, setEstadoFiltro] = useState('');
  var [showFilters, setShowFilters] = useState(false);
  var [pagina, setPagina] = useState(1);
  var [totalPages, setTotalPages] = useState(1);

  var cargarCotizaciones = useCallback(async function () {
    setLoading(true);
    setError('');
    try {
      var res = await adminService.getCotizaciones({
        estado: estadoFiltro,
        buscar: buscar.trim(),
        pagina: pagina,
        limite: 15
      });

      // API devuelve: { data: [...], paginacion: { pagina, limite, total, paginas } }
      var respuesta = res.data;
      var lista = respuesta.data || respuesta.cotizaciones || [];
      var pag = respuesta.paginacion || {};

      setCotizaciones(Array.isArray(lista) ? lista : []);
      setTotalPages(pag.paginas || 1);
      frontendLogger.info('Cotizaciones cargadas', { count: lista.length });
    } catch (err) {
      setError('Error al cargar cotizaciones');
      frontendLogger.error('Error cargando cotizaciones', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, [estadoFiltro, buscar, pagina]);

  useEffect(function () {
    cargarCotizaciones();
  }, [cargarCotizaciones]);

  var handleBuscar = function (e) {
    e.preventDefault();
    setPagina(1);
    cargarCotizaciones();
  };

  var limpiarFiltros = function () {
    setBuscar('');
    setEstadoFiltro('');
    setPagina(1);
  };

  var getEstadoBadge = function (estado) {
    var map = {
      pendiente: { label: 'Pendiente', className: 'badge-pendiente' },
      en_negociacion: { label: 'En negociación', className: 'badge-negociacion' },
      confirmada: { label: 'Confirmada', className: 'badge-confirmada' },
      rechazada: { label: 'Rechazada', className: 'badge-rechazada' },
      cancelada: { label: 'Cancelada', className: 'badge-cancelada' },
      conflicto: { label: 'Conflicto', className: 'badge-conflicto' },
    };
    return map[estado] || { label: estado, className: 'badge-pendiente' };
  };

  var formatFecha = function (fecha) {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) { return fecha; }
  };

  return (
    <div className="cots-page">
      <div className="cots-header">
        <div>
          <h1 className="cots-title">Cotizaciones</h1>
          <p className="cots-subtitle">Gestiona las solicitudes de cotización</p>
        </div>
      </div>

      {/* Search bar */}
      <form className="cots-search-bar" onSubmit={handleBuscar}>
        <div className="cots-search-input-wrapper">
          <Search size={18} className="cots-search-icon" />
          <input
            type="text"
            className="cots-search-input"
            placeholder="Buscar por código DD2603-..."
            value={buscar}
            onChange={function (e) { setBuscar(e.target.value); }}
          />
          {buscar && (
            <button type="button" className="cots-search-clear" onClick={function () { setBuscar(''); setPagina(1); }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          className={'cots-filter-btn ' + (showFilters ? 'active' : '')}
          onClick={function () { setShowFilters(!showFilters); }}
        >
          <Filter size={18} />
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="cots-filters">
          <div className="cots-filters-scroll">
            {ESTADOS.map(function (est) {
              return (
                <button
                  key={est.value}
                  className={'cots-filter-chip ' + (estadoFiltro === est.value ? 'active' : '')}
                  onClick={function () { setEstadoFiltro(est.value); setPagina(1); }}
                >
                  {est.label}
                </button>
              );
            })}
          </div>
          {(estadoFiltro || buscar) && (
            <button className="cots-clear-filters" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="cots-loading">
          <div className="spinner"></div>
          <p>Cargando cotizaciones...</p>
        </div>
      ) : error ? (
        <div className="cots-error">
          <AlertCircle size={40} />
          <p>{error}</p>
          <button onClick={cargarCotizaciones} className="cots-retry-btn">Reintentar</button>
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="cots-empty">
          <FileText size={48} />
          <p>No se encontraron cotizaciones</p>
          {(estadoFiltro || buscar) && (
            <button className="cots-clear-filters" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="cots-list">
            {cotizaciones.map(function (cot) {
              var badge = getEstadoBadge(cot.estado);
              return (
                <div
                  key={cot._id}
                  className="cots-item"
                  onClick={function () { navigate('/admin/cotizaciones/' + cot._id); }}
                >
                  <div className="cots-item-top">
                    <span className="cots-item-codigo">{cot.codigoReferencia}</span>
                    <span className={'dash-badge ' + badge.className}>{badge.label}</span>
                  </div>
                  <div className="cots-item-mid">
                    <span className="cots-item-cliente">
                      {cot.cliente?.nombre || '—'}
                    </span>
                    <span className="cots-item-servicios">
                      {(cot.servicios?.length || 0) + ' servicio' + ((cot.servicios?.length || 0) !== 1 ? 's' : '')}
                    </span>
                  </div>
                  <div className="cots-item-bottom">
                    <span className="cots-item-fecha">
                      {'📅 ' + formatFecha(cot.evento?.fecha)}
                    </span>
                    <ChevronRight size={16} className="cots-item-arrow" />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="cots-pagination">
              <button
                className="cots-page-btn"
                disabled={pagina <= 1}
                onClick={function () { setPagina(function (p) { return p - 1; }); }}
              >
                ← Anterior
              </button>
              <span className="cots-page-info">
                Página {pagina} de {totalPages}
              </span>
              <button
                className="cots-page-btn"
                disabled={pagina >= totalPages}
                onClick={function () { setPagina(function (p) { return p + 1; }); }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
