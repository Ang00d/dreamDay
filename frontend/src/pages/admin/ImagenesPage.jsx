import { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { showToast } from '../../utils/toast';
import { Upload, Trash2, Star, Search, ImageIcon, X, ChevronLeft, Loader2 } from 'lucide-react';
import './ImagenesPage.css';

function ImagenesPage() {
  var [servicios, setServicios] = useState([]);
  var [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  var [cargando, setCargando] = useState(true);
  var [subiendo, setSubiendo] = useState(false);
  var [eliminando, setEliminando] = useState(null);
  var [busqueda, setBusqueda] = useState('');
  var [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  var fileInputRef = useRef(null);

  useEffect(function () {
    cargarServicios();
  }, []);

  async function cargarServicios() {
    try {
      setCargando(true);
      var res = await adminService.getServicios();
      setServicios(res.data.data);
    } catch (err) {
      console.error('Error cargando servicios:', err);
      showToast('Error al cargar servicios', 'error');
    } finally {
      setCargando(false);
    }
  }

  async function subirImagen(e) {
    var archivos = e.target.files;
    if (!archivos || archivos.length === 0) return;

    var servicio = servicioSeleccionado;
    var imagenesActuales = servicio.imagenes ? servicio.imagenes.length : 0;

    if (imagenesActuales + archivos.length > 5) {
      showToast('Máximo 5 imágenes por servicio. Actualmente tiene ' + imagenesActuales, 'error');
      return;
    }

    setSubiendo(true);
    var exitosas = 0;

    for (var i = 0; i < archivos.length; i++) {
      var archivo = archivos[i];

      if (archivo.size > 5 * 1024 * 1024) {
        showToast(archivo.name + ' excede 5MB', 'error');
        continue;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        showToast(archivo.name + ' — solo JPEG, PNG o WEBP', 'error');
        continue;
      }

      try {
        var formData = new FormData();
        formData.append('imagenes', archivo);
        await adminService.subirImagen(servicio._id, formData);
        exitosas++;
      } catch (err) {
        console.error('Error subiendo ' + archivo.name, err);
        showToast('Error al subir ' + archivo.name, 'error');
      }
    }

    if (exitosas > 0) {
      showToast(exitosas + (exitosas === 1 ? ' imagen subida' : ' imágenes subidas'), 'success');
      await refrescarServicio(servicio._id);
    }

    setSubiendo(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function eliminarImagen(imagenId) {
    if (!confirm('¿Eliminar esta imagen?')) return;

    setEliminando(imagenId);
    try {
      await adminService.eliminarImagen(servicioSeleccionado._id, imagenId);
      showToast('Imagen eliminada', 'success');
      await refrescarServicio(servicioSeleccionado._id);
    } catch (err) {
      console.error('Error eliminando imagen:', err);
      showToast('Error al eliminar imagen', 'error');
    } finally {
      setEliminando(null);
    }
  }

  async function marcarPrincipal(imagenId) {
    try {
      await adminService.marcarImagenPrincipal(servicioSeleccionado._id, imagenId);
      showToast('Imagen principal actualizada', 'success');
      await refrescarServicio(servicioSeleccionado._id);
    } catch (err) {
      console.error('Error marcando principal:', err);
      showToast('Error al actualizar imagen principal', 'error');
    }
  }

  async function refrescarServicio(id) {
    try {
      var res = await adminService.getServicios();
      var lista = res.data.data;
      setServicios(lista);
      var actualizado = lista.find(function (s) { return s._id === id; });
      if (actualizado) setServicioSeleccionado(actualizado);
    } catch (err) {
      console.error('Error refrescando:', err);
    }
  }

  var categorias = [];
  var categoriasMap = {};
  servicios.forEach(function (s) {
    var catNombre = s.categoria && s.categoria.nombre ? s.categoria.nombre : 'Sin categoría';
    if (!categoriasMap[catNombre]) {
      categoriasMap[catNombre] = true;
      categorias.push(catNombre);
    }
  });

  var serviciosFiltrados = servicios.filter(function (s) {
    var coincideBusqueda = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    var catNombre = s.categoria && s.categoria.nombre ? s.categoria.nombre : 'Sin categoría';
    var coincideCategoria = categoriaFiltro === 'todas' || catNombre === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  function contarImagenes(servicio) {
    return servicio.imagenes ? servicio.imagenes.length : 0;
  }

  function obtenerImagenPrincipal(servicio) {
    if (!servicio.imagenes || servicio.imagenes.length === 0) return null;
    var principal = servicio.imagenes.find(function (img) { return img.esPrincipal; });
    return principal || servicio.imagenes[0];
  }

  // === VISTA DETALLE DE SERVICIO ===
  if (servicioSeleccionado) {
    var imgs = servicioSeleccionado.imagenes || [];
    var catNombre = servicioSeleccionado.categoria && servicioSeleccionado.categoria.nombre
      ? servicioSeleccionado.categoria.nombre : '';

    return (
      <div className="imagenes-page">
        <div className="imagenes-header-detalle">
          <button
            className="btn-volver"
            onClick={function () { setServicioSeleccionado(null); }}
          >
            <ChevronLeft size={20} />
            <span>Volver a servicios</span>
          </button>
        </div>

        <div className="servicio-info-banner">
          <div className="servicio-info-texto">
            <span className="servicio-categoria-badge">{catNombre}</span>
            <h2>{servicioSeleccionado.nombre}</h2>
            <p>{servicioSeleccionado.descripcionCorta || servicioSeleccionado.descripcion}</p>
          </div>
          <div className="servicio-info-contador">
            <span className="contador-numero">{imgs.length}</span>
            <span className="contador-texto">/ 5 imágenes</span>
          </div>
        </div>

        {/* Zona de subida */}
        <div className="upload-zona">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={subirImagen}
            style={{ display: 'none' }}
            id="file-upload"
          />

          {imgs.length < 5 && (
            <label
              htmlFor="file-upload"
              className={'upload-area' + (subiendo ? ' subiendo' : '')}
            >
              {subiendo ? (
                <>
                  <Loader2 size={32} className="spin-icon" />
                  <span>Subiendo imagen...</span>
                </>
              ) : (
                <>
                  <Upload size={32} />
                  <span className="upload-titulo">Arrastra o haz clic para subir</span>
                  <span className="upload-info">JPEG, PNG o WEBP — Máx 5MB por imagen</span>
                </>
              )}
            </label>
          )}

          {imgs.length >= 5 && (
            <div className="upload-area upload-lleno">
              <ImageIcon size={32} />
              <span>Límite de 5 imágenes alcanzado</span>
              <span className="upload-info">Elimina una imagen para subir otra</span>
            </div>
          )}
        </div>

        {/* Galería de imágenes */}
        {imgs.length > 0 ? (
          <div className="galeria-grid">
            {imgs.map(function (img) {
              return (
                <div
                  key={img._id}
                  className={'galeria-item' + (img.esPrincipal ? ' es-principal' : '')}
                >
                  <div className="galeria-img-wrapper">
                    <img
                      src={img.url}
                      alt={img.alt || servicioSeleccionado.nombre}
                    />
                    {img.esPrincipal && (
                      <span className="badge-principal">
                        <Star size={12} /> Principal
                      </span>
                    )}
                  </div>
                  <div className="galeria-acciones">
                    {!img.esPrincipal && (
                      <button
                        className="btn-accion btn-estrella"
                        onClick={function () { marcarPrincipal(img._id); }}
                        title="Marcar como principal"
                      >
                        <Star size={16} />
                      </button>
                    )}
                    <button
                      className="btn-accion btn-eliminar"
                      onClick={function () { eliminarImagen(img._id); }}
                      disabled={eliminando === img._id}
                      title="Eliminar imagen"
                    >
                      {eliminando === img._id ? (
                        <Loader2 size={16} className="spin-icon" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="galeria-vacia">
            <ImageIcon size={48} />
            <p>Este servicio aún no tiene imágenes</p>
            <p className="texto-secundario">Sube la primera imagen para que aparezca en el catálogo</p>
          </div>
        )}
      </div>
    );
  }

  // === VISTA LISTA DE SERVICIOS ===
  return (
    <div className="imagenes-page">
      <div className="imagenes-header">
        <div>
          <h1>Gestión de Imágenes</h1>
          <p className="header-subtitulo">Administra las fotos de cada servicio</p>
        </div>
      </div>

      <div className="imagenes-filtros">
        <div className="filtro-busqueda">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar servicio..."
            value={busqueda}
            onChange={function (e) { setBusqueda(e.target.value); }}
          />
          {busqueda && (
            <button className="btn-limpiar" onClick={function () { setBusqueda(''); }}>
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={categoriaFiltro}
          onChange={function (e) { setCategoriaFiltro(e.target.value); }}
          className="filtro-categoria"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map(function (cat) {
            return <option key={cat} value={cat}>{cat}</option>;
          })}
        </select>
      </div>

      {cargando ? (
        <div className="cargando-container">
          <Loader2 size={36} className="spin-icon" />
          <p>Cargando servicios...</p>
        </div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="sin-resultados">
          <Search size={36} />
          <p>No se encontraron servicios</p>
        </div>
      ) : (
        <div className="servicios-grid">
          {serviciosFiltrados.map(function (servicio) {
            var imgPrincipal = obtenerImagenPrincipal(servicio);
            var totalImgs = contarImagenes(servicio);
            var catNom = servicio.categoria && servicio.categoria.nombre
              ? servicio.categoria.nombre : 'Sin categoría';

            return (
              <div
                key={servicio._id}
                className="servicio-card-img"
                onClick={function () { setServicioSeleccionado(servicio); }}
              >
                <div className="card-img-preview">
                  {imgPrincipal ? (
                    <img
                      src={imgPrincipal.url}
                      alt={servicio.nombre}
                    />
                  ) : (
                    <div className="card-img-placeholder">
                      <ImageIcon size={28} />
                      <span>Sin fotos</span>
                    </div>
                  )}
                  <span className={'card-img-badge' + (totalImgs === 0 ? ' sin-img' : totalImgs >= 5 ? ' completo' : '')}>
                    {totalImgs}/5
                  </span>
                </div>
                <div className="card-img-info">
                  <span className="card-img-cat">{catNom}</span>
                  <h3>{servicio.nombre}</h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ImagenesPage;
