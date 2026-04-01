/* ============================================
   DREAM DAY — Admin: Gestión de Servicios
   Permite editar capacidadDiaria y estado activo
   de cada servicio del catálogo.
   ============================================ */

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { Package, ChevronDown, ChevronUp, Minus, Plus, Check, X } from 'lucide-react';
import './ServiciosPage.css';

function ServiciosPage() {
  var [servicios, setServicios] = useState([]);
  var [cargando, setCargando] = useState(true);
  var [categoriaAbierta, setCategoriaAbierta] = useState(null);
  var [editando, setEditando] = useState({}); // { servicioId: { capacidadDiaria, activo } }
  var [guardando, setGuardando] = useState(null);

  useEffect(function () {
    cargarServicios();
  }, []);

  async function cargarServicios() {
    try {
      setCargando(true);
      var res = await adminService.getServicios();
      var lista = res.data.data;
      setServicios(lista);

      // Abrir primera categoría por defecto
      if (lista.length > 0 && lista[0].categoria) {
        setCategoriaAbierta(lista[0].categoria._id);
      }
    } catch (err) {
      showToast('Error al cargar servicios', 'error');
    } finally {
      setCargando(false);
    }
  }

  // Agrupar servicios por categoría
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

  // Iniciar edición de un servicio
  function iniciarEdicion(servicio) {
    setEditando(function (prev) {
      var nuevo = Object.assign({}, prev);
      nuevo[servicio._id] = {
        capacidadDiaria: servicio.capacidadDiaria || 1,
        activo: servicio.activo
      };
      return nuevo;
    });
  }

  // Cancelar edición
  function cancelarEdicion(servicioId) {
    setEditando(function (prev) {
      var nuevo = Object.assign({}, prev);
      delete nuevo[servicioId];
      return nuevo;
    });
  }

  // Cambiar capacidad en edición
  function cambiarCapacidad(servicioId, delta) {
    setEditando(function (prev) {
      var nuevo = Object.assign({}, prev);
      var actual = nuevo[servicioId].capacidadDiaria;
      var siguiente = actual + delta;
      if (siguiente < 1) siguiente = 1;
      nuevo[servicioId] = Object.assign({}, nuevo[servicioId], { capacidadDiaria: siguiente });
      return nuevo;
    });
  }

  // Guardar cambios
  async function guardar(servicioId) {
    var datos = editando[servicioId];
    if (!datos) return;

    try {
      setGuardando(servicioId);
      await adminService.actualizarServicio(servicioId, {
        capacidadDiaria: datos.capacidadDiaria,
        activo: datos.activo
      });

      // Actualizar lista local
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

      cancelarEdicion(servicioId);
      showToast('Servicio actualizado', 'success');
    } catch (err) {
      showToast('Error al guardar cambios', 'error');
    } finally {
      setGuardando(null);
    }
  }

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
      </div>

      <div className="servicios-grupos">
        {grupos.map(function (grupo) {
          var abierto = categoriaAbierta === grupo.id;
          var activos = grupo.servicios.filter(function (s) { return s.activo; }).length;

          return (
            <div key={grupo.id} className="servicios-grupo">
              {/* Encabezado de categoría */}
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

              {/* Lista de servicios */}
              {abierto && (
                <div className="grupo-servicios">
                  {grupo.servicios.map(function (servicio) {
                    var enEdicion = !!editando[servicio._id];
                    var datosEdicion = editando[servicio._id] || {};
                    var estaGuardando = guardando === servicio._id;

                    return (
                      <div
                        key={servicio._id}
                        className={'servicio-fila' + (enEdicion ? ' editando' : '') + (!servicio.activo ? ' inactivo' : '')}
                      >
                        {/* Ícono y nombre */}
                        <div className="servicio-fila-info">
                          <Package size={18} className="servicio-fila-icon" />
                          <div>
                            <span className="servicio-fila-nombre">{servicio.nombre}</span>
                            {!servicio.activo && (
                              <span className="badge-inactivo">Inactivo</span>
                            )}
                          </div>
                        </div>

                        {/* Capacidad */}
                        <div className="servicio-fila-capacidad">
                          {enEdicion ? (
                            <div className="capacidad-editor">
                              <button
                                className="cap-btn"
                                onClick={function () { cambiarCapacidad(servicio._id, -1); }}
                                disabled={datosEdicion.capacidadDiaria <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="cap-valor">{datosEdicion.capacidadDiaria}</span>
                              <button
                                className="cap-btn"
                                onClick={function () { cambiarCapacidad(servicio._id, 1); }}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="cap-display">
                              {servicio.capacidadDiaria || 1} {(servicio.capacidadDiaria || 1) === 1 ? 'unidad' : 'unidades'}
                            </span>
                          )}
                        </div>

                        {/* Estado activo */}
                        <div className="servicio-fila-estado">
                          {enEdicion ? (
                            <button
                              className={'toggle-activo' + (datosEdicion.activo ? ' activo' : ' inactivo')}
                              onClick={function () {
                                setEditando(function (prev) {
                                  var nuevo = Object.assign({}, prev);
                                  nuevo[servicio._id] = Object.assign({}, nuevo[servicio._id], {
                                    activo: !nuevo[servicio._id].activo
                                  });
                                  return nuevo;
                                });
                              }}
                            >
                              {datosEdicion.activo ? 'Activo' : 'Inactivo'}
                            </button>
                          ) : (
                            <span className={'estado-label' + (servicio.activo ? ' activo' : ' inactivo')}>
                              {servicio.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="servicio-fila-acciones">
                          {enEdicion ? (
                            <>
                              <button
                                className="btn-guardar"
                                onClick={function () { guardar(servicio._id); }}
                                disabled={estaGuardando}
                              >
                                {estaGuardando ? '...' : <Check size={16} />}
                              </button>
                              <button
                                className="btn-cancelar-edicion"
                                onClick={function () { cancelarEdicion(servicio._id); }}
                                disabled={estaGuardando}
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn-editar"
                              onClick={function () { iniciarEdicion(servicio); }}
                            >
                              Editar
                            </button>
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
    </div>
  );
}

export default ServiciosPage;
