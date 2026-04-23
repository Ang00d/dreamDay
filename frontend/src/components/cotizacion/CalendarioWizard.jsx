/* ============================================
   DREAM DAY — CalendarioWizard
   
   Mini calendario integrado en el wizard de cotización.
   Muestra disponibilidad filtrada por los servicios
   del carrito con colores 🟢🟡🔴.
   
   Props:
   - fechaSeleccionada: string YYYY-MM-DD
   - fechaMinima: string YYYY-MM-DD (por anticipación)
   - serviciosIds: array de IDs de servicios
   - onSeleccionar: function(fecha)
   ============================================ */

import { useState, useEffect } from 'react';
import disponibilidadService from '../../services/disponibilidadService';
import './CalendarioWizard.css';

var DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
var MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function CalendarioWizard({ fechaSeleccionada, fechaMinima, serviciosIds, onSeleccionar }) {
  // Iniciar en el mes de la fecha mínima o actual
  var fechaRef = fechaMinima ? new Date(fechaMinima + 'T12:00:00') : new Date();
  var [anio, setAnio] = useState(fechaRef.getFullYear());
  var [mes, setMes] = useState(fechaRef.getMonth() + 1);
  var [calendario, setCalendario] = useState([]);
  var [cargando, setCargando] = useState(true);

  var hoyStr = new Date().toISOString().split('T')[0];

  // Cargar datos cuando cambia mes/anio o servicios
  useEffect(function () {
    if (!serviciosIds || serviciosIds.length === 0) {
      setCalendario([]);
      setCargando(false);
      return;
    }

    var cancelado = false;
    setCargando(true);

    async function cargar() {
      try {
        var data = await disponibilidadService.obtenerMesCarrito(anio, mes, serviciosIds);
        if (!cancelado) {
          setCalendario(data.calendario);
        }
      } catch (err) {
        // Si falla, generar calendario sin colores (todo verde)
        if (!cancelado) {
          var mesStr = String(mes).padStart(2, '0');
          var diasEnMes = new Date(anio, mes, 0).getDate();
          var cal = [];
          for (var d = 1; d <= diasEnMes; d++) {
            cal.push({
              fecha: anio + '-' + mesStr + '-' + String(d).padStart(2, '0'),
              dia: d,
              color: 'verde',
              ocupados: 0
            });
          }
          setCalendario(cal);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return function () { cancelado = true; };
  }, [anio, mes, serviciosIds]);

  // Navegación
  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  }

  function mesSiguiente() {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  }

  // No permitir navegar antes del mes actual
  var hoy = new Date();
  var esMesActualOMenor = anio === hoy.getFullYear() && mes <= hoy.getMonth() + 1;

  // Primer día del mes (para espacios vacíos)
  var primerDia = new Date(anio, mes - 1, 1).getDay();

  function handleDiaClick(dia) {
    // No seleccionar fechas pasadas o antes de la mínima
    if (dia.fecha < hoyStr) return;
    if (fechaMinima && dia.fecha < fechaMinima) return;
    onSeleccionar(dia.fecha);
  }

  return (
    <div className="cal-wizard">
      {/* Navegación del mes */}
      <div className="cal-wizard-nav">
        <button
          type="button"
          onClick={mesAnterior}
          disabled={esMesActualOMenor}
          className="cal-wizard-nav-btn"
          style={esMesActualOMenor ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
        >
          ‹
        </button>
        <span className="cal-wizard-mes">{MESES[mes - 1]} {anio}</span>
        <button
          type="button"
          onClick={mesSiguiente}
          className="cal-wizard-nav-btn"
        >
          ›
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
          <p style={{ color: 'var(--texto-medio)', marginTop: '0.5rem', fontSize: '0.8rem' }}>
            Cargando disponibilidad...
          </p>
        </div>
      ) : (
        <>
          {/* Header días de la semana */}
          <div className="cal-wizard-header">
            {DIAS_SEMANA.map(function (nombre) {
              return (
                <div key={nombre} className="cal-wizard-dia-nombre">
                  {nombre}
                </div>
              );
            })}
          </div>

          {/* Grid de días */}
          <div className="cal-wizard-grid">
            {/* Espacios vacíos */}
            {Array.from({ length: primerDia }).map(function (_, i) {
              return <div key={'e-' + i} className="cal-wizard-dia empty"></div>;
            })}

            {/* Días del mes */}
            {calendario.map(function (dia) {
              var esPasado = dia.fecha < hoyStr;
              var esAntesDeMínima = fechaMinima && dia.fecha < fechaMinima;
              var deshabilitado = esPasado || esAntesDeMínima;
              var esHoy = dia.fecha === hoyStr;
              var esSeleccionado = fechaSeleccionada === dia.fecha;

              var clases = 'cal-wizard-dia';
              if (deshabilitado) {
                clases += ' deshabilitado';
              } else {
                clases += ' ' + dia.color;
              }
              if (esHoy && !deshabilitado) clases += ' hoy';
              if (esSeleccionado) clases += ' seleccionado';

              return (
                <div
                  key={dia.fecha}
                  className={clases}
                  onClick={deshabilitado ? undefined : function () { handleDiaClick(dia); }}
                  title={
                    deshabilitado
                      ? (esAntesDeMínima && !esPasado ? 'Requiere más anticipación' : 'Fecha no disponible')
                      : dia.color === 'verde'
                        ? 'Todos disponibles'
                        : dia.color === 'amarillo'
                          ? (dia.ocupados > 0 ? dia.ocupados + ' confirmado(s)' : '') + (dia.pendientes > 0 ? (dia.ocupados > 0 ? ', ' : '') + dia.pendientes + ' pendiente(s)' : '')
                          : 'Todos los servicios ocupados'
                  }
                >
                  <span className="cal-wizard-dia-num">{dia.dia}</span>
                  {!deshabilitado && (
                    <span className={'cal-wizard-dot ' + dia.color}></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="cal-wizard-leyenda">
            <div className="cal-wizard-ley-item">
              <span className="cal-wizard-ley-dot verde"></span>
              Disponible
            </div>
            <div className="cal-wizard-ley-item">
              <span className="cal-wizard-ley-dot amarillo"></span>
              Parcial
            </div>
            <div className="cal-wizard-ley-item">
              <span className="cal-wizard-ley-dot rojo"></span>
              Ocupado
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarioWizard;
