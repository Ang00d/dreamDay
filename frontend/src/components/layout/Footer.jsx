/* ============================================
   DREAM DAY — Footer Component
   
   4 columnas: Brand, Enlaces, Servicios, Legal
   Fondo oscuro (#3D3431) con acentos café
   Responsive: 4 col → 2 col → 1 col
   ============================================ */

import { Phone, Mail, MapPin } from 'lucide-react';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  // Scroll suave a sección
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Columna 1: Brand */}
        <div className="footer-brand">
          <div className="brand-title">Dream Day</div>
          <p>
            Hacemos realidad el evento de tus sueños. Empresa de Aguascalientes
            especializada en ofrecer una experiencia completa para tu evento.
          </p>
          <div className="footer-social">
            <a
              href="https://facebook.com"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              📘
            </a>
            <a
              href="https://instagram.com"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              📸
            </a>
            <a
              href="https://wa.me/524491234567"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              💬
            </a>
          </div>
        </div>

        {/* Columna 2: Enlaces */}
        <div className="footer-links">
          <h4>Enlaces</h4>
          <ul>
            <li>
              <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')}>
                Inicio
              </a>
            </li>
            <li>
              <a href="#nosotros" onClick={(e) => scrollToSection(e, 'nosotros')}>
                Nosotros
              </a>
            </li>
            <li>
              <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>
                Servicios
              </a>
            </li>
            <li>
              <a href="#contacto" onClick={(e) => scrollToSection(e, 'contacto')}>
                Contacto
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 3: Servicios */}
        <div className="footer-links">
          <h4>Servicios</h4>
          <ul>
            <li>
              <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>
                🍽 Comida
              </a>
            </li>
            <li>
              <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>
                🥂 Bebidas
              </a>
            </li>
            <li>
              <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>
                🍰 Postres
              </a>
            </li>
            <li>
              <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>
                🎪 Inflables
              </a>
            </li>
            <li>
              <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>
                ✨ Extras
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 4: Contacto */}
        <div className="footer-links">
          <h4>Contacto</h4>
          <ul>
            <li>
              <a href="#contacto" onClick={(e) => scrollToSection(e, 'contacto')}>
                📍 Aguascalientes, Ags.
              </a>
            </li>
            <li>
              <a href="tel:+524491234567">
                📞 449 123 4567
              </a>
            </li>
            <li>
              <a href="mailto:contacto@dreamday.mx">
                ✉️ contacto@dreamday.mx
              </a>
            </li>
            <li>
              <span style={{ color: 'var(--cafe-suave)', fontSize: '0.9rem' }}>
                🕐 Lun-Vie: 9:00 - 18:00
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Dream Day — Todo para tu evento. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
