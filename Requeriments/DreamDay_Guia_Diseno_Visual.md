# DREAM DAY — GUÍA DE DISEÑO VISUAL v1.0
## Basado en dreamday.html — Referencia oficial

---

## 1. PALETA DE COLORES

```css
:root {
  --cafe-claro: #C9A68D;       /* Color principal — botones, acentos, logo */
  --cafe-pastel: #D4B8A5;      /* Gradientes, hover states */
  --cafe-suave: #E8D5C4;       /* Bordes, separadores, fondos secundarios */
  --cafe-muy-claro: #F5EDE6;   /* Fondos de tarjetas, inputs, secciones alternas */
  --crema: #FDF9F5;            /* Fondo principal del body */
  --texto-oscuro: #3D3431;     /* Títulos, texto principal, footer bg */
  --texto-medio: #6B5B4F;      /* Texto secundario, descripciones */
  --blanco: #FFFFFF;            /* Fondos de cards, header, modales */
  --sombra: rgba(201, 166, 141, 0.15);     /* Sombras suaves */
  --sombra-fuerte: rgba(61, 52, 49, 0.1);  /* Sombras de hover */
  --error: #c0392b;            /* Mensajes de error */
  --exito: #27ae60;            /* Mensajes de éxito */
  --alerta: #f39c12;           /* Alertas, cotizaciones pendientes */
}
```

### Uso de colores
| Elemento | Color |
|----------|-------|
| Fondo página | --crema (#FDF9F5) |
| Header, cards, modales | --blanco (#FFFFFF) |
| Secciones alternas | --cafe-muy-claro (#F5EDE6) |
| Botones principales | Gradiente: --cafe-claro → --cafe-pastel |
| Texto títulos | --texto-oscuro (#3D3431) |
| Texto normal | --texto-medio (#6B5B4F) |
| Marca "Dream Day" | --cafe-claro (#C9A68D) |
| Bordes, líneas | --cafe-suave (#E8D5C4) |
| Footer fondo | --texto-oscuro (#3D3431) |
| Footer texto | --cafe-suave / --cafe-muy-claro |
| Inputs focus | border: --cafe-claro |
| Inputs fondo | --cafe-muy-claro |
| Errores | --error (#c0392b) |

---

## 2. TIPOGRAFÍAS

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Great+Vibes&family=Montserrat:wght@300;400;500;600&display=swap');
```

### Uso de fuentes
| Fuente | Uso | Ejemplo |
|--------|-----|---------|
| **Great Vibes** (cursive) | Marca "Dream Day", títulos decorativos de secciones | Hero brand, modal titles, footer brand |
| **Cormorant Garamond** (serif) | Subtítulos de secciones, nombres de categorías, h2-h4 elegantes | "NUESTROS SERVICIOS", "Conócenos", category headers |
| **Montserrat** (sans-serif) | Texto general, botones, inputs, navegación, párrafos | Body text, nav links, form labels, buttons |

### Tamaños base
```css
/* Hero */
.hero-brand: 5rem (Great Vibes) → 3.5rem @768px → 2.8rem @480px
.hero-h1: 1.5rem (Cormorant, uppercase, letter-spacing: 3px)
.hero-tagline: 1.3rem (Cormorant, uppercase, letter-spacing: 5px)
.hero-description: 1.1rem (Montserrat)

/* Secciones */
.section-subtitle: 1rem (Cormorant, uppercase, letter-spacing: 5px)
.section-brand-title: 3.5rem (Great Vibes)
.category-title: 2rem (Cormorant)
.subcategory-title: 1.4rem (Cormorant)

/* Cuerpo */
body: 1rem (Montserrat), line-height: 1.6
nav-links: 0.9rem (Montserrat, weight: 500, letter-spacing: 0.5px)
buttons: 0.8-1rem (Montserrat, weight: 500-600)
small-text: 0.85rem
```

---

## 3. COMPONENTES REUTILIZABLES

### 3.1 Botón principal (gradiente)
```css
.btn-primary {
  background: linear-gradient(135deg, var(--cafe-claro), var(--cafe-pastel));
  color: var(--blanco);
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 25px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px var(--sombra);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--sombra-fuerte);
}
```

### 3.2 Botón secundario (outline)
```css
.btn-secondary {
  background: var(--blanco);
  color: var(--texto-medio);
  border: 2px solid var(--cafe-suave);
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--cafe-claro);
  color: var(--cafe-claro);
}
```

### 3.3 Botón CTA grande (hero, formulario)
```css
.btn-cta {
  display: inline-block;
  padding: 1rem 3rem;
  background: linear-gradient(135deg, var(--cafe-claro), var(--cafe-pastel));
  color: var(--blanco);
  border: none;
  border-radius: 50px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px var(--sombra);
}

.btn-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px var(--sombra-fuerte);
}
```

### 3.4 Card (tarjeta genérica)
```css
.card {
  background: var(--blanco);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 5px 20px var(--sombra);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px var(--sombra);
}
```

### 3.5 Card categoría (fondo claro)
```css
.category-card {
  background: var(--cafe-muy-claro);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 40px var(--sombra);
}
```

### 3.6 Input / Form field
```css
.form-input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 2px solid var(--cafe-suave);
  border-radius: 10px;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  background: var(--cafe-muy-claro);
}

.form-input:focus {
  outline: none;
  border-color: var(--cafe-claro);
  background: var(--blanco);
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--texto-medio);
  font-size: 0.9rem;
  font-weight: 500;
}
```

### 3.7 Modal
```css
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(61, 52, 49, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: var(--blanco);
  padding: 3rem;
  border-radius: 20px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 60px var(--sombra-fuerte);
  animation: modalSlide 0.4s ease;
}

@keyframes modalSlide {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-title {
  font-family: 'Great Vibes', cursive;
  font-size: 2.5rem;
  color: var(--cafe-claro);
  text-align: center;
  margin-bottom: 2rem;
}
```

### 3.8 Nav link con underline animado
```css
.nav-link {
  text-decoration: none;
  color: var(--texto-medio);
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--cafe-claro);
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: var(--cafe-claro);
}

.nav-link:hover::after {
  width: 100%;
}
```

### 3.9 Scrollbar personalizado
```css
/* Scrollbar vertical */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--cafe-suave); border-radius: 10px; }
::-webkit-scrollbar-thumb { background: var(--cafe-claro); border-radius: 10px; }

/* Scrollbar horizontal */
.scroll-horizontal::-webkit-scrollbar { height: 6px; }
.scroll-horizontal::-webkit-scrollbar-track { background: var(--cafe-muy-claro); border-radius: 10px; }
.scroll-horizontal::-webkit-scrollbar-thumb { background: var(--cafe-pastel); border-radius: 10px; }
```

---

## 4. ESTRUCTURA DE SECCIONES

### 4.1 Header (fijo)
```
┌──────────────────────────────────────────────────────┐
│ [Logo]     Inicio  Nosotros  Servicios  Contacto [Ingresar] │
│                                                      │
│ Mobile: [Logo]                              [☰]     │
└──────────────────────────────────────────────────────┘
- Fondo: blanco
- Sombra: 0 2px 20px var(--sombra)
- Padding: 0.8rem 2rem (→ 0.5rem 1rem @480px)
- Position: fixed, z-index: 1000
- Logo: 60x60px (→ 50x50px @480px)
```

### 4.2 Hero
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              TODO PARA TU EVENTO                     │ ← Cormorant, uppercase
│              Dream Day                               │ ← Great Vibes, 5rem
│           HACEMOS REALIDAD TUS SUEÑOS                │ ← Cormorant, uppercase
│                                                      │
│    Empresa de Aguascalientes especializada en        │ ← Montserrat, 1.1rem
│    ofrecer una experiencia completa...               │
│                                                      │
│              [ Ver Servicios ]                        │ ← btn-cta
│                                                      │
│  Decoraciones: "DD" grande, opacidad 0.1             │
└──────────────────────────────────────────────────────┘
- Fondo: gradiente 135deg (cafe-muy-claro → crema → cafe-suave)
- Min-height: 100vh
- Padding-top: 100px (espacio para header fijo)
- Pseudo-elementos: radial-gradients decorativos
```

### 4.3 Servicios (ADAPTADO para Dream Day)
```
┌──────────────────────────────────────────────────────┐
│           NUESTROS SERVICIOS                         │
│           Catálogo                                   │
│                                                      │
│  [ 🍽 Comida ] [ 🥂 Bebidas ] [ 🍰 Postres ] ...   │ ← scroll horizontal
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ [IMG]   │  │ [IMG]   │  │ [IMG]   │             │
│  │ Taco Bar│  │Coctelería│ │ Crepas  │             │
│  │ 50 pers │  │ 50 coct │  │ 50 pzs  │             │
│  │[Agregar]│  │[Agregar]│  │[Agregar]│             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                      │
└──────────────────────────────────────────────────────┘
- Fondo sección: blanco
- Categorías: scroll horizontal con estilo Stories
- Tarjetas: card con hover translateY(-5px)
- Grid: auto-fill, minmax(280px, 1fr)
```

### 4.4 Nosotros
```
┌──────────────────────────────────────────────────────┐
│  ┌──────────┐    CONÓCENOS                           │
│  │          │    Nosotros                            │
│  │  [IMG]   │                                        │
│  │          │    En Dream Day, nos dedicamos...      │
│  │  ┌─┐    │                                        │
│  └──┘ │    │    ✨ Calidad    🎯 Atención           │
│       └────┘    ⏰ Puntualidad 💰 Precios justos    │
└──────────────────────────────────────────────────────┘
- Fondo: gradiente (cafe-muy-claro → crema)
- Grid: 1fr 1fr (→ 1fr @1024px)
- Decoración: cuadro con borde en esquina de imagen
```

### 4.5 Contacto
```
┌──────────────────────────────────────────────────────┐
│              ESTAMOS PARA AYUDARTE                   │
│              Contáctanos                             │
│                                                      │
│  📍 Ubicación            ┌────────────────┐          │
│  📞 Teléfono             │ Nombre         │          │
│  ✉️ Email                │ Email          │          │
│  🕐 Horario              │ Teléfono       │          │
│                          │ Mensaje...     │          │
│                          │ [Enviar]       │          │
│                          └────────────────┘          │
└──────────────────────────────────────────────────────┘
- Fondo: blanco
- Grid: 1fr 1fr (→ 1fr @1024px)
- Form fondo: cafe-muy-claro, border-radius: 20px
```

### 4.6 Footer
```
┌──────────────────────────────────────────────────────┐
│ Dream Day     Enlaces      Servicios     Legal       │
│ Hacemos       Inicio       Comida        Términos    │
│ realidad...   Nosotros     Bebidas       Privacidad  │
│               Servicios    Postres                   │
│ [📘][📸][🐦] Contacto     Inflables                 │
│                                                      │
│         © 2026 Dream Day. Todos los derechos...      │
└──────────────────────────────────────────────────────┘
- Fondo: texto-oscuro (#3D3431)
- Texto: cafe-suave / cafe-muy-claro
- Brand: Great Vibes, cafe-claro
- Grid: 2fr 1fr 1fr 1fr (→ 1fr 1fr @1024px → 1fr @768px)
```

---

## 5. ANIMACIONES Y TRANSICIONES

```css
/* Transición estándar */
transition: all 0.3s ease;

/* Hover cards — sube y aumenta sombra */
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px var(--sombra);
}

/* Hover botones — sube suave */
.btn:hover {
  transform: translateY(-2px);
}

/* Hover logo — escala suave */
.logo:hover {
  transform: scale(1.02);
}

/* Modal entrada — slide down con fade */
@keyframes modalSlide {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Nav link underline — crece de izquierda */
.nav-link::after { width: 0; transition: width 0.3s ease; }
.nav-link:hover::after { width: 100%; }

/* Menú hamburguesa — rotación en X */
.menu-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.menu-toggle.active span:nth-child(2) { opacity: 0; }
.menu-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(7px, -6px); }
```

---

## 6. BREAKPOINTS RESPONSIVE

```css
/* Tablet grande */
@media (max-width: 1024px) {
  /* Grids pasan de multi-columna a menos columnas */
  .footer-container: 1fr 1fr;
  .about-container: 1fr;
  .contact-content: 1fr;
}

/* Tablet / Móvil grande */
@media (max-width: 768px) {
  /* Nav desktop oculto, menú hamburguesa visible */
  .nav-desktop: display: none;
  .menu-toggle: display: flex;
  
  /* Tamaños reducidos */
  .hero-brand: 3.5rem;
  .section-brand-title: 2.5rem;
  
  /* Category headers se vuelven columna */
  .category-header: flex-direction: column;
  
  /* Footer 1 columna centrada */
  .footer-container: 1fr; text-align: center;
}

/* Móvil */
@media (max-width: 480px) {
  header: padding: 0.5rem 1rem;
  .logo: 50x50px;
  .hero-brand: 2.8rem;
  .modal: padding: 2rem;
  .service-image: 150px x 120px;
}
```

---

## 7. APLICACIÓN EN PDFs

### Paleta PDF (misma que web)
```javascript
const COLORES_PDF = {
  cafeclaro: '#C9A68D',     // Líneas decorativas, acentos
  cafePastel: '#D4B8A5',    // Fondos de sección
  cafeSuave: '#E8D5C4',     // Bordes, separadores
  cafeMuyClaro: '#F5EDE6',  // Fondo de tablas alternas
  crema: '#FDF9F5',         // Fondo página
  textoOscuro: '#3D3431',   // Títulos
  textoMedio: '#6B5B4F',    // Texto normal
  blanco: '#FFFFFF',        // Fondos cards
};
```

### PDF Cotización
- Header: Logo Dream Day centrado + línea decorativa café
- Títulos de sección: Fondo cafe-muy-claro con texto oscuro
- Líneas divisorias: cafe-suave
- Código DD2603-XXXX: Grande, color cafe-claro
- Footer: Línea café + texto WhatsApp

### PDF Orden del Día
- Header: Logo + fecha + "Orden del Día — Staff"
- Tabla servicios: Filas alternas cafe-muy-claro / blanco
- Bordes tabla: cafe-suave
- Encabezados tabla: Fondo cafe-claro, texto blanco
- Footer: © Dream Day

---

## 8. ICONOS

### Método: Emojis nativos + Lucide React
Los emojis nativos se usan para categorías y features.
Lucide React se usa para UI (carrito, menú, cerrar, flechas).

### Categorías
| Categoría | Emoji |
|-----------|-------|
| Comida | 🍽 |
| Bebidas | 🥂 |
| Postres | 🍰 |
| Inflables | 🎪 |
| Extras | ✨ |

### UI (Lucide)
```javascript
import {
  ShoppingCart,    // Carrito
  Menu,            // Hamburguesa
  X,               // Cerrar
  ChevronDown,     // Dropdown
  ChevronRight,    // Flecha
  Search,          // Buscar
  Calendar,        // Calendario
  Clock,           // Hora
  MapPin,          // Ubicación
  Users,           // Personas
  Phone,           // Teléfono
  Mail,            // Email
  Download,        // Descargar PDF
  Check,           // Confirmado
  AlertTriangle,   // Alerta
  Trash2,          // Eliminar
  Edit,            // Editar
  Plus,            // Agregar
  Eye,             // Ver detalle
  LogOut,          // Cerrar sesión
} from 'lucide-react';
```
