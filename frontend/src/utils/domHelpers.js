/* ============================================
   DREAM DAY — Helpers DOM
   ★ VANILLA JS PURO — Requisito universitario DOM
   
   Demuestra: querySelectorAll, addEventListener,
   preventDefault, scrollIntoView, closest,
   delegacion de eventos, classList
   ============================================ */

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupMenuMobile() {
  var menuToggle = document.querySelector('.menu-toggle');
  var navMobile = document.querySelector('.nav-mobile');

  if (!menuToggle || !navMobile) return;

  menuToggle.addEventListener('click', function () {
    menuToggle.classList.toggle('active');
    navMobile.classList.toggle('active');
  });

  navMobile.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      menuToggle.classList.remove('active');
      navMobile.classList.remove('active');
    });
  });
}

function confirmarEliminacion(nombre, callback) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay modal-confirm';

  var html = '<div class="modal-content">';
  html += '<h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 1rem; color: var(--texto-oscuro);">';
  html += 'Eliminar "' + nombre + '"?</h3>';
  html += '<p style="color: var(--texto-medio); margin-bottom: 1.5rem;">Esta accion no se puede deshacer.</p>';
  html += '<div style="display: flex; gap: 1rem; justify-content: flex-end;">';
  html += '<button class="btn-secondary btn-cancelar">Cancelar</button>';
  html += '<button class="btn-primary btn-confirmar" style="background: var(--error);">Eliminar</button>';
  html += '</div></div>';

  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  overlay.querySelector('.btn-cancelar').addEventListener('click', function () {
    overlay.remove();
  });

  overlay.querySelector('.btn-confirmar').addEventListener('click', function () {
    callback();
    overlay.remove();
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

export { setupSmoothScroll, setupMenuMobile, confirmarEliminacion };
