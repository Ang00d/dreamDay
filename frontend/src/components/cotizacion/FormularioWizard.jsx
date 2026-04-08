/* ============================================
   DREAM DAY — FormularioWizard
   
   Wizard de 3 pasos para solicitar cotización:
   1. Revisar servicios seleccionados
   2. Elegir fecha y hora
   3. Datos del cliente
   → Pantalla de éxito con código
   
   MEJORA: Bloquea el avance al paso 3 y el envío
   si hay servicios no disponibles en la fecha elegida.
   ============================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import carritoStorage from '../../utils/carrito';
import { showToast } from '../../utils/toast';
import frontendLogger from '../../utils/frontendLogger';
import cotizacionesService from '../../services/cotizacionesService';
import Modal from '../ui/Modal';
import PasoServicios from './PasoServicios';
import PasoFecha from './PasoFecha';
import PasoDatos from './PasoDatos';
import PantallaExito from './PantallaExito';
import './Wizard.css';

var PASOS = [
  { numero: 1, label: 'Servicios' },
  { numero: 2, label: 'Fecha' },
  { numero: 3, label: 'Datos' }
];

function FormularioWizard() {
  var navigate = useNavigate();
  var [pasoActual, setPasoActual] = useState(1);
  var [enviando, setEnviando] = useState(false);
  var [respuestaExito, setRespuestaExito] = useState(null);

  // Avisos de disponibilidad recibidos del PasoFecha
  var [avisosDisponibilidad, setAvisosDisponibilidad] = useState([]);
  // Modal de bloqueo cuando intentan avanzar con servicios no disponibles
  var [modalBloqueo, setModalBloqueo] = useState(false);

  // Estado del formulario completo
  var [formData, setFormData] = useState({
    // Paso 1: Servicios (se carga del carrito)
    servicios: carritoStorage.obtener().map(function (item) {
      return {
        servicioId: item.id,
        nombre: item.nombre,
        categoria: item.categoria || '',
        descripcionCorta: item.descripcionCorta || '',
        cantidad: (item.tipoPrecio === 'precio_fijo' || item.tipoPrecio === 'por_persona') ? 1 : (item.requisitoMinimo && item.requisitoMinimo.cantidad ? item.requisitoMinimo.cantidad : 1),
        tipoPrecio: item.tipoPrecio || 'precio_fijo',
        requisitoMinimo: item.requisitoMinimo || { cantidad: 1, unidad: 'unidad' }
      };
    }),
    // Paso 2: Fecha
    fecha: '',
    horaInicio: '12:00',
    personas: 50,
    // Paso 3: Datos
    nombre: '',
    email: '',
    telefono: '',
    ubicacion: '',
    codigoPostal: '',
    notas: ''
  });

  // Actualizar un campo del formulario
  function updateField(campo, valor) {
    setFormData(function (prev) {
      var updated = Object.assign({}, prev);
      updated[campo] = valor;
      return updated;
    });
  }

  // Actualizar la cantidad de un servicio
  function updateServicioCantidad(servicioId, cantidad) {
    setFormData(function (prev) {
      var updated = Object.assign({}, prev);
      updated.servicios = prev.servicios.map(function (s) {
        if (s.servicioId === servicioId) {
          return Object.assign({}, s, { cantidad: cantidad });
        }
        return s;
      });
      return updated;
    });
  }

  // Eliminar un servicio de la lista
  function removeServicio(servicioId) {
    setFormData(function (prev) {
      var updated = Object.assign({}, prev);
      updated.servicios = prev.servicios.filter(function (s) {
        return s.servicioId !== servicioId;
      });
      return updated;
    });
    carritoStorage.eliminar(servicioId);
    window.dispatchEvent(new Event('carritoActualizado'));

    // Limpiar el aviso del servicio eliminado
    setAvisosDisponibilidad(function (prev) {
      return prev.filter(function (a) { return a.servicioId !== servicioId; });
    });
  }

  // Recibir avisos de disponibilidad del PasoFecha
  function handleAvisosChange(nuevosAvisos) {
    setAvisosDisponibilidad(nuevosAvisos);
  }

  // Validar el paso actual antes de avanzar
  function validarPaso() {
    if (pasoActual === 1) {
      if (formData.servicios.length === 0) {
        showToast('Agrega al menos un servicio', 'error');
        return false;
      }
      for (var i = 0; i < formData.servicios.length; i++) {
        var s = formData.servicios[i];
        if (!s.cantidad || s.cantidad < 1) {
          showToast('La cantidad de "' + s.nombre + '" debe ser mayor a 0', 'error');
          return false;
        }
      }
      return true;
    }

    if (pasoActual === 2) {
      if (!formData.fecha) {
        showToast('Selecciona una fecha para el evento', 'error');
        return false;
      }
      var hoy = new Date().toISOString().split('T')[0];
      if (formData.fecha < hoy) {
        showToast('La fecha no puede ser en el pasado', 'error');
        return false;
      }
      if (!formData.horaInicio) {
        showToast('Selecciona una hora de inicio', 'error');
        return false;
      }
      if (!formData.personas || formData.personas < 1) {
        showToast('Indica la cantidad de personas', 'error');
        return false;
      }
      // Verificar mínimo de personas
      var minReq = 1;
      formData.servicios.forEach(function (s) {
        if (s.requisitoMinimo && s.requisitoMinimo.unidad === 'personas') {
          var req = parseInt(s.requisitoMinimo.cantidad) || 1;
          if (req > minReq) minReq = req;
        }
      });
      if (formData.personas < minReq) {
        showToast('Se requieren mínimo ' + minReq + ' personas para los servicios seleccionados', 'error');
        return false;
      }

      // ★ BLOQUEAR si hay servicios no disponibles
      if (avisosDisponibilidad.length > 0) {
        setModalBloqueo(true);
        return false;
      }

      return true;
    }

    if (pasoActual === 3) {
      if (!formData.nombre || formData.nombre.trim().length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return false;
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showToast('Ingresa un email válido', 'error');
        return false;
      }
      if (!formData.telefono || !/^\d{10}$/.test(formData.telefono)) {
        showToast('El teléfono debe tener 10 dígitos', 'error');
        return false;
      }
      if (!formData.ubicacion || formData.ubicacion.trim().length < 5) {
        showToast('La ubicación debe tener al menos 5 caracteres', 'error');
        return false;
      }
      if (!formData.codigoPostal || !/^\d{5}$/.test(formData.codigoPostal)) {
        showToast('El código postal debe tener 5 dígitos', 'error');
        return false;
      }
      return true;
    }

    return true;
  }

  // Avanzar al siguiente paso
  function siguiente() {
    if (validarPaso()) {
      setPasoActual(function (prev) { return prev + 1; });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      frontendLogger.info('Wizard: avance al paso ' + (pasoActual + 1));
    }
  }

  // Retroceder al paso anterior
  function anterior() {
    setPasoActual(function (prev) { return prev - 1; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Enviar la cotización al backend
  async function enviarCotizacion() {
    if (!validarPaso()) return;

    // Doble verificación: no enviar si hay servicios no disponibles
    if (avisosDisponibilidad.length > 0) {
      setModalBloqueo(true);
      return;
    }

    try {
      setEnviando(true);

      var datos = {
        cliente: {
          nombre: formData.nombre.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim()
        },
        evento: {
          fecha: formData.fecha,
          horaInicio: formData.horaInicio,
          personas: parseInt(formData.personas),
          ubicacion: formData.ubicacion.trim(),
          codigoPostal: formData.codigoPostal.trim(),
          notas: formData.notas.trim()
        },
        servicios: formData.servicios.map(function (s) {
          return {
            servicioId: s.servicioId,
            cantidad: parseInt(s.cantidad),
            notas: ''
          };
        })
      };

      var respuesta = await cotizacionesService.crear(datos);

      // Limpiar carrito
      carritoStorage.limpiar();
      window.dispatchEvent(new Event('carritoActualizado'));

      setRespuestaExito(respuesta);
      setPasoActual(4);

      frontendLogger.info('Cotización enviada exitosamente', {
        codigo: respuesta.codigoReferencia,
        servicios: datos.servicios.length
      });

    } catch (err) {
      var mensaje = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Error al enviar la cotización. Intenta de nuevo.';
      showToast(mensaje, 'error', 5000);
      frontendLogger.error('Error enviando cotización', { message: err.message });
    } finally {
      setEnviando(false);
    }
  }

  // Si ya se envió, mostrar pantalla de éxito
  if (pasoActual === 4 && respuestaExito) {
    return (
      <div className="wizard">
        <div className="wizard-container">
          <PantallaExito
            respuesta={respuestaExito}
            onNueva={function () {
              navigate('/');
            }}
          />
        </div>
      </div>
    );
  }

  // Determinar si el botón siguiente debe estar deshabilitado
  var siguienteDeshabilitado = false;
  if (pasoActual === 2 && avisosDisponibilidad.length > 0) {
    siguienteDeshabilitado = true;
  }

  return (
    <div className="wizard">
      <div className="wizard-container">
        {/* Titulo */}
        <div className="wizard-title">
          <h1>Solicitar Cotización</h1>
          <p>Completa los 3 pasos para enviarnos tu solicitud</p>
        </div>

        {/* Indicador de pasos */}
        <div className="wizard-steps">
          {PASOS.map(function (paso) {
            var estado = '';
            if (paso.numero < pasoActual) estado = 'completed';
            else if (paso.numero === pasoActual) estado = 'active';

            return (
              <div key={paso.numero} className={'wizard-step ' + estado}>
                <div className="wizard-step-circle">
                  {paso.numero < pasoActual ? '✓' : paso.numero}
                </div>
                <span className="wizard-step-label">{paso.label}</span>
              </div>
            );
          })}
        </div>

        {/* Contenido del paso */}
        <div className="wizard-content">
          {pasoActual === 1 && (
            <PasoServicios
              servicios={formData.servicios}
              onUpdateCantidad={updateServicioCantidad}
              onRemove={removeServicio}
              onIrACatalogo={function () { navigate('/'); }}
            />
          )}

          {pasoActual === 2 && (
            <PasoFecha
              fecha={formData.fecha}
              horaInicio={formData.horaInicio}
              personas={formData.personas}
              servicios={formData.servicios}
              onUpdate={updateField}
              onAvisosChange={handleAvisosChange}
            />
          )}

          {pasoActual === 3 && (
            <PasoDatos
              nombre={formData.nombre}
              email={formData.email}
              telefono={formData.telefono}
              ubicacion={formData.ubicacion}
              codigoPostal={formData.codigoPostal}
              notas={formData.notas}
              onUpdate={updateField}
            />
          )}
        </div>

        {/* Navegación */}
        <div className="wizard-nav">
          {pasoActual > 1 ? (
            <button className="btn-anterior" onClick={anterior}>
              ← Anterior
            </button>
          ) : (
            <div></div>
          )}

          {pasoActual < 3 ? (
            <button
              className={'btn-siguiente' + (siguienteDeshabilitado ? ' btn-bloqueado' : '')}
              onClick={siguienteDeshabilitado ? function () { setModalBloqueo(true); } : siguiente}
              style={siguienteDeshabilitado ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {siguienteDeshabilitado ? '⚠️ Servicios no disponibles' : 'Siguiente →'}
            </button>
          ) : (
            <button
              className="btn-siguiente btn-enviar"
              onClick={enviarCotizacion}
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : '✓ Enviar Cotización'}
            </button>
          )}
        </div>
      </div>

      {/* ══════════ MODAL DE BLOQUEO ══════════ */}
      <Modal
        abierto={modalBloqueo}
        onCerrar={function () { setModalBloqueo(false); }}
        titulo="No puedes continuar"
        tipo="alerta"
      >
        <p>
          No es posible enviar tu cotización porque los siguientes servicios
          <strong> no están disponibles</strong> en la fecha seleccionada:
        </p>

        {avisosDisponibilidad.map(function (a) {
          return (
            <div key={a.nombre} className="modal-servicio-item">
              <span>🚫</span>
              <div>
                <strong>{a.nombre}</strong>
                <br />
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {a.estado === 'ocupado'
                    ? 'Ya tiene una reserva confirmada'
                    : 'Bloqueado por el administrador'}
                </span>
              </div>
            </div>
          );
        })}

        <p style={{ marginTop: '1rem' }}>
          Para continuar puedes:
        </p>
        <ul>
          <li><strong>Cambiar la fecha</strong> del evento</li>
          <li><strong>Eliminar los servicios</strong> no disponibles (paso 1)</li>
        </ul>

        <div className="modal-botones">
          <button
            className="modal-btn modal-btn-secundario"
            onClick={function () {
              setModalBloqueo(false);
              setPasoActual(1);
            }}
          >
            Ir al paso 1
          </button>
          <button
            className="modal-btn modal-btn-primario"
            onClick={function () { setModalBloqueo(false); }}
          >
            Cambiar fecha
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default FormularioWizard;
