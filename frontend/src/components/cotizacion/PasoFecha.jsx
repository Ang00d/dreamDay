/* ============================================
   DREAM DAY — Paso 2: Fecha y Hora
   
   El usuario elige fecha, hora y personas.
   Consulta disponibilidad de cada servicio
   y muestra avisos si alguno ya esta ocupado.
   ============================================ */
import { useState, useEffect } from 'react';
import api from '../../services/api';

function PasoFecha({ fecha, horaInicio, personas, servicios, onUpdate, onAvisosChange, onConsultandoChange }) {
  var [avisos, setAvisos] = useState([]);
  var [consultando, setConsultando] = useState(false);

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

  // Fecha minima: manana
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
              estado: data.estado
            });
          }
        } catch (err) {
          // Si falla la consulta, no mostrar aviso
        }
      }
      if (!cancelado) {
        setAvisos(nuevosAvisos);
        setConsultando(false);
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

      {/* Avisos de disponibilidad */}
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

      {avisos.length > 0 && !consultando && (
        <div style={{
          background: '#FFF0F0',
          border: '1.5px solid #E88',
          padding: '1rem 1.2rem',
          borderRadius: '10px',
          marginTop: '1.2rem',
          fontSize: '0.88rem',
          color: '#8B3A3A'
        }}>
          <strong>⚠️ Servicios no disponibles para esta fecha:</strong>
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
          <p style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#666' }}>
            Puedes elegir otra fecha o continuar sin esos servicios. Si envías la cotización,
            el admin no podrá confirmarla hasta que haya disponibilidad.
          </p>
        </div>
      )}

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
    </div>
  );
}
export default PasoFecha;
