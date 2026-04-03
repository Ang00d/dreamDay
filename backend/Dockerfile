# ============================================
# DREAM DAY — Dockerfile (Backend)
# Práctica 2 — Dockerización
#
# Build: docker build -t dreamday-backend .
# Run:   docker run -p 5000:5000 --env-file .env dreamday-backend
# ============================================

# Etapa 1: Base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/

# Etapa 2: Producción
FROM node:20-alpine AS production
WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -S dreamday && adduser -S dreamday -G dreamday

# Copiar dependencias y código
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src
COPY --from=base /app/package*.json ./

# Crear directorio de logs
RUN mkdir -p logs && chown -R dreamday:dreamday /app

# Cambiar a usuario no-root
USER dreamday

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000

# Exponer puerto
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:5000/api/health || exit 1

# Iniciar servidor
CMD ["node", "src/server.js"]
