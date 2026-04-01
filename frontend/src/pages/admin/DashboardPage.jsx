import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import frontendLogger from '../../utils/frontendLogger';
import {
  FileText,
  CalendarCheck,
  Clock,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Package,
  Users
} from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  var navigate = useNavigate();
  var { admin } = useAuth();
  var [dashboard, setDashboard] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');

  var rol = admin?.rol || 'editor';

  useEffect(function () {
    cargarDashboard();
  }, []);

  var cargarDashboard = async function () {
    try {
      var res = await adminService.getDashboard();
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
  var catalogo = dashboard?.catalogo || {};

  // ── Cards de estadísticas según rol ────────────────────────
  // superadmin/admin: ven todas las estadísticas
  // editor: solo ve cotizaciones totales y pendientes
  var allCards = [
    {
      label: 'Cotizaciones totales',
      value: stats.total || 0,
      icon: <FileText size={24} />,
      color: 'blue',
      roles: ['superadmin', 'admin', 'editor']
    },
    {
      label: 'Pendientes',
      value: stats.pendientes || 0,
      icon: <Clock size={24} />,
      color: 'yellow',
      roles: ['superadmin', 'admin', 'editor']
    },
    {
      label: 'Confirmadas',
      value: stats.confirmadas || 0,
      icon: <CalendarCheck size={24} />,
      color: 'green',
      roles: ['superadmin', 'admin']
    },
    {
      label: 'En negociación',
      value: stats.enNegociacion || 0,
      icon: <TrendingUp size={24} />,
      color: 'purple',
      roles: ['superadmin', 'admin']
    },
  ];

  var cards = allCards.filter(function (c) { return c.roles.includes(rol); });

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
      return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) { return fecha; }
  };

  // Etiqueta del rol para el saludo
  var rolLabel = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    editor: 'Editor'
  };

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <p className="dash-subtitle">
          Bienvenido, {admin?.nombre || 'Admin'}
          <span className="dash-rol-badge" data-rol={rol}>
            {rolLabel[rol] || rol}
          </span>
        </p>
      </div>

      {/* ── Tarjetas de estadísticas (filtradas por rol) ── */}
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

      {/* ── Info del catálogo (solo admin y superadmin) ──── */}
      {(rol === 'superadmin' || rol === 'admin') && catalogo && (
        <div className="dash-stats-grid" style={{ marginTop: '0.5rem' }}>
          <div className="dash-stat-card dash-stat-teal">
            <div className="dash-stat-icon"><Package size={24} /></div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{catalogo.servicios || 0}</span>
              <span className="dash-stat-label">Servicios activos</span>
            </div>
          </div>
          {rol === 'superadmin' && (
            <div className="dash-stat-card dash-stat-gray">
              <div className="dash-stat-icon"><Users size={24} /></div>
              <div className="dash-stat-info">
                <span className="dash-stat-value">{catalogo.categorias || 0}</span>
                <span className="dash-stat-label">Categorías</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Cotizaciones recientes ─────────────────────── */}
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

      {/* ── Aviso de permisos limitados (solo editor) ───── */}
      {rol === 'editor' && (
        <div className="dash-permisos-aviso">
          <ShieldCheck size={18} />
          <span>
            Tu cuenta tiene rol <strong>Editor</strong>. Algunas secciones son de solo lectura.
            Contacta al administrador para solicitar más permisos.
          </span>
        </div>
      )}
    </div>
  );
}
