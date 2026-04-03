/* ============================================
   DREAM DAY — Middleware: ABAC
   Práctica 2 — Autorización basada en atributos
   
   A diferencia de RBAC (que solo verifica el ROL),
   ABAC evalúa múltiples atributos del usuario,
   del recurso y del contexto para decidir si se
   permite la acción.
   
   Atributos evaluados:
   - usuario.rol        → Rol del usuario
   - usuario.departamento → Departamento asignado
   - usuario.region     → Región geográfica
   - recurso.tipo       → Tipo de recurso solicitado
   - contexto.hora      → Hora del día
   - contexto.ip        → Dirección IP
   ============================================ */

var logger = require('../config/logger');

// ── Políticas ABAC ─────────────────────────────────────────
// Cada política define QUIÉN puede hacer QUÉ bajo qué CONDICIONES
var politicas = [
  {
    nombre: 'admin_acceso_total',
    descripcion: 'Superadmin y admin tienen acceso total',
    condicion: function (usuario, recurso, contexto) {
      return ['superadmin', 'admin'].includes(usuario.rol);
    }
  },
  {
    nombre: 'editor_solo_cotizaciones',
    descripcion: 'Editor solo puede ver y editar cotizaciones',
    condicion: function (usuario, recurso, contexto) {
      return usuario.rol === 'editor' && ['cotizacion', 'servicio_lectura'].includes(recurso.tipo);
    }
  },
  {
    nombre: 'user_solo_lectura_publica',
    descripcion: 'User solo puede consultar servicios y sus propios datos',
    condicion: function (usuario, recurso, contexto) {
      return usuario.rol === 'user' && ['perfil_propio', 'servicio_lectura', 'cotizacion_propia'].includes(recurso.tipo);
    }
  },
  {
    nombre: 'ventas_acceso_cotizaciones',
    descripcion: 'Departamento ventas tiene acceso especial a cotizaciones',
    condicion: function (usuario, recurso, contexto) {
      return usuario.departamento === 'ventas' && recurso.tipo === 'cotizacion';
    }
  },
  {
    nombre: 'region_restringida',
    descripcion: 'Usuarios con región específica solo ven datos de su región',
    condicion: function (usuario, recurso, contexto) {
      if (usuario.region === 'todas') return true;
      return recurso.region === undefined || recurso.region === usuario.region;
    }
  },
  {
    nombre: 'horario_laboral',
    descripcion: 'Acceso a admin solo en horario laboral (7am - 11pm)',
    condicion: function (usuario, recurso, contexto) {
      if (['superadmin', 'admin'].includes(usuario.rol)) return true; // admins siempre
      var hora = contexto.hora || new Date().getHours();
      return hora >= 7 && hora <= 23;
    }
  }
];

// ── Middleware principal ABAC ────────────────────────────────
// Uso: abac({ tipo: 'cotizacion' })
// Uso avanzado: abac({ tipo: 'cotizacion', region: 'aguascalientes' })
function abac(recurso) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    var usuario = {
      rol: req.usuario.rol,
      departamento: req.usuario.departamento || 'general',
      region: req.usuario.region || 'aguascalientes',
      id: req.usuario._id
    };

    var contexto = {
      hora: new Date().getHours(),
      ip: req.ip,
      metodo: req.method,
      ruta: req.originalUrl
    };

    // Evaluar todas las políticas — al menos una debe permitir
    var permitido = false;
    var politicaAplicada = null;

    for (var i = 0; i < politicas.length; i++) {
      if (politicas[i].condicion(usuario, recurso, contexto)) {
        permitido = true;
        politicaAplicada = politicas[i].nombre;
        break;
      }
    }

    if (!permitido) {
      logger.warn('ABAC: Acceso denegado', {
        correlationId: req.correlationId,
        context: {
          usuarioId: usuario.id,
          rol: usuario.rol,
          departamento: usuario.departamento,
          region: usuario.region,
          recurso: recurso,
          hora: contexto.hora
        }
      });

      return res.status(403).json({
        error: 'Acceso denegado. No cumples las condiciones requeridas para este recurso.',
        detalle: {
          rol: usuario.rol,
          departamento: usuario.departamento,
          recursoSolicitado: recurso.tipo
        }
      });
    }

    logger.info('ABAC: Acceso permitido', {
      correlationId: req.correlationId,
      context: {
        usuarioId: usuario.id,
        politica: politicaAplicada,
        recurso: recurso.tipo
      }
    });

    req.abacPolitica = politicaAplicada;
    next();
  };
}

// ── Middleware: verificar propiedad del recurso ──────────────
// Para que un 'user' solo acceda a SUS datos
function soloPropietario(campoUsuarioId) {
  return function (req, res, next) {
    if (['superadmin', 'admin'].includes(req.usuario.rol)) {
      return next(); // admins pueden ver todo
    }
    var recursoUsuarioId = req.params[campoUsuarioId] || req.body[campoUsuarioId];
    if (recursoUsuarioId && recursoUsuarioId.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ error: 'Solo puedes acceder a tus propios datos.' });
    }
    next();
  };
}

module.exports = abac;
module.exports.abac = abac;
module.exports.soloPropietario = soloPropietario;
module.exports.politicas = politicas;
