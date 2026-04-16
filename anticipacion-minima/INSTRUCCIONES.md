# DREAM DAY — Anticipación Mínima por Categoría
## Instrucciones de instalación

### ¿Qué se implementa?
Validación de anticipación mínima según la categoría de cada servicio.
- **Comida** y **Bebidas** requieren **7 días** de anticipación
- **Postres**, **Inflables** y **Extras** se pueden solicitar para mañana (0 días extra)

### Cambios realizados

#### Backend (2 archivos)
1. `backend/src/routes/servicios.js`
   - Se agrega `anticipacionMinimaDias` al `.populate()` de categoría
   - Así el frontend recibe el dato al cargar servicios

2. `backend/src/routes/cotizaciones.js`
   - Se valida anticipación mínima al crear cotización (POST)
   - Si la fecha no cumple, retorna error 400 con mensaje descriptivo

#### Frontend (4 archivos)
3. `frontend/src/utils/carrito.js`
   - Se agrega campo `categoriaAnticipacion` al guardar en localStorage

4. `frontend/src/pages/HomePage.jsx`
   - Se pasa `categoriaAnticipacion` al agregar servicio al carrito

5. `frontend/src/components/cotizacion/FormularioWizard.jsx`
   - Se mapea `categoriaAnticipacion` desde el carrito
   - Se valida anticipación antes de permitir avanzar al paso 3

6. `frontend/src/components/cotizacion/PasoFecha.jsx`
   - Fecha mínima dinámica según anticipación del carrito
   - Banner informativo: "Anticipación requerida: Comida (7 días)"
   - Aviso naranja si la fecha elegida no cumple anticipación
   - El check verde ✅ solo aparece si pasa AMBAS validaciones

---

### Comandos de instalación

```bash
cd ~/Documents/dream-day-project

# Backend
cp anticipacion-minima/backend/src/routes/servicios.js backend/src/routes/servicios.js
cp anticipacion-minima/backend/src/routes/cotizaciones.js backend/src/routes/cotizaciones.js

# Frontend
cp anticipacion-minima/frontend/src/utils/carrito.js frontend/src/utils/carrito.js
cp anticipacion-minima/frontend/src/pages/HomePage.jsx frontend/src/pages/HomePage.jsx
cp anticipacion-minima/frontend/src/components/cotizacion/FormularioWizard.jsx frontend/src/components/cotizacion/FormularioWizard.jsx
cp anticipacion-minima/frontend/src/components/cotizacion/PasoFecha.jsx frontend/src/components/cotizacion/PasoFecha.jsx
```

### Probar local

```bash
# Terminal 1 — Backend
cd ~/Documents/dream-day-project/backend
npm run dev

# Terminal 2 — Frontend
cd ~/Documents/dream-day-project/frontend
npm run dev
```

### Pruebas a realizar
1. Agregar un servicio de **Comida** al carrito → ir al wizard
2. En Paso 2, verificar que aparece el banner "Anticipación requerida: Comida (7 días)"
3. Verificar que la fecha mínima es hoy + 7 días
4. Intentar seleccionar una fecha dentro de los próximos 6 días → debe mostrar aviso naranja
5. Seleccionar una fecha 8+ días en el futuro → debe mostrar ✅ verde
6. Agregar solo servicios de **Postres** → fecha mínima debe ser mañana (sin restricción extra)
7. Enviar cotización con fecha < 7 días para comida → backend rechaza con error 400

### IMPORTANTE
Los usuarios que ya tengan servicios en el carrito (localStorage) no tendrán el campo
`categoriaAnticipacion`. Esto se maneja con `|| 0` en todos los puntos, así que no hay
breaking change. Al volver a agregar los servicios (o limpiar el carrito), se guardará
correctamente.

### Deploy a producción

```bash
cd ~/Documents/dream-day-project
git add -A
git commit -m "feat: validación de anticipación mínima por categoría (Comida/Bebidas 7 días)"
git push origin main
```
El CI/CD de GitHub Actions se encarga del deploy automático a Render y Vercel.
