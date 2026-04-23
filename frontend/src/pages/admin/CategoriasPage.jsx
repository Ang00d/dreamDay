/* ============================================
   DREAM DAY — Admin: Gestión de Categorías
   
   Permite crear, editar y desactivar categorías
   del catálogo. Mobile-first.
   ============================================ */

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import frontendLogger from '../../utils/frontendLogger';
import Modal from '../../components/ui/Modal';
import {
  Plus,
  Edit2,
  Power,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  AlertTriangle
} from 'lucide-react';
import './CategoriasPage.css';

// Iconos sugeridos para el selector
var ICONOS_SUGERIDOS = [
  '🍽', '🥂', '🍰', '🎪', '✨', '🎂', '🎉', '🎈', '🎁', '🍹',
  '🍕', '🌮', '🍔', '🥗', '☕', '🎨', '🎵', '💐', '🕯', '🪩'
];

function CategoriasPage() {
  var [categorias, setCategorias] = useState([]);
  var [cargando, setCargando] = useState(true);

  // Modal de formulario (crear/editar)
  var [modalForm, setModalForm] = useState(false);
  var [modoEdicion, setModoEdicion] = useState(false);
  var [categoriaActual, setCategoriaActual] = useState(null);
  var [guardando, setGuardando] = useState(false);

  // Estado del formulario
  var [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    icono: '✨',
    orden: 0,
    anticipacionMinimaDias: 0,
    activa: true
  });

  // Modal de confirmación para desactivar
  var [modalDesactivar, setModalDesactivar] = useState(false);
  var [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  var [dependencias, setDependencias] = useState(null);

  useEffect(function () {
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    try {
      setCargando(true);
      var res = await adminService.getCategoriasAdmin();
      setCategorias(res.data.data);
    } catch (err) {
      showToast('Error al cargar categorías', 'error');
      frontendLogger.error('Error cargando categorías', { message: err.message });
    } finally {
      setCargando(false);
    }
  }

  // Generar slug automático desde el nombre
  function generarSlug(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  function abrirModalCrear() {
    setModoEdicion(false);
    setCategoriaActual(null);
    setFormData({
      nombre: '',
      slug: '',
      icono: '✨',
      orden: categorias.length,
      anticipacionMinimaDias: 0,
      activa: true
    });
    setModalForm(true);
  }

  function abrirModalEditar(cat) {
    setModoEdicion(true);
    setCategoriaActual(cat);
    setFormData({
      nombre: cat.nombre,
      slug: cat.slug,
      icono: cat.icono || '✨',
      orden: cat.orden || 0,
      anticipacionMinimaDias: cat.anticipacionMinimaDias || 0,
      activa: cat.activa
    });
    setModalForm(true);
  }

  function cerrarModalForm() {
    setModalForm(false);
    setCategoriaActual(null);
  }

  function handleChange(campo, valor) {
    setFormData(function (prev) {
      var updated = Object.assign({}, prev);
      updated[campo] = valor;
      // Auto-generar slug al escribir nombre (solo si NO está en edición)
      if (campo === 'nombre' && !modoEdicion) {
        updated.slug = generarSlug(valor);
      }
      return updated;
    });
  }

  async function guardarCategoria() {
    // Validaciones cliente
    if (!formData.nombre || formData.nombre.trim().length < 2) {
      showToast('El nombre debe tener al menos 2 caracteres', 'error');
      return;
    }
    if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
      showToast('El slug solo puede tener minúsculas, números y guiones', 'error');
      return;
    }

    try {
      setGuardando(true);
      if (modoEdicion) {
        await adminService.actualizarCategoria(categoriaActual._id, formData);
        showToast('Categoría actualizada', 'success');
        frontendLogger.info('Categoría actualizada', { id: categoriaActual._id });
      } else {
        await adminService.crearCategoria(formData);
        showToast('Categoría creada', 'success');
        frontendLogger.info('Categoría creada', { nombre: formData.nombre });
      }
      cerrarModalForm();
      cargarCategorias();
    } catch (err) {
      var msg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Error al guardar la categoría';
      showToast(msg, 'error', 5000);
      frontendLogger.error('Error guardando categoría', { message: err.message });
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActiva(cat) {
    // Si la categoría está activa, revisar dependencias primero
    if (cat.activa) {
      // Intentar desactivar normal
      try {
        await adminService.actualizarCategoria(cat._id, { activa: false });
        showToast('Categoría desactivada', 'success');
        cargarCategorias();
      } catch (err) {
        if (err.response && err.response.status === 409) {
          // Mostrar modal de confirmación
          setCategoriaAEliminar(cat);
          setDependencias(err.response.data);
          setModalDesactivar(true);
        } else {
          var msg = err.response && err.response.data && err.response.data.error
            ? err.response.data.error
            : 'Error al desactivar';
          showToast(msg, 'error');
        }
      }
    } else {
      // Reactivar: sin advertencia
      try {
        await adminService.actualizarCategoria(cat._id, { activa: true });
        showToast('Categoría activada', 'success');
        cargarCategorias();
      } catch (err) {
        showToast('Error al activar', 'error');
      }
    }
  }

  async function confirmarDesactivacion() {
    if (!categoriaAEliminar) return;
    try {
      await adminService.actualizarCategoria(categoriaAEliminar._id, {
        activa: false,
        forzarDesactivacion: true
      });
      showToast('Categoría desactivada (forzado)', 'success');
      setModalDesactivar(false);
      setCategoriaAEliminar(null);
      setDependencias(null);
      cargarCategorias();
    } catch (err) {
      showToast('Error al desactivar', 'error');
    }
  }

  return (
    <div className="categorias-admin">
      <div className="categorias-header">
        <div>
          <h1>Categorías</h1>
          <p>Gestiona las categorías del catálogo de servicios</p>
        </div>
        <button className="btn-crear" onClick={abrirModalCrear}>
          <Plus size={18} />
          <span>Nueva categoría</span>
        </button>
      </div>

      {cargando ? (
        <div className="categorias-loading">
          <div className="categorias-loading-spinner"></div>
          <p>Cargando categorías...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className="categorias-vacio">
          <Package size={48} />
          <p>No hay categorías creadas todavía.</p>
          <button className="btn-crear" onClick={abrirModalCrear}>
            <Plus size={18} /> Crear primera categoría
          </button>
        </div>
      ) : (
        <div className="categorias-grid">
          {categorias.map(function (cat) {
            return (
              <div
                key={cat._id}
                className={'categoria-card ' + (cat.activa ? 'activa' : 'inactiva')}
              >
                <div className="categoria-card-head">
                  <span className="categoria-icono">{cat.icono || '✨'}</span>
                  <div className="categoria-info">
                    <h3>{cat.nombre}</h3>
                    <span className="categoria-slug">/{cat.slug}</span>
                  </div>
                  <span className={'categoria-estado ' + (cat.activa ? 'activa' : 'inactiva')}>
                    {cat.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="categoria-stats">
                  <div className="stat">
                    <Package size={14} />
                    <span>{cat.serviciosActivos || 0} / {cat.totalServicios || 0} servicios</span>
                  </div>
                  <div className="stat">
                    <Clock size={14} />
                    <span>
                      {cat.anticipacionMinimaDias > 0
                        ? cat.anticipacionMinimaDias + ' días anticipación'
                        : 'Sin anticipación'}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="orden-label">Orden:</span>
                    <span>{cat.orden}</span>
                  </div>
                </div>

                <div className="categoria-actions">
                  <button
                    className="btn-accion btn-editar"
                    onClick={function () { abrirModalEditar(cat); }}
                  >
                    <Edit2 size={14} />
                    <span>Editar</span>
                  </button>
                  <button
                    className={'btn-accion ' + (cat.activa ? 'btn-desactivar' : 'btn-activar')}
                    onClick={function () { toggleActiva(cat); }}
                  >
                    <Power size={14} />
                    <span>{cat.activa ? 'Desactivar' : 'Activar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ MODAL FORMULARIO ══════════ */}
      <Modal
        abierto={modalForm}
        onCerrar={cerrarModalForm}
        titulo={modoEdicion ? 'Editar categoría' : 'Nueva categoría'}
        tipo="info"
      >
        <div className="cat-form">
          <div className="cat-form-field">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={function (e) { handleChange('nombre', e.target.value); }}
              placeholder="Ej. Decoración"
              maxLength={40}
            />
          </div>

          <div className="cat-form-field">
            <label>Slug (URL) *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={function (e) { handleChange('slug', e.target.value); }}
              placeholder="decoracion"
              maxLength={40}
            />
            <span className="field-hint">
              Solo minúsculas, números y guiones. Se usa en URLs.
            </span>
          </div>

          <div className="cat-form-field">
            <label>Ícono</label>
            <div className="icono-selector">
              <input
                type="text"
                value={formData.icono}
                onChange={function (e) { handleChange('icono', e.target.value); }}
                maxLength={4}
                className="icono-input"
              />
              <div className="icono-sugerencias">
                {ICONOS_SUGERIDOS.map(function (ico) {
                  return (
                    <button
                      key={ico}
                      type="button"
                      className={'icono-chip ' + (formData.icono === ico ? 'seleccionado' : '')}
                      onClick={function () { handleChange('icono', ico); }}
                    >
                      {ico}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="cat-form-row">
            <div className="cat-form-field">
              <label>Orden</label>
              <input
                type="number"
                min="0"
                max="99"
                value={formData.orden}
                onChange={function (e) { handleChange('orden', parseInt(e.target.value) || 0); }}
              />
              <span className="field-hint">Menor número = aparece primero</span>
            </div>

            <div className="cat-form-field">
              <label>Anticipación (días)</label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.anticipacionMinimaDias}
                onChange={function (e) { handleChange('anticipacionMinimaDias', parseInt(e.target.value) || 0); }}
              />
              <span className="field-hint">Días mínimos antes del evento</span>
            </div>
          </div>

          <div className="cat-form-actions">
            <button
              className="btn-cancelar"
              onClick={cerrarModalForm}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              className="btn-guardar"
              onClick={guardarCategoria}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════ MODAL CONFIRMAR DESACTIVACIÓN ══════════ */}
      <Modal
        abierto={modalDesactivar}
        onCerrar={function () {
          setModalDesactivar(false);
          setCategoriaAEliminar(null);
          setDependencias(null);
        }}
        titulo="¿Desactivar categoría?"
        tipo="alerta"
      >
        {categoriaAEliminar && dependencias && (
          <div>
            <p>
              La categoría <strong>{categoriaAEliminar.nombre}</strong> tiene
              dependencias activas:
            </p>
            <ul className="dependencias-lista">
              {dependencias.serviciosActivos > 0 && (
                <li>
                  <strong>{dependencias.serviciosActivos}</strong> servicio(s) activo(s)
                </li>
              )}
              {dependencias.cotizacionesActivas > 0 && (
                <li>
                  <strong>{dependencias.cotizacionesActivas}</strong> cotización(es) pendiente(s) o en negociación
                </li>
              )}
            </ul>
            <p style={{ marginTop: '1rem', fontSize: '0.88rem', color: '#8B3A3A' }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Si desactivas la categoría, los servicios seguirán existiendo pero no
              se mostrarán al público. Las cotizaciones activas no se verán afectadas.
            </p>

            <div className="modal-botones">
              <button
                className="modal-btn modal-btn-secundario"
                onClick={function () {
                  setModalDesactivar(false);
                  setCategoriaAEliminar(null);
                  setDependencias(null);
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

export default CategoriasPage;
