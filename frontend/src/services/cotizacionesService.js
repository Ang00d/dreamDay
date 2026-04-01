/* ============================================
   DREAM DAY — Service: Cotizaciones
   Llamadas al API para cotizaciones
   ============================================ */

import api from './api';

var cotizacionesService = {
  /**
   * Crear una nueva solicitud de cotizacion
   * POST /api/cotizaciones
   */
  crear: async function (datos) {
    var response = await api.post('/cotizaciones', datos);
    return response.data.data;
  },

  /**
   * Consultar estado de una cotizacion por codigo
   * GET /api/cotizaciones/consultar/:codigo
   */
  consultar: async function (codigo) {
    var response = await api.get('/cotizaciones/consultar/' + codigo);
    return response.data.data;
  }
};

export default cotizacionesService;
