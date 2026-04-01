import api from './api';

export const adminService = {

  // --- Dashboard ---
  getDashboard: function () {
    return api.get('/admin/dashboard');
  },

  // --- Cotizaciones ---
  getCotizaciones: function (params) {
    var queryParts = [];
    if (params) {
      if (params.pagina) queryParts.push('pagina=' + params.pagina);
      if (params.limite) queryParts.push('limite=' + params.limite);
      if (params.estado) queryParts.push('estado=' + params.estado);
      if (params.busqueda) queryParts.push('busqueda=' + encodeURIComponent(params.busqueda));
      if (params.fechaDesde) queryParts.push('fechaDesde=' + params.fechaDesde);
      if (params.fechaHasta) queryParts.push('fechaHasta=' + params.fechaHasta);
    }
    var query = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    return api.get('/admin/cotizaciones' + query);
  },

  getCotizacion: function (id) {
    return api.get('/admin/cotizaciones/' + id);
  },

  actualizarCotizacion: function (id, datos) {
    return api.patch('/admin/cotizaciones/' + id, datos);
  },

  // --- Disponibilidad ---
  bloquearFecha: function (datos) {
    return api.post('/admin/disponibilidad/bloquear', datos);
  },

  desbloquearFecha: function (id) {
    return api.delete('/admin/disponibilidad/' + id);
  },

  // --- Servicios ---
  getServicios: function () {
    return api.get('/admin/servicios');
  },

  actualizarServicio: function (id, datos) {
    return api.patch('/admin/servicios/' + id, datos);
  },

  // --- Imágenes (NUEVO) ---
  subirImagen: function (servicioId, formData) {
    return api.post('/admin/servicios/' + servicioId + '/imagenes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  eliminarImagen: function (servicioId, imagenId) {
    return api.delete('/admin/servicios/' + servicioId + '/imagenes/' + imagenId);
  },

  marcarImagenPrincipal: function (servicioId, imagenId) {
    return api.patch('/admin/servicios/' + servicioId + '/imagenes/' + imagenId + '/principal');
  }
};
