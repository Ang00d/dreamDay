import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import api from '../services/api';
import './SSODemoPage.css';

// Simula "App B" — una app separada que recibe el token SSO de App A
export default function SSODemoPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState('verificando'); // verificando | ok | error | esperando
  const [usuario, setUsuario] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (token) {
      verificarSSO(token);
    } else {
      setEstado('esperando');
    }
  }, [token]);

  async function verificarSSO(t) {
    setEstado('verificando');
    try {
      const res = await api.get('/sso/verificar?token=' + t);
      setUsuario(res.data.data.usuario);
      setMensaje(res.data.data.mensaje);
      setEstado('ok');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'Token SSO inválido o expirado');
      setEstado('error');
    }
  }

  return (
    <div className="sso-page">
      <div className="sso-card">
        {/* Header */}
        <div className="sso-header">
          <div className="sso-app-badge">App B</div>
          <h1>Dream Day Reports</h1>
          <p>Aplicación de reportes (SSO Demo)</p>
        </div>

        {/* Contenido según estado */}
        {estado === 'verificando' && (
          <div className="sso-status">
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p>Verificando autenticación SSO...</p>
          </div>
        )}

        {estado === 'ok' && (
          <div className="sso-status ok">
            <ShieldCheck size={48} className="sso-icon-ok" />
            <h2>¡Acceso concedido!</h2>
            <p>{mensaje}</p>
            <div className="sso-user-card">
              <div className="sso-user-avatar">{usuario?.nombre?.[0] || 'U'}</div>
              <div>
                <strong>{usuario?.nombre}</strong>
                <span>{usuario?.email}</span>
                <span className="sso-rol">{usuario?.rol}</span>
              </div>
            </div>
            <p className="sso-note">
              Este usuario inició sesión en <strong>App A (Dream Day Admin)</strong> y accedió
              aquí sin volver a autenticarse — eso es SSO en acción.
            </p>
          </div>
        )}

        {estado === 'error' && (
          <div className="sso-status error">
            <p className="sso-error-msg">❌ {mensaje}</p>
            <p>Debes generar un nuevo token SSO desde el panel admin.</p>
          </div>
        )}

        {estado === 'esperando' && (
          <div className="sso-status">
            <p>Esta página recibe usuarios desde <strong>App A</strong> vía SSO.</p>
            <p>Para probar el flujo:</p>
            <ol className="sso-pasos">
              <li>Inicia sesión en el panel admin (App A)</li>
              <li>Ve a <strong>Configuración → SSO Demo</strong></li>
              <li>Haz clic en "Acceder a App B"</li>
              <li>Serás redirigido aquí automáticamente</li>
            </ol>
          </div>
        )}

        {/* Flujo explicativo */}
        <div className="sso-flujo">
          <h3>Flujo SSO implementado</h3>
          <div className="sso-pasos-flujo">
            <div className="sso-paso">
              <span className="sso-paso-num">1</span>
              <span>Login en App A</span>
            </div>
            <ArrowRight size={16} className="sso-arrow" />
            <div className="sso-paso">
              <span className="sso-paso-num">2</span>
              <span>POST /sso/token</span>
            </div>
            <ArrowRight size={16} className="sso-arrow" />
            <div className="sso-paso">
              <span className="sso-paso-num">3</span>
              <span>Redirect a App B</span>
            </div>
            <ArrowRight size={16} className="sso-arrow" />
            <div className="sso-paso">
              <span className="sso-paso-num">4</span>
              <span>GET /sso/verificar</span>
            </div>
            <ArrowRight size={16} className="sso-arrow" />
            <div className="sso-paso sso-paso-ok">
              <span className="sso-paso-num">5</span>
              <span>Acceso sin login</span>
            </div>
          </div>
        </div>

        <div className="sso-footer">
          <Link to="/admin/dashboard" className="sso-link">
            ← Volver a App A (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}
