import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import frontendLogger from '../utils/frontendLogger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Al montar: restaurar sesión si hay token guardado
  useEffect(() => {
    const accessToken = localStorage.getItem('dreamday_token');
    const refreshToken = localStorage.getItem('dreamday_refresh');
    if (accessToken && refreshToken) {
      verificarToken();
    } else {
      setLoading(false);
    }
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Verificar token actual
  const verificarToken = async () => {
    try {
      const res = await api.get('/auth/me');
      const usuario = res.data.data;
      setAdmin(usuario);
      programarRefresh();
      frontendLogger.info('Sesión restaurada');
    } catch (err) {
      // Token expirado — intentar renovar
      try {
        await renovarToken();
      } catch {
        cerrarSesion();
      }
    } finally {
      setLoading(false);
    }
  };

  // Renovar access token usando refresh token
  const renovarToken = async () => {
    const refreshToken = localStorage.getItem('dreamday_refresh');
    if (!refreshToken) throw new Error('Sin refresh token');

    const res = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: nuevoRefresh } = res.data.data;

    localStorage.setItem('dreamday_token', accessToken);
    localStorage.setItem('dreamday_refresh', nuevoRefresh);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;

    // Obtener datos del usuario
    const meRes = await api.get('/auth/me');
    setAdmin(meRes.data.data);
    programarRefresh();
  };

  // Programar renovación automática 1 minuto antes de que expire (14 min)
  const programarRefresh = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try { await renovarToken(); }
      catch { cerrarSesion(); }
    }, 14 * 60 * 1000);
  };

  // Login — paso 1
  const iniciarSesion = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data.data;

    // Si requiere MFA: retornar info para que LoginPage muestre el paso 2
    if (data.mfaRequerido) return data;

    // Login completo
    localStorage.setItem('dreamday_token', data.accessToken);
    localStorage.setItem('dreamday_refresh', data.refreshToken);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
    setAdmin(data.usuario);
    programarRefresh();
    frontendLogger.info('Login exitoso');
    return data;
  };

  // Login — paso 2 (verificar OTP)
  const verificarMFA = async (usuarioId, codigo) => {
    const res = await api.post('/auth/mfa/verificar', { usuarioId, codigo });
    const data = res.data.data;
    localStorage.setItem('dreamday_token', data.accessToken);
    localStorage.setItem('dreamday_refresh', data.refreshToken);
    api.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
    setAdmin(data.usuario);
    programarRefresh();
    return data;
  };

  // Cerrar sesión
  const cerrarSesion = async () => {
    try {
      const token = localStorage.getItem('dreamday_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        await api.post('/auth/logout');
      }
    } catch (_) {}
    localStorage.removeItem('dreamday_token');
    localStorage.removeItem('dreamday_refresh');
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    frontendLogger.info('Sesión cerrada');
  };

  return (
    <AuthContext.Provider value={{ admin, loading, iniciarSesion, verificarMFA, cerrarSesion, renovarToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
