/* ============================================
   DREAM DAY — Sistema de Notificaciones Toast
   ★ VANILLA JS PURO — Requisito universitario DOM
   
   Demuestra: createElement, appendChild, remove,
   classList (add/toggle), textContent, addEventListener,
   querySelector, setTimeout
   ============================================ */

/**
 * Muestra una notificacion toast
 * @param {string} message - Texto del mensaje
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Milisegundos antes de desaparecer
 */
function showToast(message, type = 'info', duration = 3000) {
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.classList.add('toast-enter');
  toast.textContent = message;

  var container = document.querySelector('.toast-container');
  if (!container) {
    container = createToastContainer();
  }

  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', function () {
      toast.remove();
    });
  }, duration);
}

/**
 * Crea el contenedor de toasts si no existe
 * @returns {HTMLElement} El contenedor
 */
function createToastContainer() {
  var container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

export { showToast };
