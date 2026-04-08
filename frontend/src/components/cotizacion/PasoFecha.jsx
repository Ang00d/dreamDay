/* ============================================
   DREAM DAY — Paso 2: Fecha y Hora
   
   El usuario elige fecha, hora y personas.
   Consulta disponibilidad de cada servicio
   y muestra un MODAL si alguno ya está ocupado.
   Comunica los avisos al FormularioWizard para
   bloquear el envío si hay servicios no disponibles.
   ============================================ */
import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../ui/Modal';

function PasoFecha({ fecha, horaInicio, personas, servicios, onUpdate, onAvisosChange }) {
  var [avisos, setAvisos] = useState([]);
  var [consultando, setConsultando] = useState(false);
  var [modalAbierto, setModalAbierto] = useState(false);

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

  // Fecha minima: mañana
  var hoy = new Date();
  hoy.setDate(hoy.getDate() + 1);
  var fechaMinima = hoy.toISOString().split('T')[0];

  // Generar opciones de hora (9:00 a 18:00)
  var horas = [];
  for (var h = 9; h <= 18; h++) {
    var hora = String(h).padStart(2, '0') + ':00';
    horas.push(hora);
    if (h < 18) {
      horas.push(String(h).padStart(2, '0') + ':30');
    }
  }

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
        // Comunicar al padre
        if (onAvisosChange) onAvisosChange(nuevosAvisos);
        // Mostrar modal automáticamente si hay servicios no disponibles
        if (nuevosAvisos.length > 0) {
          setModalAbierto(true);
        }
      }
    }

    verificar();

    return function () { cancelado = true; };
  }, [fecha, servicios]);

  function handleFechaChange(e) {
    onUpdate('fecha', e.target.value);
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
      <div className="paso-fecha-grid">
        {/* Fecha */}
        <div className="form-field">
          <label>Fecha del evento *</label>
          <input
            type="date"
            value={fecha}
            min={fechaMinima}
            onChange={handleFechaChange}
          />
          <span className="field-hint">Selecciona la fecha de tu evento</span>
        </div>
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
          <span className="field-hint">Horario disponible: 9:00 - 18:00</span>
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
          Verificando disponibilidad...
        </div>
      )}

      {/* Aviso inline: servicios NO disponibles */}
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

      {/* Aviso inline: todo disponible */}
      {avisos.length === 0 && !consultando && fecha && (
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
