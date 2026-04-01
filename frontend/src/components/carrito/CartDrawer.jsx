import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import carritoStorage from '../../utils/carrito';
import { showToast } from '../../utils/toast';
import frontendLogger from '../../utils/frontendLogger';
import './CartDrawer.css';

function CartDrawer({ isOpen, onClose }) {
  var navigate = useNavigate();
  var [items, setItems] = useState([]);

  useEffect(function () {
    if (isOpen) {
      setItems(carritoStorage.obtener());
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return function () {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escuchar cambios del carrito
  useEffect(function () {
    var handleUpdate = function () {
      setItems(carritoStorage.obtener());
    };

    window.addEventListener('carritoActualizado', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return function () {
      window.removeEventListener('carritoActualizado', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  var handleEliminar = function (servicioId, nombre) {
    carritoStorage.eliminar(servicioId);
    setItems(carritoStorage.obtener());
    window.dispatchEvent(new Event('carritoActualizado'));
    showToast(nombre + ' eliminado del carrito', 'info');
    frontendLogger.info('Servicio eliminado del carrito', {
      servicioId: servicioId,
      nombre: nombre
    });
  };

  var handleLimpiar = function () {
    if (!window.confirm('¿Vaciar todo el carrito?')) return;
    carritoStorage.limpiar();
    setItems([]);
    window.dispatchEvent(new Event('carritoActualizado'));
    showToast('Carrito vaciado', 'info');
    frontendLogger.info('Carrito vaciado');
  };

  var handleCotizar = function () {
    onClose();
    navigate('/cotizar');
    frontendLogger.info('Navegación a cotizar desde drawer', {
      serviciosCount: items.length
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={'cart-overlay ' + (isOpen ? 'active' : '')}
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className={'cart-drawer ' + (isOpen ? 'active' : '')}>
        {/* Header del drawer */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title-row">
            <ShoppingCart size={20} className="cart-drawer-icon" />
            <h2 className="cart-drawer-title">Mi Carrito</h2>
            <span className="cart-drawer-count">{items.length}</span>
          </div>
          <button className="cart-drawer-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Contenido */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-drawer-empty">
              <Package size={48} />
              <p className="cart-drawer-empty-title">Tu carrito está vacío</p>
              <p className="cart-drawer-empty-text">
                Explora nuestros servicios y agrega los que necesites para tu evento
              </p>
              <button className="cart-drawer-explore-btn" onClick={function () { onClose(); navigate('/'); }}>
                Ver servicios
              </button>
            </div>
          ) : (
            <div className="cart-drawer-items">
              {items.map(function (item) {
                return (
                  <div key={item.id} className="cart-drawer-item">
                    <div className="cart-drawer-item-info">
                      <span className="cart-drawer-item-name">{item.nombre}</span>
                      {item.categoria && (
                        <span className="cart-drawer-item-cat">{item.categoria}</span>
                      )}
                      {item.descripcionCorta && (
                        <span className="cart-drawer-item-desc">{item.descripcionCorta}</span>
                      )}
                      {item.requisitoMinimo && (
                        <span className="cart-drawer-item-min">
                          Mín: {item.requisitoMinimo.cantidad} {item.requisitoMinimo.unidad}
                        </span>
                      )}
                    </div>
                    <button
                      className="cart-drawer-item-remove"
                      onClick={function () { handleEliminar(item.id, item.nombre); }}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <button className="cart-drawer-clear-btn" onClick={handleLimpiar}>
              Vaciar carrito
            </button>
            <button className="cart-drawer-cotizar-btn" onClick={handleCotizar}>
              <span>Cotizar ({items.length})</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;
