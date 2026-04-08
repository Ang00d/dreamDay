/* ============================================
   DREAM DAY — HomePage (actualizado Paso 15)
   
   Ahora usa ServicioCard con imágenes Cloudinary
   ============================================ */

import { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';
import carritoStorage from '../utils/carrito';
import frontendLogger from '../utils/frontendLogger';
import categoriasService from '../services/categoriasService';
import serviciosService from '../services/serviciosService';
import ServicioCard from '../components/servicios/ServicioCard';
import './HomePage.css';

function HomePage() {
  // Estados para datos del API
  var [categorias, setCategorias] = useState([]);
  var [servicios, setServicios] = useState([]);
  var [categoriaActiva, setCategoriaActiva] = useState(null);
  var [cargandoCategorias, setCargandoCategorias] = useState(true);
  var [cargandoServicios, setCargandoServicios] = useState(false);
  var [error, setError] = useState(null);
  var [carrito, setCarrito] = useState(carritoStorage.obtener());

  // Escuchar cambios del carrito
  useEffect(function () {
    function actualizarCarrito() {
      setCarrito(carritoStorage.obtener());
    }
    window.addEventListener('carritoActualizado', actualizarCarrito);
    return function () {
      window.removeEventListener('carritoActualizado', actualizarCarrito);
    };
  }, []);

  // Cargar categorias al inicio
  useEffect(function () {
    cargarCategorias();
  }, []);

  // Cuando cambia la categoria activa, cargar sus servicios
  useEffect(function () {
    if (categoriaActiva) {
      cargarServicios(categoriaActiva._id);
    }
  }, [categoriaActiva]);

  // Funcion para cargar categorias del API
  async function cargarCategorias() {
    try {
      setCargandoCategorias(true);
      setError(null);

      var data = await categoriasService.obtenerTodas();
      setCategorias(data);

      // Seleccionar la primera categoria por defecto
      if (data.length > 0) {
        setCategoriaActiva(data[0]);
      }

      frontendLogger.info('Categorias cargadas', { total: data.length });
    } catch (err) {
      setError('No se pudieron cargar las categorias. Verifica que el servidor este corriendo.');
      frontendLogger.error('Error cargando categorias', { message: err.message });
    } finally {
      setCargandoCategorias(false);
    }
  }

  // Funcion para cargar servicios de una categoria
  async function cargarServicios(categoriaId) {
    try {
      setCargandoServicios(true);

      var data = await serviciosService.obtenerTodos(categoriaId);
      setServicios(data);

      frontendLogger.info('Servicios cargados', {
        categoriaId: categoriaId,
        total: data.length
      });
    } catch (err) {
      frontendLogger.error('Error cargando servicios', { message: err.message });
      setServicios([]);
    } finally {
      setCargandoServicios(false);
    }
  }

  // Agregar al carrito
  function handleAgregar(servicio) {
    var agregado = carritoStorage.agregar({
      id: servicio._id,
      nombre: servicio.nombre,
      categoria: servicio.categoria ? servicio.categoria.nombre : '',
      descripcionCorta: servicio.descripcionCorta,
      requisitoMinimo: servicio.requisitoMinimo,
      duracionHoras: servicio.duracionHoras,
      tipoPrecio: servicio.tipoPrecio || 'precio_fijo',
      imagenPrincipal: servicio.imagenes && servicio.imagenes.length > 0
        ? servicio.imagenes[0].url
        : null
    });

    if (agregado) {
      showToast(servicio.nombre + ' agregado al carrito', 'success');
      window.dispatchEvent(new Event('carritoActualizado'));
    } else {
      showToast(servicio.nombre + ' ya esta en el carrito', 'info');
    }

    frontendLogger.info('Servicio agregado al carrito', {
      servicioId: servicio._id,
      servicioNombre: servicio.nombre
    });
  }

  // Quitar del carrito
  function handleQuitar(servicio) {
    carritoStorage.eliminar(servicio._id);
    showToast(servicio.nombre + ' removido del carrito', 'info');
    window.dispatchEvent(new Event('carritoActualizado'));
  }

  // Verificar si un servicio está en el carrito
  function estaEnCarrito(servicioId) {
    return carrito.some(function (item) {
      return item.id === servicioId || item._id === servicioId || item.servicioId === servicioId;
    });
  }

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="hero" id="inicio">
        <span className="decoration decoration-1">D</span>
        <span className="decoration decoration-2">D</span>
        <div className="hero-content">
          <p className="hero-pretitle">Todo para tu evento</p>
          <h1 className="hero-brand">Dream Day</h1>
          <p className="hero-tagline">Hacemos realidad tus sueños</p>
          <p className="hero-description">
            Empresa de Aguascalientes especializada en ofrecer una experiencia
            completa para tu evento. Comida, bebidas, postres, inflables y mucho
            más para crear momentos inolvidables.
          </p>
          <a
            href="#servicios"
            className="btn-cta"
            onClick={function (e) {
              e.preventDefault();
              var el = document.getElementById('servicios');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Ver Servicios
          </a>
        </div>
      </section>

      {/* ========== SERVICIOS ========== */}
      <section className="servicios-preview" id="servicios">
        <div className="section-header">
          <p className="section-subtitle">Nuestros Servicios</p>
          <h2 className="section-title">Catálogo</h2>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#c0392b',
            background: '#fdf0ef',
            borderRadius: '10px',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            <p>{error}</p>
            <button
              className="btn-primary"
              onClick={cargarCategorias}
              style={{ marginTop: '1rem' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Categorias (pills scrollables) */}
        {cargandoCategorias ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--texto-medio)', marginTop: '1rem' }}>Cargando categorías...</p>
          </div>
        ) : (
          <div className="categorias-scroll">
            {categorias.map(function (cat) {
              return (
                <button
                  key={cat._id}
                  className={'categoria-pill ' + (categoriaActiva && categoriaActiva._id === cat._id ? 'active' : '')}
                  onClick={function () {
                    setCategoriaActiva(cat);
                    frontendLogger.info('Categoria seleccionada', { categoria: cat.slug });
                  }}
                >
                  <span className="emoji">{cat.icono}</span>
                  {cat.nombre}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid de servicios */}
        {cargandoServicios ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--texto-medio)', marginTop: '1rem' }}>Cargando servicios...</p>
          </div>
        ) : (
          <div className="servicios-grid-preview">
            {servicios.map(function (servicio) {
              return (
                <ServicioCard
                  key={servicio._id}
                  servicio={servicio}
                  enCarrito={estaEnCarrito(servicio._id)}
                  onAgregar={handleAgregar}
                  onQuitar={handleQuitar}
                />
              );
            })}

            {servicios.length === 0 && !cargandoServicios && (
              <p style={{
                color: 'var(--texto-medio)',
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '2rem'
              }}>
                No hay servicios en esta categoría aún.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ========== NOSOTROS ========== */}
      <section className="nosotros" id="nosotros">
        <div className="nosotros-container">
          <div className="nosotros-image">
            <div className="nosotros-image-decoration"></div>
            <div className="nosotros-image-main">
              <div className="placeholder">
                <span className="dd-logo">DD</span>
                <p>Dream Day</p>
              </div>
            </div>
          </div>

          <div className="nosotros-content">
            <p className="section-subtitle">Conócenos</p>
            <h2 className="section-title">Nosotros</h2>
            <p>
              En Dream Day, nos dedicamos a transformar tus ideas en eventos
              inolvidables. Somos una empresa de Aguascalientes con pasión por
              ofrecer servicios de calidad para todo tipo de celebraciones.
            </p>
            <p>
              Nuestro equipo trabaja con dedicación para asegurar que cada
              detalle de tu evento sea perfecto, desde la comida hasta la
              diversión.
            </p>

            <div className="nosotros-features">
              <div className="feature-item">
                <div className="feature-icon">✨</div>
                <div className="feature-text">
                  <h4>Calidad Premium</h4>
                  <p>Los mejores servicios para tu evento</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">
                  <h4>Atención Personalizada</h4>
                  <p>Cada evento es único</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⏰</div>
                <div className="feature-text">
                  <h4>Puntualidad</h4>
                  <p>Siempre a tiempo, siempre</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">💰</div>
                <div className="feature-text">
                  <h4>Precios Justos</h4>
                  <p>Calidad al mejor precio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTACTO ========== */}
      <section className="contacto" id="contacto">
        <div className="contacto-container">
          <div className="section-header">
            <p className="section-subtitle">Estamos para ayudarte</p>
            <h2 className="section-title">Contáctanos</h2>
          </div>

          <div className="contacto-content">
            {/* Info */}
            <div className="contacto-info">
              <div className="contacto-item">
                <div className="contacto-icon">📍</div>
                <div className="contacto-text">
                  <h4>Ubicación</h4>
                  <p>Aguascalientes, Ags., México</p>
                </div>
              </div>
              <div className="contacto-item">
                <div className="contacto-icon">📞</div>
                <div className="contacto-text">
                  <h4>Teléfono</h4>
                  <p>+52 449 123 4567</p>
                </div>
              </div>
              <div className="contacto-item">
                <div className="contacto-icon">✉️</div>
                <div className="contacto-text">
                  <h4>Email</h4>
                  <p>contacto@dreamday.mx</p>
                </div>
              </div>
              <div className="contacto-item">
                <div className="contacto-icon">🕐</div>
                <div className="contacto-text">
                  <h4>Horario</h4>
                  <p>Lunes a Viernes: 9:00 - 18:00</p>
                  <p>Sábado: 10:00 - 14:00</p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form
              className="contacto-form"
              onSubmit={function (e) {
                e.preventDefault();
                showToast('Mensaje enviado correctamente', 'success');
                frontendLogger.info('Formulario de contacto enviado');
                e.target.reset();
              }}
            >
              <div className="form-group">
                <input type="text" placeholder="Tu nombre" required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Tu email" required />
              </div>
              <div className="form-group">
                <input type="tel" placeholder="Tu teléfono" />
              </div>
              <div className="form-group">
                <textarea placeholder="Tu mensaje..."></textarea>
              </div>
              <button type="submit" className="btn-send">
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
