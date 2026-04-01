import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import api from '../../services/api';
import { ExternalLink, Users, Plus, Trash2, ShieldCheck } from 'lucide-react';
import './AdminUserPage.css';

// Solo superadmin puede gestionar usuarios
export default function AdminUserPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ssoToken, setSsoToken] = useState(null);
  const [nuevoUser, setNuevoUser] = useState({ nombre: '', email: '', password: '', rol: 'editor' });
  const [creando, setCreando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    if (admin?.rol !== 'superadmin') {
      navigate('/admin/dashboard');
      return;
    }
    cargarUsuarios();
  }, [admin]);

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const res = await api.get('/admin/usuarios');
      setUsuarios(res.data.data);
    } catch (_) { showToast('Error al cargar usuarios', 'error'); }
    finally { setCargando(false); }
  }

  async function crearUsuario(e) {
    e.preventDefault();
    if (!nuevoUser.nombre || !nuevoUser.email || !nuevoUser.password) {
      showToast('Completa todos los campos', 'error'); return;
    }
    setCreando(true);
    try {
      await api.post('/admin/usuarios', nuevoUser);
      showToast('Usuario creado', 'success');
      setNuevoUser({ nombre: '', email: '', password: '', rol: 'editor' });
      setMostrarForm(false);
      cargarUsuarios();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error', 'error');
    } finally { setCreando(false); }
  }

  async function toggleActivo(id, activo) {
    try {
      await api.patch('/admin/usuarios/' + id, { activo: !activo });
      setUsuarios(u => u.map(x => x._id === id ? { ...x, activo: !activo } : x));
      showToast(activo ? 'Usuario desactivado' : 'Usuario activado', 'success');
    } catch (_) { showToast('Error', 'error'); }
  }

  async function generarSSO() {
    try {
      const res = await api.post('/sso/token');
      setSsoToken(res.data.data);
    } catch (_) { showToast('Error al generar token SSO', 'error'); }
  }

  const ROLES = { superadmin: { label: 'Superadmin', cls: 'rol-superadmin' }, admin: { label: 'Admin', cls: 'rol-admin' }, editor: { label: 'Editor', cls: 'rol-editor' } };

  if (cargando) return <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;

  return (
    <div className="adminuser-page">
      <div className="adminuser-header">
        <h1>Gestión de Usuarios y SSO</h1>
        <p>Solo accesible para <strong>superadmin</strong></p>
      </div>

      {/* ── SSO Demo ──────────────────────────────────────── */}
      <div className="adminuser-card">
        <div className="adminuser-card-header">
          <ShieldCheck size={20} />
          <h2>Single Sign-On (SSO Demo)</h2>
        </div>
        <p className="adminuser-desc">
          Genera un token SSO para acceder a <strong>App B (Dream Day Reports)</strong> sin volver a autenticarte.
          El token es válido por 5 minutos y de un solo uso.
        </p>
        <button className="adminuser-btn-primary" onClick={generarSSO}>
          <ExternalLink size={16} /> Generar token SSO
        </button>

        {ssoToken && (
          <div className="sso-result">
            <p>✅ Token generado. Haz clic para acceder a App B:</p>
            <a href={ssoToken.urlAppB} target="_blank" rel="noopener noreferrer" className="sso-btn-appb">
              <ExternalLink size={16} /> Abrir App B (Dream Day Reports)
            </a>
            <p className="sso-expira">Expira: {new Date(ssoToken.expiracion).toLocaleTimeString('es-MX')}</p>
          </div>
        )}
      </div>

      {/* ── Lista de usuarios ─────────────────────────────── */}
      <div className="adminuser-card">
        <div className="adminuser-card-header">
          <Users size={20} />
          <h2>Usuarios del sistema</h2>
          <button className="adminuser-btn-small" onClick={() => setMostrarForm(!mostrarForm)}>
            <Plus size={14} /> Nuevo usuario
          </button>
        </div>

        {/* Formulario nuevo usuario */}
        {mostrarForm && (
          <form onSubmit={crearUsuario} className="adminuser-form">
            <div className="adminuser-form-grid">
              <div className="adminuser-field">
                <label>Nombre</label>
                <input type="text" placeholder="Nombre completo" value={nuevoUser.nombre}
                  onChange={e => setNuevoUser({ ...nuevoUser, nombre: e.target.value })} />
              </div>
              <div className="adminuser-field">
                <label>Email</label>
                <input type="email" placeholder="correo@dreamday.mx" value={nuevoUser.email}
                  onChange={e => setNuevoUser({ ...nuevoUser, email: e.target.value })} />
              </div>
              <div className="adminuser-field">
                <label>Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={nuevoUser.password}
                  onChange={e => setNuevoUser({ ...nuevoUser, password: e.target.value })} />
              </div>
              <div className="adminuser-field">
                <label>Rol</label>
                <select value={nuevoUser.rol} onChange={e => setNuevoUser({ ...nuevoUser, rol: e.target.value })}>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button type="submit" className="adminuser-btn-primary" disabled={creando}>
                {creando ? 'Creando...' : 'Crear usuario'}
              </button>
              <button type="button" className="adminuser-btn-ghost" onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        <div className="adminuser-lista">
          {usuarios.map(u => (
            <div key={u._id} className={'adminuser-item' + (!u.activo ? ' inactivo' : '')}>
              <div className="adminuser-item-avatar">{u.nombre?.[0] || 'U'}</div>
              <div className="adminuser-item-info">
                <span className="adminuser-nombre">{u.nombre}</span>
                <span className="adminuser-email">{u.email}</span>
              </div>
              <span className={'adminuser-rol ' + (ROLES[u.rol]?.cls || '')}>{ROLES[u.rol]?.label || u.rol}</span>
              <span className={'adminuser-estado ' + (u.activo ? 'activo' : 'inactivo')}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
              {u._id !== admin?._id && (
                <button className={'adminuser-btn-toggle ' + (u.activo ? 'desactivar' : 'activar')}
                  onClick={() => toggleActivo(u._id, u.activo)}>
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
