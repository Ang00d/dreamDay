/* ============================================
   DREAM DAY — Service: Categorias
   Llamadas al API para categorias
   ============================================ */

import api from './api';

var categoriasService = {
  /**
   * Obtener todas las categorias activas
   * GET /api/categorias
   */
  obtenerTodas: async function () {
    var response = await api.get('/categorias');
    return response.data.data;
  },

  /**
   * Obtener una categoria por slug
   * GET /api/categorias/:slug
   */
  obtenerPorSlug: async function (slug) {
    var response = await api.get('/categorias/' + slug);
    return response.data.data;
  }
};

export default categoriasService;
