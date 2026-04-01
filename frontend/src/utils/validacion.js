/* ============================================
   DREAM DAY — Validacion de Formularios
   ★ VANILLA JS PURO — Requisito universitario DOM
   
   Demuestra: querySelectorAll, addEventListener ('input'),
   classList.toggle, dataset (data-validate, data-error-msg),
   nextElementSibling, textContent
   ============================================ */

function setupValidacion(formElement) {
  var inputs = formElement.querySelectorAll('input[data-validate]');

  inputs.forEach(function (input) {
    input.addEventListener('input', function (e) {
      var regla = e.target.dataset.validate;
      var valor = e.target.value;
      var valido = false;

      switch (regla) {
        case 'nombre':
          valido = valor.length >= 3;
          break;
        case 'email':
          valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
          break;
        case 'telefono':
          valido = /^[1-9]\d{9}$/.test(valor);
          break;
        case 'cp':
          valido = /^\d{5}$/.test(valor);
          break;
        case 'ubicacion':
          valido = valor.length >= 5;
          break;
        case 'personas':
          valido = parseInt(valor) > 0;
          break;
        default:
          valido = valor.length > 0;
      }

      e.target.classList.toggle('input-valid', valido);
      e.target.classList.toggle('input-error', !valido && valor.length > 0);

      var errorMsg = e.target.nextElementSibling;
      if (errorMsg && errorMsg.classList.contains('error-message')) {
        errorMsg.textContent = valido ? '' : (e.target.dataset.errorMsg || 'Campo invalido');
      }
    });
  });
}

function validarFormulario(formElement) {
  var inputs = formElement.querySelectorAll('input[data-validate]');
  var todoValido = true;

  inputs.forEach(function (input) {
    input.dispatchEvent(new Event('input'));
    if (input.classList.contains('input-error') || input.value.trim() === '') {
      todoValido = false;
    }
  });

  return todoValido;
}

export { setupValidacion, validarFormulario };
