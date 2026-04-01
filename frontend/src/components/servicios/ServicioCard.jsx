import { useState } from 'react';
import ReactDOM from 'react-dom';
import { ImageIcon, Clock, Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './ServicioCard.css';

function ServicioCard({ servicio, enCarrito, onAgregar, onQuitar }) {
  var [lightbox, setLightbox] = useState(false);
  var [fotoActual, setFotoActual] = useState(0);

  function obtenerImagen() {
    if (!servicio.imagenes || servicio.imagenes.length === 0) return null;
    var principal = servicio.imagenes.find(function (img) { return img.esPrincipal; });
    return principal || servicio.imagenes[0];
  }

  var imagen = obtenerImagen();
  var tieneImagen = imagen !== null;
  var totalFotos = servicio.imagenes ? servicio.imagenes.length : 0;

  function abrirLightbox() {
    if (totalFotos === 0) return;
    setFotoActual(0);
    setLightbox(true);
  }

  function cerrarLightbox() {
    setLightbox(false);
  }

  function anterior() {
    setFotoActual(function (i) { return i === 0 ? totalFotos - 1 : i - 1; });
  }

  function siguiente() {
    setFotoActual(function (i) { return i === totalFotos - 1 ? 0 : i + 1; });
  }

  return (
    <div className={'servicio-card' + (enCarrito ? ' en-carrito' : '')}>
      <div className="servicio-card-imagen" onClick={abrirLightbox} style={{ cursor: tieneImagen ? 'pointer' : 'default' }}>
        {tieneImagen ? (
          <img
            src={imagen.url}
            alt={imagen.alt || servicio.nombre}
            loading="lazy"
          />
        ) : (
          <div className="servicio-card-placeholder">
            <ImageIcon size={28} />
          </div>
        )}
        {totalFotos > 1 && (
          <span className="servicio-card-fotos-count">
            {totalFotos} fotos
          </span>
        )}
      </div>

      <div className="servicio-card-contenido">
        <h3 className="servicio-card-nombre">{servicio.nombre}</h3>
        {servicio.descripcionCorta && (
          <p className="servicio-card-desc">{servicio.descripcionCorta}</p>
        )}
        <div className="servicio-card-detalles">
          {servicio.duracionHoras && (
            <span className="servicio-card-detalle">
              <Clock size={13} />
              {servicio.duracionHoras}h
            </span>
          )}
        </div>
        <button
          className={'servicio-card-btn' + (enCarrito ? ' btn-quitar' : ' btn-agregar')}
          onClick={function () {
            if (enCarrito) {
              onQuitar && onQuitar(servicio);
            } else {
              onAgregar && onAgregar(servicio);
            }
          }}
        >
          {enCarrito ? (
            <>
              <Check size={16} />
              <span>Agregado</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Cotizar</span>
            </>
          )}
        </button>
      </div>

      {lightbox && totalFotos > 0 && ReactDOM.createPortal(
        <div className="lightbox-overlay" onClick={cerrarLightbox}>
          <div className="lightbox-content" onClick={function (e) { e.stopPropagation(); }}>
            <button className="lightbox-cerrar" onClick={cerrarLightbox}>
              <X size={20} />
            </button>
            <img
              src={servicio.imagenes[fotoActual].url}
              alt={servicio.imagenes[fotoActual].alt || servicio.nombre}
              className="lightbox-img"
            />
            {totalFotos > 1 && (
              <>
                <button className="lightbox-nav lightbox-prev" onClick={anterior}>
                  <ChevronLeft size={24} />
                </button>
                <button className="lightbox-nav lightbox-next" onClick={siguiente}>
                  <ChevronRight size={24} />
                </button>
                <span className="lightbox-counter">{fotoActual + 1} / {totalFotos}</span>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ServicioCard;
