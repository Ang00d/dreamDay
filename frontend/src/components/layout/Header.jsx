/* ============================================
   DREAM DAY — Header (actualizado Paso 15)
   
   Cambios:
   - Cart button abre CartDrawer en lugar de navegar
   - CartDrawer integrado dentro del Header
   ============================================ */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import CartDrawer from '../carrito/CartDrawer';
import carritoStorage from '../../utils/carrito';
import frontendLogger from '../../utils/frontendLogger';
import './Header.css';

function Header() {
  var navigate = useNavigate();
  var [menuOpen, setMenuOpen] = useState(false);
  var [cartCount, setCartCount] = useState(0);
  var [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(function () {
    setCartCount(carritoStorage.contarItems());

    var handleStorage = function () {
      setCartCount(carritoStorage.contarItems());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('carritoActualizado', handleStorage);

    return function () {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('carritoActualizado', handleStorage);
    };
  }, []);

  var toggleMenu = function () {
    setMenuOpen(!menuOpen);
  };

  var closeMenu = function () {
    setMenuOpen(false);
  };

  var scrollToSection = function (e, sectionId) {
    e.preventDefault();
    closeMenu();

    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(function () {
        var section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      var section = document.getElementById(sectionId);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  var handleCartClick = function () {
    closeMenu();
    setDrawerOpen(true);
    frontendLogger.info('Carrito drawer abierto', { items: cartCount });
  };

  var handleCloseDrawer = function () {
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo-container" onClick={closeMenu}>
            <div className="logo-placeholder">DD</div>
            <span className="logo-text">Dream Day</span>
          </Link>

          {/* Nav Desktop */}
          <nav className="nav-desktop">
            <a href="#inicio" className="nav-link" onClick={function (e) { scrollToSection(e, 'inicio'); }}>
              Inicio
            </a>
            <a href="#servicios" className="nav-link" onClick={function (e) { scrollToSection(e, 'servicios'); }}>
              Servicios
            </a>
            <Link to="/disponibilidad" className="nav-link">
              Disponibilidad
            </Link>
            <a href="#nosotros" className="nav-link" onClick={function (e) { scrollToSection(e, 'nosotros'); }}>
              Nosotros
            </a>
            <a href="#contacto" className="nav-link" onClick={function (e) { scrollToSection(e, 'contacto'); }}>
              Contacto
            </a>

            <button className="cart-button" onClick={handleCartClick}>
              <ShoppingCart size={22} />
              <span className={'cart-badge ' + (cartCount === 0 ? 'hidden' : '')}>
                {cartCount}
              </span>
            </button>

            {cartCount > 0 && (
              <button className="btn-cotizar-header" onClick={handleCartClick}>
                Cotizar ({cartCount})
              </button>
            )}

            <Link to="/admin/login" className="btn-admin">
              Ingresar
            </Link>
          </nav>

          {/* Mobile buttons */}
          <div className="header-mobile-actions">
            <button className="cart-button-mobile" onClick={handleCartClick}>
              <ShoppingCart size={20} />
              <span className={'cart-badge ' + (cartCount === 0 ? 'hidden' : '')}>
                {cartCount}
              </span>
            </button>
            <button
              className={'menu-toggle ' + (menuOpen ? 'active' : '')}
              onClick={toggleMenu}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Nav Mobile */}
        <nav className={'nav-mobile ' + (menuOpen ? 'active' : '')}>
          <div className="nav-mobile-item">
            <a href="#inicio" className="nav-mobile-link" onClick={function (e) { scrollToSection(e, 'inicio'); }}>
              Inicio
            </a>
          </div>
          <div className="nav-mobile-item">
            <a href="#servicios" className="nav-mobile-link" onClick={function (e) { scrollToSection(e, 'servicios'); }}>
              Servicios
            </a>
          </div>
          <div className="nav-mobile-item">
            <Link to="/disponibilidad" className="nav-mobile-link" onClick={closeMenu}>
              📅 Disponibilidad
            </Link>
          </div>
          <div className="nav-mobile-item">
            <a href="#nosotros" className="nav-mobile-link" onClick={function (e) { scrollToSection(e, 'nosotros'); }}>
              Nosotros
            </a>
          </div>
          <div className="nav-mobile-item">
            <a href="#contacto" className="nav-mobile-link" onClick={function (e) { scrollToSection(e, 'contacto'); }}>
              Contacto
            </a>
          </div>
          <div className="nav-mobile-actions">
            <button className="btn-primary" onClick={handleCartClick} style={{ width: '100%' }}>
              <ShoppingCart size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              {cartCount > 0 ? 'Ver Carrito (' + cartCount + ')' : 'Carrito'}
            </button>
            <Link
              to="/admin/login"
              className="btn-admin"
              onClick={closeMenu}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Ingresar
            </Link>
          </div>
        </nav>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} />
    </>
  );
}

export default Header;
