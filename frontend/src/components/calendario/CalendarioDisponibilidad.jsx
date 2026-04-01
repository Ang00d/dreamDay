/* ============================================
   DREAM DAY — Calendario de Disponibilidad
   
   Muestra un mes completo con colores:
   🟢 Verde: todo disponible
   🟡 Amarillo: algunos servicios ocupados
   🔴 Rojo: todo ocupado
   
   Click en un dia muestra detalle de disponibilidad
   ============================================ */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import disponibilidadService from '../../services/disponibilidadService';
import frontendLogger from '../../utils/frontendLogger';
import './Calendario.css';

var DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
var MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function CalendarioDisponibilidad() {
  var hoy = new Date();
  var [anio, setAnio] = useState(hoy.getFullYear());
  var [mes, setMes] = useState(hoy.getMonth() + 1); // 1-12
  var [calendario, setCalendario] = useState([]);
  var [cargando, setCargando] = useState(true);
  var [diaSeleccionado, setDiaSeleccionado] = useState(null);
  var [totalServicios, setTotalServicios] = useState(0);

  // Cargar datos del mes al cambiar anio/mes
  useEffect(function () {
    cargarMes();
  }, [anio, mes]);

  async function cargarMes() {
    try {
      setCargando(true);
      setDiaSeleccionado(null);

      var data = await disponibilidadService.obtenerMes(anio, mes);
      setCalendario(data.calendario);
      setTotalServicios(data.totalServicios);

      frontendLogger.info('Calendario cargado', { anio: anio, mes: mes });
    } catch (err) {
      frontendLogger.error('Error cargando calendario', { message: err.message });
      setCalendario([]);
    } finally {
      setCargando(false);
    }
  }

  // Navegar al mes anterior
  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  }

  // Navegar al mes siguiente
  function mesSiguiente() {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  }

  // Obtener fecha de hoy en formato YYYY-MM-DD
  var hoyStr = hoy.toISOString().split('T')[0];

  // Calcular cuantos espacios vacios antes del dia 1
  var primerDia = new Date(anio, mes - 1, 1).getDay(); // 0=Dom

  // Click en un dia
  function handleDiaClick(dia) {
    if (dia.fecha < hoyStr) return; // No permitir dias pasados
    setDiaSeleccionado(dia);
    frontendLogger.info('Dia seleccionado en calendario', {
      fecha: dia.fecha,
      color: dia.color
    });
  }

  // Verificar si el mes actual es el presente o pasado (para no navegar hacia atras)
  var esMesActualOMenor = anio === hoy.getFullYear() && mes <= hoy.getMonth() + 1;

  return (
    <div className="calendario-page">
      <div className="calendario-container">
        {/* Titulo */}
        <div className="calendario-title">
          <h1>Disponibilidad</h1>
          <p>Consulta la disponibilidad de nuestros servicios por fecha</p>
        </div>

        <div className="calendario-card">
          {/* Navegacion del mes */}
          <div className="calendario-nav">
            <button
              onClick={mesAnterior}
              disabled={esMesActualOMenor}
              style={esMesActualOMenor ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
            >
              ←
            </button>
            <h2>{MESES[mes - 1]} {anio}</h2>
            <button onClick={mesSiguiente}>→</button>
          </div>

          {/* Cargando */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--texto-medio)', marginTop: '1rem' }}>Cargando calendario...</p>
            </div>
          ) : (
            <>
              {/* Nombres de dias */}
              <div className="calendario-dias-header">
                {DIAS_SEMANA.map(function (nombre) {
                  return (
                    <div key={nombre} className="calendario-dia-nombre">
                      {nombre}
                    </div>
                  );
                })}
              </div>

              {/* Grid de dias */}
              <div className="calendario-dias">
                {/* Espacios vacios antes del dia 1 */}
                {Array.from({ length: primerDia }).map(function (_, i) {
                  return <div key={'empty-' + i} className="calendario-dia empty"></div>;
                })}

                {/* Dias del mes */}
                {calendario.map(function (dia) {
                  var esPasado = dia.fecha < hoyStr;
                  var esHoy = dia.fecha === hoyStr;
                  var esSeleccionado = diaSeleccionado && diaSeleccionado.fecha === dia.fecha;

                  var clases = 'calendario-dia';
                  if (esPasado) {
                    clases += ' pasado';
                  } else {
                    clases += ' ' + dia.color;
                  }
                  if (esHoy) clases += ' hoy';
                  if (esSeleccionado) clases += ' seleccionado';

                  return (
                    <div
                      key={dia.fecha}
                      className={clases}
                      onClick={function () { handleDiaClick(dia); }}
                      title={dia.fecha + ' - ' + (esPasado ? 'Pasado' : dia.color)}
                    >
                      {dia.dia}
                      {!esPasado && dia.ocupados > 0 && (
                        <span className="dia-dot"></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="calendario-leyenda">
                <div className="leyenda-item">
                  <div className="leyenda-dot verde"></div>
                  Disponible
                </div>
                <div className="leyenda-item">
                  <div className="leyenda-dot amarillo"></div>
                  Parcial
                </div>
                <div className="leyenda-item">
                  <div className="leyenda-dot rojo"></div>
                  Ocupado
                </div>
              </div>

              {/* Detalle del dia seleccionado */}
              {diaSeleccionado && (
                <div className="dia-detalle">
                  <h3>
                    {new Date(diaSeleccionado.fecha + 'T12:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>

                  <div className={'dia-detalle-estado ' + diaSeleccionado.color}>
                    {diaSeleccionado.color === 'verde' && '🟢 Todo disponible'}
                    {diaSeleccionado.color === 'amarillo' && '🟡 Parcialmente ocupado'}
                    {diaSeleccionado.color === 'rojo' && '🔴 Completamente ocupado'}
                  </div>

                  <p>
                    {diaSeleccionado.ocupados} de {totalServicios} servicios ocupados en esta fecha.
                    {diaSeleccionado.color !== 'rojo' && (
                      ' ¡Aún hay servicios disponibles para tu evento!'
                    )}
                  </p>

                  {diaSeleccionado.color !== 'rojo' && (
                    <Link to="/cotizar" className="btn-cotizar">
                      Cotizar para esta fecha
                    </Link>
                  )}

                  {diaSeleccionado.color === 'rojo' && (
                    <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Todos los servicios están ocupados este día.
                      Puedes intentar con otra fecha o contactarnos por WhatsApp.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarioDisponibilidad;
