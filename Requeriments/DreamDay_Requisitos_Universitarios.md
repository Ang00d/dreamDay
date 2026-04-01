# DREAM DAY — REQUISITOS UNIVERSITARIOS INTEGRADOS
## Logging (Tarea Teams) + DOM Avanzado (Práctica Unidad 2)

---

## 1. TAREA: SISTEMA DE LOGGING

### Qué piden
Implementar logging full-stack en JSON, generar escenarios de prueba y analizarlos con Grafana+Loki.

### Cómo se integra en Dream Day

**Backend (Winston):**
- Log de cada request (método, ruta, status, latencia)
- Excepciones con stacktrace
- Eventos de negocio: cotizacion_creada, cita_confirmada, servicio_bloqueado
- Queries lentas a MongoDB (>500ms)
- Correlation ID por request (UUID)
- Formato JSON, timestamps UTC, rotación de archivos

**Frontend (React):**
- window.onerror y unhandledrejection
- Eventos de UI (agregar al carrito, enviar cotización)
- Cambios de ruta (SPA navigation)
- Métricas de carga (performance.now)

**Herramienta de análisis:** Grafana + Loki (Docker, gratis)

**Escenarios mínimos a generar:**
- ≥20 requests exitosos en 3 rutas distintas
- ≥3 errores (404, 500, validación)
- ≥5 eventos de negocio
- ≥2 casos con latencia >500ms

**Dependencias:** winston, winston-daily-rotate-file, uuid

**Detalle completo:** Ver DreamDay_Sistema_Logging.md

---

## 2. PRÁCTICA: MANIPULACIÓN AVANZADA DEL DOM

### Qué piden
Aplicar manipulación avanzada del DOM con JavaScript puro (Vanilla JS): CRUD dinámico, eventos, localStorage, arquitectura modular.

### Cómo se integra en Dream Day

Aunque Dream Day usa React, hay componentes y secciones donde se aplica DOM avanzado con Vanilla JS directamente. React es una capa sobre el DOM, pero podemos demostrar conocimiento de DOM puro en partes específicas.

### 2.1 Conceptos del DOM aplicados en el proyecto

| Concepto requerido | Dónde se aplica en Dream Day |
|-------------------|------------------------------|
| querySelector / querySelectorAll | Scroll automático a secciones, focus en inputs, animaciones |
| createElement | Generación dinámica de tarjetas de servicio en el seed visual |
| appendChild / prepend | Insertar notificaciones toast dinámicas |
| remove | Eliminar items del carrito, cerrar modales |
| classList (add/remove/toggle) | Menú móvil toggle, estados activos de categorías, animaciones |
| innerHTML / textContent | Actualizar contadores del carrito, mensajes dinámicos |
| addEventListener | Todos los eventos del proyecto |
| Delegación de eventos | Click en grid de servicios (un listener en el padre) |
| LocalStorage | Carrito persistente, preferencias del usuario |
| Validación de formularios | Formulario de cotización en tiempo real |

### 2.2 Implementaciones específicas de DOM puro

**A) Sistema de notificaciones Toast (Vanilla JS puro)**
```javascript
// src/utils/toast.js — DOM puro, sin React
function showToast(message, type = 'info', duration = 3000) {
  // createElement
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Estilos dinámicos con classList
  toast.classList.add('toast-enter');
  
  // appendChild al body
  const container = document.querySelector('.toast-container') 
    || createToastContainer();
  container.appendChild(toast);
  
  // Animación de salida y remove
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, duration);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}
```

**B) Carrito con LocalStorage (persistencia DOM)**
```javascript
// src/utils/carrito.js — LocalStorage directo
const CART_KEY = 'dreamday_carrito';

const carritoStorage = {
  obtener() {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  guardar(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    // Actualizar badge con textContent (DOM directo)
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = items.length;
      badge.classList.toggle('hidden', items.length === 0);
    }
  },
  
  agregar(servicio) {
    const items = this.obtener();
    if (items.find(i => i.id === servicio.id)) return false;
    items.push(servicio);
    this.guardar(items);
    return true;
  },
  
  eliminar(servicioId) {
    const items = this.obtener().filter(i => i.id !== servicioId);
    this.guardar(items);
  },
  
  limpiar() {
    localStorage.removeItem(CART_KEY);
    this.guardar([]);
  }
};
```

**C) Delegación de eventos en el grid de servicios**
```javascript
// Un solo listener en el padre, no uno por cada tarjeta
document.querySelector('.servicios-grid')?.addEventListener('click', (e) => {
  // Buscar el botón más cercano
  const btnAgregar = e.target.closest('.btn-agregar');
  if (btnAgregar) {
    const servicioId = btnAgregar.dataset.servicioId;
    const servicioNombre = btnAgregar.dataset.servicioNombre;
    // Agregar al carrito
    carritoStorage.agregar({ id: servicioId, nombre: servicioNombre });
    showToast(`${servicioNombre} agregado al carrito`, 'success');
  }
  
  const btnDetalle = e.target.closest('.btn-detalle');
  if (btnDetalle) {
    const servicioId = btnDetalle.dataset.servicioId;
    // Abrir modal de detalle
    abrirModalDetalle(servicioId);
  }
});
```

**D) Menú móvil con classList toggle**
```javascript
// Toggle menú hamburguesa — classList puro
const menuToggle = document.querySelector('.menu-toggle');
const navMobile = document.querySelector('.nav-mobile');

menuToggle?.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  navMobile.classList.toggle('active');
});

// Cerrar al hacer click en un link
navMobile?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuToggle.classList.remove('active');
    navMobile.classList.remove('active');
  });
});
```

**E) Scroll suave a secciones con querySelector**
```javascript
// Smooth scroll para links de navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
```

**F) Validación de formulario en tiempo real (DOM directo)**
```javascript
// Validación con eventos input — DOM puro
function setupValidacion(formElement) {
  const inputs = formElement.querySelectorAll('input[data-validate]');
  
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const regla = e.target.dataset.validate;
      const valor = e.target.value;
      let valido = false;
      
      switch (regla) {
        case 'nombre': valido = valor.length >= 3; break;
        case 'email': valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor); break;
        case 'telefono': valido = /^[1-9]\d{9}$/.test(valor); break;
        case 'cp': valido = /^\d{5}$/.test(valor); break;
      }
      
      // classList para mostrar estado visual
      e.target.classList.toggle('input-valid', valido);
      e.target.classList.toggle('input-error', !valido && valor.length > 0);
      
      // textContent para mensaje de error
      const errorMsg = e.target.nextElementSibling;
      if (errorMsg?.classList.contains('error-message')) {
        errorMsg.textContent = valido ? '' : e.target.dataset.errorMsg;
      }
    });
  });
}
```

**G) Confirmación antes de eliminar (modal dinámico)**
```javascript
// Crear modal de confirmación dinámicamente
function confirmarEliminacion(nombre, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay modal-confirm';
  
  overlay.innerHTML = `
    <div class="modal-content">
      <h3>¿Eliminar "${nombre}"?</h3>
      <p>Esta acción no se puede deshacer.</p>
      <div class="modal-buttons">
        <button class="btn-cancelar">Cancelar</button>
        <button class="btn-confirmar">Eliminar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.querySelector('.btn-cancelar').addEventListener('click', () => {
    overlay.remove();
  });
  
  overlay.querySelector('.btn-confirmar').addEventListener('click', () => {
    callback();
    overlay.remove();
  });
}
```

### 2.3 Arquitectura modular (Opción B del requisito)

El proyecto cumple con la separación modular:

```
React (componentes) = Vista (ui.js)
API calls (axios)   = Datos (data.js)  
App.jsx + Router    = Controlador (app.js)

+ Utilidades Vanilla JS:
  src/utils/toast.js        → Notificaciones DOM puro
  src/utils/carrito.js      → LocalStorage + DOM updates
  src/utils/validacion.js   → Validación formularios DOM
  src/utils/frontendLogger.js → Logging frontend
```

### 2.4 Checklist de requisitos DOM cubiertos

| Requisito | ✅ Cubierto | Dónde |
|-----------|------------|-------|
| CRUD (crear, editar, eliminar, buscar) | ✅ | Admin: servicios, categorías, cotizaciones |
| Filtrar por estado/categoría | ✅ | Grid servicios (categorías), admin (filtros) |
| Ordenar registros | ✅ | Admin: cotizaciones por fecha, servicios por orden |
| Validación de formularios | ✅ | Formulario cotización, login admin |
| Confirmación antes de eliminar | ✅ | Modal dinámico al eliminar servicio/categoría |
| Mensajes dinámicos | ✅ | Toast notifications |
| Actualización sin recargar | ✅ | SPA completa con React Router |
| LocalStorage | ✅ | Carrito persistente |
| Recuperación al cargar | ✅ | Carrito se restaura al abrir la página |
| querySelector/querySelectorAll | ✅ | Toast, scroll, validación, menú |
| createElement | ✅ | Toast container, modal confirmación |
| appendChild/prepend | ✅ | Toast insertion |
| remove | ✅ | Toast removal, modal removal |
| classList | ✅ | Menú toggle, validación visual, toast animations |
| innerHTML/textContent | ✅ | Badge carrito, mensajes error, modal dinámico |
| addEventListener | ✅ | Todo el proyecto |
| Delegación de eventos | ✅ | Grid servicios (click en padre) |

---

## 3. ENTREGABLES UNIVERSITARIOS

### Para la tarea de Logging:
1. ✅ Código con logging (integrado en Dream Day)
2. ✅ Muestra de logs (.log en JSON)
3. ✅ Capturas de Grafana (dashboards, consultas)
4. ✅ Reporte PDF (estrategia, campos, consultas, hallazgos, mejoras)

### Para la práctica de DOM:
1. ✅ Código fuente (Dream Day completo)
2. ✅ Documentación técnica 3-5 páginas (arquitectura, módulos, flujo, capturas)
3. ✅ Manual de usuario 1 página
4. ✅ Video demostrativo 3-5 minutos
