import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import api from '../../services/api';
import frontendLogger from '../../utils/frontendLogger';
import { showToast } from '../../utils/toast';
import {
  Calendar,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './DisponibilidadAdminPage.css';

var DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
var MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function DisponibilidadAdminPage() {
  var hoy = new Date();
  var [anio, setAnio] = useState(hoy.getFullYear());
  var [mes, setMes] = useState(hoy.getMonth() + 1);
  var [servicios, setServicios] = useState([]);
  var [servicioSeleccionado, setServicioSeleccionado] = useState('');
  var [calendario, setCalendario] = useState([]);
  var [bloqueos, setBloqueos] = useState([]);
  var [loading, setLoading] = useState(false);
  var [loadingServicios, setLoadingServicios] = useState(true);
  var [diaSeleccionado, setDiaSeleccionado] = useState(null);
  var [motivo, setMotivo] = useState('');
  var [actionLoading, setActionLoading] = useState(false);

  // Cargar servicios
  useEffect(function () {
    var cargar = async function () {
      try {
        var res = await adminService.getServicios();
        var lista = res.data.data || res.data.servicios || res.data || [];
        setServicios(Array.isArray(lista) ? lista : []);
        if (lista.length > 0) {
          setServicioSeleccionado(lista[0]._id);
        }
      } catch (err) {
        frontendLogger.error('Error cargando servicios admin', { error: err.message });
      } finally {
        setLoadingServicios(false);
      }
    };
    cargar();
  }, []);

  // Cargar calendario cuando cambia mes
  useEffect(function () {
    cargarCalendario();
  }, [anio, mes, servicioSeleccionado]);

  var cargarCalendario = async function () {
    setLoading(true);
    try {
      // Usar endpoint público para obtener calendario del mes
      var res = await api.get('/disponibilidad/mes?anio=' + anio + '&mes=' + mes);
      var data = res.data.data || res.data;
      setCalendario(data.calendario || []);

      // También cargar bloqueos de la colección Disponibilidad
      // para el servicio seleccionado
      if (servicioSeleccionado) {
        try {
          var bloqRes = await api.get('/disponibilidad?fecha=' + anio + '-' + String(mes).padStart(2, '0') + '-01');
          setBloqueos(bloqRes.data.data || bloqRes.data || []);
        } catch (e) {
          setBloqueos([]);
        }
      }
    } catch (err) {
      frontendLogger.error('Error cargando calendario admin', { error: err.message });
      setCalendario([]);
    } finally {
      setLoading(false);
    }
  };

  var navMes = function (dir) {
    var newMes = mes + dir;
    var newAnio = anio;
    if (newMes < 1) { newMes = 12; newAnio--; }
    if (newMes > 12) { newMes = 1; newAnio++; }
    setMes(newMes);
    setAnio(newAnio);
    setDiaSeleccionado(null);
  };

  var bloquearFecha = async function () {
    if (!diaSeleccionado || !servicioSeleccionado) return;
    setActionLoading(true);
    try {
      await adminService.bloquearFecha({
        servicioId: servicioSeleccionado,
        fecha: diaSeleccionado,
        motivoBloqueo: motivo.trim() || 'Bloqueado por admin'
      });
      showToast('Fecha bloqueada', 'success');
      frontendLogger.info('Fecha bloqueada', { fecha: diaSeleccionado, servicioId: servicioSeleccionado });
      setMotivo('');
      setDiaSeleccionado(null);
      cargarCalendario();
    } catch (err) {
      var msg = err.response?.data?.error || 'Error al bloquear fecha';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  var desbloquearFecha = async function (dispoId) {
    if (!window.confirm('¿Desbloquear esta fecha?')) return;
    setActionLoading(true);
    try {
      await adminService.desbloquearFecha(dispoId);
      showToast('Fecha desbloqueada', 'success');
      frontendLogger.info('Fecha desbloqueada', { dispoId: dispoId });
      setDiaSeleccionado(null);
      cargarCalendario();
    } catch (err) {
      var msg = err.response?.data?.error || 'Error al desbloquear';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Generar días del calendario
  var primerDia = new Date(anio, mes - 1, 1);
  var ultimoDia = new Date(anio, mes, 0);
  var diasEnMes = ultimoDia.getDate();
  var diaInicioSemana = primerDia.getDay();

  var celdas = [];
  for (var i = 0; i < diaInicioSemana; i++) {
    celdas.push(null);
  }
  for (var d = 1; d <= diasEnMes; d++) {
    celdas.push(d);
  }

  var getInfoDia = function (dia) {
    if (!dia) return { estado: 'vacio', color: '' };
    var fechaStr = anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');

    var fechaDia = new Date(anio, mes - 1, dia);
    var hoyDate = new Date();
    hoyDate.setHours(0, 0, 0, 0);
    if (fechaDia < hoyDate) return { estado: 'pasado', color: '' };

    // Buscar en el calendario público
    var calDia = calendario.find(function (c) { return c.dia === dia; });
    if (!calDia) return { estado: 'disponible', color: 'verde' };

    // Buscar bloqueos específicos del servicio
    var bloqueo = bloqueos.find(function (b) {
      return b.fecha === fechaStr && String(b.servicioId) === String(servicioSeleccionado);
    });

    if (bloqueo) {
      return { 
        estado: bloqueo.estado === 'bloqueado_admin' ? 'bloqueado' : bloqueo.estado,
        color: bloqueo.estado === 'bloqueado_admin' ? 'bloqueado' : 'rojo',
        id: bloqueo._id
      };
    }

    return {
      estado: calDia.color === 'rojo' ? 'ocupado' : calDia.color === 'amarillo' ? 'parcial' : 'disponible',
      color: calDia.color
    };
  };

  var esHoy = function (dia) {
    return dia === hoy.getDate() && mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();
  };

  return (
    <div className="dispo-admin-page">
      <div className="dispo-admin-header">
        <h1 className="dispo-admin-title">Disponibilidad</h1>
        <p className="dispo-admin-subtitle">Bloquea o desbloquea fechas por servicio</p>
      </div>

      {/* Selector de servicio */}
      {loadingServicios ? (
        <div className="dispo-admin-loading-small">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="dispo-admin-selector">
          <label className="dispo-admin-label">Servicio:</label>
          <select
            className="dispo-admin-select"
            value={servicioSeleccionado}
            onChange={function (e) { setServicioSeleccionado(e.target.value); setDiaSeleccionado(null); }}
          >
            {servicios.map(function (s) {
              return <option key={s._id} value={s._id}>{s.nombre}</option>;
            })}
          </select>
        </div>
      )}

      {/* Navegación mes */}
      <div className="dispo-admin-nav-mes">
        <button className="dispo-admin-nav-btn" onClick={function () { navMes(-1); }}>
          <ChevronLeft size={20} />
        </button>
        <span className="dispo-admin-mes-label">
          {MESES[mes - 1]} {anio}
        </span>
        <button className="dispo-admin-nav-btn" onClick={function () { navMes(1); }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Leyenda */}
      <div className="dispo-admin-leyenda">
        <span className="dispo-admin-ley-item"><span className="dispo-dot dispo-dot-disponible"></span> Disponible</span>
        <span className="dispo-admin-ley-item"><span className="dispo-dot dispo-dot-ocupado"></span> Ocupado</span>
        <span className="dispo-admin-ley-item"><span className="dispo-dot dispo-dot-bloqueado"></span> Bloqueado</span>
      </div>

      {/* Calendario */}
      {loading ? (
        <div className="dispo-admin-loading">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : (
        <div className="dispo-admin-calendar">
          <div className="dispo-admin-weekdays">
            {DIAS_SEMANA.map(function (d) {
              return <div key={d} className="dispo-admin-weekday">{d}</div>;
            })}
          </div>
          <div className="dispo-admin-grid">
            {celdas.map(function (dia, idx) {
              if (dia === null) return <div key={'e-' + idx} className="dispo-admin-cell dispo-admin-empty"></div>;

              var info = getInfoDia(dia);
              var fechaStr = anio + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
              var isSelected = diaSeleccionado === fechaStr;

              var cellClass = 'dispo-admin-cell';
              if (info.estado === 'pasado') cellClass += ' dispo-admin-pasado';
              else if (info.estado === 'bloqueado') cellClass += ' dispo-admin-bloqueado';
              else if (info.estado === 'ocupado') cellClass += ' dispo-admin-ocupado';
              else if (info.estado === 'parcial') cellClass += ' dispo-admin-pendiente';
              else cellClass += ' dispo-admin-disponible';

              if (esHoy(dia)) cellClass += ' dispo-admin-hoy';
              if (isSelected) cellClass += ' dispo-admin-selected';

              return (
                <button
                  key={dia}
                  className={cellClass}
                  onClick={function () {
                    if (info.estado !== 'pasado') {
                      setDiaSeleccionado(isSelected ? null : fechaStr);
                    }
                  }}
                  disabled={info.estado === 'pasado'}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Panel de acción para día seleccionado */}
      {diaSeleccionado && (function () {
        var dia = parseInt(diaSeleccionado.split('-')[2]);
        var info = getInfoDia(dia);

        return (
          <div className="dispo-admin-action-panel">
            <h3 className="dispo-admin-action-title">
              <Calendar size={18} />
              {new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-MX', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </h3>

            {info.estado === 'bloqueado' && info.id ? (
              <div className="dispo-admin-action-content">
                <p className="dispo-admin-estado-text">
                  🔒 Esta fecha está <strong>bloqueada</strong>
                </p>
                <button
                  className="dispo-admin-action-btn dispo-admin-btn-unblock"
                  onClick={function () { desbloquearFecha(info.id); }}
                  disabled={actionLoading}
                >
                  <Unlock size={18} />
                  {actionLoading ? 'Desbloqueando...' : 'Desbloquear fecha'}
                </button>
              </div>
            ) : info.estado === 'ocupado' ? (
              <div className="dispo-admin-action-content">
                <p className="dispo-admin-estado-text">
                  🔴 Esta fecha está <strong>ocupada</strong> por una cita confirmada
                </p>
              </div>
            ) : (
              <div className="dispo-admin-action-content">
                <p className="dispo-admin-estado-text">
                  {'🟢 Fecha ' + (info.estado === 'parcial' ? 'parcialmente disponible' : 'disponible')}
                </p>
                <div className="dispo-admin-motivo-field">
                  <label className="dispo-admin-label">Motivo (opcional):</label>
                  <input
                    type="text"
                    className="dispo-admin-motivo-input"
                    placeholder="Ej: Mantenimiento, vacaciones..."
                    value={motivo}
                    onChange={function (e) { setMotivo(e.target.value); }}
                  />
                </div>
                <button
                  className="dispo-admin-action-btn dispo-admin-btn-block"
                  onClick={bloquearFecha}
                  disabled={actionLoading}
                >
                  <Lock size={18} />
                  {actionLoading ? 'Bloqueando...' : 'Bloquear fecha'}
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
