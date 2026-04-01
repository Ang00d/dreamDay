/* ============================================
   DREAM DAY — Configuracion Axios
   Actualizado Práctica 3: manejo de refresh token
   ============================================ */

import axios from 'axios';
import frontendLogger from '../utils/frontendLogger';

var API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

var api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Flag para evitar múltiples intentos de refresh simultáneos
var renovandoToken = false;

api.interceptors.request.use(
  function (config) {
    var token = localStorage.getItem('dreamday_token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    frontendLogger.debug('API Request', {
      method: config.method ? config.method.toUpperCase() : '',
      url: config.url
    });
    return config;
  },
  function (error) {
    frontendLogger.error('Error en request API', { message: error.message });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function (response) {
    frontendLogger.debug('API Response OK', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  async function (error) {
    var status = error.response ? error.response.status : null;
    var url = error.config ? error.config.url : '';
    var message = (error.response && error.response.data && error.response.data.error) || error.message;
    frontendLogger.error('API Response Error', { status, url, message });

    // Si es 401 y tenemos refresh token, intentar renovar
    var refreshToken = localStorage.getItem('dreamday_refresh');
    var esRutaAuth = url && (url.includes('/auth/login') || url.includes('/auth/refresh'));

    if (status === 401 && refreshToken && !renovandoToken && !esRutaAuth) {
      renovandoToken = true;
      try {
        var res = await axios.post(API_BASE_URL + '/auth/refresh', { refreshToken });
        var nuevoToken = res.data.data.accessToken;
        var nuevoRefresh = res.data.data.refreshToken;

        localStorage.setItem('dreamday_token', nuevoToken);
        localStorage.setItem('dreamday_refresh', nuevoRefresh);

        // Reintentar la petición original con el nuevo token
        error.config.headers.Authorization = 'Bearer ' + nuevoToken;
        renovandoToken = false;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh falló — cerrar sesión
        renovandoToken = false;
        localStorage.removeItem('dreamday_token');
        localStorage.removeItem('dreamday_refresh');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // 401 sin refresh token → cerrar sesión
    if (status === 401 && !refreshToken) {
      localStorage.removeItem('dreamday_token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
