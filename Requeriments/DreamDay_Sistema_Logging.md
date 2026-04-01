# DREAM DAY — SISTEMA DE LOGGING v1.0
## Winston + Grafana + Loki — Integrado desde el inicio

---

## 1. ESTRATEGIA DE LOGGING

### Alcance: Full-Stack
- **Backend (Node/Express):** Requests, errores, eventos de negocio, queries lentas
- **Frontend (React):** Errores JS, navegación, eventos de UI críticos

### Principios
- Todos los logs en formato **JSON consistente**
- Timestamps en **UTC** (ISO 8601)
- **Niveles:** error > warn > info > debug
- **Nunca loguear:** contraseñas, tokens JWT, emails completos, datos de pago
- **Correlation ID:** cada request tiene un ID único que conecta todos sus logs
- Rotación de archivos: máximo 5 archivos de 10MB cada uno

---

## 2. CAMPOS DE LOG (ESTRUCTURA JSON)

```json
{
  "timestamp": "2026-03-15T14:23:45.000Z",
  "level": "info",
  "service": "backend",
  "env": "production",
  "message": "Cotización creada exitosamente",
  "correlationId": "req-abc123-def456",
  "method": "POST",
  "path": "/api/cotizaciones",
  "status": 201,
  "responseTimeMs": 245,
  "userId": null,
  "context": {
    "codigoReferencia": "DD2603-B8A2",
    "serviciosCount": 4
  }
}
```

### Campos obligatorios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| timestamp | String (ISO 8601 UTC) | Cuándo pasó |
| level | String (error/warn/info/debug) | Gravedad |
| service | String (backend/frontend) | De dónde viene |
| env | String (development/production) | Ambiente |
| message | String | Qué pasó (legible) |
| correlationId | String (UUID) | ID único por request |

### Campos opcionales
| Campo | Tipo | Cuándo se usa |
|-------|------|--------------|
| method | String (GET/POST/PUT/DELETE) | En requests HTTP |
| path | String | Ruta del request |
| status | Number | Código HTTP de respuesta |
| responseTimeMs | Number | Latencia en milisegundos |
| userId | String | Si hay admin autenticado |
| context | Object | Datos extra del evento |
| error | Object | Stack trace en errores |
| userAgent | String | Navegador del cliente |
| ip | String (hasheado) | IP anonimizada |

---

## 3. IMPLEMENTACIÓN BACKEND (Winston)

### Dependencia
```bash
npm install winston winston-daily-rotate-file uuid
```

### Configuración Winston
```javascript
// src/config/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'backend',
    env: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Archivo rotativo — todos los logs
    new DailyRotateFile({
      dirname: logDir,
      filename: 'dreamday-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',  // Mantener 14 días
      level: 'info'
    }),
    // Archivo rotativo — solo errores
    new DailyRotateFile({
      dirname: logDir,
      filename: 'dreamday-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',  // Errores se guardan 30 días
      level: 'error'
    })
  ]
});

// En desarrollo, también mostrar en consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### Middleware de Correlation ID
```javascript
// src/middleware/correlationId.js
const { v4: uuidv4 } = require('uuid');

const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};

module.exports = correlationIdMiddleware;
```

### Middleware de Request Logging
```javascript
// src/middleware/requestLogger.js
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Cuando la respuesta termine
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const logData = {
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: responseTime,
      userAgent: req.get('user-agent'),
      userId: req.usuario?.id || null
    };

    // Determinar nivel según status
    if (res.statusCode >= 500) {
      logger.error('Request fallido (server error)', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request fallido (client error)', logData);
    } else if (responseTime > 500) {
      logger.warn('Request lento (>500ms)', logData);
    } else {
      logger.info('Request completado', logData);
    }
  });

  next();
};

module.exports = requestLogger;
```

### Logs de Eventos de Negocio
```javascript
// Ejemplos de uso en controladores:

// Cotización creada
logger.info('Cotización creada', {
  correlationId: req.correlationId,
  context: {
    codigoReferencia: 'DD2603-B8A2',
    serviciosCount: 4,
    fechaEvento: '2026-03-15',
    categoria: 'comida'
  }
});

// Cita confirmada
logger.info('Cita confirmada', {
  correlationId: req.correlationId,
  userId: req.usuario.id,
  context: {
    codigoReferencia: 'DD2603-B8A2',
    serviciosConfirmados: 4
  }
});

// Conflictos resueltos
logger.warn('Cotizaciones en conflicto detectadas', {
  correlationId: req.correlationId,
  context: {
    cotizacionesAfectadas: 3,
    fecha: '2026-03-15',
    servicioId: '...'
  }
});

// Error de base de datos
logger.error('Error MongoDB', {
  correlationId: req.correlationId,
  error: {
    message: err.message,
    stack: err.stack,
    code: err.code
  }
});

// Login fallido
logger.warn('Intento de login fallido', {
  correlationId: req.correlationId,
  context: {
    email: '***@***.com',  // Censurado
    ip: req.ip,
    intentosRestantes: 3
  }
});

// Servicio bloqueado por admin
logger.info('Disponibilidad bloqueada por admin', {
  correlationId: req.correlationId,
  userId: req.usuario.id,
  context: {
    servicioId: '...',
    fechas: ['2026-03-15', '2026-03-16'],
    motivo: 'Mantenimiento'
  }
});
```

### Middleware de Error Global
```javascript
// src/middleware/errorHandler.js
const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error no manejado', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.originalUrl,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    }
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
};

module.exports = errorHandler;
```

---

## 4. IMPLEMENTACIÓN FRONTEND (React)

### Logger del frontend
```javascript
// src/utils/frontendLogger.js

const LOG_ENDPOINT = '/api/logs'; // Opcional: enviar al backend

const frontendLogger = {
  log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'frontend',
      env: import.meta.env.MODE,
      message,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      context
    };

    // Siempre guardar en consola (dev)
    if (import.meta.env.DEV) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `[${level.toUpperCase()}]`, message, context
      );
    }

    // Enviar al backend para centralizar (opcional)
    try {
      navigator.sendBeacon(LOG_ENDPOINT, JSON.stringify(logEntry));
    } catch (e) {
      // Silencioso si falla
    }
  },

  info(message, context) { this.log('info', message, context); },
  warn(message, context) { this.log('warn', message, context); },
  error(message, context) { this.log('error', message, context); },
  debug(message, context) { this.log('debug', message, context); }
};

export default frontendLogger;
```

### Captura de errores globales
```javascript
// src/main.jsx — agregar al inicio
import frontendLogger from './utils/frontendLogger';

// Errores de JavaScript no capturados
window.onerror = (message, source, lineno, colno, error) => {
  frontendLogger.error('Error JavaScript no capturado', {
    message,
    source,
    lineno,
    colno,
    stack: error?.stack
  });
};

// Promesas rechazadas sin catch
window.addEventListener('unhandledrejection', (event) => {
  frontendLogger.error('Promesa rechazada sin catch', {
    reason: event.reason?.message || String(event.reason)
  });
});
```

### Logs de navegación (React Router)
```javascript
// En el componente principal o layout
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import frontendLogger from '../utils/frontendLogger';

function useRouteLogger() {
  const location = useLocation();

  useEffect(() => {
    frontendLogger.info('Navegación de página', {
      path: location.pathname,
      search: location.search
    });
  }, [location]);
}
```

### Logs de eventos de UI
```javascript
// Agregar al carrito
frontendLogger.info('Servicio agregado al carrito', {
  servicioId: '...',
  servicioNombre: 'Taco Bar',
  categoria: 'comida'
});

// Cotización enviada
frontendLogger.info('Cotización enviada', {
  serviciosCount: 4,
  fechaEvento: '2026-03-15'
});

// Error en formulario
frontendLogger.warn('Validación de formulario fallida', {
  campo: 'telefono',
  error: 'Debe tener 10 dígitos'
});

// Tiempo de carga
frontendLogger.info('Página cargada', {
  loadTimeMs: performance.now()
});
```

---

## 5. GRAFANA + LOKI (DOCKER)

### docker-compose.yml
```yaml
# /dream-day-project/docker-compose.logging.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki-data:/loki

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - ./backend/logs:/var/log/dreamday
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=dreamday2026
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - loki

volumes:
  loki-data:
  grafana-data:
```

### promtail-config.yml
```yaml
# /dream-day-project/promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: dreamday-backend
    static_configs:
      - targets:
          - localhost
        labels:
          job: dreamday
          service: backend
          __path__: /var/log/dreamday/*.log
```

### Cómo levantar
```bash
cd /home/ayanami/Documents/dream-day-project
docker compose -f docker-compose.logging.yml up -d
```

### Acceder
- **Grafana:** http://localhost:3001 (user: admin, pass: dreamday2026)
- **Loki:** http://localhost:3100 (solo API, se accede desde Grafana)

### Configurar datasource en Grafana
1. Abrir Grafana → Configuration → Data Sources
2. Add data source → Loki
3. URL: http://loki:3100
4. Save & Test

---

## 6. ESCENARIOS DE PRUEBA (para la tarea)

### 6.1 Requests exitosos (≥20 en 3 rutas)
```
GET  /api/servicios                    × 8 requests
GET  /api/servicios/categoria/comida   × 7 requests
GET  /api/categorias                   × 5 requests
```

### 6.2 Errores (≥3)
```
GET  /api/servicios/999999             → 404 (servicio no existe)
POST /api/cotizaciones (sin body)      → 400 (validación)
GET  /api/admin/cotizaciones (sin JWT) → 401 (no autorizado)
POST /api/auth/login (pass incorrecto) → 401 (login fallido)
```

### 6.3 Eventos de negocio (≥5)
```
cotizacion_creada      → POST /api/cotizaciones (éxito)
cotizacion_rechazada   → PUT /api/admin/cotizaciones/:id/estado
cita_confirmada        → POST /api/admin/citas
disponibilidad_bloqueada → POST /api/admin/disponibilidad/bloquear
servicio_creado        → POST /api/admin/servicios
login_exitoso          → POST /api/auth/login
```

### 6.4 Latencia alta (≥2)
```
GET /api/disponibilidad/multiple?servicios=id1,id2,id3,id4,id5,id6,id7,id8&mes=2026-03
→ Consulta cruzada de 8 servicios × 31 días = muchas queries

POST /api/cotizaciones (con PDF)
→ Generar PDF + guardar en disco + insertar en BD
```

---

## 7. CONSULTAS GRAFANA / LOKI (para la tarea)

### Top 5 rutas más visitadas
```logql
{service="backend"} |= "Request completado" | json | line_format "{{.path}}"
```

### Errores por hora (histograma)
```logql
count_over_time({service="backend"} |= "error" [1h])
```

### Requests lentos (>500ms)
```logql
{service="backend"} |= "Request lento" | json | responseTimeMs > 500
```

### Cotizaciones creadas por día
```logql
{service="backend"} |= "Cotización creada" | json
```

### Intentos de login fallidos
```logql
{service="backend"} |= "login fallido" | json
```

### Percentil de latencia
```logql
quantile_over_time(0.95, {service="backend"} | json | unwrap responseTimeMs [1h])
```

---

## 8. ESTRUCTURA DE ARCHIVOS DE LOGS

```
dream-day-project/
├── backend/
│   ├── logs/                          ← Carpeta de logs (gitignored)
│   │   ├── dreamday-2026-03-15.log   ← Todos los logs del día
│   │   ├── dreamday-error-2026-03-15.log ← Solo errores
│   │   └── ...
│   └── src/
│       ├── config/
│       │   └── logger.js             ← Configuración Winston
│       └── middleware/
│           ├── correlationId.js      ← Genera ID por request
│           ├── requestLogger.js      ← Log de cada request
│           └── errorHandler.js       ← Log de errores globales
├── frontend/
│   └── src/
│       └── utils/
│           └── frontendLogger.js     ← Logger del frontend
├── docker-compose.logging.yml        ← Grafana + Loki + Promtail
├── promtail-config.yml               ← Config de Promtail
└── .gitignore                        ← Incluir: logs/, grafana-data/
```

---

## 9. DATOS SENSIBLES — QUÉ NO LOGUEAR

| ❌ Nunca loguear | ✅ Alternativa |
|------------------|---------------|
| Contraseñas | "login_attempt" sin password |
| Tokens JWT | "token_generado" sin el token |
| Email completo | "***@***.com" (censurado) |
| Teléfono completo | "449***4567" (parcial) |
| IP sin hash | Hash del IP o solo primeros octetos |
| Datos de pago | Solo "pago_recibido: true" |

---

## 10. DEPENDENCIAS ADICIONALES

### Backend
```bash
npm install winston winston-daily-rotate-file uuid
```

### Docker (ya instalado en tu máquina)
```bash
# Ya tienes Docker — verificar con:
docker --version
docker compose version
```
