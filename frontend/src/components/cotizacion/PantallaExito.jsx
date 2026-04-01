/* ============================================
   DREAM DAY — Pantalla de Exito
   
   Se muestra despues de enviar la cotizacion.
   Muestra:
   - Codigo de referencia (DD2603-XXXX)
   - Boton de WhatsApp para seguimiento
   - Boton para volver al inicio
   ============================================ */

import { Link } from 'react-router-dom';

function PantallaExito({ respuesta, onNueva }) {
  return (
    <div className="wizard-content">
      <div className="exito">
        <div className="exito-icon">🎉</div>
        <h2>¡Solicitud Enviada!</h2>
        <p className="exito-mensaje">
          Tu solicitud de cotización ha sido recibida. Te contactaremos
          pronto para finalizar los detalles.
        </p>

        {/* Codigo de referencia */}
        <div className="exito-codigo">
          <label>Tu código de referencia:</label>
          <span>{respuesta.codigoReferencia}</span>
        </div>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--texto-medio)',
          maxWidth: '450px',
          margin: '0 auto 1rem'
        }}>
          Guarda este código para dar seguimiento a tu cotización.
          También puedes contactarnos directamente por WhatsApp.
        </p>

        {/* Acciones */}
        <div className="exito-actions">
          {/* Boton WhatsApp */}
          <a
            href={respuesta.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            💬 Contactar por WhatsApp
          </a>

          {/* Boton volver */}
          <Link
            to="/"
            className="btn-secondary"
            style={{
              display: 'inline-block',
              padding: '0.8rem 2rem',
              textDecoration: 'none',
              textAlign: 'center'
            }}
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PantallaExito;
