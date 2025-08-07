#!/bin/bash

# Script de deployment para Personal Fit Santa Fe
# Este script se ejecuta en la máquina remota para hacer el deployment

set -euo pipefail  # Fallar ante errores y variables no definidas

echo "🚀 Iniciando deployment de Personal Fit Santa Fe..."

# Configuración
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
REPO_URL="https://github.com/Lautarobarella/Personal-Fit-Santa-Fe.git"  # Actualizar con la URL real
BRANCH="main"
APP_DOMAIN="https://personalfitsantafe.com"  # No usar localhost
BACKEND_PUBLIC="http://personalfitsantafe.com:8080"  # Chequeo simple sin localhost

# Función para logging con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Función de retry para curl contra dominio (sin localhost)
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

# Asegurar base de datos arriba (no bajar volúmenes ni contenedor de DB)
log "🗄️  Asegurando base de datos en ejecución..."
docker-compose up -d postgres

# Construir imágenes actualizadas (sin tocar volúmenes)
log "🏗️  Construyendo imágenes actualizadas..."
docker-compose build personalfit-backend personalfit-frontend

# Levantar/recrear backend y frontend sin bajar la base de datos
log "🚢 Recreando servicios de app (sin deps ni DB)..."
docker-compose up -d --no-deps --build personalfit-backend personalfit-frontend

# Limpiar contenedores huérfanos (sin afectar servicios definidos ni volúmenes)
log "🧹 Removiendo orphans si los hay (sin detener servicios definidos)..."
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

# Esperar patrones de arranque (sin localhost)
log "🔎 Esperando confirmación por logs..."
wait_for_log personalfit-backend "Started .* in .* seconds" 40 3 || log "⚠️  No se detectó patrón de arranque en backend (continuando)"
wait_for_log personalfit-frontend "ready - started server on" 40 3 || log "⚠️  No se detectó patrón de arranque en frontend (continuando)"

# Recarga suave de nginx si existe
if command -v nginx >/dev/null 2>&1; then
  log "🔄 Recargando Nginx (si configuración es válida)..."
  (nginx -t && systemctl reload nginx) || log "⚠️  No se pudo recargar Nginx (continuando)"
fi

# Esperar a que los servicios estén listos (checks suaves contra dominio)
log "⏳ Esperando disponibilidad pública..."
retry_curl_head "$APP_DOMAIN" 20 5 && log "✅ Frontend accesible en $APP_DOMAIN" || log "⚠️  Frontend aún no responde en $APP_DOMAIN (se continuará igualmente)"
retry_curl_head "$BACKEND_PUBLIC" 20 5 && log "✅ Backend accesible en $BACKEND_PUBLIC" || log "⚠️  Backend aún no responde en $BACKEND_PUBLIC (se continuará igualmente)"

# Mostrar últimos logs para diagnóstico rápido
log "📋 Últimos logs del frontend:" 
(docker-compose logs --no-color --tail=50 personalfit-frontend || true) | tail -n 50 | sed 's/^/FE | /'

log "📋 Últimos logs del backend:"
(docker-compose logs --no-color --tail=50 personalfit-backend || true) | tail -n 50 | sed 's/^/BE | /'

log "🎉 ¡Deployment completado!"
log "🌐 La aplicación debería estar disponible en:"
log "   - Frontend: $APP_DOMAIN"
log "   - Backend API (puerto público): $BACKEND_PUBLIC"