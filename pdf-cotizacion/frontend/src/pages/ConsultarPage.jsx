/* ============================================
   DREAM DAY — Consultar Cotización por Código
   Página pública: /mi-cotizacion
   ============================================ */
import { useState } from 'react';
import api from '../services/api';
import frontendLogger from '../utils/frontendLogger';
import {
  Search,
  Calendar,
  Clock,
  Users,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  XCircle,
  HelpCircle,
  Download
} from 'lucide-react';
import { generarPdfCotizacion } from '../utils/generarPdfCotizacion';
import './ConsultarPage.css';

var ESTADOS_INFO = {
  pendiente: {
    icon: <Clock size={28} />,
    label: 'Pendiente',
    color: '#f39c12',
    mensaje: 'Tu cotización ha sido recibida y está en espera de revisión. Te contactaremos pronto por WhatsApp.'
  },
  en_negociacion: {
    icon: <MessageCircle size={28} />,
    label: 'En negociación',
    color: '#3498db',
    mensaje: 'Nuestro equipo está revisando tu solicitud. Te contactaremos por WhatsApp para acordar los detalles y precios.'
  },
  confirmada: {
    icon: <CheckCircle size={28} />,
    label: 'Confirmada',
    color: '#27ae60',
    mensaje: '¡Tu evento está confirmado! Los servicios han sido reservados para tu fecha. Si tienes dudas, contáctanos por WhatsApp.'
  },
  rechazada: {
    icon: <XCircle size={28} />,
    label: 'Rechazada',
    color: '#c0392b',
    mensaje: 'Lamentablemente no pudimos aceptar esta solicitud. Puedes contactarnos por WhatsApp para más información o crear una nueva cotización.'
  },
  cancelada: {
    icon: <XCircle size={28} />,
    label: 'Cancelada',
    color: '#7f8c8d',
    mensaje: 'Esta cotización fue cancelada. Si necesitas algo, no dudes en crear una nueva solicitud.'
  },
  conflicto: {
    icon: <AlertCircle size={28} />,
    label: 'En revisión',
    color: '#8e44ad',
    mensaje: 'Algunos servicios de tu cotización pueden tener conflictos de disponibilidad. Te contactaremos por WhatsApp para ofrecerte alternativas.'
  }
};

function ConsultarPage() {
  var [codigo, setCodigo] = useState('');
  var [cotizacion, setCotizacion] = useState(null);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [buscado, setBuscado] = useState(false);

  var handleBuscar = async function (e) {
    e.preventDefault();
    var codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio) {
      setError('Ingresa tu código de cotización');
      return;
    }

    if (!/^DD\d{4}-[A-Z0-9]{4}$/.test(codigoLimpio)) {
      setError('El formato debe ser DD2603-XXXX');
      return;
    }

    setLoading(true);
    setError('');
    setCotizacion(null);
    setBuscado(true);

    try {
      var res = await api.get('/cotizaciones/consultar/' + codigoLimpio);
      // API devuelve: { data: { codigoReferencia, estado, evento, servicios } }
      var data = res.data.data || res.data;
      setCotizacion(data);
      frontendLogger.info('Cotización consultada', { codigo: codigoLimpio });
    } catch (err) {
      var msg = err.response?.data?.error || 'Cotización no encontrada';
      setError(msg);
      frontendLogger.warn('Consulta cotización fallida', { codigo: codigoLimpio });
    } finally {
      setLoading(false);
    }
  };

  var handleLimpiar = function () {
    setCodigo('');
    setCotizacion(null);
    setError('');
    setBuscado(false);
  };

  var formatFecha = function (fecha) {
    if (!fecha) return '—';
    try {
      return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) { return fecha; }
  };

  var estadoInfo = cotizacion ? (ESTADOS_INFO[cotizacion.estado] || ESTADOS_INFO.pendiente) : null;
  var evento = cotizacion?.evento || {};
  var servicios = cotizacion?.servicios || [];

  return (
    <div className="consultar-page">
      <div className="consultar-container">
        {/* Header */}
        <div className="consultar-header">
          <span className="consultar-brand">Dream Day</span>
          <h1 className="consultar-title">Consulta tu Cotización</h1>
          <p className="consultar-subtitle">
            Ingresa el código que recibiste al generar tu solicitud
          </p>
        </div>

        {/* Search form */}
        <form className="consultar-form" onSubmit={handleBuscar}>
          <div className="consultar-input-wrapper">
            <Search size={20} className="consultar-input-icon" />
            <input
              type="text"
              className="consultar-input"
              placeholder="DD2603-XXXX"
              value={codigo}
              onChange={function (e) {
                setCodigo(e.target.value.toUpperCase());
                setError('');
              }}
              maxLength={11}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="consultar-submit"
            disabled={loading || !codigo.trim()}
          >
            {loading ? (
              <span className="consultar-spinner"></span>
            ) : (
              'Buscar'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="consultar-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {cotizacion && estadoInfo && (
          <div className="consultar-result">
            {/* Estado */}
            <div className="consultar-estado-card" style={{ borderLeftColor: estadoInfo.color }}>
              <div className="consultar-estado-header">
                <div className="consultar-estado-icon" style={{ color: estadoInfo.color }}>
                  {estadoInfo.icon}
                </div>
                <div className="consultar-estado-info">
                  <span className="consultar-estado-codigo">{cotizacion.codigoReferencia}</span>
                  <span className="consultar-estado-label" style={{ color: estadoInfo.color }}>
                    {estadoInfo.label}
                  </span>
                </div>
              </div>
              <p className="consultar-estado-msg">{estadoInfo.mensaje}</p>
            </div>

            {/* Detalles del evento */}
            <div className="consultar-detalles-card">
              <h3 className="consultar-card-title">Detalles del evento</h3>
              <div className="consultar-detalles-grid">
                <div className="consultar-detalle-item">
                  <Calendar size={16} />
                  <span>{formatFecha(evento.fecha)}</span>
                </div>
                <div className="consultar-detalle-item">
                  <Clock size={16} />
                  <span>{evento.horaInicio || evento.hora || '—'}</span>
                </div>
                {evento.personas && (
                  <div className="consultar-detalle-item">
                    <Users size={16} />
                    <span>{evento.personas} personas</span>
                  </div>
                )}
                {evento.ubicacion && (
                  <div className="consultar-detalle-item">
                    <MapPin size={16} />
                    <span>{evento.ubicacion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Servicios */}
            {servicios.length > 0 && (
              <div className="consultar-detalles-card">
                <h3 className="consultar-card-title">Servicios solicitados</h3>
                <div className="consultar-servicios-list">
                  {servicios.map(function (s, i) {
                    var nombre = s.nombre || s.servicioId?.nombre || 'Servicio ' + (i + 1);
                    return (
                      <div key={i} className="consultar-servicio-item">
                        <Package size={14} />
                        <span className="consultar-servicio-nombre">{nombre}</span>
                        {s.cantidad && (
                          <span className="consultar-servicio-cant">{'×' + s.cantidad}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Descargar PDF */}
            <button
              className="consultar-pdf"
              onClick={function () {
                try {
                  generarPdfCotizacion(cotizacion, 'cliente');
                } catch (err) {
                  frontendLogger.error('Error generando PDF cliente', { error: err.message });
                }
              }}
            >
              <Download size={18} />
              <span>Descargar PDF de mi solicitud</span>
            </button>

            {/* WhatsApp CTA */}
            <a
              className="consultar-whatsapp"
              href={'https://wa.me/52?text=' + encodeURIComponent(
                'Hola, tengo una cotización con código ' + cotizacion.codigoReferencia + ' y me gustaría más información.'
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Contactar por WhatsApp
            </a>

            {/* Buscar otra */}
            <button className="consultar-otra" onClick={handleLimpiar}>
              Buscar otra cotización
            </button>
          </div>
        )}

        {/* Empty state after search */}
        {buscado && !cotizacion && !loading && !error && (
          <div className="consultar-not-found">
            <HelpCircle size={48} />
            <p>No se encontró ninguna cotización con ese código</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsultarPage;
