/* ============================================
   DREAM DAY — Seed de Datos
   
   Carga las 5 categorias + 57 servicios + admin
   en la base de datos. Ejecutar con:
   
   node src/seed.js
   
   CUIDADO: Borra los datos existentes antes de insertar.
   ============================================ */

require('dotenv').config();
var mongoose = require('mongoose');
var Categoria = require('./models/Categoria');
var Servicio = require('./models/Servicio');
var Usuario = require('./models/Usuario');
var logger = require('./config/logger');

// ============================================
// CATEGORIAS (5)
// ============================================
var categorias = [
  { nombre: 'Comida',     slug: 'comida',     icono: '🍽', orden: 1, anticipacionMinimaDias: 7 },
  { nombre: 'Bebidas',    slug: 'bebidas',    icono: '🥂', orden: 2, anticipacionMinimaDias: 7 },
  { nombre: 'Postres',    slug: 'postres',    icono: '🍰', orden: 3, anticipacionMinimaDias: 0 },
  { nombre: 'Inflables',  slug: 'inflables',  icono: '🎪', orden: 4, anticipacionMinimaDias: 0 },
  { nombre: 'Extras',     slug: 'extras',     icono: '✨', orden: 5, anticipacionMinimaDias: 0 },
];

// ============================================
// SERVICIOS (57)
// El precio es placeholder — el admin lo ajusta
// ============================================

// --- COMIDA (13) ---
var comida = [
  { nombre: 'Buffet de Guisados', descripcion: 'Buffet completo con variedad de guisados mexicanos tradicionales. Incluye tortillas, salsas, arroz y frijoles.', descripcionCorta: 'Variedad de guisados mexicanos tradicionales', tipoPrecio: 'por_persona', requisitoMinimo: { cantidad: 50, unidad: 'personas' }, duracionHoras: 2, precio: 150, incluye: ['Tortillas', 'Salsas', 'Arroz', 'Frijoles', 'Servicio'], orden: 1 },
  { nombre: 'Taco Bar', descripcion: 'Estacion de tacos con variedad de guisados a elegir. Incluye tortillas, salsas, complementos y servicio de taquero.', descripcionCorta: 'Estacion de tacos con variedad de guisados', tipoPrecio: 'por_persona', requisitoMinimo: { cantidad: 50, unidad: 'personas' }, duracionHoras: 2, precio: 130, incluye: ['Tortillas', 'Salsas', 'Complementos', 'Taquero'], orden: 2 },
  { nombre: 'Tacos al Vapor', descripcion: 'Tacos al vapor de diversos guisados. Incluye salsas y complementos.', descripcionCorta: 'Tacos al vapor de diversos guisados', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 250, unidad: 'tacos' }, duracionHoras: 2, precio: 12, incluye: ['Salsas', 'Complementos'], orden: 3 },
  { nombre: 'Chilaquiles', descripcion: 'Servicio de chilaquiles verdes o rojos con pollo, crema, queso y complementos.', descripcionCorta: 'Chilaquiles con pollo, crema y queso', tipoPrecio: 'por_orden', requisitoMinimo: { cantidad: 50, unidad: 'ordenes' }, duracionHoras: 2, precio: 85, incluye: ['Pollo', 'Crema', 'Queso', 'Complementos'], orden: 4 },
  { nombre: 'Cafe + Chilaquiles + Fruta', descripcion: 'Paquete completo de desayuno con cafe, chilaquiles y fruta de temporada.', descripcionCorta: 'Desayuno completo: cafe, chilaquiles y fruta', tipoPrecio: 'por_persona', requisitoMinimo: { cantidad: 50, unidad: 'personas' }, duracionHoras: 2, precio: 120, incluye: ['Cafe', 'Chilaquiles', 'Fruta de temporada'], orden: 5 },
  { nombre: 'Tortas de Lechon', descripcion: 'Tortas de lechon con guarniciones tradicionales.', descripcionCorta: 'Tortas de lechon con guarniciones', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 45, incluye: ['Lechon', 'Pan', 'Guarniciones'], orden: 6 },
  { nombre: 'Pizzas', descripcion: 'Servicio de pizzas variadas recien horneadas.', descripcionCorta: 'Pizzas variadas recien horneadas', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 35, incluye: ['Variedad de sabores', 'Servicio'], orden: 7 },
  { nombre: 'Hotdogs', descripcion: 'Estacion de hotdogs con variedad de toppings y salsas.', descripcionCorta: 'Hotdogs con variedad de toppings', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 100, unidad: 'piezas' }, duracionHoras: 2, precio: 25, incluye: ['Pan', 'Salchicha', 'Toppings', 'Salsas'], orden: 8 },
  { nombre: 'Pastas', descripcion: 'Estacion de pastas con diferentes salsas a elegir.', descripcionCorta: 'Pastas con variedad de salsas', tipoPrecio: 'por_orden', requisitoMinimo: { cantidad: 50, unidad: 'ordenes' }, duracionHoras: 2, precio: 75, incluye: ['Pasta', 'Salsas a elegir', 'Pan de ajo'], orden: 9 },
  { nombre: 'Flautas en Vaso', descripcion: 'Flautas servidas en vaso con crema, lechuga, queso y salsa.', descripcionCorta: 'Flautas en vaso con complementos', tipoPrecio: 'por_orden', requisitoMinimo: { cantidad: 50, unidad: 'ordenes' }, duracionHoras: 2, precio: 55, incluye: ['Flautas', 'Crema', 'Lechuga', 'Queso'], orden: 10 },
  { nombre: 'Brunch', descripcion: 'Servicio completo de brunch con opciones dulces y saladas.', descripcionCorta: 'Brunch completo dulce y salado', tipoPrecio: 'por_persona', requisitoMinimo: { cantidad: 50, unidad: 'personas' }, duracionHoras: 2, precio: 180, incluye: ['Opciones dulces', 'Opciones saladas', 'Bebidas', 'Fruta'], orden: 11 },
  { nombre: 'Charcuteria', descripcion: 'Tabla de charcuteria con quesos, carnes frias, frutas y panes artesanales.', descripcionCorta: 'Tabla de quesos, carnes frias y frutas', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 65, incluye: ['Quesos', 'Carnes frias', 'Frutas', 'Panes'], orden: 12 },
  { nombre: 'Snacks', descripcion: 'Variedad de snacks y botanas para tu evento.', descripcionCorta: 'Variedad de snacks y botanas', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 30, incluye: ['Variedad de snacks', 'Presentacion'], orden: 13 },
];

// --- BEBIDAS (9) ---
var bebidas = [
  { nombre: 'Cocteleria', descripcion: 'Barra de cocteles con mixologo profesional. Variedad de cocteles clasicos y de autor.', descripcionCorta: 'Barra de cocteles con mixologo profesional', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'cocteles' }, duracionHoras: 3, precio: 85, incluye: ['Mixologo', 'Ingredientes', 'Cristaleria', 'Hielo'], orden: 1 },
  { nombre: 'Cantaritos', descripcion: 'Cantaritos preparados con tequila, jugo de naranja, toronja y limon.', descripcionCorta: 'Cantaritos preparados con tequila y citricos', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 55, incluye: ['Cantarito de barro', 'Tequila', 'Jugos'], orden: 2 },
  { nombre: 'Mimosas', descripcion: 'Mimosas con jugo de naranja natural y vino espumoso.', descripcionCorta: 'Mimosas con jugo natural y espumoso', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 40, unidad: 'piezas' }, duracionHoras: 2, precio: 65, incluye: ['Vino espumoso', 'Jugo natural', 'Copa'], orden: 3 },
  { nombre: 'Drink Bags', descripcion: 'Bolsas de bebida personalizadas con coctel o bebida a elegir.', descripcionCorta: 'Bolsas personalizadas con coctel a elegir', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 45, incluye: ['Bolsa personalizada', 'Bebida', 'Popote'], orden: 4 },
  { nombre: 'Pared de Shots', descripcion: 'Pared decorativa con shots de diferentes sabores y colores.', descripcionCorta: 'Pared decorativa con shots de sabores', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 100, unidad: 'piezas' }, duracionHoras: 2, precio: 25, incluye: ['Estructura', 'Shots', 'Decoracion'], orden: 5 },
  { nombre: 'Coffee Break', descripcion: 'Servicio de cafe, te y acompanamiento para eventos corporativos o sociales.', descripcionCorta: 'Cafe, te y acompanamiento para eventos', tipoPrecio: 'por_persona', requisitoMinimo: { cantidad: 50, unidad: 'personas' }, duracionHoras: 2, precio: 95, incluye: ['Cafe', 'Te', 'Galletas', 'Pan dulce'], orden: 6 },
  { nombre: 'Aguas Naturales', descripcion: 'Garrafas de aguas frescas de sabores naturales.', descripcionCorta: 'Garrafas de aguas frescas naturales', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 2, unidad: 'garrafas' }, duracionHoras: 2, precio: 350, incluye: ['2 garrafas', 'Vasos', 'Hielo'], orden: 7 },
  { nombre: 'Back Bienvenida Cerveza', descripcion: 'Estacion de bienvenida con cerveza artesanal o comercial para los invitados.', descripcionCorta: 'Estacion de bienvenida con cerveza', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 2500, incluye: ['Estructura', 'Cerveza', 'Hielo', 'Vasos'], orden: 8 },
  { nombre: 'Cheery (Cocteles Kids)', descripcion: 'Cocteles sin alcohol para ninos con colores y sabores divertidos.', descripcionCorta: 'Cocteles sin alcohol para ninos', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 35, incluye: ['Bebida', 'Decoracion', 'Popote divertido'], orden: 9 },
];

// --- POSTRES (14) ---
var postres = [
  { nombre: 'Fresas con Crema', descripcion: 'Fresas frescas con crema batida y toppings a elegir.', descripcionCorta: 'Fresas frescas con crema y toppings', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 1800, incluye: ['Fresas', 'Crema', 'Toppings'], orden: 1 },
  { nombre: 'Malteadas', descripcion: 'Malteadas de diferentes sabores con toppings.', descripcionCorta: 'Malteadas de sabores con toppings', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 50, unidad: 'vasos' }, duracionHoras: 2, precio: 2200, incluye: ['Malteada', 'Vaso', 'Toppings'], orden: 2 },
  { nombre: 'Pasteles Personales', descripcion: 'Mini pasteles individuales decorados al tema del evento.', descripcionCorta: 'Mini pasteles individuales tematicos', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 55, incluye: ['Pastel individual', 'Decoracion tematica'], orden: 3 },
  { nombre: 'Crepas', descripcion: 'Estacion de crepas dulces con variedad de rellenos y toppings.', descripcionCorta: 'Estacion de crepas dulces con rellenos', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 40, incluye: ['Crepa', 'Rellenos', 'Toppings', 'Salsas'], orden: 4 },
  { nombre: 'Waffles', descripcion: 'Estacion de waffles con toppings dulces variados.', descripcionCorta: 'Waffles con toppings dulces variados', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 40, incluye: ['Waffle', 'Toppings', 'Salsas dulces'], orden: 5 },
  { nombre: 'Crepaletas', descripcion: 'Crepa en forma de paleta con relleno y cobertura de chocolate.', descripcionCorta: 'Crepa en paleta con cobertura de chocolate', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 35, incluye: ['Crepaleta', 'Relleno', 'Cobertura'], orden: 6 },
  { nombre: 'Mini Hotcakes', descripcion: 'Mini hotcakes en brocheta con toppings y miel.', descripcionCorta: 'Mini hotcakes en brocheta con toppings', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 30, incluye: ['Hotcakes', 'Brocheta', 'Miel', 'Toppings'], orden: 7 },
  { nombre: 'Churros', descripcion: 'Churros recien hechos con azucar y canela, opciones de relleno.', descripcionCorta: 'Churros recien hechos con relleno opcional', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 20, incluye: ['Churro', 'Azucar', 'Canela', 'Relleno opcional'], orden: 8 },
  { nombre: 'Maruchan Station', descripcion: 'Estacion divertida de Maruchan con toppings y complementos.', descripcionCorta: 'Estacion de Maruchan con toppings', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 70, unidad: 'piezas' }, duracionHoras: 2, precio: 25, incluye: ['Maruchan', 'Toppings', 'Complementos'], orden: 9 },
  { nombre: 'Chascas', descripcion: 'Preparados de fruta con chamoy, limon y chile.', descripcionCorta: 'Preparados de fruta con chamoy y chile', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 35, incluye: ['Fruta', 'Chamoy', 'Chile', 'Limon'], orden: 10 },
  { nombre: 'Paletas de Hielo', descripcion: 'Paletas de hielo artesanales de sabores naturales.', descripcionCorta: 'Paletas artesanales de sabores naturales', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 60, unidad: 'paletas' }, duracionHoras: 2, precio: 25, incluye: ['Paleta artesanal', 'Variedad de sabores'], orden: 11 },
  { nombre: 'Raspados', descripcion: 'Servicio de raspados con variedad de sabores y complementos.', descripcionCorta: 'Raspados con variedad de sabores', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'evento' }, duracionHoras: 1.5, precio: 2500, incluye: ['Maquina', 'Sabores', 'Vasos', 'Complementos'], orden: 12 },
  { nombre: 'Palomitas', descripcion: 'Maquina de palomitas con diferentes sabores y presentaciones.', descripcionCorta: 'Palomitas con variedad de sabores', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'evento' }, duracionHoras: 2, precio: 1500, incluye: ['Maquina', 'Maiz', 'Sabores', 'Bolsas'], orden: 13 },
  { nombre: 'Candy Bar', descripcion: 'Mesa de dulces personalizada al tema de tu evento con variedad de golosinas.', descripcionCorta: 'Mesa de dulces personalizada para tu evento', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 50, unidad: 'personas' }, duracionHoras: 2, precio: 3500, incluye: ['Dulces variados', 'Decoracion tematica', 'Mesa', 'Exhibidores'], orden: 14 },
];

// --- INFLABLES (13) ---
var inflables = [
  { nombre: 'Maxi Castillo', descripcion: 'Inflable tipo castillo grande ideal para fiestas infantiles.', descripcionCorta: 'Castillo inflable grande para fiestas', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 2800, incluye: ['Inflable', 'Instalacion', 'Monitoreo'], orden: 1 },
  { nombre: 'Castillo Palacio', descripcion: 'Inflable castillo estilo palacio con tobogan.', descripcionCorta: 'Castillo palacio inflable con tobogan', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 3200, incluye: ['Inflable', 'Instalacion', 'Monitoreo'], orden: 2 },
  { nombre: 'Laberinto White', descripcion: 'Inflable tipo laberinto en color blanco elegante.', descripcionCorta: 'Laberinto inflable blanco elegante', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 3500, incluye: ['Inflable', 'Instalacion', 'Monitoreo'], orden: 3 },
  { nombre: 'Ludoteca / Splash Pad', descripcion: 'Area de juegos acuaticos inflables tipo splash pad.', descripcionCorta: 'Area de juegos acuaticos inflables', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 4000, incluye: ['Inflable acuatico', 'Instalacion', 'Monitoreo'], orden: 4 },
  { nombre: 'Alberca Pelotas + Resbaladilla', descripcion: 'Alberca de pelotas con resbaladilla integrada para los mas pequenos.', descripcionCorta: 'Alberca de pelotas con resbaladilla', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 2200, incluye: ['Alberca', 'Pelotas', 'Resbaladilla', 'Monitoreo'], orden: 5 },
  { nombre: 'Castillo Petite + Alberca', descripcion: 'Castillo inflable tamano pequeno combinado con alberca de pelotas.', descripcionCorta: 'Mini castillo inflable con alberca', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 2500, incluye: ['Castillo', 'Alberca', 'Pelotas', 'Monitoreo'], orden: 6 },
  { nombre: 'Inflable Corazon', descripcion: 'Inflable en forma de corazon, ideal para eventos romanticos.', descripcionCorta: 'Inflable en forma de corazon romantico', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 3000, incluye: ['Inflable', 'Instalacion', 'Monitoreo'], orden: 7 },
  { nombre: 'Carritos Chocones', descripcion: 'Set de carritos chocones inflables para ninos y adultos.', descripcionCorta: 'Carritos chocones para ninos y adultos', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 3, precio: 3500, incluye: ['Carritos', 'Pista', 'Monitoreo'], orden: 8 },
  { nombre: 'Bumper Balls', descripcion: 'Bolas inflables para chocar, diversion garantizada.', descripcionCorta: 'Bolas inflables para chocar', tipoPrecio: 'por_juego', requisitoMinimo: { cantidad: 1, unidad: 'juego (2 bolas)' }, duracionHoras: 5, precio: 1800, incluye: ['2 bolas', 'Monitoreo'], orden: 9 },
  { nombre: 'Bubble House', descripcion: 'Casa burbuja transparente inflable para experiencias unicas.', descripcionCorta: 'Casa burbuja transparente inflable', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 3, precio: 4500, incluye: ['Bubble house', 'Instalacion', 'Decoracion interior'], orden: 10 },
  { nombre: 'Maxi Alberca', descripcion: 'Alberca inflable grande para eventos al aire libre.', descripcionCorta: 'Alberca inflable grande al aire libre', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 3800, incluye: ['Alberca grande', 'Instalacion', 'Monitoreo'], orden: 11 },
  { nombre: 'Castillo White', descripcion: 'Castillo inflable en color blanco elegante para todo tipo de evento.', descripcionCorta: 'Castillo inflable blanco elegante', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 3200, incluye: ['Inflable blanco', 'Instalacion', 'Monitoreo'], orden: 12 },
  { nombre: 'Mobiliario Infantil', descripcion: 'Juego de mesas y sillas infantiles tematicas para los pequenos invitados.', descripcionCorta: 'Mesas y sillas infantiles tematicas', tipoPrecio: 'por_juego', requisitoMinimo: { cantidad: 2, unidad: 'juegos' }, duracionHoras: 4, precio: 600, incluye: ['Mesa', 'Sillas', 'Mantel tematico'], orden: 13 },
];

// --- EXTRAS (8) ---
var extras = [
  { nombre: 'Flower Bar', descripcion: 'Estacion donde los invitados arman su propio arreglo floral.', descripcionCorta: 'Estacion para armar arreglos florales', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 50, unidad: 'piezas' }, duracionHoras: 2, precio: 75, incluye: ['Flores', 'Vasija', 'Accesorios', 'Guia'], orden: 1 },
  { nombre: 'Glitter Neon', descripcion: 'Servicio de maquillaje con glitter y neon para los invitados.', descripcionCorta: 'Maquillaje con glitter y neon', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'evento' }, duracionHoras: 2, precio: 2500, incluye: ['Maquillista', 'Glitter', 'Pintura neon'], orden: 2 },
  { nombre: 'Audio Guest Book', descripcion: 'Telefono vintage donde los invitados dejan mensajes de voz como recuerdo.', descripcionCorta: 'Telefono vintage para mensajes de voz', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 3, precio: 1800, incluye: ['Telefono vintage', 'Grabacion digital', 'Audio editado'], orden: 3 },
  { nombre: 'Back Bienvenida Recuerdos', descripcion: 'Estructura decorativa de bienvenida con espacio para fotos y recuerdos.', descripcionCorta: 'Estructura de bienvenida para fotos', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'unidad' }, duracionHoras: 5, precio: 2000, incluye: ['Estructura', 'Decoracion', 'Instalacion'], orden: 4 },
  { nombre: 'Paquete Picasso', descripcion: 'Actividad de pintura para ninos con materiales incluidos.', descripcionCorta: 'Actividad de pintura para ninos', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 10, unidad: 'ninos' }, duracionHoras: 2.5, precio: 3000, incluye: ['Lienzos', 'Pinturas', 'Pinceles', 'Delantales', 'Instructor'], orden: 5 },
  { nombre: 'Paquete Party', descripcion: 'Paquete completo de entretenimiento infantil con actividades variadas.', descripcionCorta: 'Paquete completo entretenimiento infantil', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 10, unidad: 'ninos' }, duracionHoras: 5, precio: 5500, incluye: ['Animador', 'Juegos', 'Musica', 'Actividades'], orden: 6 },
  { nombre: 'Paquete Baby Gym', descripcion: 'Area de estimulacion y juego seguro para bebes y ninos pequenos.', descripcionCorta: 'Area de juego seguro para bebes', tipoPrecio: 'precio_fijo', requisitoMinimo: { cantidad: 1, unidad: 'paquete' }, duracionHoras: 4, precio: 3500, incluye: ['Tapete', 'Juegos sensoriales', 'Pelotas', 'Monitor'], orden: 7 },
  { nombre: 'Tablitas Recuerdo', descripcion: 'Tablitas de madera personalizadas como recuerdo del evento.', descripcionCorta: 'Tablitas de madera personalizadas', tipoPrecio: 'por_pieza', requisitoMinimo: { cantidad: 20, unidad: 'piezas' }, duracionHoras: 0, precio: 85, incluye: ['Tablita grabada', 'Personalizacion'], orden: 8 },
];

// ============================================
// ADMIN (usuario inicial)
// ============================================
var adminInicial = {
  nombre: 'Admin Dream Day',
  email: 'admin@dreamday.mx',
  password: 'DreamDay2026!',
  rol: 'superadmin'
};

// ============================================
// EJECUTAR SEED
// ============================================
async function seed() {
  try {
    // Conectar a MongoDB
    var uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dreamday';
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');

    // Limpiar datos existentes
    await Categoria.deleteMany({});
    await Servicio.deleteMany({});
    await Usuario.deleteMany({});
    console.log('Datos anteriores eliminados');

    // Insertar categorias
    var categoriasInsertadas = await Categoria.insertMany(categorias);
    console.log('5 categorias insertadas');

    // Crear mapa slug -> _id para asignar categorias a servicios
    var catMap = {};
    categoriasInsertadas.forEach(function (cat) {
      catMap[cat.slug] = cat._id;
    });

    // Preparar servicios con su categoria
    function prepararServicios(lista, slugCategoria) {
      return lista.map(function (s) {
        s.categoria = catMap[slugCategoria];
        return s;
      });
    }

    var todosLosServicios = [].concat(
      prepararServicios(comida, 'comida'),
      prepararServicios(bebidas, 'bebidas'),
      prepararServicios(postres, 'postres'),
      prepararServicios(inflables, 'inflables'),
      prepararServicios(extras, 'extras')
    );

    await Servicio.insertMany(todosLosServicios);
    console.log(todosLosServicios.length + ' servicios insertados');

    // Crear admin
    var admin = new Usuario(adminInicial);
    await admin.save();
    console.log('Admin creado: ' + adminInicial.email);

    console.log('\n========================================');
    console.log('  SEED COMPLETADO EXITOSAMENTE');
    console.log('  Categorias: 5');
    console.log('  Servicios: ' + todosLosServicios.length);
    console.log('  Admin: ' + adminInicial.email);
    console.log('  Password: ' + adminInicial.password);
    console.log('========================================\n');

    process.exit(0);

  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
}

seed();
