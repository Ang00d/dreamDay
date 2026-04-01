# Cloudinary Integration — Dream Day

## Paso 1: Instalar dependencias
```bash
cd /home/ayanami/Documents/dream-day-project/backend
npm install cloudinary multer
```

## Paso 2: Agregar variables a .env
Agregar al final de `backend/.env`:
```
# Cloudinary
CLOUDINARY_CLOUD_NAME=dpojwrwed
CLOUDINARY_API_KEY=355744141133798
CLOUDINARY_API_SECRET=17wuTnSrnk1R55sGAPs4vYKLHD4
```

## Paso 3: Copiar archivos
```bash
cd /home/ayanami/Documents/dream-day-project
unzip -o ~/Downloads/cloudinary_setup.zip

cp cloudinary/backend/src/config/cloudinary.js backend/src/config/
cp cloudinary/backend/src/middleware/upload.js backend/src/middleware/
cp cloudinary/backend/src/routes/imagenes.js backend/src/routes/
cp cloudinary/backend/src/models/Servicio.js backend/src/models/
```

## Paso 4: Registrar ruta en server.js
Agregar DESPUES de las rutas admin existentes en `backend/src/server.js`:
```javascript
app.use('/api/admin/servicios', require('./routes/imagenes'));
```

## Paso 5: Reiniciar backend
```bash
cd backend
node src/server.js
```

## Paso 6: Probar subida
```bash
# Subir imagen de prueba a un servicio
curl -X POST http://localhost:5000/api/admin/servicios/SERVICIO_ID/imagenes \
  -H "Authorization: Bearer TOKEN" \
  -F "imagenes=@/ruta/a/imagen.jpg"
```

## Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/admin/servicios/:id/imagenes | Subir 1-5 imagenes |
| DELETE | /api/admin/servicios/:id/imagenes/:imagenId | Eliminar imagen |
| PATCH | /api/admin/servicios/:id/imagenes/:imagenId/principal | Marcar como principal |

## Limites
- Maximo 5 imagenes por servicio
- Maximo 5MB por imagen
- Solo JPEG, PNG, WEBP
- Cloudinary genera thumbnails automaticamente
