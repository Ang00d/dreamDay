/* ============================================
   DREAM DAY — Service: Disponibilidad
   Llamadas al API para disponibilidad/calendario
   ============================================ */

import api from './api';

var disponibilidadService = {
  /**
   * Obtener estado de un dia
   * GET /api/disponibilidad?fecha=YYYY-MM-DD
   */
  obtenerDia: async function (fecha) {
    var response = await api.get('/disponibilidad', { params: { fecha: fecha } });
    return response.data.data;
  },

  /**
   * Obtener calendario de un mes completo
   * GET /api/disponibilidad/mes?anio=2026&mes=3
   */
  obtenerMes: async function (anio, mes) {
    var response = await api.get('/disponibilidad/mes', {
      params: { anio: anio, mes: mes }
    });
    return response.data.data;
  },

  /**
   * Verificar disponibilidad de un servicio en una fecha
   * GET /api/disponibilidad/servicio/:id?fecha=YYYY-MM-DD
   */
  verificarServicio: async function (servicioId, fecha) {
    var response = await api.get('/disponibilidad/servicio/' + servicioId, {
      params: { fecha: fecha }
    });
    return response.data.data;
  }
};

export default disponibilidadService;
