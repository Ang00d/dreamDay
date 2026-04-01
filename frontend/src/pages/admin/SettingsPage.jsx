import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import api from '../../services/api';
import {
  Shield, ShieldOff, ShieldCheck, Key, Monitor,
  Trash2, LogOut, User, Bell, Moon, Sun, HelpCircle
} from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const { admin, cerrarSesion } = useAuth();
  const [sesiones, setSesiones] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Formularios
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mfaCodigo, setMfaCodigo] = useState('');
  const [mfaDesactivarPass, setMfaDesactivarPass] = useState('');
  const [mfaPendiente, setMfaPendiente] = useState(false);
  const [pregunta, setPregunta] = useState({ pregunta: '', respuesta: '' });
  const [preferencias, setPreferencias] = useState({ tema: 'claro' });
  const [guardando, setGuardando] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [settRes, sesRes] = await Promise.all([
        api.get('/auth/settings'),
        api.get('/auth/sessions')
      ]);
      setSettings(settRes.data.data);
      setSesiones(sesRes.data.data);
      setPreferencias(settRes.data.data.preferencias || { tema: 'claro' });
    } catch (_) {
      showToast('Error al cargar configuración', 'error');
    } finally {
      setCargando(false);
    }
  }

  // ── Cambiar contraseña ─────────────────────────────────────
  async function handleCambiarPassword(e) {
    e.preventDefault();
    if (passwordForm.nueva !== passwordForm.confirmar) {
      showToast('Las contraseñas no coinciden', 'error'); return;
    }
    if (passwordForm.nueva.length < 6) {
      showToast('Mínimo 6 caracteres', 'error'); return;
    }
    setGuardando('password');
    try {
      await api.post('/auth/password/cambiar', {
        passwordActual: passwordForm.actual,
        nuevaPassword: passwordForm.nueva
      });
      showToast('Contraseña actualizada', 'success');
      setPasswordForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Error al cambiar contraseña', 'error');
    } finally {
      setGuardando('');
    }
  }

  // ── MFA ────────────────────────────────────────────────────
  async function activarMFA() {
    setGuardando('mfa');
    try {
      await api.post('/auth/settings/mfa/activar');
      setMfaPendiente(true);
      showToast('Código enviado a tu correo', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error', 'error');
    } finally { setGuardando(''); }
  }

  async function confirmarMFA(e) {
    e.preventDefault();
    setGuardando('mfa');
    try {
      await api.post('/auth/settings/mfa/confirmar', { codigo: mfaCodigo });
      showToast('MFA activado correctamente', 'success');
      setMfaPendiente(false);
      setMfaCodigo('');
      setSettings(s => ({ ...s, mfaActivo: true }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Código incorrecto', 'error');
    } finally { setGuardando(''); }
  }

  async function desactivarMFA(e) {
    e.preventDefault();
    setGuardando('mfa');
    try {
      await api.post('/auth/settings/mfa/desactivar', { password: mfaDesactivarPass });
      showToast('MFA desactivado', 'success');
      setMfaDesactivarPass('');
      setSettings(s => ({ ...s, mfaActivo: false }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Contraseña incorrecta', 'error');
    } finally { setGuardando(''); }
  }

  // ── Sesiones ───────────────────────────────────────────────
  async function cerrarSesionRemota(id) {
    try {
      await api.delete('/auth/sessions/' + id);
      setSesiones(s => s.filter(x => x.id !== id));
      showToast('Sesión cerrada', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error', 'error');
    }
  }

  async function cerrarTodasSesiones() {
    try {
      const res = await api.delete('/auth/sessions');
      await cargarDatos();
      showToast(res.data.data.mensaje, 'success');
    } catch (_) { showToast('Error', 'error'); }
  }

  // ── Pregunta secreta ───────────────────────────────────────
  async function guardarPregunta(e) {
    e.preventDefault();
    if (!pregunta.pregunta || !pregunta.respuesta) {
      showToast('Completa pregunta y respuesta', 'error'); return;
    }
    setGuardando('pregunta');
    try {
      await api.post('/auth/pregunta-secreta', pregunta);
      showToast('Pregunta secreta guardada', 'success');
      setPregunta({ pregunta: '', respuesta: '' });
      setSettings(s => ({ ...s, tienePreguntaSecreta: true }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Error', 'error');
    } finally { setGuardando(''); }
  }

  // ── Preferencias ───────────────────────────────────────────
  async function guardarPreferencias() {
    setGuardando('preferencias');
    try {
      await api.patch('/auth/settings', { preferencias });
      showToast('Preferencias guardadas', 'success');
    } catch (_) { showToast('Error', 'error'); }
    finally { setGuardando(''); }
  }

  function formatFecha(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  }

  if (cargando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Configuración de cuenta</h1>
        <p>Gestiona tu seguridad, sesiones y preferencias</p>
      </div>

      {/* ── Sección MFA ───────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Shield size={20} />
          <h2>Autenticación en dos pasos (MFA)</h2>
          <span className={'settings-badge ' + (settings?.mfaActivo ? 'activo' : 'inactivo')}>
            {settings?.mfaActivo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="settings-desc">
          Al activar el MFA, necesitarás ingresar un código de 6 dígitos enviado a tu correo cada vez que inicies sesión.
        </p>

        {!settings?.mfaActivo && !mfaPendiente && (
          <button className="settings-btn-primary" onClick={activarMFA} disabled={guardando === 'mfa'}>
            <ShieldCheck size={16} /> Activar MFA
          </button>
        )}

        {!settings?.mfaActivo && mfaPendiente && (
          <form onSubmit={confirmarMFA} className="settings-inline-form">
            <input type="text" placeholder="Código de 6 dígitos" maxLength={6}
              value={mfaCodigo} onChange={e => setMfaCodigo(e.target.value)}
              className="settings-input" />
            <button type="submit" className="settings-btn-primary" disabled={guardando === 'mfa'}>
              Confirmar
            </button>
            <button type="button" className="settings-btn-ghost" onClick={() => setMfaPendiente(false)}>
              Cancelar
            </button>
          </form>
        )}

        {settings?.mfaActivo && (
          <form onSubmit={desactivarMFA} className="settings-inline-form">
            <input type="password" placeholder="Confirma tu contraseña para desactivar"
              value={mfaDesactivarPass}
              onChange={e => setMfaDesactivarPass(e.target.value)}
              className="settings-input" />
            <button type="submit" className="settings-btn-danger" disabled={guardando === 'mfa'}>
              <ShieldOff size={16} /> Desactivar MFA
            </button>
          </form>
        )}
      </div>

      {/* ── Cambiar contraseña ────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Key size={20} />
          <h2>Cambiar contraseña</h2>
        </div>
        <form onSubmit={handleCambiarPassword} className="settings-form">
          <div className="settings-field">
            <label>Contraseña actual</label>
            <input type="password" className="settings-input"
              value={passwordForm.actual}
              onChange={e => setPasswordForm({ ...passwordForm, actual: e.target.value })} />
          </div>
          <div className="settings-field">
            <label>Nueva contraseña</label>
            <input type="password" className="settings-input"
              value={passwordForm.nueva}
              onChange={e => setPasswordForm({ ...passwordForm, nueva: e.target.value })} />
          </div>
          <div className="settings-field">
            <label>Confirmar nueva contraseña</label>
            <input type="password" className="settings-input"
              value={passwordForm.confirmar}
              onChange={e => setPasswordForm({ ...passwordForm, confirmar: e.target.value })} />
          </div>
          <button type="submit" className="settings-btn-primary" disabled={guardando === 'password'}>
            {guardando === 'password' ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>

      {/* ── Pregunta secreta ──────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <HelpCircle size={20} />
          <h2>Pregunta secreta</h2>
          {settings?.tienePreguntaSecreta && (
            <span className="settings-badge activo">Configurada</span>
          )}
        </div>
        <p className="settings-desc">Se usa como método alternativo de recuperación de contraseña.</p>
        <form onSubmit={guardarPregunta} className="settings-form">
          <div className="settings-field">
            <label>Pregunta</label>
            <input type="text" className="settings-input" placeholder="Ej: ¿Nombre de tu primera mascota?"
              value={pregunta.pregunta}
              onChange={e => setPregunta({ ...pregunta, pregunta: e.target.value })} />
          </div>
          <div className="settings-field">
            <label>Respuesta</label>
            <input type="text" className="settings-input" placeholder="Tu respuesta (no distingue mayúsculas)"
              value={pregunta.respuesta}
              onChange={e => setPregunta({ ...pregunta, respuesta: e.target.value })} />
          </div>
          <button type="submit" className="settings-btn-primary" disabled={guardando === 'pregunta'}>
            {settings?.tienePreguntaSecreta ? 'Actualizar pregunta' : 'Guardar pregunta'}
          </button>
        </form>
      </div>

      {/* ── Sesiones activas ──────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Monitor size={20} />
          <h2>Sesiones activas</h2>
          <span className="settings-badge neutral">{sesiones.length} sesión(es)</span>
        </div>
        <p className="settings-desc">Estas son todas las sesiones donde tienes la cuenta abierta actualmente.</p>

        <div className="settings-sesiones">
          {sesiones.map(s => (
            <div key={s.id} className={'settings-sesion' + (s.esActual ? ' actual' : '')}>
              <div className="settings-sesion-info">
                <Monitor size={16} />
                <div>
                  <span className="settings-sesion-dispositivo">
                    {s.dispositivo}
                    {s.esActual && <span className="settings-sesion-current"> · Sesión actual</span>}
                  </span>
                  <span className="settings-sesion-meta">
                    {s.ip} · {formatFecha(s.ultimaActividad)}
                  </span>
                </div>
              </div>
              {!s.esActual && (
                <button className="settings-btn-icon-danger"
                  onClick={() => cerrarSesionRemota(s.id)}
                  title="Cerrar esta sesión">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {sesiones.length > 1 && (
          <button className="settings-btn-danger" style={{ marginTop: '1rem' }}
            onClick={cerrarTodasSesiones}>
            <LogOut size={16} /> Cerrar todas las demás sesiones
          </button>
        )}
      </div>

      {/* ── Preferencias ─────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          {preferencias.tema === 'oscuro' ? <Moon size={20} /> : <Sun size={20} />}
          <h2>Preferencias</h2>
        </div>
        <div className="settings-field">
          <label>Tema</label>
          <div className="settings-toggle-group">
            <button
              className={'settings-toggle' + (preferencias.tema === 'claro' ? ' active' : '')}
              onClick={() => setPreferencias({ ...preferencias, tema: 'claro' })}>
              <Sun size={16} /> Claro
            </button>
            <button
              className={'settings-toggle' + (preferencias.tema === 'oscuro' ? ' active' : '')}
              onClick={() => setPreferencias({ ...preferencias, tema: 'oscuro' })}>
              <Moon size={16} /> Oscuro
            </button>
          </div>
        </div>
        <button className="settings-btn-primary" onClick={guardarPreferencias}
          disabled={guardando === 'preferencias'}>
          Guardar preferencias
        </button>
      </div>

      {/* ── Rol actual ───────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <User size={20} />
          <h2>Información de cuenta</h2>
        </div>
        <div className="settings-info-grid">
          <div><span className="settings-label">Nombre</span><span>{admin?.nombre}</span></div>
          <div><span className="settings-label">Email</span><span>{admin?.email}</span></div>
          <div><span className="settings-label">Rol</span>
            <span className={'settings-badge rol-' + admin?.rol}>{admin?.rol}</span>
          </div>
          <div><span className="settings-label">Último acceso</span>
            <span>{formatFecha(settings?.ultimoLogin)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
