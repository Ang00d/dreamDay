import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import frontendLogger from '../../utils/frontendLogger';
import { showToast } from '../../utils/toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  AlertCircle,
  DollarSign,
  Package,
  Download
} from 'lucide-react';
import './CotizacionDetallePage.css';
import { generarPdfCotizacion } from '../../utils/generarPdfCotizacion';

export default function CotizacionDetallePage() {
  var { id } = useParams();
  var navigate = useNavigate();
  var [cotizacion, setCotizacion] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');
  var [actionLoading, setActionLoading] = useState('');

  useEffect(function () {
    cargarCotizacion();
  }, [id]);

  var cargarCotizacion = async function () {
    setLoading(true);
    try {
      var res = await adminService.getCotizacion(id);
      // API devuelve: { data: cotizacion }
      setCotizacion(res.data.data || res.data);
      frontendLogger.info('Detalle cotización cargado', { id: id });
    } catch (err) {
      setError('Error al cargar la cotización');
      frontendLogger.error('Error cargando cotización', { id: id, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  var cambiarEstado = async function (nuevoEstado) {
    var confirmMsg = {
      confirmada: '¿Confirmar esta cotización? Se creará una cita y se bloqueará la disponibilidad.',
      rechazada: '¿Rechazar esta cotización?',
      en_negociacion: '¿Marcar como en negociación?',
      cancelada: '¿Cancelar esta cotización?',
      completada: '¿Marcar este evento como completado? Esto indica que el evento ya se realizó.'
    };

    if (!window.confirm(confirmMsg[nuevoEstado] || '¿Cambiar a ' + nuevoEstado + '?')) return;

    setActionLoading(nuevoEstado);
    try {
      var res = await adminService.actualizarCotizacion(id, { estado: nuevoEstado });
      showToast('Estado actualizado a: ' + nuevoEstado, 'success');

      // Aviso si se marcaron cotizaciones como conflicto automáticamente
      var conflictosAuto = res && res.data && res.data.conflictosAutoMarcados;
      if (conflictosAuto && conflictosAuto > 0) {
        showToast(
          '⚠️ ' + conflictosAuto + ' cotización(es) marcada(s) automáticamente como conflicto',
          'info',
          6000
        );
      }

      frontendLogger.info('Estado cotización cambiado', { id: id, nuevoEstado: nuevoEstado });
      cargarCotizacion();
    } catch (err) {
      var msg = err.response?.data?.error || 'Error al cambiar estado';
      showToast(msg, 'error');
      frontendLogger.error('Error cambiando estado', { id: id, nuevoEstado: nuevoEstado, error: err.message });
    } finally {
      setActionLoading('');
    }
  };

  var getEstadoBadge = function (estado) {
    var map = {
      pendiente: { label: 'Pendiente', className: 'badge-pendiente' },
      en_negociacion: { label: 'En negociación', className: 'badge-negociacion' },
      confirmada: { label: 'Confirmada', className: 'badge-confirmada' },
      rechazada: { label: 'Rechazada', className: 'badge-rechazada' },
      cancelada: { label: 'Cancelada', className: 'badge-cancelada' },
      conflicto: { label: 'Conflicto', className: 'badge-conflicto' },
      completada: { label: 'Completada', className: 'badge-completada' },
    };
    return map[estado] || { label: estado, className: 'badge-pendiente' };
  };

  var formatFecha = function (fecha) {
    if (!fecha) return '—';
    try {
      return new Date(fecha).toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) { return fecha; }
  };

  var formatPrecio = function (precio) {
    if (!precio && precio !== 0) return '—';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio);
  };

  if (loading) {
    return (
      <div className="det-loading">
        <div className="spinner"></div>
        <p>Cargando cotización...</p>
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="det-error">
        <AlertCircle size={48} />
        <p>{error || 'Cotización no encontrada'}</p>
        <button onClick={function () { navigate('/admin/cotizaciones'); }} className="det-back-btn">
          ← Volver
        </button>
      </div>
    );
  }

  var cot = cotizacion;
  var badge = getEstadoBadge(cot.estado);
  var cliente = cot.cliente || {};
  var evento = cot.evento || {};
  var servicios = cot.servicios || [];

  var canConfirm = ['pendiente', 'en_negociacion'].indexOf(cot.estado) !== -1;
  var canReject = ['pendiente', 'en_negociacion'].indexOf(cot.estado) !== -1;
  var canNegotiate = cot.estado === 'pendiente';
  var canCancel = ['cancelada', 'rechazada', 'completada'].indexOf(cot.estado) === -1;

  // Puede marcar como completada si está confirmada y la fecha del evento ya pasó
  var hoyStr = new Date().toISOString().split('T')[0];
  var canComplete = cot.estado === 'confirmada' && evento.fecha && evento.fecha < hoyStr;

  // Calcular subtotal correcto según tipoPrecio
  function calcularSubtotal(s, personas) {
    var precio = s.precioUnitario || (s.servicioId && s.servicioId.precio) || 0;
    var tipoPrecio = (s.servicioId && s.servicioId.tipoPrecio) || 'precio_fijo';
    var reqMin = (s.servicioId && s.servicioId.requisitoMinimo) || null;
    if (s.precioUnitario) {
      // Si el admin ya puso precio manual, usar precio × cantidad
      return precio * (s.cantidad || 1);
    }
    if (tipoPrecio === 'por_persona') {
      return precio * (personas || 1);
    }
    if (tipoPrecio === 'por_pieza' || tipoPrecio === 'por_orden') {
      var minCantidad = reqMin ? (reqMin.cantidad || 1) : 1;
      return precio * minCantidad;
    }
    // precio_fijo, por_juego
    return precio;
  }

  var totalEstimado = servicios.reduce(function (sum, s) {
    return sum + calcularSubtotal(s, evento.personas);
  }, 0);

  return (
    <div className="det-page">
      {/* Header */}
      <div className="det-header">
        <button className="det-back" onClick={function () { navigate('/admin/cotizaciones'); }}>
          <ArrowLeft size={20} />
        </button>
        <div className="det-header-info">
          <h1 className="det-codigo">{cot.codigoReferencia}</h1>
          <span className={'dash-badge ' + badge.className}>{badge.label}</span>
        </div>
        <button
          className="det-btn-pdf"
          onClick={function () {
            try {
              var cotConPrecios = Object.assign({}, cot);
              cotConPrecios.servicios = servicios.map(function (s) {
                var nombre = (s.servicioId && s.servicioId.nombre) || s.nombre || 'Servicio';
                var precio = s.precioUnitario || (s.servicioId && s.servicioId.precio) || 0;
                var subtotal = calcularSubtotal(s, evento.personas);
                return {
                  nombre: nombre,
                  cantidad: s.cantidad || 1,
                  precioUnitario: precio,
                  precioTotal: subtotal,
                  servicioId: s.servicioId
                };
              });
              cotConPrecios.precioTotal = totalEstimado;
              generarPdfCotizacion(cotConPrecios, 'admin');
              showToast('PDF generado', 'success');
            } catch (err) {
              showToast('Error al generar PDF', 'error');
              frontendLogger.error('Error generando PDF', { error: err.message });
            }
          }}
          title="Descargar PDF"
        >
          <Download size={18} />
          <span className="det-btn-pdf-label">PDF</span>
        </button>
      </div>

      {/* Cliente */}
      <div className="det-card">
        <h2 className="det-card-title">
          <User size={18} /> Datos del cliente
        </h2>
        <div className="det-info-grid">
          <div className="det-info-item">
            <User size={16} />
            <span>{cliente.nombre || '—'}</span>
          </div>
          <div className="det-info-item">
            <Mail size={16} />
            <span>{cliente.email || '—'}</span>
          </div>
          <div className="det-info-item">
            <Phone size={16} />
            <span>{cliente.telefono || '—'}</span>
          </div>
          <div className="det-info-item">
            <MapPin size={16} />
            <span>
              {evento.ubicacion || '—'}
              {evento.codigoPostal && ', CP ' + evento.codigoPostal}
            </span>
          </div>
        </div>
      </div>

      {/* Evento */}
      <div className="det-card">
        <h2 className="det-card-title">
          <Calendar size={18} /> Detalles del evento
        </h2>
        <div className="det-info-grid">
          <div className="det-info-item">
            <Calendar size={16} />
            <span>{formatFecha(evento.fecha)}</span>
          </div>
          <div className="det-info-item">
            <Clock size={16} />
            <span>{evento.hora || '—'}</span>
          </div>
          <div className="det-info-item">
            <Users size={16} />
            <span>{(evento.personas || '—') + ' personas'}</span>
          </div>
          {evento.notas && (
            <div className="det-info-item det-info-full">
              <MessageSquare size={16} />
              <span>{evento.notas}</span>
            </div>
          )}
        </div>
      </div>

      {/* Servicios con precios */}
      <div className="det-card">
        <h2 className="det-card-title">
          <Package size={18} /> Servicios solicitados
        </h2>
        <div className="det-servicios-list">
          {servicios.map(function (s, i) {
            var nombre = (s.servicioId && s.servicioId.nombre) || s.nombre || 'Servicio ' + (i + 1);
            var precio = s.precioUnitario || (s.servicioId && s.servicioId.precio) || 0;
            var tipoPrecio = (s.servicioId && s.servicioId.tipoPrecio) || 'precio_fijo';
            var reqMin = (s.servicioId && s.servicioId.requisitoMinimo) || null;
            var subtotal = calcularSubtotal(s, evento.personas);

            // Etiqueta descriptiva del desglose
            var detalle = '';
            if (s.precioUnitario) {
              detalle = formatPrecio(precio) + ' × ' + (s.cantidad || 1) + ' unidad(es)';
            } else if (tipoPrecio === 'por_persona') {
              detalle = formatPrecio(precio) + ' × ' + (evento.personas || '?') + ' personas';
            } else if (tipoPrecio === 'por_pieza' || tipoPrecio === 'por_orden') {
              var minQ = reqMin ? reqMin.cantidad : 1;
              var minU = reqMin ? reqMin.unidad : 'unidad';
              detalle = formatPrecio(precio) + ' × ' + minQ + ' ' + minU;
            } else {
              detalle = 'Precio fijo';
            }

            return (
              <div key={i} className="det-servicio-item">
                <div className="det-servicio-info">
                  <span className="det-servicio-nombre">{nombre}</span>
                  <span className="det-servicio-cantidad">{detalle}</span>
                </div>
                <div className="det-servicio-precios">
                  <span className="det-servicio-subtotal">{formatPrecio(subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {totalEstimado > 0 && (
          <div className="det-total">
            <DollarSign size={18} />
            <span className="det-total-label">Total estimado:</span>
            <span className="det-total-value">{formatPrecio(totalEstimado)}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="det-actions">
        {canNegotiate && (
          <button
            className="det-action-btn det-btn-negotiate"
            onClick={function () { cambiarEstado('en_negociacion'); }}
            disabled={!!actionLoading}
          >
            <MessageCircle size={18} />
            {actionLoading === 'en_negociacion' ? 'Procesando...' : 'En negociación'}
          </button>
        )}
        {canConfirm && (
          <button
            className="det-action-btn det-btn-confirm"
            onClick={function () { cambiarEstado('confirmada'); }}
            disabled={!!actionLoading}
          >
            <CheckCircle size={18} />
            {actionLoading === 'confirmada' ? 'Confirmando...' : 'Confirmar'}
          </button>
        )}
        {canReject && (
          <button
            className="det-action-btn det-btn-reject"
            onClick={function () { cambiarEstado('rechazada'); }}
            disabled={!!actionLoading}
          >
            <XCircle size={18} />
            {actionLoading === 'rechazada' ? 'Procesando...' : 'Rechazar'}
          </button>
        )}
        {canComplete && (
          <button
            className="det-action-btn det-btn-complete"
            onClick={function () { cambiarEstado('completada'); }}
            disabled={!!actionLoading}
          >
            <CheckCircle2 size={18} />
            {actionLoading === 'completada' ? 'Procesando...' : 'Marcar completada'}
          </button>
        )}
        {canCancel && (
          <button
            className="det-action-btn det-btn-cancel"
            onClick={function () { cambiarEstado('cancelada'); }}
            disabled={!!actionLoading}
          >
            <XCircle size={18} />
            {actionLoading === 'cancelada' ? 'Procesando...' : 'Cancelar'}
          </button>
        )}
      </div>

      {/* WhatsApp link */}
      {cliente.telefono && (
        <a
          className="det-whatsapp-link"
          href={'https://wa.me/52' + cliente.telefono + '?text=' + encodeURIComponent(
            'Hola, soy del equipo Dream Day. Estoy revisando tu cotización ' + cot.codigoReferencia + '.'
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          💬 Contactar por WhatsApp
        </a>
      )}
    </div>
  );
}
