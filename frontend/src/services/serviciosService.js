/* ============================================
   DREAM DAY — Service: Servicios
   Llamadas al API para servicios
   ============================================ */

import api from './api';

var serviciosService = {
  /**
   * Obtener todos los servicios activos
   * GET /api/servicios
   * @param {string} categoriaId - Filtrar por categoria (opcional)
   * @param {string} buscar - Buscar por texto (opcional)
   */
  obtenerTodos: async function (categoriaId, buscar) {
    var params = {};
    if (categoriaId) params.categoria = categoriaId;
    if (buscar) params.buscar = buscar;

    var response = await api.get('/servicios', { params: params });
    return response.data.data;
  },

  /**
   * Obtener un servicio por ID
   * GET /api/servicios/:id
   */
  obtenerPorId: async function (id) {
    var response = await api.get('/servicios/' + id);
    return response.data.data;
  }
};

export default serviciosService;
