/* ============================================
   DREAM DAY — Service: Auth
   Llamadas al API para autenticacion admin
   ============================================ */

import api from './api';

var authService = {
  /**
   * Login de admin
   * POST /api/auth/login
   */
  login: async function (email, password) {
    var response = await api.post('/auth/login', {
      email: email,
      password: password
    });
    var data = response.data.data;

    // Guardar token en localStorage
    localStorage.setItem('dreamday_token', data.token);

    return data;
  },

  /**
   * Verificar token actual
   * GET /api/auth/me
   */
  verificarToken: async function () {
    var response = await api.get('/auth/me');
    return response.data.data;
  },

  /**
   * Cerrar sesion (eliminar token)
   */
  logout: function () {
    localStorage.removeItem('dreamday_token');
  },

  /**
   * Verificar si hay un token guardado
   */
  estaAutenticado: function () {
    return !!localStorage.getItem('dreamday_token');
  }
};

export default authService;
