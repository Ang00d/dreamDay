/* ============================================
   DREAM DAY — Paso 1: Servicios
   
   Muestra los servicios del carrito.
   La cantidad se adapta según el tipoPrecio:
   
   - precio_fijo   → 1 unidad (no editable)
   - por_persona    → se calcula en paso 2 (personas)
   - por_pieza      → input editable (tacos, piezas, etc.)
   - por_orden      → input editable (órdenes)
   - por_juego      → input editable (juegos)
   ============================================ */
import { Trash2 } from 'lucide-react';
import { showToast } from '../../utils/toast';

// Iconos por categoría
var iconosPorCategoria = {
  'Comida': '🍽',
  'Bebidas': '🥂',
  'Postres': '🍰',
  'Inflables': '🎪',
  'Extras': '✨'
};

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

  // Determinar qué mostrar para la cantidad según tipoPrecio
  function renderCantidad(servicio) {
    var tipo = servicio.tipoPrecio || 'precio_fijo';
    var unidad = (servicio.requisitoMinimo && servicio.requisitoMinimo.unidad) || 'unidad';
    var minimo = (servicio.requisitoMinimo && servicio.requisitoMinimo.cantidad) || 1;
    var maxCantidad = servicio.capacidadDiaria || 99;

    switch (tipo) {
      case 'precio_fijo':
        // Inflables, albercas, candy bar, etc. — siempre 1 unidad
        return (
          <div className="servicio-item-cantidad" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: 'var(--texto-oscuro)',
              background: 'var(--cafe-muy-claro)',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              minWidth: '50px',
              textAlign: 'center'
            }}>1</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--texto-medio)', textAlign: 'center' }}>
              unidad
            </span>
          </div>
        );

      case 'por_persona':
        // Buffet, taco bar, brunch, coffee break — la cantidad se define por personas en paso 2
        return (
          <div className="servicio-item-cantidad" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--cafe-claro)',
              fontWeight: '600',
              background: 'rgba(201,166,141,0.1)',
              padding: '0.4rem 0.6rem',
              borderRadius: '8px',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              Por persona
              <br />
              <span style={{ fontSize: '0.68rem', fontWeight: '400', color: 'var(--texto-medio)' }}>
                (paso 2)
              </span>
            </span>
          </div>
        );

      case 'por_pieza':
        // Tacos al vapor, hotdogs, pizzas, crepas, churros, etc.
        return (
          <div className="servicio-item-cantidad" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <input
              type="number"
              min={minimo}
              max="9999"
              value={servicio.cantidad}
              onChange={function (e) {
                var val = parseInt(e.target.value) || minimo;
                if (val < minimo) {
                  showToast('Mínimo ' + minimo + ' ' + unidad + ' para "' + servicio.nombre + '"', 'error');
                  val = minimo;
                }
                onUpdateCantidad(servicio.servicioId, val);
              }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--texto-medio)', textAlign: 'center' }}>
              {unidad}
            </span>
          </div>
        );

      case 'por_orden':
        // Chilaquiles, pastas, flautas
        return (
          <div className="servicio-item-cantidad" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <input
              type="number"
              min={minimo}
              max="9999"
              value={servicio.cantidad}
              onChange={function (e) {
                var val = parseInt(e.target.value) || minimo;
                if (val < minimo) {
                  showToast('Mínimo ' + minimo + ' ' + unidad + ' para "' + servicio.nombre + '"', 'error');
                  val = minimo;
                }
                onUpdateCantidad(servicio.servicioId, val);
              }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--texto-medio)', textAlign: 'center' }}>
              {unidad}
            </span>
          </div>
        );

      case 'por_juego':
        // Bumper balls, mobiliario infantil
        return (
          <div className="servicio-item-cantidad" style={{ flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <input
              type="number"
              min={minimo}
              max={maxCantidad}
              value={servicio.cantidad}
              onChange={function (e) {
                var val = parseInt(e.target.value) || minimo;
                if (val > maxCantidad) {
                  showToast('"' + servicio.nombre + '" máximo ' + maxCantidad + ' ' + unidad + ' por día', 'error');
                  val = maxCantidad;
                }
                if (val < minimo) val = minimo;
                onUpdateCantidad(servicio.servicioId, val);
              }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--texto-medio)', textAlign: 'center' }}>
              {unidad}
            </span>
          </div>
        );

      default:
        return (
          <div className="servicio-item-cantidad">
            <input
              type="number"
              min="1"
              value={servicio.cantidad}
              onChange={function (e) {
                var val = parseInt(e.target.value) || 1;
                if (val < 1) val = 1;
                onUpdateCantidad(servicio.servicioId, val);
              }}
            />
          </div>
        );
    }
  }

  // Texto descriptivo del tipo de precio
  function getDescripcionPrecio(servicio) {
    var tipo = servicio.tipoPrecio || 'precio_fijo';
    var minimo = servicio.requisitoMinimo;
    var textos = {
      'precio_fijo': 'Precio fijo por servicio',
      'por_persona': minimo ? 'Mín. ' + minimo.cantidad + ' personas' : 'Precio por persona',
      'por_pieza': minimo ? 'Mín. ' + minimo.cantidad + ' ' + minimo.unidad : 'Precio por pieza',
      'por_orden': minimo ? 'Mín. ' + minimo.cantidad + ' ' + minimo.unidad : 'Precio por orden',
      'por_juego': minimo ? 'Mín. ' + minimo.cantidad + ' ' + minimo.unidad : 'Precio por juego'
    };
    return textos[tipo] || '';
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
        var icono = iconosPorCategoria[servicio.categoria] || '📦';

        return (
          <div key={servicio.servicioId} className="servicio-item">
            <div className="servicio-item-icon">{icono}</div>
            <div className="servicio-item-info">
              <h4>{servicio.nombre}</h4>
              <p>
                {servicio.categoria && servicio.categoria}
                {' · '}
                {getDescripcionPrecio(servicio)}
              </p>
            </div>

            {renderCantidad(servicio)}

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

      <div style={{
        fontSize: '0.82rem',
        color: 'var(--texto-medio)',
        marginTop: '1.2rem',
        padding: '0.8rem 1rem',
        background: 'var(--cafe-muy-claro)',
        borderRadius: '10px',
        lineHeight: '1.5'
      }}>
        <strong style={{ color: 'var(--texto-oscuro)' }}>💡 Nota sobre cantidades:</strong>
        <br />
        Los servicios <strong>por persona</strong> se calculan automáticamente con el número de invitados (paso 2).
        Los servicios con <strong>precio fijo</strong> son 1 unidad por evento.
      </div>
    </div>
  );
}

export default PasoServicios;
