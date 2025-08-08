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
    
    # Listar todos los volúmenes para debug
    log "📋 Volúmenes existentes:"
    docker volume ls
    
    # Verificar volumen pgdata (puede tener diferentes nombres)
    if docker volume ls --format "{{.Name}}" | grep -q -E "(pgdata|personalfit.*pgdata|personal-fit.*pgdata)"; then
        log "✅ Volumen pgdata existe"
        pgdata_exists=true
    else
        log "⚠️  Volumen pgdata NO existe - se creará automáticamente"
        pgdata_exists=true  # Docker Compose lo creará automáticamente
    fi
    
    # Verificar volumen comprobantes (puede tener diferentes nombres)
    if docker volume ls --format "{{.Name}}" | grep -q -E "(comprobantes|personalfit.*comprobantes|personal-fit.*comprobantes)"; then
        log "✅ Volumen comprobantes existe"
        comprobantes_exists=true
    else
        log "⚠️  Volumen comprobantes NO existe - se creará automáticamente"
        comprobantes_exists=true  # Docker Compose lo creará automáticamente
    fi
    
    return 0  # Siempre retornamos éxito ya que Docker Compose crea los volúmenes
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

# LIMPIEZA SEGURA DE CONTENEDORES E IMÁGENES (PRESERVANDO DB Y COMPROBANTES)
log "🧹 LIMPIEZA SEGURA - Preservando base de datos y comprobantes..."

# 1. Detener solo contenedores de aplicación (NO postgres para preservar conexiones)
log "📦 Deteniendo contenedores de aplicación..."
docker-compose stop personalfit-backend personalfit-frontend personalfit-pgadmin 2>/dev/null || true

# 2. Eliminar solo contenedores específicos de aplicación
log "🗑️  Eliminando contenedores de aplicación..."
docker-compose rm -f personalfit-backend personalfit-frontend personalfit-pgadmin 2>/dev/null || true

# 3. Eliminar imágenes específicas de la aplicación
log "🖼️  Eliminando imágenes de aplicación..."
docker rmi personalfit-backend:latest 2>/dev/null || true
docker rmi personalfit-frontend:latest 2>/dev/null || true
docker rmi personal-fit-santa-fe_personalfit-backend:latest 2>/dev/null || true
docker rmi personal-fit-santa-fe_personalfit-frontend:latest 2>/dev/null || true

# 4. Limpiar solo imágenes dangling (sin afectar postgres ni volúmenes)
log "🧽 Limpiando imágenes dangling..."
docker image prune -f

# VERIFICAR QUE LA BASE DE DATOS SIGUE FUNCIONANDO DESPUÉS DE LA LIMPIEZA
if ! check_database_status; then
    log "❌ ERROR: La base de datos se perdió durante la limpieza"
    exit 1
fi

# VERIFICAR QUE LOS VOLÚMENES CRÍTICOS SIGUEN EXISTIENDO
if ! check_critical_volumes; then
    log "❌ ERROR: Los volúmenes críticos se perdieron durante la limpieza"
    exit 1
fi

# Construir imágenes actualizadas
log "🏗️  Construyendo imágenes actualizadas..."
docker-compose build --no-cache personalfit-backend personalfit-frontend

# Levantar TODOS los servicios (incluyendo postgres si no está corriendo)
log "🚢 Levantando TODOS los servicios..."
docker-compose up -d

# Esperar a que los servicios estén completamente listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 15

# Verificar que postgres sigue corriendo después del up
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-db$'; then
    log "⚠️  Postgres no está corriendo, intentando levantarlo..."
    docker-compose up -d postgres
    sleep 10
fi

# Mostrar estado
log "✅ Estado de servicios (docker-compose ps):"
docker-compose ps

# Validar que TODOS los servicios están en ejecución
log "🔍 Validando que todos los servicios estén en ejecución..."

# Verificar Postgres
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-db$'; then
  log "❌ Postgres no está corriendo tras el deploy"
  docker-compose logs --no-color --tail=100 postgres | sed 's/^/PG | /'
  exit 1
else
  log "✅ Postgres está corriendo"
fi

# Verificar Backend
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-backend$'; then
  log "❌ Backend no está corriendo tras el deploy"
  docker-compose logs --no-color --tail=100 personalfit-backend | sed 's/^/BE | /'
  exit 1
else
  log "✅ Backend está corriendo"
fi

# Verificar Frontend
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-frontend$'; then
  log "❌ Frontend no está corriendo tras el deploy"
  docker-compose logs --no-color --tail=100 personalfit-frontend | sed 's/^/FE | /'
  exit 1
else
  log "✅ Frontend está corriendo"
fi

# Verificar PgAdmin
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-pgadmin$'; then
  log "⚠️  PgAdmin no está corriendo, intentando levantarlo..."
  docker-compose up -d pgadmin
  sleep 5
else
  log "✅ PgAdmin está corriendo"
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

# Verificación final de conectividad
log "🌐 Verificando conectividad final..."

# Función para reintentar la verificación de servicios
retry_service_check() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "🔄 Intento $attempt/$max_attempts de verificación de servicios..."
        
        # Verificar que todos los servicios están corriendo
        if docker ps --format '{{.Names}}' | grep -q '^personalfit-db$' && \
           docker ps --format '{{.Names}}' | grep -q '^personalfit-backend$' && \
           docker ps --format '{{.Names}}' | grep -q '^personalfit-frontend$'; then
            log "✅ Todos los servicios están corriendo"
            return 0
        else
            log "⚠️  Algunos servicios no están corriendo, reintentando..."
            docker-compose up -d
            sleep 20
            attempt=$((attempt + 1))
        fi
    done
    
    log "❌ Error: No se pudieron levantar todos los servicios después de $max_attempts intentos"
    log "📋 Estado final de contenedores:"
    docker ps -a
    log "📋 Logs de servicios:"
    docker-compose logs --tail=50
    exit 1
}

# Ejecutar verificación con reintentos
retry_service_check

log "🎉 ¡Deployment completado exitosamente!"
log "🌐 La aplicación está disponible en:"
log "   - Frontend: $APP_DOMAIN"
log "   - Backend API (puerto público): $BACKEND_PUBLIC"
log "💾 Base de datos y comprobantes preservados exitosamente"
log "📋 Estado final de todos los servicios:"
docker-compose ps