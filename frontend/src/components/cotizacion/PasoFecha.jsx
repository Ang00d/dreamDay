/* ============================================
   DREAM DAY — Paso 2: Fecha y Hora
   
   ACTUALIZADO: Calendario visual inteligente
   reemplaza el input date. Muestra colores 🟢🟡🔴
   basados en disponibilidad de los servicios del
   carrito. Respeta anticipación mínima por categoría.
   ============================================ */
import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import Modal from '../ui/Modal';
import CalendarioWizard from './CalendarioWizard';

function PasoFecha({ fecha, horaInicio, personas, servicios, onUpdate, onAvisosChange }) {
  var [avisos, setAvisos] = useState([]);
  var [consultando, setConsultando] = useState(false);
  var [modalAbierto, setModalAbierto] = useState(false);

  // Helper: sumar/restar horas a un string HH:mm
  function sumarHorasHelper(horaStr, horas) {
    if (!horaStr) return '--:--';
    var partes = horaStr.split(':');
    var h = parseInt(partes[0]);
    var m = parseInt(partes[1]) || 0;
    if (isNaN(h)) return '--:--';
    var totalMin = h * 60 + m + Math.round(horas * 60);
    if (totalMin < 0) totalMin = 0;
    var nh = Math.floor(totalMin / 60);
    var nm = totalMin % 60;
    return String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0');
  }

  // Calcular mínimo de personas requerido por los servicios del carrito
  var minPersonas = 1;
  if (servicios && servicios.length > 0) {
    servicios.forEach(function (s) {
      if (s.requisitoMinimo && s.requisitoMinimo.unidad === 'personas') {
        var req = parseInt(s.requisitoMinimo.cantidad) || 1;
        if (req > minPersonas) minPersonas = req;
      }
    });
  }

  // ★ Calcular la anticipación máxima requerida por los servicios del carrito
  var anticipacionInfo = useMemo(function () {
    var maxDias = 1;
    var categoriasConAnticipacion = [];

    if (servicios && servicios.length > 0) {
      servicios.forEach(function (s) {
        var dias = s.categoriaAnticipacion || 0;
        if (dias > 0) {
          var yaIncluida = categoriasConAnticipacion.find(function (c) {
            return c.nombre === s.categoria;
          });
          if (!yaIncluida) {
            categoriasConAnticipacion.push({ nombre: s.categoria, dias: dias });
          }
          if (dias > maxDias) maxDias = dias;
        }
      });
    }

    var hoy = new Date();
    hoy.setDate(hoy.getDate() + Math.max(maxDias, 1));
    var fechaMin = hoy.toISOString().split('T')[0];

    return {
      maxDias: maxDias,
      fechaMinima: fechaMin,
      categorias: categoriasConAnticipacion
    };
  }, [servicios]);

  // ★ IDs de servicios para el calendario
  var serviciosIds = useMemo(function () {
    if (!servicios || servicios.length === 0) return [];
    return servicios.map(function (s) { return s.servicioId; });
  }, [servicios]);

  // Generar opciones de hora (9:00 a 18:00)
  var horas = [];
  for (var h = 9; h <= 18; h++) {
    var hora = String(h).padStart(2, '0') + ':00';
    horas.push(hora);
    if (h < 18) {
      horas.push(String(h).padStart(2, '0') + ':30');
    }
  }

  // ★ Verificar si la fecha seleccionada cumple la anticipación
  var avisoAnticipacion = useMemo(function () {
    if (!fecha || anticipacionInfo.categorias.length === 0) return null;

    var fechaEvento = new Date(fecha + 'T12:00:00');
    var ahora = new Date();
    var diffMs = fechaEvento.getTime() - ahora.getTime();
    var diasDisponibles = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    var violaciones = [];
    anticipacionInfo.categorias.forEach(function (cat) {
      if (diasDisponibles < cat.dias) {
        violaciones.push(cat);
      }
    });

    if (violaciones.length === 0) return null;
    return { violaciones: violaciones, diasDisponibles: diasDisponibles };
  }, [fecha, anticipacionInfo]);

  // Consultar disponibilidad cuando cambia la fecha
  useEffect(function () {
    if (!fecha || !servicios || servicios.length === 0) {
      setAvisos([]);
      if (onAvisosChange) onAvisosChange([]);
      return;
    }

    var cancelado = false;
    setConsultando(true);

    async function verificar() {
      var nuevosAvisos = [];
      for (var i = 0; i < servicios.length; i++) {
        var s = servicios[i];
        try {
          var res = await api.get('/disponibilidad/servicio/' + s.servicioId + '?fecha=' + fecha);
          var data = res.data.data || res.data;
          if (!data.disponible) {
            nuevosAvisos.push({
              nombre: s.nombre,
              estado: data.estado,
              servicioId: s.servicioId
            });
          }
        } catch (err) {
          // Si falla la consulta, no mostrar aviso
        }
      }
      if (!cancelado) {
        setAvisos(nuevosAvisos);
        setConsultando(false);
        if (onAvisosChange) onAvisosChange(nuevosAvisos);
        if (nuevosAvisos.length > 0) {
          setModalAbierto(true);
        }
      }
    }

    verificar();
    return function () { cancelado = true; };
  }, [fecha, servicios]);

  // ★ Handler para cuando se selecciona un día en el calendario
  function handleFechaSeleccionada(nuevaFecha) {
    onUpdate('fecha', nuevaFecha);
  }

  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.3rem',
        color: 'var(--texto-oscuro)',
        marginBottom: '1.5rem'
      }}>
        ¿Cuándo es tu evento?
      </h3>

      {/* ★ Aviso de anticipación mínima */}
      {anticipacionInfo.categorias.length > 0 && (
        <div style={{
          background: '#FFF8E7',
          border: '1.5px solid #E8D5C4',
          padding: '0.9rem 1.2rem',
          borderRadius: '10px',
          marginBottom: '1.2rem',
          fontSize: '0.85rem',
          color: '#8b7355'
        }}>
          <strong style={{ color: '#6B5B3E' }}>📅 Anticipación requerida:</strong>
          <span style={{ marginLeft: '0.3rem' }}>
            {anticipacionInfo.categorias.map(function (cat, idx) {
              return (idx > 0 ? ', ' : '') + cat.nombre + ' (' + cat.dias + ' días)';
            })}
          </span>
          <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.8rem', color: '#a89270' }}>
            La fecha más próxima disponible es el{' '}
            <strong>
              {new Date(anticipacionInfo.fechaMinima + 'T12:00:00').toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </strong>
          </span>
        </div>
      )}

      {/* ★ CALENDARIO VISUAL — reemplaza el input date */}
      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: '600',
          fontSize: '0.9rem',
          color: 'var(--texto-oscuro)'
        }}>
          Selecciona la fecha del evento *
        </label>
        <CalendarioWizard
          fechaSeleccionada={fecha}
          fechaMinima={anticipacionInfo.fechaMinima}
          serviciosIds={serviciosIds}
          onSeleccionar={handleFechaSeleccionada}
        />
        {fecha && (
          <div style={{
            marginTop: '0.6rem',
            padding: '0.6rem 1rem',
            background: 'var(--cafe-muy-claro)',
            borderRadius: '8px',
            fontSize: '0.88rem',
            color: 'var(--texto-oscuro)',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            📌 Fecha seleccionada:{' '}
            <strong>
              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </strong>
          </div>
        )}
      </div>

      <div className="paso-fecha-grid">
        {/* Hora */}
        <div className="form-field">
          <label>Hora de inicio *</label>
          <select
            value={horaInicio}
            onChange={function (e) { onUpdate('horaInicio', e.target.value); }}
          >
            {horas.map(function (h) {
              return (
                <option key={h} value={h}>{h} hrs</option>
              );
            })}
          </select>
        </div>
        {/* Personas */}
        <div className="form-field">
          <label>Número de personas *</label>
          <input
            type="number"
            min={minPersonas}
            max="1000"
            value={personas}
            onChange={function (e) {
              var val = parseInt(e.target.value) || minPersonas;
              if (val < minPersonas) val = minPersonas;
              onUpdate('personas', val);
            }}
          />
          <span className="field-hint">
            {minPersonas > 1
              ? 'Mínimo ' + minPersonas + ' personas (requerido por tus servicios)'
              : 'Aproximado de invitados'}
          </span>
        </div>
      </div>

      {/* ★ PREVIEW DE HORARIOS DE ENTREGA/RECOLECCIÓN */}
      {fecha && horaInicio && servicios && servicios.length > 0 && (
        <div style={{
          marginTop: '1.2rem',
          background: '#fff',
          border: '1.5px solid var(--cafe-suave, #E8D5C4)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.7rem 1rem',
            background: 'var(--cafe-muy-claro, #FDF9F5)',
            borderBottom: '1px solid var(--cafe-suave, #E8D5C4)',
            fontWeight: '600',
            fontSize: '0.85rem',
            color: 'var(--texto-oscuro, #2c1810)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            🚚 Horarios de entrega y recolección
          </div>
          <div style={{ padding: '0' }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 65px 65px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.68rem',
              fontWeight: '700',
              color: 'var(--texto-medio, #8b7355)',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              borderBottom: '1px solid var(--cafe-muy-claro, #F5EDE6)'
            }}>
              <span>Servicio</span>
              <span style={{ textAlign: 'center' }}>Entrega</span>
              <span style={{ textAlign: 'center' }}>Recoger</span>
            </div>
            {/* Filas */}
            {servicios.map(function (s, idx) {
              var cat = (s.categoria || '').toLowerCase();
              var necesitaMontaje = cat === 'comida' || cat === 'bebidas';
              var dur = s.duracionHoras || 2;
              var entrega = necesitaMontaje
                ? sumarHorasHelper(horaInicio, -1)
                : horaInicio;
              var recoger = sumarHorasHelper(horaInicio, dur);

              return (
                <div key={s.servicioId} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 65px 65px',
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.82rem',
                  color: 'var(--texto-oscuro, #2c1810)',
                  borderBottom: idx < servicios.length - 1 ? '1px solid var(--cafe-muy-claro, #F5EDE6)' : 'none',
                  background: idx % 2 === 0 ? 'transparent' : 'var(--cafe-muy-claro, #FDF9F5)'
                }}>
                  <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {s.nombre}
                    {necesitaMontaje && (
                      <span style={{
                        fontSize: '0.58rem',
                        background: 'rgba(230,126,34,0.12)',
                        color: '#e67e22',
                        padding: '0.05rem 0.3rem',
                        borderRadius: '3px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>montaje</span>
                    )}
                  </span>
                  <span style={{
                    textAlign: 'center',
                    fontWeight: necesitaMontaje ? '700' : '500',
                    color: necesitaMontaje ? '#e67e22' : 'var(--texto-oscuro, #2c1810)'
                  }}>
                    {entrega}
                  </span>
                  <span style={{ textAlign: 'center', fontWeight: '500' }}>
                    {recoger}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{
            padding: '0.45rem 0.8rem',
            fontSize: '0.68rem',
            color: 'var(--texto-medio, #8b7355)',
            background: 'var(--cafe-muy-claro, #FDF9F5)',
            borderTop: '1px solid var(--cafe-suave, #E8D5C4)'
          }}>
            <span style={{ color: '#e67e22', fontWeight: '700' }}>*</span> Comida y Bebidas se entregan 1h antes para montaje
          </div>
        </div>
      )}

      {/* Indicador de verificación */}
      {consultando && fecha && (
        <div style={{
          background: '#FFF8E7',
          border: '1px solid #E8D5C4',
          padding: '0.8rem 1.2rem',
          borderRadius: '10px',
          marginTop: '1.2rem',
          fontSize: '0.85rem',
          color: '#8b7355'
        }}>
          Verificando disponibilidad de servicios...
        </div>
      )}

      {/* ★ Aviso de anticipación insuficiente */}
      {avisoAnticipacion && !consultando && (
        <div style={{
          background: '#FFF5E6',
          border: '2px solid #E8A838',
          padding: '1rem 1.2rem',
          borderRadius: '10px',
          marginTop: '1.2rem',
          fontSize: '0.88rem',
          color: '#7A5A00'
        }}>
          <strong>⏰ Anticipación insuficiente para esta fecha:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
            {avisoAnticipacion.violaciones.map(function (v) {
              return (
                <li key={v.nombre} style={{ marginBottom: '0.3rem' }}>
                  <strong>{v.nombre}</strong> — requiere {v.dias} días de anticipación
                  (solo tienes {avisoAnticipacion.diasDisponibles})
                </li>
              );
            })}
          </ul>
          <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#8B6914', fontWeight: '600' }}>
            Elige una fecha a partir del{' '}
            {new Date(anticipacionInfo.fechaMinima + 'T12:00:00').toLocaleDateString('es-MX', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
      )}

      {/* Aviso: servicios NO disponibles */}
      {avisos.length > 0 && !consultando && (
        <div style={{
          background: '#FFF0F0',
          border: '2px solid #E88',
          padding: '1rem 1.2rem',
          borderRadius: '10px',
          marginTop: '1.2rem',
          fontSize: '0.88rem',
          color: '#8B3A3A'
        }}>
          <strong>⚠️ {avisos.length} servicio(s) no disponible(s) para esta fecha:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
            {avisos.map(function (a) {
              return (
                <li key={a.nombre} style={{ marginBottom: '0.3rem' }}>
                  <strong>{a.nombre}</strong>
                  {a.estado === 'ocupado'
                    ? ' — ya tiene una reserva confirmada ese día'
                    : ' — bloqueado por administrador'}
                </li>
              );
            })}
          </ul>
          <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#c0392b', fontWeight: '600' }}>
            No podrás enviar la cotización hasta que elijas una fecha donde todos los servicios estén disponibles, o elimines los servicios no disponibles.
          </p>
          <button
            onClick={function () { setModalAbierto(true); }}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: '600'
            }}
          >
            Ver detalles
          </button>
        </div>
      )}

      {/* Todo disponible ✅ */}
      {avisos.length === 0 && !avisoAnticipacion && !consultando && fecha && (
        <div style={{
          background: '#F0FFF4',
          border: '1.5px solid #A8D5BA',
          padding: '0.8rem 1.2rem',
          borderRadius: '10px',
          marginTop: '1.2rem',
          fontSize: '0.85rem',
          color: '#2D6A4F'
        }}>
          ✅ Todos tus servicios están disponibles para esta fecha
        </div>
      )}

      <div style={{
        background: 'var(--cafe-muy-claro)',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        marginTop: '1.2rem',
        fontSize: '0.9rem',
        color: 'var(--texto-medio)'
      }}>
        <strong style={{ color: 'var(--texto-oscuro)' }}>💡 Nota:</strong> La fecha y hora son
        una solicitud. Confirmaremos la disponibilidad y te contactaremos por WhatsApp para
        finalizar los detalles.
      </div>

      {/* ══════════ MODAL DE ALERTA ══════════ */}
      <Modal
        abierto={modalAbierto}
        onCerrar={function () { setModalAbierto(false); }}
        titulo="Servicios no disponibles"
        tipo="alerta"
      >
        <p>
          Los siguientes servicios <strong>no están disponibles</strong> para la fecha seleccionada
          (<strong>{fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</strong>):
        </p>

        {avisos.map(function (a) {
          return (
            <div key={a.nombre} className="modal-servicio-item">
              <span>🚫</span>
              <div>
                <strong>{a.nombre}</strong>
                <br />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {a.estado === 'ocupado'
                    ? 'Ya tiene una reserva confirmada ese día'
                    : 'Bloqueado por el administrador'}
                </span>
              </div>
            </div>
          );
        })}

        <p style={{ marginTop: '1rem', fontWeight: '500' }}>
          Para continuar tienes dos opciones:
        </p>
        <ul>
          <li><strong>Elegir otra fecha</strong> donde todos estén disponibles</li>
          <li><strong>Eliminar los servicios</strong> no disponibles de tu cotización (en el paso 1)</li>
        </ul>

        <div className="modal-botones">
          <button
            className="modal-btn modal-btn-primario"
            onClick={function () { setModalAbierto(false); }}
          >
            Entendido, elegiré otra fecha
          </button>
        </div>
      </Modal>
    </div>
  );
}
export default PasoFecha;
