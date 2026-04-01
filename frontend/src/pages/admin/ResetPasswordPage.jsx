import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { showToast } from '../../utils/toast';
import api from '../../services/api';
import './LoginPage.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ nueva: '', confirmar: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-brand">Dream Day</h1>
            <p className="login-subtitle">Token inválido</p>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--texto-medio)', padding: '1rem' }}>
            El enlace de recuperación no es válido o ya fue usado.
          </p>
          <div className="login-footer">
            <a href="/admin/login" className="login-back-link">← Ir al login</a>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.nueva !== form.confirmar) { setError('Las contraseñas no coinciden'); return; }
    if (form.nueva.length < 6) { setError('Mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password/reset', { token, nuevaPassword: form.nueva });
      setExito(true);
      showToast('Contraseña actualizada', 'success');
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">Dream Day</h1>
          <p className="login-subtitle">Nueva contraseña</p>
        </div>

        {exito ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#2e7d32' }}>
            ✅ Contraseña actualizada. Redirigiendo...
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-mfa-info">
              <KeyRound size={32} style={{ color: 'var(--color-primary)' }} />
              <p>Ingresa tu nueva contraseña.</p>
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="login-field">
              <label className="login-label">Nueva contraseña</label>
              <div className="login-password-wrapper">
                <input type={showPass ? 'text' : 'password'} className="login-input"
                  value={form.nueva} onChange={e => setForm({ ...form, nueva: e.target.value })} />
                <button type="button" className="login-toggle-password" tabIndex={-1}
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="login-field">
              <label className="login-label">Confirmar contraseña</label>
              <input type="password" className="login-input"
                value={form.confirmar} onChange={e => setForm({ ...form, confirmar: e.target.value })} />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span>
                : <><KeyRound size={18} /><span>Guardar contraseña</span></>}
            </button>
          </form>
        )}
        <div className="login-footer">
          <a href="/admin/login" className="login-back-link">← Volver al login</a>
        </div>
      </div>
    </div>
  );
}
