# DREAM DAY — REQUERIMIENTOS DEFINITIVOS v3.0 (FINAL)
## Documento blindado — Todas las vulnerabilidades resueltas

---

## 1. DECISIONES DE NEGOCIO CONFIRMADAS

### Cotización y Reservas
- La cotización es **SOLO una solicitud**, no bloquea disponibilidad
- El admin decide manualmente desde el panel (confirma, rechaza, negocia)
- Alertas de conflicto cuando hay múltiples cotizaciones en misma fecha/servicio
- Al confirmar una cita con servicio tipo "única", las cotizaciones en conflicto cambian automáticamente a estado `conflicto`

### Precios
- **100% manual por WhatsApp** — el sistema NO muestra precios al cliente
- Campo `precio` solo visible para admin en rutas autenticadas
- Variantes de servicio se negocian por WhatsApp

### Disponibilidad
- Servicios tipo "única" → bloquean **todo el día completo**
- Cliente selecciona **día + hora de inicio**
- **Duración definida por servicio** (admin la configura)
- Bloqueo **automático al confirmar + manual por admin**

### Calendario del Formulario
- Muestra TODOS los días del mes con indicador por colores
- 🟢 Todos los servicios del carrito disponibles
- 🟡 Algunos servicios disponibles (muestra cuáles sí y cuáles no)
- 🔴 Ningún servicio disponible
- Al seleccionar un día 🟡, muestra detalle servicio por servicio con opción de quitar los no disponibles

### Anticipación mínima
- **Comida y Bebidas: 7 días mínimo**
- **Postres, Inflables, Extras: sin mínimo** (cualquier fecha futura)

### Código de referencia
- Formato: **DD2603-A7K9** (DD + año + mes + 4 alfanuméricos)
- Cambia automáticamente por año y mes
- Corto, fácil de comunicar por WhatsApp

### Diseño
- **Mobile-first** — mayoría de clientes usan celular
- Touch targets mínimo 44px
- Categorías como scroll horizontal tipo Stories

---

## 2. CATEGORÍAS (DINÁMICAS)

### Modelo de categoría
```javascript
const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icono: { type: String, default: '✨' },
  orden: { type: Number, default: 0 },
  activa: { type: Boolean, default: true },
  anticipacionMinimaDias: { type: Number, default: 0 },
  // 7 para comida/bebidas, 0 para el resto
  createdAt: { type: Date, default: Date.now }
});
```

### Categorías iniciales (seed)
| Nombre | Slug | Ícono | Anticipación | Orden |
|--------|------|-------|-------------|-------|
| Comida | comida | 🍽 | 7 días | 1 |
| Bebidas | bebidas | 🥂 | 7 días | 2 |
| Postres | postres | 🍰 | 0 días | 3 |
| Inflables | inflables | 🎪 | 0 días | 4 |
| Extras | extras | ✨ | 0 días | 5 |

### Admin puede
- Crear nuevas categorías (nombre, ícono, orden, anticipación)
- Editar categorías existentes
- Reordenar categorías
- Desactivar categorías (soft delete, advierte si tiene servicios vinculados)

---

## 3. CATÁLOGO DE SERVICIOS

### Distribución (57 servicios)

**COMIDA (13 servicios) — Anticipación: 7 días**
| Servicio | Mínimo | Tipo precio | Duración |
|----------|--------|-------------|----------|
| Buffet de Guisados | 50 personas | Por persona | 2h |
| Taco Bar | 50 personas | Por persona | 2h |
| Tacos al Vapor | 250 tacos | Por pieza | 2h |
| Chilaquiles | 50 órdenes | Por orden | 2h |
| Café + Chilaquiles + Fruta | 50 personas | Por persona | 2h |
| Tortas de Lechón | 50 piezas | Por pieza | 2h |
| Pizzas | 50 piezas | Por pieza | 2h |
| Hotdogs | 100 piezas | Por pieza | 2h |
| Pastas | 50 órdenes | Por orden | 2h |
| Flautas en Vaso | 50 órdenes | Por orden | 2h |
| Brunch | 50 personas | Por persona | 2h |
| Charcutería | 50 piezas | Por pieza | 2h |
| Snacks | 50 piezas | Por pieza | 2h |

**BEBIDAS (9 servicios) — Anticipación: 7 días**
| Servicio | Mínimo | Tipo precio | Duración |
|----------|--------|-------------|----------|
| Coctelería | 50 cócteles | Por pieza | 2-5h |
| Cantaritos | 50 piezas | Por pieza | 2h |
| Mimosas | 40 piezas | Por pieza | 2h |
| Drink Bags | 50 piezas | Por pieza | 2h |
| Pared de Shots | 100 piezas | Por pieza | 2h |
| Coffee Break | 50 personas | Por persona | 2h |
| Aguas Naturales | 2 garrafas | Precio fijo | 2h |
| Back Bienvenida Cerveza | 1 unidad | Precio fijo | Evento |
| Cheery (Cócteles Kids) | 50 piezas | Por pieza | 2h |

**POSTRES (14 servicios) — Sin anticipación mínima**
| Servicio | Mínimo | Tipo precio | Duración |
|----------|--------|-------------|----------|
| Fresas con Crema | 50 piezas | Precio fijo | 2h |
| Malteadas | 50 vasos | Precio fijo | 2h |
| Pasteles Personales | 50 piezas | Por pieza | 2h |
| Crepas | 50 piezas | Por pieza | 2h |
| Waffles | 50 piezas | Por pieza | 2h |
| Crepaletas | 50 piezas | Por pieza | 2h |
| Mini Hotcakes | 50 piezas | Por pieza | 2h |
| Churros | 50 piezas | Por pieza | 2h |
| Maruchan Station | 70 piezas | Por pieza | 2h |
| Chascas | 50 piezas | Por pieza | 2h |
| Paletas de Hielo | 60 paletas | Por pieza | 2h |
| Raspados | 1 evento | Precio fijo | 1.5h |
| Palomitas | 1 evento | Precio fijo | 2h |
| Candy Bar | 50 personas | Precio fijo | 2h |

**INFLABLES (13 servicios) — Sin anticipación mínima**
| Servicio | Mínimo | Tipo precio | Duración |
|----------|--------|-------------|----------|
| Maxi Castillo | 1 unidad | Precio fijo | 5h |
| Castillo Palacio | 1 unidad | Precio fijo | 5h |
| Laberinto White | 1 unidad | Precio fijo | 5h |
| Ludoteca / Splash Pad | 1 unidad | Precio fijo | 5h |
| Alberca Pelotas + Resbaladilla | 1 unidad | Precio fijo | 5h |
| Castillo Petite + Alberca | 1 unidad | Precio fijo | 5h |
| Inflable Corazón | 1 unidad | Precio fijo | 5h |
| Carritos Chocones | 1 unidad | Precio fijo | 3h |
| Bumper Balls | 1 juego (2 bolas) | Por juego | 5h |
| Bubble House | 1 unidad | Precio fijo | 3h |
| Maxi Alberca | 1 unidad | Precio fijo | 5h |
| Castillo White | 1 unidad | Precio fijo | 5h |
| Mobiliario Infantil | 2 juegos | Por juego | 4h |

**EXTRAS (8 servicios) — Sin anticipación mínima**
| Servicio | Mínimo | Tipo precio | Duración |
|----------|--------|-------------|----------|
| Flower Bar | 50 piezas | Por pieza | 2h |
| Glitter Neon | 1 evento | Precio fijo | 2h |
| Audio Guest Book | 1 unidad | Precio fijo | 3h |
| Back Bienvenida Recuerdos | 1 unidad | Precio fijo | Evento |
| Paquete Picasso | 10 niños | Precio fijo | 2.5h |
| Paquete Party | 10 niños | Precio fijo | 5h |
| Paquete Baby Gym | 1 paquete | Precio fijo | 4h |
| Tablitas Recuerdo | 20 piezas | Por pieza | N/A |

---

## 4. MODELOS DE DATOS

### Categoría
```javascript
const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icono: { type: String, default: '✨' },
  orden: { type: Number, default: 0 },
  activa: { type: Boolean, default: true },
  anticipacionMinimaDias: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
```

### Servicio
```javascript
const servicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, required: true },
  descripcionCorta: { type: String, required: true, maxlength: 80 },
  imagenUrl: { type: String, required: true },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  precio: { type: Number, required: true },
  tipoPrecio: {
    type: String,
    enum: ['por_persona', 'por_pieza', 'por_orden', 'por_juego', 'precio_fijo'],
    required: true
  },
  requisitoMinimo: {
    cantidad: { type: Number, required: true },
    unidad: { type: String, required: true }
  },
  duracionHoras: { type: Number, required: true },
  incluye: [String],
  notas: String,
  tipoDisponibilidad: {
    type: String,
    enum: ['unica', 'multiple'],
    default: 'unica'
  },
  capacidadDiaria: { type: Number, default: 1 },
  activo: { type: Boolean, default: true },
  orden: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});
```

### Disponibilidad
```javascript
const disponibilidadSchema = new mongoose.Schema({
  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  fecha: { type: String, required: true }, // YYYY-MM-DD
  estado: {
    type: String,
    enum: ['disponible', 'ocupado', 'bloqueado_admin'],
    default: 'disponible'
  },
  citaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita',
    default: null
  },
  motivoBloqueo: { type: String, default: null },
  cotizacionesPendientes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

disponibilidadSchema.index({ servicioId: 1, fecha: 1 }, { unique: true });
```

### Cotización
```javascript
const cotizacionSchema = new mongoose.Schema({
  codigoReferencia: { type: String, unique: true, required: true },
  // Formato: DD2603-A7K9
  cliente: {
    nombre: { type: String, required: true, minlength: 3 },
    email: { type: String, required: true },
    telefono: { type: String, required: true } // 10 dígitos
  },
  servicios: [{
    servicioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' },
    nombre: String,
    cantidad: Number,
    unidad: String
  }],
  evento: {
    fecha: { type: String, required: true },     // YYYY-MM-DD
    horaInicio: { type: String, required: true }, // HH:MM
    cantidadPersonas: { type: Number, required: true, min: 1 },
    ubicacion: { type: String, required: true, minlength: 5 },
    codigoPostal: { type: String, required: true }, // 5 dígitos
    detallesEspeciales: String
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_negociacion', 'confirmada', 'rechazada', 'cancelada', 'conflicto'],
    default: 'pendiente'
  },
  pdfUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

cotizacionSchema.index({ codigoReferencia: 1 }, { unique: true });
cotizacionSchema.index({ 'cliente.email': 1 });
cotizacionSchema.index({ estado: 1 });
cotizacionSchema.index({ createdAt: -1 });
```

### Cita
```javascript
const citaSchema = new mongoose.Schema({
  cotizacionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: true
  },
  codigoReferencia: { type: String, required: true },
  cliente: {
    nombre: String,
    email: String,
    telefono: String
  },
  servicios: [{
    servicioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' },
    nombre: String,
    cantidad: Number,
    duracionHoras: Number
  }],
  fechaEvento: { type: String, required: true },
  horaInicio: { type: String, required: true },
  cantidadPersonas: Number,
  ubicacion: String,
  codigoPostal: String,
  detallesEspeciales: String,
  estado: {
    type: String,
    enum: ['confirmada', 'completada', 'cancelada'],
    default: 'confirmada'
  },
  googleCalendarEventId: String,
  fechaConfirmacion: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

citaSchema.index({ codigoReferencia: 1 });
citaSchema.index({ fechaEvento: 1 });
citaSchema.index({ estado: 1 });
```

### Usuario (Admin)
```javascript
const usuarioSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  nombre: { type: String, required: true },
  rol: { type: String, enum: ['admin'], default: 'admin' },
  activo: { type: Boolean, default: true },
  intentosFallidos: { type: Number, default: 0 },
  bloqueadoHasta: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
```

---

## 5. SEGURIDAD — SOLUCIONES IMPLEMENTADAS

### 5.1 Inyección NoSQL
```javascript
// Instalar: express-mongo-sanitize
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
// Remueve operadores $ y . de req.body, req.query, req.params
```

### 5.2 Fuerza bruta en login
```javascript
// Instalar: express-rate-limit
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
  standardHeaders: true
});
app.use('/api/auth/login', loginLimiter);

// Además, bloqueo por cuenta (en modelo Usuario)
// Después de 5 intentos fallidos → bloqueadoHasta = ahora + 30min
```

### 5.3 Rate limit en cotizaciones (anti-spam)
```javascript
const cotizacionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 cotizaciones por hora por IP
  message: { error: 'Límite de cotizaciones alcanzado. Intenta más tarde.' }
});
app.use('/api/cotizaciones', cotizacionLimiter);
```

### 5.4 JWT con expiración
```javascript
const token = jwt.sign(
  { id: usuario._id, email: usuario.email, rol: usuario.rol },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
// Token expira en 8 horas, admin debe re-loguearse
```

### 5.5 CORS estricto en producción
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL  // Solo tu dominio
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
```

### 5.6 Validación de imágenes
```javascript
const multer = require('multer');
const storage = multer.diskStorage({ /* config */ });
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
    }
  }
});
```

### 5.7 Protección XSS
```javascript
// Instalar: helmet (headers de seguridad) + sanitize-html
const helmet = require('helmet');
app.use(helmet());

// Sanitizar texto de entrada
const sanitizeHtml = require('sanitize-html');
const limpiarTexto = (texto) => sanitizeHtml(texto, {
  allowedTags: [], // No permitir HTML
  allowedAttributes: {}
});
// Aplicar a: nombre, ubicacion, detallesEspeciales
```

### 5.8 HTTPS forzado
```javascript
// Middleware para producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

### 5.9 Race condition — operación atómica
```javascript
// Usar sesiones de MongoDB para transacciones
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Bloquear disponibilidad (atómico)
  const dispo = await Disponibilidad.findOneAndUpdate(
    { servicioId, fecha, estado: 'disponible' },
    { estado: 'ocupado', citaId: nuevaCita._id },
    { new: true, session }
  );
  if (!dispo) throw new Error('Fecha ya no disponible');

  // 2. Crear cita
  const cita = await Cita.create([datos], { session });

  // 3. Actualizar cotización
  await Cotizacion.findByIdAndUpdate(
    cotizacionId,
    { estado: 'confirmada' },
    { session }
  );

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 5.10 Código único con retry
```javascript
const crypto = require('crypto');

async function generarCodigoUnico() {
  const ahora = new Date();
  const anio = String(ahora.getFullYear()).slice(-2);
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const prefijo = `DD${anio}${mes}`;

  let codigo, intentos = 0;
  do {
    const aleatorio = crypto.randomBytes(2).toString('hex').toUpperCase();
    codigo = `${prefijo}-${aleatorio}`;
    intentos++;
  } while (
    await Cotizacion.exists({ codigoReferencia: codigo }) && intentos < 10
  );

  if (intentos >= 10) throw new Error('No se pudo generar código único');
  return codigo;
}
// Ejemplo resultado: DD2603-B8A2
```

### 5.11 Validación teléfono México
```javascript
const validarTelefono = (tel) => {
  // 10 dígitos, no empieza con 0
  return /^[1-9]\d{9}$/.test(tel);
};
```

### 5.12 Email no bloquea operaciones
```javascript
const cita = await Cita.create(datos);
// Email como best-effort, nunca bloquea
try {
  await enviarEmailConfirmacion(datos);
} catch (e) {
  console.error('Email falló, cita creada igual:', cita._id);
  // Opcionalmente guardar en cola para reintento
}
```

### 5.13 Compresión de imágenes
```javascript
// Instalar: sharp
const sharp = require('sharp');

const comprimirImagen = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);
};
// Ejecutar al subir imagen desde admin
```

---

## 6. LÓGICA DE NEGOCIO — SOLUCIONES

### 6.1 Conflictos automáticos al confirmar cita
```javascript
// Al confirmar cita con servicio tipo 'unica':
async function resolverConflictos(servicioId, fecha, cotizacionConfirmadaId) {
  // Buscar otras cotizaciones pendientes con mismo servicio/fecha
  const conflictos = await Cotizacion.find({
    _id: { $ne: cotizacionConfirmadaId },
    estado: { $in: ['pendiente', 'en_negociacion'] },
    'servicios.servicioId': servicioId,
    'evento.fecha': fecha
  });

  // Marcar como conflicto
  for (const cot of conflictos) {
    cot.estado = 'conflicto';
    cot.updatedAt = new Date();
    await cot.save();
  }

  return conflictos.length;
  // Admin ve: "Se marcaron 3 cotizaciones en conflicto"
}
```

### 6.2 Anticipación mínima por categoría
```javascript
// En validación de cotización
async function validarAnticipacion(servicios, fechaEvento) {
  const fecha = new Date(fechaEvento);
  const hoy = new Date();
  const diasDiferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));

  for (const servicio of servicios) {
    const srv = await Servicio.findById(servicio.servicioId).populate('categoria');
    const minDias = srv.categoria.anticipacionMinimaDias;

    if (diasDiferencia < minDias) {
      throw new Error(
        `${srv.nombre} requiere mínimo ${minDias} días de anticipación`
      );
    }
  }
}
```

### 6.3 Soft delete con advertencia
```javascript
// Al desactivar servicio
async function desactivarServicio(servicioId) {
  const pendientes = await Cotizacion.countDocuments({
    'servicios.servicioId': servicioId,
    estado: { $in: ['pendiente', 'en_negociacion'] }
  });

  return {
    advertencia: pendientes > 0
      ? `⚠️ Este servicio tiene ${pendientes} cotizaciones pendientes`
      : null,
    pendientes
  };
  // Admin confirma si quiere continuar
}

// Al desactivar categoría
async function desactivarCategoria(categoriaId) {
  const serviciosVinculados = await Servicio.countDocuments({
    categoria: categoriaId,
    activo: true
  });

  return {
    advertencia: serviciosVinculados > 0
      ? `⚠️ Esta categoría tiene ${serviciosVinculados} servicios activos`
      : null
  };
}
```

### 6.4 Cotización sin servicios → rechazada
```javascript
// Validación backend
if (!datos.servicios || datos.servicios.length === 0) {
  return res.status(400).json({ error: 'Debes agregar al menos 1 servicio' });
}
```

### 6.5 Zona horaria consistente
```javascript
// TODAS las fechas se guardan como string YYYY-MM-DD
// TODAS las horas se guardan como string HH:MM
// NO usar Date objects para fechas de evento
// La zona horaria se maneja solo en frontend para display
```

---

## 7. UX — SOLUCIONES

### 7.1 Calendario inteligente con disponibilidad granular
```
Paso 1: Cliente tiene 4 servicios en carrito
Paso 2: Abre calendario, sistema consulta disponibilidad de los 4

GET /api/disponibilidad/multiple?servicios=id1,id2,id3,id4&mes=2026-03

Respuesta:
{
  dias: {
    "2026-03-05": {
      estado: "todos",  // 🟢
      servicios: [
        { id: "...", nombre: "Taco Bar", disponible: true },
        { id: "...", nombre: "Coctelería", disponible: true },
        { id: "...", nombre: "Castillo Palacio", disponible: true },
        { id: "...", nombre: "Candy Bar", disponible: true }
      ]
    },
    "2026-03-10": {
      estado: "parcial",  // 🟡
      servicios: [
        { id: "...", nombre: "Taco Bar", disponible: true },
        { id: "...", nombre: "Coctelería", disponible: true },
        { id: "...", nombre: "Castillo Palacio", disponible: false,
          motivo: "Reservado" },
        { id: "...", nombre: "Candy Bar", disponible: true }
      ]
    },
    "2026-03-15": {
      estado: "ninguno",  // 🔴
      servicios: [ /* todos false */ ]
    }
  }
}

Paso 3: Cliente toca día amarillo (parcial)
→ Modal muestra:

  ✅ Taco Bar — Disponible
  ✅ Coctelería — Disponible
  ❌ Castillo Palacio — No disponible
  ✅ Candy Bar — Disponible

  [ Quitar "Castillo Palacio" y continuar ]
  [ Elegir otra fecha ]

Paso 4: Si quita el servicio, se elimina del carrito
         y el calendario se recalcula
```

### 7.2 Seguimiento de cotización por código
```
Página pública: /mi-cotizacion

┌─────────────────────────────┐
│   Consulta tu cotización    │
│                             │
│   [ DD2603-____ ]           │
│   [ Buscar ]                │
│                             │
│   Estado: En negociación 🟡 │
│   Fecha solicitada: 15 Mar  │
│   Servicios: 4              │
│                             │
│   Tu cotización está siendo │
│   revisada por nuestro      │
│   equipo. Te contactaremos  │
│   por WhatsApp pronto.      │
└─────────────────────────────┘
```
Sin login, solo con código. Muestra estado pero NO precios ni datos sensibles.

### 7.3 Imágenes optimizadas
```
Al subir imagen desde admin:
1. Sharp la redimensiona a máx 800x600
2. La convierte a WebP (80% calidad)
3. Peso resultante: ~50-100KB vs 3-5MB original
4. Se guarda en /uploads/ o Cloudinary

En frontend:
- loading="lazy" en todas las imágenes
- Placeholder blur mientras carga
- srcset para diferentes tamaños de pantalla
```

### 7.4 Fallback WhatsApp
```javascript
// Si wa.me no funciona (desktop sin WhatsApp)
const enviarWhatsApp = (numero, mensaje) => {
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  const ventana = window.open(url, '_blank');

  // Si no abrió, mostrar fallback
  setTimeout(() => {
    if (!ventana || ventana.closed) {
      mostrarModal({
        titulo: '¿No tienes WhatsApp?',
        mensaje: `Envía tu PDF al número ${numero}`,
        botonCopiar: numero
      });
    }
  }, 2000);
};
```

### 7.5 Formulario optimizado para móvil (3 pasos ligeros)
```
PASO 1 — Tu evento (4 campos):
  📅 Calendario visual
  🕐 Hora de inicio (selector)
  👥 Cantidad de personas
  📍 Ubicación + Código postal

PASO 2 — Tus datos (3 campos):
  👤 Nombre completo
  📧 Email
  📱 Teléfono

PASO 3 — Confirmar:
  📋 Resumen visual de todo
  💬 Detalles especiales (opcional, textarea)
  [ Generar cotización ]
```

---

## 8. PANEL ADMIN COMPLETO

### Estructura de navegación
```
Panel Admin (responsive iPhone)
│
├── 📊 Dashboard
│   ├── Cotizaciones este mes (total + pendientes)
│   ├── Citas confirmadas este mes
│   ├── Servicio más popular
│   └── Próximas citas (lista)
│
├── 📋 Cotizaciones
│   ├── Buscador por código (DD2603-XXXX)
│   ├── Filtros: estado, fecha, categoría
│   ├── Lista ordenada por fecha (recientes arriba)
│   ├── Al tocar → detalle completo:
│   │   ├── Datos cliente
│   │   ├── Servicios (CON precios internos)
│   │   ├── Fecha, hora, ubicación
│   │   ├── ⚠️ Alertas de conflicto si las hay
│   │   └── Botones: [Confirmar] [Rechazar] [En negociación]
│   └── Confirmar → crea cita automáticamente
│
├── 📅 Citas
│   ├── Vista calendario mensual
│   ├── Vista lista
│   ├── Al tocar cita → detalle
│   ├── Botones: [Completada] [Cancelar]
│   └── 🆕 Botón: [Generar PDF del día]
│       └── Selecciona fecha → genera PDF con:
│           ├── Todas las citas del día
│           ├── Hora inicio y fin de cada servicio
│           ├── Ubicación con CP
│           ├── Teléfono del cliente
│           ├── Servicios a entregar con cantidades
│           └── Ordenado cronológicamente
│
├── 📅 Disponibilidad
│   ├── Selector de servicio
│   ├── Calendario mensual:
│   │   🟢 Disponible
│   │   🔴 Ocupado (cita confirmada)
│   │   ⚫ Bloqueado (manual)
│   │   🟡 Cotizaciones pendientes
│   ├── Bloquear/desbloquear fechas
│   └── Motivo de bloqueo (opcional)
│
├── 🏷️ Categorías (🆕)
│   ├── Lista de categorías con orden
│   ├── [+ Agregar categoría]
│   │   ├── Nombre
│   │   ├── Ícono (selector de emoji)
│   │   ├── Orden
│   │   └── Anticipación mínima (días)
│   ├── [Editar] → mismos campos
│   ├── [Desactivar] → soft delete + advertencia
│   └── Reordenar (drag en móvil)
│
├── 🎪 Servicios (🆕 CRUD completo)
│   ├── Lista filtrable por categoría
│   ├── [+ Agregar servicio]
│   │   ├── Nombre
│   │   ├── Descripción completa
│   │   ├── Descripción corta (max 80 chars)
│   │   ├── Imagen (upload + compresión automática)
│   │   ├── Categoría (dropdown dinámico)
│   │   ├── Precio (solo admin)
│   │   ├── Tipo precio (dropdown)
│   │   ├── Requisito mínimo (cantidad + unidad)
│   │   ├── Duración (horas)
│   │   ├── Tipo disponibilidad (única/múltiple)
│   │   ├── Qué incluye (lista editable)
│   │   └── Notas
│   ├── [Editar] → mismos campos
│   └── [Desactivar] → soft delete + advertencia si tiene cotizaciones
│
└── ⚙️ Configuración
    ├── Cambiar contraseña
    ├── Número WhatsApp del negocio
    └── Horarios de atención
```

---

## 9. PDF — DISEÑOS

### 9.1 PDF Cotización (para el cliente)
```
Diseño: Logo Dream Day centrado arriba, línea rosa decorativa,
tipografía limpia, paleta rosa #D7B1A3 + negro + blanco

┌─────────────────────────────────┐
│         [LOGO DREAM DAY]        │
│    ─── ✦ ─────────── ✦ ───     │
│                                 │
│    Solicitud de Cotización      │
│    Código: DD2603-B8A2          │
│    Generada: 13 Feb 2026        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ DATOS DEL CLIENTE           │ │
│ │ Juan Pérez                  │ │
│ │ juan@email.com              │ │
│ │ 449 123 4567                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ SERVICIOS SOLICITADOS       │ │
│ │                             │ │
│ │ ● Taco Bar — 80 personas   │ │
│ │ ● Coctelería — 80 cócteles │ │
│ │ ● Castillo Palacio — 1 ud  │ │
│ │ ● Candy Bar — 80 personas  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ DETALLES DEL EVENTO         │ │
│ │                             │ │
│ │ 📅 15 de Marzo, 2026       │ │
│ │ 🕐 11:00 AM                │ │
│ │ 👥 80 personas             │ │
│ │ 📍 Av. Aguascalientes #123 │ │
│ │    Col. Centro, CP 20000   │ │
│ │ 💬 Temática rosa y dorado  │ │
│ └─────────────────────────────┘ │
│                                 │
│    ─── ✦ ─────────── ✦ ───     │
│                                 │
│  Para recibir tu cotización     │
│  con precios, envía este PDF    │
│  por WhatsApp al:               │
│                                 │
│      📱 449-XXX-XXXX           │
│                                 │
│  Los precios serán acordados    │
│  directamente con nuestro       │
│  equipo.                        │
│                                 │
│    ─── ✦ ─────────── ✦ ───     │
│     © 2026 Dream Day            │
└─────────────────────────────────┘
```

### 9.2 PDF Orden del Día (🆕 para el equipo)
```
Diseño: Funcional, claro, con tabla.
Pensado para imprimir o ver en celular.

┌─────────────────────────────────┐
│         [LOGO DREAM DAY]        │
│    Orden del Día — Staff        │
│    📅 15 de Marzo, 2026         │
│    Total de eventos: 3          │
│                                 │
│ ═══════════════════════════════ │
│ EVENTO 1 — 9:00 AM             │
│ ═══════════════════════════════ │
│                                 │
│ 👤 Juan Pérez — 449-123-4567   │
│ 📍 Av. Aguascalientes #123     │
│    Col. Centro, CP 20000        │
│ 👥 80 personas                  │
│                                 │
│ Servicios:                      │
│ ┌────────────────┬────────────┐ │
│ │ Servicio       │ Horario    │ │
│ ├────────────────┼────────────┤ │
│ │ Taco Bar (80p) │ 9:00-11:00 │ │
│ │ Coctelería     │ 9:00-14:00 │ │
│ │ Castillo Palac │ 9:00-14:00 │ │
│ │ Candy Bar (80) │ 9:00-11:00 │ │
│ └────────────────┴────────────┘ │
│                                 │
│ ═══════════════════════════════ │
│ EVENTO 2 — 2:00 PM             │
│ ═══════════════════════════════ │
│                                 │
│ 👤 María López — 449-456-7890  │
│ 📍 Blvd. Zacatecas #456        │
│    Fracc. Los Arcos, CP 20100   │
│ 👥 50 personas                  │
│                                 │
│ Servicios:                      │
│ ┌────────────────┬────────────┐ │
│ │ Servicio       │ Horario    │ │
│ ├────────────────┼────────────┤ │
│ │ Hotdogs (100)  │ 2:00-4:00  │ │
│ │ Inflable Coraz │ 2:00-7:00  │ │
│ └────────────────┴────────────┘ │
│                                 │
│    © 2026 Dream Day — Staff     │
└─────────────────────────────────┘
```

---

## 10. ENDPOINTS API COMPLETOS

### Públicos (sin auth)
```
GET    /api/categorias
       → Categorías activas ordenadas

GET    /api/servicios
       → Servicios activos SIN precio, populados con categoría

GET    /api/servicios/categoria/:slug
       → Servicios por categoría SIN precio

GET    /api/disponibilidad/multiple
       → ?servicios=id1,id2&mes=2026-03
       → Disponibilidad cruzada con detalle por servicio

POST   /api/cotizaciones
       → Crear cotización + generar PDF
       → Rate limit: 3/hora por IP

GET    /api/cotizaciones/consultar/:codigo
       → Estado público (sin precios ni datos sensibles)
```

### Admin (JWT auth)
```
POST   /api/auth/login              → Login + rate limit
GET    /api/auth/me                 → Datos del admin autenticado

--- Categorías ---
GET    /api/admin/categorias        → Todas (incluso inactivas)
POST   /api/admin/categorias        → Crear
PUT    /api/admin/categorias/:id    → Editar
DELETE /api/admin/categorias/:id    → Soft delete + advertencia

--- Servicios ---
GET    /api/admin/servicios         → Todos CON precio
POST   /api/admin/servicios         → Crear (con upload imagen)
PUT    /api/admin/servicios/:id     → Editar
DELETE /api/admin/servicios/:id     → Soft delete + advertencia

--- Cotizaciones ---
GET    /api/admin/cotizaciones      → Todas con filtros
       → ?estado=pendiente&fecha=2026-03&buscar=DD2603
GET    /api/admin/cotizaciones/:id  → Detalle CON precios + conflictos
PUT    /api/admin/cotizaciones/:id/estado → Cambiar estado

--- Citas ---
POST   /api/admin/citas             → Confirmar (desde cotización)
GET    /api/admin/citas             → Todas con filtros
GET    /api/admin/citas/fecha/:fecha → Citas de un día específico
PUT    /api/admin/citas/:id         → Actualizar estado
GET    /api/admin/citas/pdf/:fecha  → 🆕 Generar PDF orden del día

--- Disponibilidad ---
GET    /api/admin/disponibilidad/:servicioId?mes=2026-03
POST   /api/admin/disponibilidad/bloquear
DELETE /api/admin/disponibilidad/desbloquear

--- Dashboard ---
GET    /api/admin/estadisticas?mes=3&anio=2026
```

---

## 11. VALIDACIONES COMPLETAS

### Frontend (tiempo real)
| Campo | Validación | Mensaje |
|-------|-----------|---------|
| Nombre | Min 3 chars | "Ingresa tu nombre completo" |
| Email | Regex válido | "Ingresa un email válido" |
| Teléfono | 10 dígitos, no empieza con 0 | "Teléfono inválido" |
| Fecha | No pasada + disponible + anticipación | "Fecha no disponible" o "Se requieren mín X días" |
| Hora | Entre 9:00 y 18:00 | "Horario: 9:00 AM - 6:00 PM" |
| Personas | Mayor a 0 | "Indica la cantidad de personas" |
| Ubicación | Min 5 chars | "Ingresa la dirección del evento" |
| Código postal | Exactamente 5 dígitos | "Código postal inválido" |
| Servicios | Al menos 1 en carrito | "Agrega al menos 1 servicio" |
| Requisito mín | Según servicio | "X requiere mínimo Y" |

### Backend (duplicado + sanitización)
- Mismas validaciones + mongoSanitize + sanitize-html
- Verificar que servicios existen y están activos
- Verificar disponibilidad en tiempo real

---

## 12. CONSTANTES DEL SISTEMA

```javascript
module.exports = {
  TIPOS_PRECIO: ['por_persona', 'por_pieza', 'por_orden', 'por_juego', 'precio_fijo'],
  ESTADOS_COTIZACION: ['pendiente', 'en_negociacion', 'confirmada', 'rechazada', 'cancelada', 'conflicto'],
  ESTADOS_CITA: ['confirmada', 'completada', 'cancelada'],
  ESTADOS_DISPONIBILIDAD: ['disponible', 'ocupado', 'bloqueado_admin'],
  HORA_MINIMA: '09:00',
  HORA_MAXIMA: '18:00',
  TELEFONO_DIGITOS: 10,
  CODIGO_POSTAL_DIGITOS: 5,
  NOMBRE_MIN_LENGTH: 3,
  UBICACION_MIN_LENGTH: 5,
  DESCRIPCION_CORTA_MAX: 80,
  IMAGEN_MAX_SIZE_MB: 5,
  IMAGEN_TIPOS: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGEN_RESIZE: { width: 800, height: 600 },
  JWT_EXPIRACION: '8h',
  RATE_LIMIT_LOGIN: { ventana: 15, max: 5 },
  RATE_LIMIT_COTIZACION: { ventana: 60, max: 3 },
  WHATSAPP_NUMERO: '+52XXXXXXXXXX',
};
```

---

## 13. DEPENDENCIAS ACTUALIZADAS

### Backend (agregar a package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "dotenv": "^17.2.3",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.1.0",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.13.0",
    "axios": "^1.5.0",
    "nodemailer": "^6.9.6",
    "googleapis": "^118.0.0",
    "express-rate-limit": "^7.1.0",
    "express-mongo-sanitize": "^2.2.0",
    "helmet": "^7.1.0",
    "sanitize-html": "^2.11.0",
    "sharp": "^0.33.0",
    "morgan": "^1.10.0"
  }
}
```

---

## 14. INFRAESTRUCTURA

### Imágenes
- Almacenar en Cloudinary (25GB gratis) o /uploads/ del backend
- NO guardar en MongoDB
- Comprimir con Sharp al subir (800x600, WebP, 80%)

### Monitoreo
- UptimeRobot (gratis) → ping cada 5 min → alerta si cae
- Morgan para logs de requests
- Console.error para errores críticos
- Railway logs nativos para debugging

### Backups
- MongoDB Atlas: backups automáticos
- Script semanal: mongoexport → JSON → guardado local

### Railway sleep
- UptimeRobot hace ping cada 5 min → el servidor nunca duerme
- Alternativa: aceptar $5/mes de Railway para always-on

---

## 15. FASES DE DESARROLLO

### Fase 1: Backend base
1. Config database.js
2. Modelo Categoria
3. Modelo Servicio (actualizar)
4. Modelo Disponibilidad
5. Modelo Cotización
6. Modelo Cita
7. Modelo Usuario
8. Middleware auth + rate limiting + sanitización
9. Utilidades (generarCodigo, validaciones, compresión imágenes)
10. Constantes del sistema
11. Rutas categorías (public + admin)
12. Rutas servicios (actualizar + admin CRUD)
13. Rutas disponibilidad (public + admin)
14. Rutas cotizaciones (public + admin)
15. Rutas citas (admin)
16. Rutas auth
17. Rutas dashboard/estadísticas
18. Seed data (categorías + servicios del catálogo)

### Fase 2: Frontend cliente (mobile-first)
19. CategoriasNav (scroll horizontal)
20. ServiciosGrid (actualizar 5 categorías)
21. TarjetaServicio (nueva, mobile-first)
22. Carrito (drawer desde abajo)
23. Formulario wizard 3 pasos
24. Calendario disponibilidad (granular)
25. Pantalla éxito + WhatsApp
26. Página consulta cotización por código

### Fase 3: Admin (iPhone responsive)
27. LoginAdmin
28. PanelAdmin (layout + navegación)
29. DashboardAdmin
30. TablaCotizaciones (buscador + filtros + acciones)
31. DetalleCotizacion (precios + confirmar/rechazar)
32. Citas (lista + calendario)
33. CalendarioDisponibilidad (gestión manual)
34. CRUD Categorías
35. CRUD Servicios (con upload imagen)
36. Configuración

### Fase 4: PDFs e integraciones
37. PDF cotización (diseño bonito con logo)
38. PDF orden del día (para staff)
39. Email confirmación (Nodemailer)
40. Google Calendar API

### Fase 5: Deploy
41. GitHub (repo privado)
42. Cloudinary (imágenes)
43. Vercel (frontend)
44. Railway (backend)
45. UptimeRobot (monitoreo)
46. Dominio + DNS
