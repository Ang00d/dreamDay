import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import frontendLogger from '../../utils/frontendLogger';
import {
  FileText,
  CalendarCheck,
  Clock,
  TrendingUp,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  var navigate = useNavigate();
  var [dashboard, setDashboard] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');

  useEffect(function () {
    cargarDashboard();
  }, []);

  var cargarDashboard = async function () {
    try {
      var res = await adminService.getDashboard();
      // API devuelve: { data: { cotizaciones: {...}, recientes: [...], ... } }
      setDashboard(res.data.data || res.data);
      frontendLogger.info('Dashboard cargado');
    } catch (err) {
      setError('Error al cargar el dashboard');
      frontendLogger.error('Error cargando dashboard', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={cargarDashboard} className="dash-retry-btn">Reintentar</button>
      </div>
    );
  }

  var stats = dashboard?.cotizaciones || {};
  var recientes = dashboard?.recientes || [];

  var cards = [
    {
      label: 'Cotizaciones totales',
      value: stats.total || 0,
      icon: <FileText size={24} />,
      color: 'blue'
    },
    {
      label: 'Pendientes',
      value: stats.pendientes || 0,
      icon: <Clock size={24} />,
      color: 'yellow'
    },
    {
      label: 'Confirmadas',
      value: stats.confirmadas || 0,
      icon: <CalendarCheck size={24} />,
      color: 'green'
    },
    {
      label: 'En negociación',
      value: stats.enNegociacion || 0,
      icon: <TrendingUp size={24} />,
      color: 'purple'
    },
  ];

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
    <div className="dash-page">
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">Resumen general de Dream Day</p>
      </div>

      <div className="dash-stats-grid">
        {cards.map(function (card, i) {
          return (
            <div key={i} className={'dash-stat-card dash-stat-' + card.color}>
              <div className="dash-stat-icon">{card.icon}</div>
              <div className="dash-stat-info">
                <span className="dash-stat-value">{card.value}</span>
                <span className="dash-stat-label">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Cotizaciones recientes</h2>
          <button className="dash-see-all" onClick={function () { navigate('/admin/cotizaciones'); }}>
            Ver todas <ChevronRight size={16} />
          </button>
        </div>

        {recientes.length === 0 ? (
          <div className="dash-empty">
            <FileText size={40} />
            <p>No hay cotizaciones aún</p>
          </div>
        ) : (
          <div className="dash-recientes-list">
            {recientes.map(function (cot) {
              var badge = getEstadoBadge(cot.estado);
              return (
                <div
                  key={cot._id}
                  className="dash-reciente-item"
                  onClick={function () { navigate('/admin/cotizaciones/' + cot._id); }}
                >
                  <div className="dash-reciente-left">
                    <span className="dash-reciente-codigo">{cot.codigoReferencia}</span>
                    <span className="dash-reciente-cliente">
                      {cot.cliente?.nombre || '—'}
                    </span>
                  </div>
                  <div className="dash-reciente-right">
                    <span className={'dash-badge ' + badge.className}>{badge.label}</span>
                    <span className="dash-reciente-fecha">
                      {formatFecha(cot.evento?.fecha)}
                    </span>
                  </div>
                  <ChevronRight size={16} className="dash-reciente-arrow" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
