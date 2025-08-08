#!/bin/bash

# Script de deployment para Personal Fit Santa Fe
# Este script se ejecuta en la máquina remota para hacer el deployment
#
# IMPORTANTE: Este script preserva ÚNICAMENTE:
# - Base de datos (volumen pgdata)
# - Comprobantes de pago (volumen comprobantes)
#
# TODO LO DEMÁS se destruye y se reconstruye desde cero:
# - Contenedores de aplicación
# - Imágenes de aplicación
# - Redes no utilizadas
# - Volúmenes no utilizados
#
# Esto asegura que los cambios del frontend y backend se apliquen correctamente.

set -euo pipefail  # Fallar ante errores y variables no definidas

echo "🚀 Iniciando deployment de Personal Fit Santa Fe..."

# Configuración
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
REPO_URL="https://github.com/Lautarobarella/Personal-Fit-Santa-Fe.git"
BRANCH="main"
APP_DOMAIN="https://personalfitsantafe.com"
BACKEND_PUBLIC="http://personalfitsantafe.com:8080"

# Función para logging con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función de retry para curl contra dominio
retry_curl_head() {
  local url="$1"
  local attempts=${2:-12}
  local wait_seconds=${3:-5}

  for i in $(seq 1 "$attempts"); do
    if curl -sS -I --max-time 5 "$url" > /dev/null; then
      return 0
    fi
    log "⏳ Esperando a que responda: $url (intento $i/$attempts)"
    sleep "$wait_seconds"
  done
  return 1
}

# Esperar patrón en logs del contenedor
wait_for_log() {
  local service_name="$1"
  local pattern="$2"
  local attempts=${3:-40}
  local wait_seconds=${4:-3}

  for i in $(seq 1 "$attempts"); do
    if docker-compose logs "$service_name" | grep -Eqi "$pattern"; then
      return 0
    fi
    log "⏳ Esperando logs de $service_name (intento $i/$attempts)"
    sleep "$wait_seconds"
  done
  return 1
}

# Verificar estado de la base de datos
check_database_status() {
    log "🔍 Verificando estado de la base de datos..."
    if docker ps --format '{{.Names}}' | grep -q '^personalfit-db$'; then
        log "✅ Base de datos está ejecutándose"
        return 0
    else
        log "❌ Base de datos NO está ejecutándose"
        return 1
    fi
}

# Verificar que los volúmenes críticos existen
check_critical_volumes() {
    log "🔍 Verificando volúmenes críticos..."
    local pgdata_exists=false
    local comprobantes_exists=false
    
    # Verificar volumen pgdata
    if docker volume ls --format "{{.Name}}" | grep -q "^personalfit_pgdata$"; then
        log "✅ Volumen pgdata existe"
        pgdata_exists=true
    else
        log "⚠️  Volumen pgdata NO existe"
    fi
    
    # Verificar volumen comprobantes
    if docker volume ls --format "{{.Name}}" | grep -q "^personalfit_comprobantes$"; then
        log "✅ Volumen comprobantes existe"
        comprobantes_exists=true
    else
        log "⚠️  Volumen comprobantes NO existe"
    fi
    
    if [ "$pgdata_exists" = true ] && [ "$comprobantes_exists" = true ]; then
        return 0
    else
        return 1
    fi
}

# Verificar que estamos en el directorio correcto
log "📂 Navegando al directorio del proyecto: $PROJECT_DIR"
cd /opt

# Si el directorio no existe, clonarlo
if [ ! -d "$PROJECT_DIR" ]; then
    log "📥 Clonando repositorio por primera vez..."
    git clone "$REPO_URL"
    cd Personal-Fit-Santa-Fe
else
    log "📝 Actualizando repositorio existente..."
    cd Personal-Fit-Santa-Fe
    
    # Verificar el estado de Git
    git status
    
    # Hacer backup de cambios locales si los hay
    if ! git diff-index --quiet HEAD --; then
        log "⚠️  Detectados cambios locales. Creando backup..."
        git stash push -m "Backup before deployment $(date '+%Y%m%d_%H%M%S')"
    fi
    
    # Actualizar el código
    log "🔄 Actualizando código desde $BRANCH..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
fi

# Verificar que tenemos las variables de entorno necesarias
log "🔐 Verificando variables de entorno..."
if [ -z "${MP_ACCESS_TOKEN:-}" ]; then
    log "⚠️  MP_ACCESS_TOKEN no está configurada. Continuando igualmente."
fi

if [ -z "${NEXT_PUBLIC_MP_PUBLIC_KEY:-}" ]; then
    log "⚠️  NEXT_PUBLIC_MP_PUBLIC_KEY no está configurada. Continuando igualmente."
fi

# Crear archivo .env temporal con las variables de entorno para docker compose
log "📝 Creando archivo .env temporal..."
cat > .env << EOF
MP_ACCESS_TOKEN=${MP_ACCESS_TOKEN:-}
NEXT_PUBLIC_MP_PUBLIC_KEY=${NEXT_PUBLIC_MP_PUBLIC_KEY:-}
EOF

# VERIFICAR ESTADO INICIAL DE LA BASE DE DATOS
check_database_status

# VERIFICAR VOLÚMENES CRÍTICOS ANTES DE LA LIMPIEZA
check_critical_volumes

# Asegurar base de datos arriba (NO TOCAR - PROTEGER DATOS)
log "🗄️  Asegurando base de datos en ejecución..."
docker-compose up -d postgres

# ESPERAR a que la base de datos esté lista
log "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# VERIFICAR QUE LA BASE DE DATOS SIGUE FUNCIONANDO
if ! check_database_status; then
    log "❌ ERROR: La base de datos no está funcionando correctamente"
    exit 1
fi

# LIMPIEZA COMPLETA DE CONTENEDORES E IMÁGENES (PRESERVANDO SOLO DB Y COMPROBANTES)
log "🧹 LIMPIEZA COMPLETA - Destruyendo todo excepto base de datos y comprobantes..."

# 1. Detener TODOS los contenedores de la aplicación (sin eliminar volúmenes)
log "📦 Deteniendo TODOS los contenedores de la aplicación..."
docker-compose stop personalfit-backend personalfit-frontend personalfit-pgadmin 2>/dev/null || true
docker-compose rm -f personalfit-backend personalfit-frontend personalfit-pgadmin 2>/dev/null || true

# 2. Eliminar TODOS los contenedores huérfanos
log "🗑️  Eliminando TODOS los contenedores huérfanos..."
docker container prune -f

# 3. Eliminar TODAS las imágenes de la aplicación (NO postgres)
log "🖼️  Eliminando TODAS las imágenes de la aplicación..."
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(personalfit-backend|personalfit-frontend)" | xargs -r docker rmi -f || true

# 4. Limpiar TODAS las imágenes no utilizadas
log "🧽 Limpiando TODAS las imágenes no utilizadas..."
docker image prune -a -f

# 5. Limpiar TODAS las redes no utilizadas (preservando la red de la app)
log "🌐 Limpiando TODAS las redes no utilizadas..."
docker network prune -f

# 6. Limpiar volúmenes no utilizados (EXCEPTO pgdata y comprobantes)
log "💾 Limpiando volúmenes no utilizados (preservando pgdata y comprobantes)..."
# Solo limpiar volúmenes que no sean pgdata o comprobantes y que no estén en uso
docker volume ls --format "{{.Name}}" | grep -v -E "(personalfit_pgdata|personalfit_comprobantes)" | while read volume; do
    if ! docker ps -a --filter "volume=$volume" --format "{{.Names}}" | grep -q .; then
        log "🗑️  Eliminando volumen no utilizado: $volume"
        docker volume rm "$volume" 2>/dev/null || true
    fi
done

# VERIFICAR QUE LA BASE DE DATOS SIGUE FUNCIONANDO DESPUÉS DE LA LIMPIEZA
if ! check_database_status; then
    log "❌ ERROR: La base de datos se perdió durante la limpieza test"
    exit 1
fi

# VERIFICAR QUE LOS VOLÚMENES CRÍTICOS SIGUEN EXISTIENDO
if ! check_critical_volumes; then
    log "❌ ERROR: Los volúmenes críticos se perdieron durante la limpieza"
    exit 1
fi

# Construir imágenes actualizadas DESDE CERO
log "🏗️  Construyendo imágenes actualizadas DESDE CERO..."
docker-compose build --no-cache personalfit-backend personalfit-frontend

# Levantar servicios de aplicación
log "🚢 Levantando servicios de aplicación..."
docker-compose up -d personalfit-backend personalfit-frontend personalfit-pgadmin

# Limpiar contenedores huérfanos final
log "🧹 Limpieza final de huérfanos..."
docker-compose up -d --remove-orphans

# Mostrar estado
log "✅ Estado de servicios (docker-compose ps):"
docker-compose ps

# Validar que backend y frontend están en ejecución
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-backend$'; then
  log "❌ Backend no está corriendo tras el deploy"
  docker-compose logs --no-color --tail=200 personalfit-backend | sed 's/^/BE | /'
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-frontend$'; then
  log "❌ Frontend no está corriendo tras el deploy. Mostrando logs:"
  docker-compose logs --no-color --tail=200 personalfit-frontend | sed 's/^/FE | /'
  exit 1
fi

# VERIFICAR ESTADO FINAL DE LA BASE DE DATOS
if ! check_database_status; then
    log "❌ ERROR: La base de datos se perdió durante el deployment"
    exit 1
fi

# Esperar patrones de arranque
log "🔎 Esperando confirmación por logs..."
wait_for_log personalfit-backend "Started .* in .* seconds" 40 3 || log "⚠️  No se detectó patrón de arranque en backend (continuando)"
wait_for_log personalfit-frontend "(ready - started server on|Listening on)" 40 3 || log "⚠️  No se detectó patrón de arranque en frontend (continuando)"

# Recarga suave de nginx si existe
if command -v nginx >/dev/null 2>&1; then
  log "🔄 Recargando Nginx (si configuración es válida)..."
  (nginx -t && systemctl reload nginx) || log "⚠️  No se pudo recargar Nginx (continuando)"
fi

# Esperar a que los servicios estén listos
log "⏳ Esperando disponibilidad pública..."
retry_curl_head "$APP_DOMAIN" 20 5 && log "✅ Frontend accesible en $APP_DOMAIN" || log "⚠️  Frontend aún no responde en $APP_DOMAIN (se continuará igualmente)"
retry_curl_head "$BACKEND_PUBLIC" 20 5 && log "✅ Backend accesible en $BACKEND_PUBLIC" || log "⚠️  Backend aún no responde en $BACKEND_PUBLIC (se continuará igualmente)"

# Mostrar últimos logs para diagnóstico rápido
log "📋 Últimos logs del frontend:" 
(docker-compose logs --no-color --tail=20 personalfit-frontend || true) | tail -n 20 | sed 's/^/FE | /'

log "📋 Últimos logs del backend:"
(docker-compose logs --no-color --tail=20 personalfit-backend || true) | tail -n 20 | sed 's/^/BE | /'

log "🎉 ¡Deployment completado!"
log "🌐 La aplicación debería estar disponible en:"
log "   - Frontend: $APP_DOMAIN"
log "   - Backend API (puerto público): $BACKEND_PUBLIC"
log "💾 Base de datos preservada exitosamente"