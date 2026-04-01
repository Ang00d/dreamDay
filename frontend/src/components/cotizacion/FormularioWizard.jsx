/* ============================================
   DREAM DAY — FormularioWizard
   
   Wizard de 3 pasos para solicitar cotizacion:
   1. Revisar servicios seleccionados
   2. Elegir fecha y hora
   3. Datos del cliente
   → Pantalla de exito con codigo
   ============================================ */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import carritoStorage from '../../utils/carrito';
import { showToast } from '../../utils/toast';
import frontendLogger from '../../utils/frontendLogger';
import cotizacionesService from '../../services/cotizacionesService';
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

  // Estado del formulario completo
  var [formData, setFormData] = useState({
    // Paso 1: Servicios (se carga del carrito)
    servicios: carritoStorage.obtener().map(function (item) {
      return {
        servicioId: item.id,
        nombre: item.nombre,
        categoria: item.categoria || '',
        descripcionCorta: item.descripcionCorta || '',
        cantidad: 1,
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
  }

  // Validar el paso actual antes de avanzar
  function validarPaso() {
    if (pasoActual === 1) {
      if (formData.servicios.length === 0) {
        showToast('Agrega al menos un servicio', 'error');
        return false;
      }
      // Verificar cantidades
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
      // Verificar que no sea fecha pasada
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
      // Verificar mínimo de personas requerido por los servicios
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
      return true;
    }

    if (pasoActual === 3) {
      if (!formData.nombre || formData.nombre.trim().length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return false;
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showToast('Ingresa un email valido', 'error');
        return false;
      }
      if (!formData.telefono || !/^\d{10}$/.test(formData.telefono)) {
        showToast('El telefono debe tener 10 digitos', 'error');
        return false;
      }
      if (!formData.ubicacion || formData.ubicacion.trim().length < 5) {
        showToast('La ubicacion debe tener al menos 5 caracteres', 'error');
        return false;
      }
      if (!formData.codigoPostal || !/^\d{5}$/.test(formData.codigoPostal)) {
        showToast('El codigo postal debe tener 5 digitos', 'error');
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

  // Enviar la cotizacion al backend
  async function enviarCotizacion() {
    if (!validarPaso()) return;

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
      setPasoActual(4); // Pantalla de exito

      frontendLogger.info('Cotizacion enviada exitosamente', {
        codigo: respuesta.codigoReferencia,
        servicios: datos.servicios.length
      });

    } catch (err) {
      var mensaje = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Error al enviar la cotizacion. Intenta de nuevo.';
      showToast(mensaje, 'error', 5000);
      frontendLogger.error('Error enviando cotizacion', { message: err.message });
    } finally {
      setEnviando(false);
    }
  }

  // Si ya se envio, mostrar pantalla de exito
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

        {/* Navegacion */}
        <div className="wizard-nav">
          {pasoActual > 1 ? (
            <button className="btn-anterior" onClick={anterior}>
              ← Anterior
            </button>
          ) : (
            <div></div>
          )}

          {pasoActual < 3 ? (
            <button className="btn-siguiente" onClick={siguiente}>
              Siguiente →
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
    </div>
  );
}

export default FormularioWizard;
