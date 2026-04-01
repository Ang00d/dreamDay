/* ============================================
   DREAM DAY — Paso 1: Servicios
   
   Muestra los servicios del carrito.
   El usuario puede ajustar cantidades o eliminar.
   Si esta vacio, muestra boton para ir al catalogo.
   ============================================ */

import { Trash2 } from 'lucide-react';
import { showToast } from '../../utils/toast';

function PasoServicios({ servicios, onUpdateCantidad, onRemove, onIrACatalogo }) {
  if (servicios.length === 0) {
    return (
      <div className="paso-servicios-empty">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
        <p>No tienes servicios seleccionados.</p>
        <p style={{ fontSize: '0.9rem', color: 'var(--texto-medio)' }}>
          Agrega servicios desde el catálogo para poder cotizar.
        </p>
        <button className="btn-primary" onClick={onIrACatalogo} style={{ marginTop: '1rem' }}>
          Ir al Catálogo
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '1.3rem',
        color: 'var(--texto-oscuro)',
        marginBottom: '1.5rem'
      }}>
        Servicios seleccionados ({servicios.length})
      </h3>

      {servicios.map(function (servicio) {
        var maxCantidad = servicio.capacidadDiaria || 1;
        return (
          <div key={servicio.servicioId} className="servicio-item">
            <div className="servicio-item-icon">📦</div>

            <div className="servicio-item-info">
              <h4>{servicio.nombre}</h4>
              <p>
                {servicio.categoria && servicio.categoria}
                {servicio.requisitoMinimo && (
                  ' · Mín. ' + servicio.requisitoMinimo.cantidad + ' ' + servicio.requisitoMinimo.unidad
                )}
              </p>
              {maxCantidad > 1 && (
                <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                  Capacidad máxima: {maxCantidad} por día
                </p>
              )}
            </div>

            <div className="servicio-item-cantidad">
              <input
                type="number"
                min="1"
                value={servicio.cantidad}
                onChange={function (e) {
                  var val = parseInt(e.target.value) || 1;
                  if (val > maxCantidad) {
                    showToast(
                      '"' + servicio.nombre + '" solo puede contratarse ' + maxCantidad + ' vez por día',
                      'error'
                    );
                    val = maxCantidad;
                  }
                  if (val < 1) val = 1;
                  onUpdateCantidad(servicio.servicioId, val);
                }}
              />
            </div>

            <button
              className="servicio-item-remove"
              onClick={function () { onRemove(servicio.servicioId); }}
              aria-label="Eliminar servicio"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      })}

      <p style={{
        fontSize: '0.85rem',
        color: 'var(--texto-medio)',
        marginTop: '1rem',
        textAlign: 'center'
      }}>
        Ajusta las cantidades según tus necesidades.
      </p>
    </div>
  );
}

export default PasoServicios;
