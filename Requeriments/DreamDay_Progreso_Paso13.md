# DREAM DAY — Documento de Progreso Completo
## Para continuar en nueva conversación

---

## Prompt para nueva conversación

Copia y pega esto al inicio de la nueva conversación:

---

**INICIO DEL PROMPT:**

Estoy construyendo Dream Day, una plataforma de cotización de servicios para eventos en Aguascalientes, México. Te adjunto los documentos de planeación originales (los mismos 4 archivos .md + el HTML de referencia) MÁS este documento de progreso.

**Estado actual: Paso 13 completado. Siguiente: Paso 14 — Panel Admin.**

Lee el documento de progreso adjunto PRIMERO para entender exactamente dónde estamos, luego los documentos originales como referencia. Continúa desde el **Paso 14: Panel Admin (login + dashboard + gestión de cotizaciones)**.

Recuerda:
- Tengo poca experiencia en desarrollo, necesito guía paso a paso
- Entrégame los archivos en ZIP para evitar problemas con heredoc en terminal
- Cada vez que crees archivos con `pre('save')` de Mongoose, NO uses el parámetro `next` — usa funciones async sin `next`
- No uses `express-mongo-sanitize` — es incompatible con la versión actual de Express/Node
- Mobile-first, paleta café, tipografías: Great Vibes, Cormorant Garamond, Montserrat

**FIN DEL PROMPT**

---

## Entorno de desarrollo

- **OS:** Ubuntu 24.04
- **Node.js:** v24.13.1
- **npm:** 11.8
- **MongoDB:** 7.0 (local, corriendo con systemctl)
- **Editor:** VS Code
- **Docker:** instalado (para Grafana/Loki más adelante)
- **Navegador:** Edge Linux (Chromium)

## Estructura del proyecto

```
/home/ayanami/Documents/dream-day-project/
├── backend/
│   ├── .env
│   ├── logs/
│   ├── uploads/
│   ├── node_modules/
│   ├── package.json
│   └── src/
│       ├── server.js              ← Punto de entrada Express (SIN mongoSanitize)
│       ├── seed.js                ← Carga 5 categorías + 57 servicios + admin
│       ├── config/
│       │   ├── database.js        ← Conexión MongoDB con Mongoose
│       │   ├── logger.js          ← Winston con rotación diaria ★
│       │   └── constants.js       ← Reglas de negocio centralizadas
│       ├── models/
│       │   ├── Categoria.js       ← 5 categorías dinámicas
│       │   ├── Servicio.js        ← 57 servicios (precio solo admin)
│       │   ├── Disponibilidad.js  ← Estado por fecha/servicio
│       │   ├── Cotizacion.js      ← Solicitudes (pre save SIN next)
│       │   ├── Cita.js            ← Citas confirmadas (pre save SIN next)
│       │   └── Usuario.js         ← Admin con bcrypt (pre save SIN next)
│       ├── middleware/
│       │   ├── correlationId.js   ← UUID por request ★
│       │   ├── requestLogger.js   ← Log HTTP ★
│       │   ├── errorHandler.js    ← Captura errores ★
│       │   └── auth.js            ← Verificación JWT
│       ├── routes/
│       │   ├── categorias.js      ← GET públicas
│       │   ├── servicios.js       ← GET públicas (sin precios)
│       │   ├── disponibilidad.js  ← GET calendario/mes/servicio
│       │   ├── cotizaciones.js    ← POST crear + GET consultar
│       │   ├── auth.js            ← POST login + GET /me
│       │   └── admin.js           ← Dashboard + CRUD (protegidas JWT)
│       └── utils/
│           └── generarCodigo.js   ← Códigos DD2603-XXXX
│
├── frontend/
│   ├── .env                       ← VITE_API_URL=http://localhost:5000/api
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── node_modules/
│   └── src/
│       ├── main.jsx               ← Entry point con BrowserRouter
│       ├── App.jsx                ← Routes: /, /cotizar, /disponibilidad
│       ├── styles/
│       │   ├── variables.css      ← CSS variables (paleta café)
│       │   └── global.css         ← Reset + tipografías + spinner
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx     ← Nav con links + carrito + Disponibilidad
│       │   │   ├── Header.css
│       │   │   ├── Footer.jsx     ← 4 columnas, social links
│       │   │   ├── Footer.css
│       │   │   ├── Layout.jsx     ← Header + main + Footer
│       │   │   └── Layout.css
│       │   ├── cotizacion/
│       │   │   ├── FormularioWizard.jsx  ← Wizard 3 pasos principal
│       │   │   ├── PasoServicios.jsx     ← Paso 1: servicios del carrito
│       │   │   ├── PasoFecha.jsx         ← Paso 2: fecha, hora, personas
│       │   │   ├── PasoDatos.jsx         ← Paso 3: datos cliente
│       │   │   ├── PantallaExito.jsx     ← Código + WhatsApp
│       │   │   └── Wizard.css
│       │   └── calendario/
│       │       ├── CalendarioDisponibilidad.jsx  ← Mes con colores
│       │       └── Calendario.css
│       ├── pages/
│       │   ├── HomePage.jsx       ← Hero + Servicios API + Nosotros + Contacto
│       │   ├── HomePage.css
│       │   ├── CotizarPage.jsx    ← Wrapper wizard
│       │   └── DisponibilidadPage.jsx  ← Wrapper calendario
│       ├── services/
│       │   ├── api.js             ← Axios config (baseURL, interceptors)
│       │   ├── categoriasService.js
│       │   ├── serviciosService.js
│       │   ├── cotizacionesService.js
│       │   ├── disponibilidadService.js
│       │   └── authService.js
│       └── utils/
│           ├── toast.js           ← Notificaciones vanilla JS ★★
│           ├── frontendLogger.js  ← Logs al backend ★★
│           ├── carrito.js         ← localStorage CRUD ★★
│           ├── validacion.js      ← Validación con data-validate ★★
│           └── domHelpers.js      ← Scroll, modal, delegación ★★
│
└── Requeriments/                  ← Documentos de planeación
    ├── DreamDay_Requerimientos_v3_FINAL.md
    ├── DreamDay_Guia_Diseno_Visual.md
    ├── DreamDay_Sistema_Logging.md
    ├── DreamDay_Requisitos_Universitarios.md
    └── dreamday.html (referencia visual)
```

★ = Requisito universitario (Logging con Winston)
★★ = Requisito universitario (Manipulación DOM avanzada con vanilla JS)

## Dependencias instaladas

### Backend (package.json)
```
express, mongoose, bcrypt, jsonwebtoken, helmet, cors,
multer, pdfkit, sharp, dotenv, uuid,
winston, winston-daily-rotate-file
```
**NO usar:** `express-mongo-sanitize` (incompatible con Node 24 / Express actual)

### Frontend (package.json)
```
react, react-dom, react-router-dom, axios, lucide-react
```
**Dev:** `vite, @vitejs/plugin-react`

## Base de datos (MongoDB: dreamday)

### Colecciones con datos:
- **categorias:** 5 documentos (Comida 🍽, Bebidas 🥂, Postres 🍰, Inflables 🎪, Extras ✨)
- **servicios:** 57 documentos (13 comida, 9 bebidas, 14 postres, 13 inflables, 8 extras)
- **usuarios:** 1 admin (admin@dreamday.mx / DreamDay2026! / superadmin)
- **cotizaciones:** Puede tener cotizaciones de prueba creadas

### Credenciales admin:
- Email: admin@dreamday.mx
- Password: DreamDay2026!

### Seed: `node src/seed.js` (BORRA todo y recrea)

## Pasos completados

### Paso 7 ✅ — Frontend con Vite
- Creado proyecto Vite + React
- Variables CSS con paleta café
- Global CSS con tipografías Google Fonts
- Utils vanilla JS (toast, logger, carrito, validación, domHelpers)
- Axios config con interceptors

### Paso 8 ✅ — Componentes visuales
- Header: nav desktop/mobile, hamburger animado, badge carrito
- Footer: 4 columnas, social links, responsive
- Layout: Header + main + Footer
- HomePage: Hero (Dream Day grande), sección servicios, nosotros, contacto

### Paso 9 ✅ — Backend modelos + seed
- Conexión MongoDB
- Winston logger con rotación diaria
- 6 modelos Mongoose (Categoria, Servicio, Disponibilidad, Cotizacion, Cita, Usuario)
- Middlewares: correlationId, requestLogger, errorHandler, auth JWT
- Seed: 5 categorías + 57 servicios + 1 admin
- Constantes centralizadas

### Paso 10 ✅ — Rutas API
- Públicas: GET categorias, servicios, disponibilidad, POST cotizaciones
- Auth: POST login, GET /me
- Admin: GET dashboard, CRUD cotizaciones, bloquear disponibilidad

### Paso 11 ✅ — Frontend ↔ Backend
- Services layer (categoriasService, serviciosService, etc.)
- HomePage carga datos reales del API
- Spinner de carga, manejo de errores
- Categorías y servicios dinámicos desde MongoDB

### Paso 12 ✅ — Formulario cotización (wizard 3 pasos)
- Paso 1: Revisar servicios del carrito, ajustar cantidades
- Paso 2: Fecha, hora (9-18), personas
- Paso 3: Nombre, email, teléfono, ubicación, CP, notas
- Validación en tiempo real (errores en rojo)
- Envío al backend → código DD2602-XXXX
- Pantalla éxito con código + botón WhatsApp
- Header actualizado: carrito navega a /cotizar

### Paso 13 ✅ — Calendario disponibilidad
- Vista mensual con grid 7 columnas (Dom-Sáb)
- Colores: 🟢 verde (disponible), 🟡 amarillo (parcial), 🔴 rojo (ocupado)
- Navegación entre meses (← →)
- Días pasados grises, hoy con borde especial
- Click en día muestra detalle + botón "Cotizar para esta fecha"
- Header actualizado: link "Disponibilidad" en nav
- Ruta: /disponibilidad

## Bugs resueltos (IMPORTANTE para futuro)

### 1. express-mongo-sanitize — NO USAR
**Error:** `Cannot set property query of #<IncomingMessage> which has only a getter`
**Causa:** Incompatible con Node 24 / Express actual
**Solución:** Eliminar las 2 líneas de mongoSanitize de server.js. NO incluir en futuros archivos.

### 2. Mongoose pre('save') con next — NO USAR next
**Error:** `next is not a function`
**Causa:** En versiones recientes de Mongoose, los hooks async no reciben `next`
**Solución:** Cambiar todos los `pre('save')` a funciones async SIN parámetro next:
```javascript
// ❌ MAL
schema.pre('save', async function (next) {
  // ...
  next();
});

// ✅ BIEN
schema.pre('save', async function () {
  // ...
});
```
**Archivos afectados y ya corregidos:** Usuario.js, Cotizacion.js, Cita.js

### 3. Heredoc en terminal — USAR ZIP
**Problema:** Crear archivos con heredoc (cat << 'EOF') en la terminal corrompe caracteres especiales
**Solución:** Siempre entregar archivos como ZIP para que el usuario descargue y extraiga con `unzip -o`

### 4. Import paths — Verificar niveles
**Problema:** `../../utils/toast` vs `../utils/toast` dependiendo de la profundidad del archivo
**Regla:** `src/pages/X.jsx` → `../utils/Y` (1 nivel), `src/components/sub/X.jsx` → `../../utils/Y` (2 niveles)

## Endpoints API funcionando

### Públicos
| Método | Ruta | Estado |
|--------|------|--------|
| GET | /api/health | ✅ |
| GET | /api/categorias | ✅ 5 categorías |
| GET | /api/categorias/:slug | ✅ |
| GET | /api/servicios | ✅ 57 servicios (sin precios) |
| GET | /api/servicios?categoria=ID | ✅ |
| GET | /api/servicios/:id | ✅ |
| GET | /api/disponibilidad?fecha=YYYY-MM-DD | ✅ |
| GET | /api/disponibilidad/mes?anio=2026&mes=3 | ✅ |
| GET | /api/disponibilidad/servicio/:id?fecha=... | ✅ |
| POST | /api/cotizaciones | ✅ Genera DD2602-XXXX |
| GET | /api/cotizaciones/consultar/:codigo | ✅ |
| POST | /api/logs | ✅ Recibe logs frontend |

### Auth
| Método | Ruta | Estado |
|--------|------|--------|
| POST | /api/auth/login | ✅ Devuelve JWT |
| GET | /api/auth/me | ✅ Con Bearer token |

### Admin (requieren JWT)
| Método | Ruta | Estado |
|--------|------|--------|
| GET | /api/admin/dashboard | ✅ |
| GET | /api/admin/cotizaciones | ✅ Con paginación |
| GET | /api/admin/cotizaciones/:id | ✅ Con precios |
| PATCH | /api/admin/cotizaciones/:id | ✅ |
| POST | /api/admin/disponibilidad/bloquear | ✅ |
| DELETE | /api/admin/disponibilidad/:id | ✅ |
| GET | /api/admin/servicios | ✅ Con precios |

## Rutas frontend funcionando

| Ruta | Componente | Estado |
|------|-----------|--------|
| / | HomePage (Layout) | ✅ |
| /cotizar | CotizarPage (Wizard) | ✅ |
| /disponibilidad | DisponibilidadPage (Calendario) | ✅ |
| /admin/login | (pendiente) | ❌ |
| /admin/dashboard | (pendiente) | ❌ |

## Lo que falta (pendiente)

### Paso 14 — Panel Admin (SIGUIENTE)
- Página de login admin
- Dashboard con estadísticas
- Lista de cotizaciones (pendientes, confirmadas, etc.)
- Detalle de cotización con precios
- Cambiar estado (confirmar → crea Cita → bloquea disponibilidad)
- Bloquear/desbloquear fechas manualmente

### Paso 15 — Carrito drawer (panel lateral)
- Panel lateral que se desliza desde la derecha
- Muestra servicios agregados con cantidades
- Botón "Cotizar" que lleva al wizard

### Paso 16 — Consultar cotización por código
- Página donde el cliente ingresa su código DD2603-XXXX
- Muestra estado actual de la cotización

### Paso 17 — Grafana + Loki (requisito universidad)
- Docker compose para Grafana + Loki
- Configurar Winston para enviar logs a Loki
- Dashboard en Grafana

### Paso 18 — Subida de imágenes para servicios
- Multer para upload
- Sharp para redimensionar
- Admin puede agregar/quitar fotos de servicios

### Paso 19 — Generación de PDF de cotización
- PDFKit para generar PDF con detalle de cotización
- Descargar desde panel admin

### Paso 20+ — Pulido final
- Validaciones avanzadas
- Rate limiting
- Optimización de rendimiento
- Deploy

## Reglas de negocio clave

1. **Cotización NO bloquea disponibilidad** — es solo una solicitud
2. **Cita confirmada SÍ bloquea** — se crea cuando admin confirma cotización
3. **Precios NUNCA se muestran al cliente** — solo el admin los ve
4. **Negociación por WhatsApp** — el código DD2603-XXXX es la referencia
5. **5 categorías dinámicas** — el admin puede crear/editar/desactivar
6. **57 servicios** — del catálogo real del negocio
7. **Horario: 9:00 - 18:00** — para eventos
8. **Mobile-first** — la mayoría de clientes usa celular

## Cómo arrancar el proyecto

### Terminal 1 — Backend:
```bash
cd /home/ayanami/Documents/dream-day-project/backend
node src/server.js
```
→ Puerto 5000

### Terminal 2 — Frontend:
```bash
cd /home/ayanami/Documents/dream-day-project/frontend
npm run dev
```
→ Puerto 5173

### Verificar:
- http://localhost:5000/api/health → {"status":"OK"}
- http://localhost:5173/ → Dream Day homepage
