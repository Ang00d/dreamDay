/* ============================================
   DREAM DAY — Admin: Gestión de Servicios (CRUD completo)
   
   - Listar servicios agrupados por categoría
   - Crear nuevo servicio (form completo)
   - Editar cualquier campo (form completo)
   - Desactivar con advertencia si hay cotizaciones pendientes
   - Editar capacidad inline (rápido)
   
   Mobile-first.
   ============================================ */

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import categoriasService from '../../services/categoriasService';
import { showToast } from '../../utils/toast';
import frontendLogger from '../../utils/frontendLogger';
import Modal from '../../components/ui/Modal';
import {
  Package,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Check,
  X,
  Edit2,
  Power,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import './ServiciosPage.css';

var TIPOS_PRECIO = [
  { value: 'por_persona', label: 'Por persona' },
  { value: 'por_pieza', label: 'Por pieza' },
  { value: 'por_orden', label: 'Por orden' },
  { value: 'por_juego', label: 'Por juego' },
  { value: 'precio_fijo', label: 'Precio fijo' }
];

var UNIDADES_SUGERIDAS = ['personas', 'piezas', 'ordenes', 'unidad', 'cocteles', 'tacos', 'paletas', 'vasos', 'garrafas', 'hora', 'dia'];

function ServiciosPage() {
  var [servicios, setServicios] = useState([]);
  var [categorias, setCategorias] = useState([]);
  var [cargando, setCargando] = useState(true);
  var [categoriaAbierta, setCategoriaAbierta] = useState(null);

  // Edición inline (capacidad + activo rápido)
  var [editandoInline, setEditandoInline] = useState({});
  var [guardandoInline, setGuardandoInline] = useState(null);

  // Modal de formulario completo (crear/editar)
  var [modalForm, setModalForm] = useState(false);
  var [modoEdicion, setModoEdicion] = useState(false);
  var [servicioActual, setServicioActual] = useState(null);
  var [guardandoForm, setGuardandoForm] = useState(false);
  var [formData, setFormData] = useState(formDataInicial());

  // Modal de confirmación desactivar
  var [modalDesactivar, setModalDesactivar] = useState(false);
  var [servicioADesactivar, setServicioADesactivar] = useState(null);
  var [dependenciasServicio, setDependenciasServicio] = useState(null);

  function formDataInicial() {
    return {
      nombre: '',
      descripcion: '',
      descripcionCorta: '',
      categoria: '',
      tipoPrecio: 'por_persona',
      precio: '',
      requisitoMinimoCantidad: 1,
      requisitoMinimoUnidad: 'personas',
      duracionHoras: 2,
      incluye: '',
      notas: '',
      contenido: '',
      tipoDisponibilidad: 'unica',
      capacidadDiaria: 1,
      orden: 0,
      activo: true
    };
  }

  useEffect(function () {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      var [serviciosRes, categoriasData] = await Promise.all([
        adminService.getServicios(),
        categoriasService.obtenerTodas()
      ]);
      var lista = serviciosRes.data.data;
      setServicios(lista);
      setCategorias(categoriasData);

      if (lista.length > 0 && lista[0].categoria) {
        setCategoriaAbierta(lista[0].categoria._id);
      }
    } catch (err) {
      showToast('Error al cargar datos', 'error');
      frontendLogger.error('Error cargando servicios/categorías', { message: err.message });
    } finally {
      setCargando(false);
    }
  }

  function agruparPorCategoria(lista) {
    var grupos = {};
    lista.forEach(function (s) {
      var catId = s.categoria ? s.categoria._id : 'sin_categoria';
      var catNombre = s.categoria ? s.categoria.nombre : 'Sin categoría';
      var catIcono = s.categoria ? s.categoria.icono : '📦';
      if (!grupos[catId]) {
        grupos[catId] = { id: catId, nombre: catNombre, icono: catIcono, servicios: [] };
      }
      grupos[catId].servicios.push(s);
    });
    return Object.values(grupos);
  }

  // ═══ EDICIÓN INLINE (capacidad + activo) ═══

  function iniciarEdicionInline(servicio) {
    setEditandoInline(function (prev) {
      var nuevo = Object.assign({}, prev);
      nuevo[servicio._id] = {
        capacidadDiaria: servicio.capacidadDiaria || 1,
        activo: servicio.activo
      };
      return nuevo;
    });
  }

  function cancelarEdicionInline(servicioId) {
    setEditandoInline(function (prev) {
      var nuevo = Object.assign({}, prev);
      delete nuevo[servicioId];
      return nuevo;
    });
  }

  function cambiarCapacidad(servicioId, delta) {
    setEditandoInline(function (prev) {
      var nuevo = Object.assign({}, prev);
      var actual = nuevo[servicioId].capacidadDiaria;
      var siguiente = actual + delta;
      if (siguiente < 1) siguiente = 1;
      nuevo[servicioId] = Object.assign({}, nuevo[servicioId], { capacidadDiaria: siguiente });
      return nuevo;
    });
  }

  async function guardarInline(servicioId) {
    var datos = editandoInline[servicioId];
    if (!datos) return;
    try {
      setGuardandoInline(servicioId);
      await adminService.actualizarServicio(servicioId, {
        capacidadDiaria: datos.capacidadDiaria,
        activo: datos.activo
      });
      setServicios(function (prev) {
        return prev.map(function (s) {
          if (s._id === servicioId) {
            return Object.assign({}, s, {
              capacidadDiaria: datos.capacidadDiaria,
              activo: datos.activo
            });
          }
          return s;
        });
      });
      cancelarEdicionInline(servicioId);
      showToast('Cambios rápidos guardados', 'success');
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error : 'Error al guardar cambios';
      showToast(msg, 'error');
    } finally {
      setGuardandoInline(null);
    }
  }

  // ═══ MODAL FORMULARIO (CREAR / EDITAR COMPLETO) ═══

  function abrirModalCrear() {
    if (categorias.length === 0) {
      showToast('Primero crea al menos una categoría', 'error');
      return;
    }
    setModoEdicion(false);
    setServicioActual(null);
    var init = formDataInicial();
    init.categoria = categorias[0]._id;
    setFormData(init);
    setModalForm(true);
  }

  function abrirModalEditar(servicio) {
    setModoEdicion(true);
    setServicioActual(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      descripcionCorta: servicio.descripcionCorta,
      categoria: servicio.categoria ? servicio.categoria._id : '',
      tipoPrecio: servicio.tipoPrecio,
      precio: servicio.precio !== undefined ? servicio.precio : '',
      requisitoMinimoCantidad: servicio.requisitoMinimo ? servicio.requisitoMinimo.cantidad : 1,
      requisitoMinimoUnidad: servicio.requisitoMinimo ? servicio.requisitoMinimo.unidad : 'personas',
      duracionHoras: servicio.duracionHoras || 2,
      incluye: Array.isArray(servicio.incluye) ? servicio.incluye.join('\n') : '',
      notas: servicio.notas || '',
      contenido: servicio.contenido || '',
      tipoDisponibilidad: servicio.tipoDisponibilidad || 'unica',
      capacidadDiaria: servicio.capacidadDiaria || 1,
      orden: servicio.orden || 0,
      activo: servicio.activo
    });
    setModalForm(true);
  }

  function cerrarModalForm() {
    setModalForm(false);
    setServicioActual(null);
  }

  function handleFormChange(campo, valor) {
    setFormData(function (prev) {
      var up = Object.assign({}, prev);
      up[campo] = valor;
      return up;
    });
  }

  async function guardarFormulario() {
    // Validaciones cliente
    if (!formData.nombre || formData.nombre.trim().length < 3) {
      showToast('El nombre debe tener al menos 3 caracteres', 'error');
      return;
    }
    if (!formData.descripcion || formData.descripcion.trim().length < 10) {
      showToast('La descripción debe tener al menos 10 caracteres', 'error');
      return;
    }
    if (!formData.descripcionCorta || formData.descripcionCorta.trim().length < 5) {
      showToast('La descripción corta debe tener al menos 5 caracteres', 'error');
      return;
    }
    if (formData.descripcionCorta.length > 80) {
      showToast('La descripción corta no puede exceder 80 caracteres', 'error');
      return;
    }
    if (!formData.categoria) {
      showToast('Selecciona una categoría', 'error');
      return;
    }
    var precioNum = parseFloat(formData.precio);
    if (isNaN(precioNum) || precioNum < 0) {
      showToast('Ingresa un precio válido', 'error');
      return;
    }

    // Preparar payload
    var payload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      descripcionCorta: formData.descripcionCorta.trim(),
      categoria: formData.categoria,
      tipoPrecio: formData.tipoPrecio,
      precio: precioNum,
      requisitoMinimo: {
        cantidad: parseInt(formData.requisitoMinimoCantidad) || 1,
        unidad: formData.requisitoMinimoUnidad.trim()
      },
      duracionHoras: parseFloat(formData.duracionHoras),
      incluye: formData.incluye.split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return x; }),
      notas: formData.notas.trim(),
      contenido: formData.contenido ? formData.contenido.trim() : '',
      tipoDisponibilidad: formData.tipoDisponibilidad,
      capacidadDiaria: parseInt(formData.capacidadDiaria) || 1,
      orden: parseInt(formData.orden) || 0,
      activo: formData.activo
    };

    try {
      setGuardandoForm(true);
      if (modoEdicion) {
        await adminService.actualizarServicio(servicioActual._id, payload);
        showToast('Servicio actualizado', 'success');
        frontendLogger.info('Servicio actualizado', { id: servicioActual._id });
      } else {
        await adminService.crearServicio(payload);
        showToast('Servicio creado', 'success');
        frontendLogger.info('Servicio creado', { nombre: payload.nombre });
      }
      cerrarModalForm();
      cargarDatos();
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error : 'Error al guardar';
      showToast(msg, 'error', 5000);
      frontendLogger.error('Error guardando servicio', { message: err.message });
    } finally {
      setGuardandoForm(false);
    }
  }

  // ═══ DESACTIVAR / REACTIVAR ═══

  async function toggleActivo(servicio) {
    if (servicio.activo) {
      // Intentar desactivar
      try {
        await adminService.eliminarServicio(servicio._id);
        showToast('Servicio desactivado', 'success');
        cargarDatos();
      } catch (err) {
        if (err.response && err.response.status === 409) {
          setServicioADesactivar(servicio);
          setDependenciasServicio(err.response.data);
          setModalDesactivar(true);
        } else {
          showToast('Error al desactivar', 'error');
        }
      }
    } else {
      // Reactivar
      try {
        await adminService.actualizarServicio(servicio._id, { activo: true });
        showToast('Servicio activado', 'success');
        cargarDatos();
      } catch (err) {
        showToast('Error al activar', 'error');
      }
    }
  }

  async function confirmarDesactivacion() {
    if (!servicioADesactivar) return;
    try {
      await adminService.eliminarServicio(servicioADesactivar._id, true);
      showToast('Servicio desactivado (forzado)', 'success');
      setModalDesactivar(false);
      setServicioADesactivar(null);
      setDependenciasServicio(null);
      cargarDatos();
    } catch (err) {
      showToast('Error al desactivar', 'error');
    }
  }

  // ═══ RENDER ═══

  if (cargando) {
    return (
      <div className="servicios-loading">
        <div className="servicios-loading-spinner"></div>
        <p>Cargando servicios...</p>
      </div>
    );
  }

  var grupos = agruparPorCategoria(servicios);

  return (
    <div className="servicios-admin">
      <div className="servicios-header">
        <div>
          <h1>Gestión de Servicios</h1>
          <p>{servicios.length} servicios en {grupos.length} categorías</p>
        </div>
        <button className="btn-crear-servicio" onClick={abrirModalCrear}>
          <PlusCircle size={18} />
          <span>Nuevo servicio</span>
        </button>
      </div>

      {servicios.length === 0 ? (
        <div className="servicios-vacio">
          <Package size={48} />
          <p>No hay servicios creados aún.</p>
          <button className="btn-crear-servicio" onClick={abrirModalCrear}>
            <PlusCircle size={18} /> Crear primer servicio
          </button>
        </div>
      ) : (
        <div className="servicios-grupos">
          {grupos.map(function (grupo) {
            var abierto = categoriaAbierta === grupo.id;
            var activos = grupo.servicios.filter(function (s) { return s.activo; }).length;

            return (
              <div key={grupo.id} className="servicios-grupo">
                <button
                  className="grupo-header"
                  onClick={function () {
                    setCategoriaAbierta(abierto ? null : grupo.id);
                  }}
                >
                  <div className="grupo-header-left">
                    <span className="grupo-icono">{grupo.icono}</span>
                    <div>
                      <span className="grupo-nombre">{grupo.nombre}</span>
                      <span className="grupo-conteo">{activos}/{grupo.servicios.length} activos</span>
                    </div>
                  </div>
                  {abierto ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {abierto && (
                  <div className="grupo-servicios">
                    {grupo.servicios.map(function (servicio) {
                      var enEdicionInline = !!editandoInline[servicio._id];
                      var datosInline = editandoInline[servicio._id] || {};
                      var estaGuardando = guardandoInline === servicio._id;

                      return (
                        <div
                          key={servicio._id}
                          className={'servicio-fila' + (enEdicionInline ? ' editando' : '') + (!servicio.activo ? ' inactivo' : '')}
                        >
                          <div className="servicio-fila-info">
                            <Package size={18} className="servicio-fila-icon" />
                            <div className="servicio-fila-textos">
                              <span className="servicio-fila-nombre">{servicio.nombre}</span>
                              {!servicio.activo && (
                                <span className="badge-inactivo">Inactivo</span>
                              )}
                              <span className="servicio-fila-precio">
                                ${servicio.precio} {servicio.tipoPrecio && servicio.tipoPrecio.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="servicio-fila-capacidad">
                            {enEdicionInline ? (
                              <div className="capacidad-editor">
                                <button
                                  className="cap-btn"
                                  onClick={function () { cambiarCapacidad(servicio._id, -1); }}
                                  disabled={datosInline.capacidadDiaria <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="cap-valor">{datosInline.capacidadDiaria}</span>
                                <button
                                  className="cap-btn"
                                  onClick={function () { cambiarCapacidad(servicio._id, 1); }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="cap-display">
                                Cap: {servicio.capacidadDiaria || 1}
                              </span>
                            )}
                          </div>

                          <div className="servicio-fila-estado">
                            {enEdicionInline ? (
                              <button
                                className={'toggle-activo' + (datosInline.activo ? ' activo' : ' inactivo')}
                                onClick={function () {
                                  setEditandoInline(function (prev) {
                                    var nuevo = Object.assign({}, prev);
                                    nuevo[servicio._id] = Object.assign({}, nuevo[servicio._id], {
                                      activo: !nuevo[servicio._id].activo
                                    });
                                    return nuevo;
                                  });
                                }}
                              >
                                {datosInline.activo ? 'Activo' : 'Inactivo'}
                              </button>
                            ) : (
                              <span className={'estado-label' + (servicio.activo ? ' activo' : ' inactivo')}>
                                {servicio.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            )}
                          </div>

                          <div className="servicio-fila-acciones">
                            {enEdicionInline ? (
                              <>
                                <button
                                  className="btn-guardar"
                                  onClick={function () { guardarInline(servicio._id); }}
                                  disabled={estaGuardando}
                                  title="Guardar"
                                >
                                  {estaGuardando ? '...' : <Check size={16} />}
                                </button>
                                <button
                                  className="btn-cancelar-edicion"
                                  onClick={function () { cancelarEdicionInline(servicio._id); }}
                                  disabled={estaGuardando}
                                  title="Cancelar"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn-editar-rapido"
                                  onClick={function () { iniciarEdicionInline(servicio); }}
                                  title="Editar capacidad/estado"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn-editar-completo"
                                  onClick={function () { abrirModalEditar(servicio); }}
                                  title="Editar completo"
                                >
                                  Editar
                                </button>
                                <button
                                  className={'btn-toggle ' + (servicio.activo ? 'btn-desactivar-servicio' : 'btn-activar-servicio')}
                                  onClick={function () { toggleActivo(servicio); }}
                                  title={servicio.activo ? 'Desactivar' : 'Activar'}
                                >
                                  <Power size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ MODAL FORMULARIO ══════════ */}
      <Modal
        abierto={modalForm}
        onCerrar={cerrarModalForm}
        titulo={modoEdicion ? 'Editar servicio' : 'Nuevo servicio'}
        tipo="info"
      >
        <div className="serv-form">
          <div className="serv-form-field">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={function (e) { handleFormChange('nombre', e.target.value); }}
              placeholder="Ej. Buffet de Mariscos"
              maxLength={80}
            />
          </div>

          <div className="serv-form-field">
            <label>Descripción corta * ({formData.descripcionCorta.length}/80)</label>
            <input
              type="text"
              value={formData.descripcionCorta}
              onChange={function (e) { handleFormChange('descripcionCorta', e.target.value); }}
              placeholder="Resumen breve que se muestra en la tarjeta"
              maxLength={80}
            />
          </div>

          <div className="serv-form-field">
            <label>Descripción completa *</label>
            <textarea
              rows="3"
              value={formData.descripcion}
              onChange={function (e) { handleFormChange('descripcion', e.target.value); }}
              placeholder="Descripción detallada del servicio..."
            />
          </div>

          <div className="serv-form-row">
            <div className="serv-form-field">
              <label>Categoría *</label>
              <select
                value={formData.categoria}
                onChange={function (e) { handleFormChange('categoria', e.target.value); }}
              >
                {categorias.map(function (cat) {
                  return (
                    <option key={cat._id} value={cat._id}>
                      {cat.icono} {cat.nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="serv-form-field">
              <label>Tipo de precio *</label>
              <select
                value={formData.tipoPrecio}
                onChange={function (e) { handleFormChange('tipoPrecio', e.target.value); }}
              >
                {TIPOS_PRECIO.map(function (t) {
                  return <option key={t.value} value={t.value}>{t.label}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="serv-form-row">
            <div className="serv-form-field">
              <label>Precio (MXN) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={function (e) { handleFormChange('precio', e.target.value); }}
                placeholder="150"
              />
              <span className="field-hint">Solo visible para admin</span>
            </div>

            <div className="serv-form-field">
              <label>Duración (horas) *</label>
              <input
                type="number"
                min="0.5"
                max="48"
                step="0.5"
                value={formData.duracionHoras}
                onChange={function (e) { handleFormChange('duracionHoras', e.target.value); }}
              />
            </div>
          </div>

          <div className="serv-form-row">
            <div className="serv-form-field">
              <label>Mínimo cantidad *</label>
              <input
                type="number"
                min="1"
                value={formData.requisitoMinimoCantidad}
                onChange={function (e) { handleFormChange('requisitoMinimoCantidad', e.target.value); }}
              />
            </div>

            <div className="serv-form-field">
              <label>Unidad *</label>
              <input
                type="text"
                list="unidades-sugeridas"
                value={formData.requisitoMinimoUnidad}
                onChange={function (e) { handleFormChange('requisitoMinimoUnidad', e.target.value); }}
                placeholder="personas"
              />
              <datalist id="unidades-sugeridas">
                {UNIDADES_SUGERIDAS.map(function (u) {
                  return <option key={u} value={u} />;
                })}
              </datalist>
            </div>
          </div>

          <div className="serv-form-field">
            <label>Qué incluye</label>
            <textarea
              rows="3"
              value={formData.incluye}
              onChange={function (e) { handleFormChange('incluye', e.target.value); }}
              placeholder="Un elemento por línea&#10;Tortillas&#10;Salsas&#10;Servicio"
            />
            <span className="field-hint">Un elemento por línea</span>
          </div>

          <div className="serv-form-row">
            <div className="serv-form-field">
              <label>Capacidad diaria</label>
              <input
                type="number"
                min="1"
                value={formData.capacidadDiaria}
                onChange={function (e) { handleFormChange('capacidadDiaria', e.target.value); }}
              />
              <span className="field-hint">Eventos simultáneos/día</span>
            </div>

            <div className="serv-form-field">
              <label>Orden</label>
              <input
                type="number"
                min="0"
                value={formData.orden}
                onChange={function (e) { handleFormChange('orden', e.target.value); }}
              />
            </div>
          </div>

          <div className="serv-form-field">
            <label>Notas internas (opcional)</label>
            <input
              type="text"
              value={formData.notas}
              onChange={function (e) { handleFormChange('notas', e.target.value); }}
              placeholder="Notas para el equipo"
            />
          </div>

          <div className="serv-form-field">
            <label>Contenido logístico</label>
            <textarea
              rows="3"
              value={formData.contenido || ''}
              onChange={function (e) { handleFormChange('contenido', e.target.value); }}
              placeholder={"Qué llevar al evento:\n2 mesas buffet\n3 chafers, platos, cubiertos..."}
            />
            <span className="field-hint">Equipo/material a cargar al camión. Se muestra en la Orden del Día.</span>
          </div>

          <div className="serv-form-actions">
            <button
              className="btn-cancelar"
              onClick={cerrarModalForm}
              disabled={guardandoForm}
            >
              Cancelar
            </button>
            <button
              className="btn-guardar-form"
              onClick={guardarFormulario}
              disabled={guardandoForm}
            >
              {guardandoForm ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear servicio')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════ MODAL CONFIRMAR DESACTIVACIÓN ══════════ */}
      <Modal
        abierto={modalDesactivar}
        onCerrar={function () {
          setModalDesactivar(false);
          setServicioADesactivar(null);
          setDependenciasServicio(null);
        }}
        titulo="¿Desactivar servicio?"
        tipo="alerta"
      >
        {servicioADesactivar && dependenciasServicio && (
          <div>
            <p>
              El servicio <strong>{servicioADesactivar.nombre}</strong> tiene
              dependencias activas:
            </p>
            <ul className="dependencias-lista">
              {dependenciasServicio.cotizacionesActivas > 0 && (
                <li>
                  <strong>{dependenciasServicio.cotizacionesActivas}</strong> cotización(es)
                  pendiente(s) o en negociación
                </li>
              )}
              {dependenciasServicio.confirmacionesFuturas > 0 && (
                <li>
                  <strong>{dependenciasServicio.confirmacionesFuturas}</strong> confirmación(es)
                  de eventos futuros
                </li>
              )}
            </ul>
            <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: '#8B3A3A' }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Si desactivas el servicio, dejará de aparecer en el catálogo público.
              Las cotizaciones y confirmaciones existentes no se verán afectadas.
            </p>

            <div className="modal-botones">
              <button
                className="modal-btn modal-btn-secundario"
                onClick={function () {
                  setModalDesactivar(false);
                  setServicioADesactivar(null);
                  setDependenciasServicio(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="modal-btn modal-btn-primario"
                onClick={confirmarDesactivacion}
                style={{ background: '#e74c3c' }}
              >
                Sí, desactivar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ServiciosPage;
