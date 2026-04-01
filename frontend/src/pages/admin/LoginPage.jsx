import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, LogIn, ShieldCheck, KeyRound, Mail, Phone, PhoneCall, HelpCircle, ArrowLeft } from 'lucide-react';
import { showToast } from '../../utils/toast';
import api from '../../services/api';
import './LoginPage.css';

// Vistas: 'login' | 'mfa' | 'recovery' | 'recovery_method' | 'recovery_sms' | 'recovery_llamada' | 'recovery_pregunta' | 'recovery_pregunta_reset'
export default function LoginPage() {
  const { iniciarSesion, verificarMFA, admin } = useAuth();
  const navigate = useNavigate();

  const [vista, setVista] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [mfaData, setMfaData] = useState({ usuarioId: '', codigo: '' });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Para SMS/Llamada
  const [otpCode, setOtpCode] = useState('');
  // Para pregunta secreta
  const [preguntaRespuesta, setPreguntaRespuesta] = useState('');
  // Token de reset obtenido vía pregunta secreta
  const [resetToken, setResetToken] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  if (admin) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  // ── Paso 1: Login ──────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const data = await iniciarSesion(form.email, form.password);
      if (data.mfaRequerido) {
        setMfaData({ usuarioId: data.usuarioId, codigo: '' });
        setVista('mfa');
        showToast('Código enviado a tu correo', 'success');
      } else {
        showToast('¡Bienvenido!', 'success');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: Verificar MFA ──────────────────────────────────
  const handleMFA = async (e) => {
    e.preventDefault();
    setError('');
    if (!mfaData.codigo.trim()) { setError('Ingresa el código'); return; }
    setLoading(true);
    try {
      await verificarMFA(mfaData.usuarioId, mfaData.codigo);
      showToast('¡Bienvenido!', 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación por EMAIL ─────────────────────────────────
  const handleRecoveryEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (!recoveryEmail.trim()) { setError('Ingresa tu correo'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password/solicitar', { email: recoveryEmail, metodo: 'email' });
      showToast('Si el correo existe, recibirás un enlace de recuperación (revisa la consola del servidor)', 'success', 6000);
      setVista('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación por SMS ───────────────────────────────────
  const handleRecoverySMS = async (e) => {
    e.preventDefault();
    setError('');
    if (!recoveryEmail.trim()) { setError('Ingresa tu correo'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password/solicitar', { email: recoveryEmail, metodo: 'sms' });
      showToast('Si el correo existe, se envió un código SMS (revisa la consola del servidor)', 'success', 6000);
      setVista('recovery_sms');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación por LLAMADA ───────────────────────────────
  const handleRecoveryLlamada = async (e) => {
    e.preventDefault();
    setError('');
    if (!recoveryEmail.trim()) { setError('Ingresa tu correo'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password/solicitar', { email: recoveryEmail, metodo: 'llamada' });
      showToast('Si el correo existe, se generó un código de voz (revisa la consola del servidor)', 'success', 6000);
      setVista('recovery_llamada');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  // ── Validar código OTP (SMS o llamada) → reset contraseña ──
  const handleValidarOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) { setError('Ingresa el código'); return; }
    if (!nuevaPassword.trim()) { setError('Ingresa la nueva contraseña'); return; }
    if (nuevaPassword !== confirmarPassword) { setError('Las contraseñas no coinciden'); return; }
    if (nuevaPassword.length < 6) { setError('Mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password/reset', { token: otpCode, nuevaPassword });
      showToast('Contraseña actualizada correctamente', 'success');
      setVista('login');
      limpiarCampos();
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  // ── Recuperación por PREGUNTA SECRETA ──────────────────────
  const handleVerificarPregunta = async (e) => {
    e.preventDefault();
    setError('');
    if (!recoveryEmail.trim()) { setError('Ingresa tu correo'); return; }
    if (!preguntaRespuesta.trim()) { setError('Ingresa tu respuesta'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/pregunta-secreta/verificar', {
        email: recoveryEmail,
        respuesta: preguntaRespuesta
      });
      setResetToken(res.data.data.token);
      setVista('recovery_pregunta_reset');
      showToast('Respuesta correcta. Ahora cambia tu contraseña.', 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Respuesta incorrecta');
    } finally {
      setLoading(false);
    }
  };

  // ── Cambiar contraseña con token de pregunta secreta ───────
  const handleResetConPregunta = async (e) => {
    e.preventDefault();
    setError('');
    if (!nuevaPassword.trim()) { setError('Ingresa la nueva contraseña'); return; }
    if (nuevaPassword !== confirmarPassword) { setError('Las contraseñas no coinciden'); return; }
    if (nuevaPassword.length < 6) { setError('Mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/auth/password/reset', { token: resetToken, nuevaPassword });
      showToast('Contraseña actualizada correctamente', 'success');
      setVista('login');
      limpiarCampos();
    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  function limpiarCampos() {
    setRecoveryEmail('');
    setOtpCode('');
    setPreguntaRespuesta('');
    setResetToken('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setError('');
  }

  function irARecoveryMethod() {
    limpiarCampos();
    setVista('recovery_method');
  }

  function volverALogin() {
    limpiarCampos();
    setVista('login');
  }

  // ── Subtítulo según vista ──────────────────────────────────
  const subtitulos = {
    login: 'Panel de Administración',
    mfa: 'Verificación en dos pasos',
    recovery_method: 'Recuperar contraseña',
    recovery: 'Recuperar por correo',
    recovery_sms: 'Código SMS',
    recovery_llamada: 'Código de llamada',
    recovery_pregunta: 'Pregunta secreta',
    recovery_pregunta_reset: 'Nueva contraseña',
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">Dream Day</h1>
          <p className="login-subtitle">{subtitulos[vista] || 'Recuperar contraseña'}</p>
        </div>

        {/* ══════════ VISTA LOGIN ══════════ */}
        {vista === 'login' && (
          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="login-error">{error}</div>}
            <div className="login-field">
              <label className="login-label">Correo electrónico</label>
              <input type="email" name="email" className="login-input"
                placeholder="admin@dreamday.mx" value={form.email}
                onChange={handleChange} disabled={loading} />
            </div>
            <div className="login-field">
              <label className="login-label">Contraseña</label>
              <div className="login-password-wrapper">
                <input type={showPassword ? 'text' : 'password'} name="password"
                  className="login-input" placeholder="Tu contraseña"
                  value={form.password} onChange={handleChange} disabled={loading} />
                <button type="button" className="login-toggle-password" tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="button" className="login-forgot"
              onClick={irARecoveryMethod}>
              ¿Olvidaste tu contraseña?
            </button>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span>
                : <><LogIn size={18} /><span>Ingresar</span></>}
            </button>
          </form>
        )}

        {/* ══════════ VISTA MFA ══════════ */}
        {vista === 'mfa' && (
          <form className="login-form" onSubmit={handleMFA}>
            <div className="login-mfa-info">
              <ShieldCheck size={32} style={{ color: 'var(--color-primary, var(--cafe-claro))' }} />
              <p>Ingresa el código de 6 dígitos enviado a tu correo electrónico.</p>
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="login-field">
              <label className="login-label">Código de verificación</label>
              <input type="text" className="login-input login-otp-input"
                placeholder="000000" maxLength={6}
                value={mfaData.codigo}
                onChange={(e) => { setMfaData({ ...mfaData, codigo: e.target.value }); setError(''); }}
                disabled={loading} autoFocus />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span>
                : <><ShieldCheck size={18} /><span>Verificar código</span></>}
            </button>
            <button type="button" className="login-forgot" onClick={volverALogin}>
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* ══════════ SELECCIONAR MÉTODO DE RECUPERACIÓN ══════════ */}
        {vista === 'recovery_method' && (
          <div className="login-form">
            <div className="login-mfa-info">
              <KeyRound size={32} style={{ color: 'var(--color-primary, var(--cafe-claro))' }} />
              <p>Elige cómo deseas recuperar tu contraseña:</p>
            </div>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label className="login-label">Correo electrónico</label>
              <input type="email" className="login-input" placeholder="admin@dreamday.mx"
                value={recoveryEmail}
                onChange={(e) => { setRecoveryEmail(e.target.value); setError(''); }}
                disabled={loading} />
            </div>

            <div className="recovery-methods">
              <button type="button" className="recovery-method-btn" onClick={handleRecoveryEmail} disabled={loading}>
                <Mail size={20} />
                <div className="recovery-method-text">
                  <span className="recovery-method-title">Correo electrónico</span>
                  <span className="recovery-method-desc">Recibir enlace de recuperación</span>
                </div>
              </button>

              <button type="button" className="recovery-method-btn" onClick={handleRecoverySMS} disabled={loading}>
                <Phone size={20} />
                <div className="recovery-method-text">
                  <span className="recovery-method-title">SMS</span>
                  <span className="recovery-method-desc">Recibir código por mensaje de texto</span>
                </div>
              </button>

              <button type="button" className="recovery-method-btn" onClick={handleRecoveryLlamada} disabled={loading}>
                <PhoneCall size={20} />
                <div className="recovery-method-text">
                  <span className="recovery-method-title">Llamada telefónica</span>
                  <span className="recovery-method-desc">Recibir código por llamada de voz</span>
                </div>
              </button>

              <button type="button" className="recovery-method-btn" onClick={() => setVista('recovery_pregunta')} disabled={loading}>
                <HelpCircle size={20} />
                <div className="recovery-method-text">
                  <span className="recovery-method-title">Pregunta secreta</span>
                  <span className="recovery-method-desc">Responder tu pregunta de seguridad</span>
                </div>
              </button>
            </div>

            <button type="button" className="login-forgot" onClick={volverALogin}>
              ← Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* ══════════ RECUPERACIÓN SMS — INGRESAR OTP + NUEVA CONTRASEÑA ══════════ */}
        {(vista === 'recovery_sms' || vista === 'recovery_llamada') && (
          <form className="login-form" onSubmit={handleValidarOTP}>
            <div className="login-mfa-info">
              {vista === 'recovery_sms'
                ? <Phone size={32} style={{ color: 'var(--color-primary, var(--cafe-claro))' }} />
                : <PhoneCall size={32} style={{ color: 'var(--color-primary, var(--cafe-claro))' }} />
              }
              <p>
                {vista === 'recovery_sms'
                  ? 'Ingresa el código de 6 dígitos enviado por SMS y tu nueva contraseña.'
                  : 'Ingresa el código de 6 dígitos dictado por la llamada y tu nueva contraseña.'
                }
              </p>
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="login-field">
              <label className="login-label">Código de verificación</label>
              <input type="text" className="login-input login-otp-input"
                placeholder="000000" maxLength={6}
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
            </div>
            <div className="login-field">
              <label className="login-label">Nueva contraseña</label>
              <input type="password" className="login-input"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => { setNuevaPassword(e.target.value); setError(''); }}
                disabled={loading} />
            </div>
            <div className="login-field">
              <label className="login-label">Confirmar contraseña</label>
              <input type="password" className="login-input"
                placeholder="Repetir contraseña"
                value={confirmarPassword}
                onChange={(e) => { setConfirmarPassword(e.target.value); setError(''); }}
                disabled={loading} />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span>
                : <><KeyRound size={18} /><span>Cambiar contraseña</span></>}
            </button>
            <button type="button" className="login-forgot" onClick={irARecoveryMethod}>
              ← Probar otro método
            </button>
          </form>
        )}

        {/* ══════════ RECUPERACIÓN PREGUNTA SECRETA — VERIFICAR ══════════ */}
        {vista === 'recovery_pregunta' && (
          <form className="login-form" onSubmit={handleVerificarPregunta}>
            <div className="login-mfa-info">
              <HelpCircle size={32} style={{ color: 'var(--color-primary, var(--cafe-claro))' }} />
              <p>Ingresa tu correo y la respuesta a tu pregunta secreta.</p>
            </div>
            {error && <div className="login-error">{error}</div>}
            {!recoveryEmail && (
              <div className="login-field">
                <label className="login-label">Correo electrónico</label>
                <input type="email" className="login-input" placeholder="admin@dreamday.mx"
                  value={recoveryEmail}
                  onChange={(e) => { setRecoveryEmail(e.target.value); setError(''); }}
                  disabled={loading} />
              </div>
            )}
            {recoveryEmail && (
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '0.85rem', color: 'var(--texto-medio)', textAlign: 'center', marginBottom: '0.5rem' }}>
                Cuenta: <strong>{recoveryEmail}</strong>
              </p>
            )}
            <div className="login-field">
              <label className="login-label">Respuesta a tu pregunta secreta</label>
              <input type="text" className="login-input"
                placeholder="Tu respuesta"
                value={preguntaRespuesta}
                onChange={(e) => { setPreguntaRespuesta(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span>
                : <><HelpCircle size={18} /><span>Verificar respuesta</span></>}
            </button>
            <button type="button" className="login-forgot" onClick={irARecoveryMethod}>
              ← Probar otro método
            </button>
          </form>
        )}

        {/* ══════════ PREGUNTA SECRETA — NUEVA CONTRASEÑA ══════════ */}
        {vista === 'recovery_pregunta_reset' && (
          <form className="login-form" onSubmit={handleResetConPregunta}>
            <div className="login-mfa-info">
              <KeyRound size={32} style={{ color: 'var(--color-primary, var(--cafe-claro))' }} />
              <p>Respuesta correcta. Ahora establece tu nueva contraseña.</p>
            </div>
            {error && <div className="login-error">{error}</div>}
            <div className="login-field">
              <label className="login-label">Nueva contraseña</label>
              <input type="password" className="login-input"
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => { setNuevaPassword(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
            </div>
            <div className="login-field">
              <label className="login-label">Confirmar contraseña</label>
              <input type="password" className="login-input"
                placeholder="Repetir contraseña"
                value={confirmarPassword}
                onChange={(e) => { setConfirmarPassword(e.target.value); setError(''); }}
                disabled={loading} />
            </div>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? <span className="login-spinner"></span>
                : <><KeyRound size={18} /><span>Guardar contraseña</span></>}
            </button>
          </form>
        )}

        <div className="login-footer">
          <a href="/" className="login-back-link">← Volver al sitio</a>
        </div>
      </div>
    </div>
  );
}
