/* ============================================
   DREAM DAY — Carrito con LocalStorage
   ★ VANILLA JS PURO — Requisito universitario DOM
   
   Demuestra: localStorage (getItem, setItem, removeItem),
   querySelector, textContent, classList.toggle,
   JSON.parse, JSON.stringify
   
   Actualizado: ahora guarda tipoPrecio para el wizard
   ============================================ */
var CART_KEY = 'dreamday_carrito';
var carritoStorage = {
  obtener: function () {
    var data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  },
  guardar: function (items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    var badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = items.length;
      badge.classList.toggle('hidden', items.length === 0);
    }
  },
  agregar: function (servicio) {
    var items = this.obtener();
    if (items.find(function (i) { return i.id === servicio.id; })) return false;
    items.push({
      id: servicio.id,
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      descripcionCorta: servicio.descripcionCorta,
      requisitoMinimo: servicio.requisitoMinimo,
      duracionHoras: servicio.duracionHoras,
      tipoPrecio: servicio.tipoPrecio || 'precio_fijo',
      imagenPrincipal: servicio.imagenPrincipal || null
    });
    this.guardar(items);
    return true;
  },
  eliminar: function (servicioId) {
    var items = this.obtener().filter(function (i) { return i.id !== servicioId; });
    this.guardar(items);
  },
  limpiar: function () {
    localStorage.removeItem(CART_KEY);
    this.guardar([]);
  },
  contarItems: function () {
    return this.obtener().length;
  }
};
export default carritoStorage;
