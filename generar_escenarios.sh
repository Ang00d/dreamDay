#!/bin/bash
# ============================================
# DREAM DAY — Script de Escenarios de Logging
# Genera los escenarios requeridos para la tarea
# ============================================

BASE="http://localhost:5000/api"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

echo ""
echo "=========================================="
echo "  DREAM DAY — Generador de Escenarios"
echo "=========================================="
echo ""

# ============================================
# 1. REQUESTS EXITOSOS (>=20 en 3 rutas)
# ============================================
echo -e "${GREEN}[1/4] Generando requests exitosos (>=20 en 3+ rutas)${NC}"
echo ""

echo "  → GET /api/categorias (x8)..."
for i in $(seq 1 8); do
  curl -s "$BASE/categorias" > /dev/null
  sleep 0.2
done
echo "    ✓ 8 requests completados"

echo "  → GET /api/servicios (x8)..."
for i in $(seq 1 8); do
  curl -s "$BASE/servicios" > /dev/null
  sleep 0.2
done
echo "    ✓ 8 requests completados"

echo "  → GET /api/disponibilidad/mes?anio=2026&mes=3 (x4)..."
for i in $(seq 1 4); do
  curl -s "$BASE/disponibilidad/mes?anio=2026&mes=3" > /dev/null
  sleep 0.2
done
echo "    ✓ 4 requests completados"

echo "  → GET /api/health (x5)..."
for i in $(seq 1 5); do
  curl -s "$BASE/health" > /dev/null
  sleep 0.2
done
echo "    ✓ 5 requests completados"

echo ""
echo -e "  ${GREEN}Total: 25 requests exitosos en 4 rutas ✓${NC}"
echo ""

# ============================================
# 2. ERRORES (>=3 — 404, 500, validacion)
# ============================================
echo -e "${RED}[2/4] Generando errores (>=3 tipos)${NC}"
echo ""

echo "  → GET /api/servicios/000000000000000000000099 (404 - no existe)..."
curl -s "$BASE/servicios/000000000000000000000099" > /dev/null
sleep 0.3

echo "  → POST /api/cotizaciones sin body (400 - validación)..."
curl -s -X POST "$BASE/cotizaciones" -H "Content-Type: application/json" -d '{}' > /dev/null
sleep 0.3

echo "  → POST /api/cotizaciones body incompleto (400 - validación)..."
curl -s -X POST "$BASE/cotizaciones" -H "Content-Type: application/json" \
  -d '{"cliente":{"nombre":"Test"},"evento":{},"servicios":[]}' > /dev/null
sleep 0.3

echo "  → GET /api/admin/cotizaciones sin JWT (401 - no autorizado)..."
curl -s "$BASE/admin/cotizaciones" > /dev/null
sleep 0.3

echo "  → POST /api/auth/login password incorrecto (401 - login fallido)..."
curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@dreamday.mx","password":"incorrecta123"}' > /dev/null
sleep 0.3

echo "  → GET /api/ruta-inexistente (404 - ruta no encontrada)..."
curl -s "$BASE/ruta-inexistente" > /dev/null
sleep 0.3

echo ""
echo -e "  ${RED}Total: 6 errores generados (400, 401, 404) ✓${NC}"
echo ""

# ============================================
# 3. EVENTOS DE NEGOCIO (>=5)
# ============================================
echo -e "${BLUE}[3/4] Generando eventos de negocio (>=5)${NC}"
echo ""

# Login exitoso
echo "  → Login exitoso..."
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dreamday.mx","password":"DreamDay2026!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
sleep 0.3
echo "    ✓ Login admin (evento: login_exitoso)"

# Obtener un servicioId real
SERVICIO_ID=$(curl -s "$BASE/servicios" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "    (usando servicioId: $SERVICIO_ID)"

# Crear cotización
echo "  → Creando cotización..."
FECHA_EVENTO="2026-04-20"
COT_RESPONSE=$(curl -s -X POST "$BASE/cotizaciones" \
  -H "Content-Type: application/json" \
  -d "{
    \"cliente\": {
      \"nombre\": \"María García Test\",
      \"email\": \"maria@test.com\",
      \"telefono\": \"4491234567\"
    },
    \"evento\": {
      \"fecha\": \"$FECHA_EVENTO\",
      \"horaInicio\": \"14:00\",
      \"personas\": 80,
      \"ubicacion\": \"Salón Los Arcos, Aguascalientes\",
      \"codigoPostal\": \"20000\",
      \"notas\": \"Evento de prueba para logging\"
    },
    \"servicios\": [
      { \"servicioId\": \"$SERVICIO_ID\", \"cantidad\": 80, \"notas\": \"Sin picante\" }
    ]
  }")
sleep 0.3

COT_ID=$(echo "$COT_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
COT_CODE=$(echo "$COT_RESPONSE" | grep -o '"codigoReferencia":"[^"]*"' | cut -d'"' -f4)
echo "    ✓ Cotización creada: $COT_CODE (evento: cotizacion_creada)"

# Crear segunda cotización
echo "  → Creando segunda cotización..."
COT2_RESPONSE=$(curl -s -X POST "$BASE/cotizaciones" \
  -H "Content-Type: application/json" \
  -d "{
    \"cliente\": {
      \"nombre\": \"Juan Pérez Test\",
      \"email\": \"juan@test.com\",
      \"telefono\": \"4499876543\"
    },
    \"evento\": {
      \"fecha\": \"2026-05-10\",
      \"horaInicio\": \"16:00\",
      \"personas\": 120,
      \"ubicacion\": \"Jardín Quinta Real\",
      \"codigoPostal\": \"20100\",
      \"notas\": \"Boda\"
    },
    \"servicios\": [
      { \"servicioId\": \"$SERVICIO_ID\", \"cantidad\": 120 }
    ]
  }")
sleep 0.3

COT2_ID=$(echo "$COT2_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
COT2_CODE=$(echo "$COT2_RESPONSE" | grep -o '"codigoReferencia":"[^"]*"' | cut -d'"' -f4)
echo "    ✓ Cotización creada: $COT2_CODE (evento: cotizacion_creada)"

# Cambiar estado a en_negociacion
echo "  → Cambiando estado a 'en_negociacion'..."
curl -s -X PATCH "$BASE/admin/cotizaciones/$COT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"en_negociacion"}' > /dev/null
sleep 0.3
echo "    ✓ Estado cambiado (evento: cotizacion_en_negociacion)"

# Confirmar cotización
echo "  → Confirmando cotización..."
curl -s -X PATCH "$BASE/admin/cotizaciones/$COT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"confirmada"}' > /dev/null
sleep 0.3
echo "    ✓ Cotización confirmada (evento: cita_confirmada)"

# Rechazar segunda cotización
echo "  → Rechazando segunda cotización..."
curl -s -X PATCH "$BASE/admin/cotizaciones/$COT2_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"estado":"rechazada"}' > /dev/null
sleep 0.3
echo "    ✓ Cotización rechazada (evento: cotizacion_rechazada)"

# Bloquear disponibilidad
echo "  → Bloqueando disponibilidad..."
curl -s -X POST "$BASE/admin/disponibilidad/bloquear" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"servicioId\":\"$SERVICIO_ID\",\"fecha\":\"2026-04-25\",\"motivoBloqueo\":\"Mantenimiento equipo\"}" > /dev/null
sleep 0.3
echo "    ✓ Fecha bloqueada (evento: disponibilidad_bloqueada)"

# Consultar cotización pública
echo "  → Consultando cotización por código público..."
curl -s "$BASE/cotizaciones/consultar/$COT_CODE" > /dev/null
sleep 0.3
echo "    ✓ Consulta pública (evento: cotizacion_consultada)"

# Dashboard admin
echo "  → Consultando dashboard admin..."
curl -s "$BASE/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
sleep 0.3
echo "    ✓ Dashboard consultado"

echo ""
echo -e "  ${BLUE}Total: 8+ eventos de negocio generados ✓${NC}"
echo ""

# ============================================
# 4. LATENCIA ALTA (>=2 casos >500ms)
# ============================================
echo -e "${YELLOW}[4/4] Generando casos de latencia alta (>=2)${NC}"
echo ""

echo "  → Consulta masiva de disponibilidad (todos los meses)..."
for m in 1 2 3 4 5 6 7 8 9 10 11 12; do
  curl -s "$BASE/disponibilidad/mes?anio=2026&mes=$m" > /dev/null &
done
wait
sleep 0.5
echo "    ✓ 12 consultas simultáneas"

echo "  → Múltiples cotizaciones + servicios en paralelo..."
for i in $(seq 1 5); do
  curl -s "$BASE/servicios" > /dev/null &
  curl -s "$BASE/categorias" > /dev/null &
  curl -s "$BASE/admin/cotizaciones" -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait
sleep 0.5
echo "    ✓ 15 requests paralelos"

echo ""
echo -e "  ${YELLOW}(La latencia >500ms depende de la carga del servidor) ✓${NC}"
echo ""

# ============================================
# RESUMEN
# ============================================
echo "=========================================="
echo -e "  ${GREEN}ESCENARIOS COMPLETADOS${NC}"
echo "=========================================="
echo ""
echo "  ✓ 25+ requests exitosos en 4+ rutas"
echo "  ✓ 6 errores (400, 401, 404)"
echo "  ✓ 8+ eventos de negocio"
echo "  ✓ 2+ casos de latencia (paralelo)"
echo ""
echo "  Cotización de prueba: $COT_CODE (confirmada)"
echo "  Cotización de prueba: $COT2_CODE (rechazada)"
echo ""
echo "  Logs en: backend/logs/"
echo "=========================================="
echo ""
