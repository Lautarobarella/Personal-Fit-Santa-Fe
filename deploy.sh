#!/bin/bash

# Script de deployment para Personal Fit Santa Fe
# Este script GARANTIZA que los servicios estén corriendo al final
#
# COMPORTAMIENTO:
# 1. Si no hay servicios corriendo: Los crea desde cero
# 2. Si hay servicios corriendo: Los destruye (preservando DB) y los recrea
# 3. SIEMPRE termina con todos los servicios levantados y funcionando
#
# PRESERVA ÚNICAMENTE:
# - Base de datos (volumen pgdata)
# - Comprobantes de pago (volumen comprobantes)

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

# Función para verificar si un contenedor está corriendo
is_container_running() {
    local container_name="$1"
    docker ps --format '{{.Names}}' | grep -q "^${container_name}$"
}

# Función para forzar el levantamiento de servicios
force_services_up() {
    log "🚀 FORZANDO LEVANTAMIENTO DE TODOS LOS SERVICIOS..."
    
    # Intentar levantar con build
    log "🏗️  Construyendo y levantando servicios..."
    docker-compose up --build -d
    
    # Esperar a que se levanten
    log "⏳ Esperando 45 segundos para que los servicios estén listos..."
    sleep 45
    
    # Verificar que estén corriendo
    local postgres_running=false
    local backend_running=false
    local frontend_running=false
    
    if is_container_running "personalfit-db"; then
        log "✅ Postgres está corriendo"
        postgres_running=true
    else
        log "❌ Postgres NO está corriendo"
    fi
    
    if is_container_running "personalfit-backend"; then
        log "✅ Backend está corriendo"
        backend_running=true
    else
        log "❌ Backend NO está corriendo"
        log "📋 Logs del backend para diagnóstico:"
        docker-compose logs --tail=30 personalfit-backend || true
    fi
    
    if is_container_running "personalfit-frontend"; then
        log "✅ Frontend está corriendo"
        frontend_running=true
    else
        log "❌ Frontend NO está corriendo"
    fi
    
    # Si alguno no está corriendo, mostrar logs y reintentar
    if [ "$postgres_running" = false ] || [ "$backend_running" = false ] || [ "$frontend_running" = false ]; then
        log "⚠️  Algunos servicios no están corriendo. Mostrando logs..."
        
        log "📋 Estado de contenedores:"
        docker ps -a
        
        log "📋 Logs de Postgres:"
        docker-compose logs --tail=20 postgres || true
        
        log "📋 Logs de Backend:"
        docker-compose logs --tail=20 personalfit-backend || true
        
        log "📋 Logs de Frontend:"
        docker-compose logs --tail=20 personalfit-frontend || true
        
        # Reintentar una vez más
        log "🔄 Reintentando levantar servicios..."
        docker-compose down
        sleep 5
        docker-compose up --build -d
        sleep 30
        
        # Verificación final
        if is_container_running "personalfit-db" && is_container_running "personalfit-backend" && is_container_running "personalfit-frontend"; then
            log "✅ Todos los servicios están corriendo después del reintento"
            return 0
        else
            log "❌ ERROR CRÍTICO: No se pudieron levantar los servicios"
            log "📋 Estado final:"
            docker ps -a
            exit 1
        fi
    else
        log "✅ Todos los servicios están corriendo correctamente"
        return 0
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

# Verificar estado actual de los servicios
log "🔍 Verificando estado actual de los servicios..."

postgres_running=$(is_container_running "personalfit-db" && echo "true" || echo "false")
backend_running=$(is_container_running "personalfit-backend" && echo "true" || echo "false")
frontend_running=$(is_container_running "personalfit-frontend" && echo "true" || echo "false")

log "📊 Estado actual:"
log "   - Postgres: $postgres_running"
log "   - Backend: $backend_running"
log "   - Frontend: $frontend_running"

# ESCENARIO 1: No hay servicios corriendo - Crear desde cero
if [ "$postgres_running" = false ] && [ "$backend_running" = false ] && [ "$frontend_running" = false ]; then
    log "🆕 ESCENARIO: No hay servicios corriendo - Creando desde cero"
    
    # Limpiar cualquier resto
    log "🧹 Limpiando restos anteriores..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker container prune -f
    docker image prune -f
    
    # Eliminar imágenes específicas si existen
    log "🗑️  Eliminando imágenes antiguas..."
    docker rmi personalfit-backend:latest 2>/dev/null || true
    docker rmi personalfit-frontend:latest 2>/dev/null || true
    docker rmi personal-fit-santa-fe_personalfit-backend:latest 2>/dev/null || true
    docker rmi personal-fit-santa-fe_personalfit-frontend:latest 2>/dev/null || true
    
    # Crear y levantar servicios
    force_services_up

# ESCENARIO 2: Hay servicios corriendo - Destruir y recrear (preservando DB)
else
    log "🔄 ESCENARIO: Hay servicios corriendo - Destruir y recrear preservando datos"
    
    # Detener servicios de aplicación (NO postgres si está corriendo)
    if [ "$backend_running" = true ] || [ "$frontend_running" = true ]; then
        log "🛑 Deteniendo servicios de aplicación..."
        docker-compose stop personalfit-backend personalfit-frontend personalfit-pgadmin 2>/dev/null || true
        docker-compose rm -f personalfit-backend personalfit-frontend personalfit-pgadmin 2>/dev/null || true
    fi
    
    # Eliminar imágenes de aplicación para forzar rebuild
    log "🗑️  Eliminando imágenes de aplicación para forzar rebuild..."
    docker rmi personalfit-backend:latest 2>/dev/null || true
    docker rmi personalfit-frontend:latest 2>/dev/null || true
    docker rmi personal-fit-santa-fe_personalfit-backend:latest 2>/dev/null || true
    docker rmi personal-fit-santa-fe_personalfit-frontend:latest 2>/dev/null || true
    
    # Limpiar imágenes dangling
    docker image prune -f
    
    # Verificar que postgres sigue corriendo si estaba corriendo
    if [ "$postgres_running" = true ]; then
        if ! is_container_running "personalfit-db"; then
            log "⚠️  Postgres se detuvo, reactivándolo..."
            docker-compose up -d postgres
            sleep 10
        fi
    fi
    
    # Recrear servicios
    force_services_up
fi

# VERIFICACIÓN FINAL OBLIGATORIA
log "🔍 VERIFICACIÓN FINAL OBLIGATORIA..."

# Esperar un poco más para que todo esté estable
sleep 10

# Verificar que TODOS los servicios estén corriendo
services_ok=true

if ! is_container_running "personalfit-db"; then
    log "❌ FALLO FINAL: Postgres no está corriendo"
    services_ok=false
fi

if ! is_container_running "personalfit-backend"; then
    log "❌ FALLO FINAL: Backend no está corriendo"
    services_ok=false
fi

if ! is_container_running "personalfit-frontend"; then
    log "❌ FALLO FINAL: Frontend no está corriendo"
    services_ok=false
fi

if [ "$services_ok" = false ]; then
    log "💥 ERROR CRÍTICO: Los servicios no están corriendo al final del deployment"
    log "📋 Estado actual:"
    docker ps -a
    log "📋 Logs de servicios:"
    docker-compose logs --tail=30
    
    # ÚLTIMO INTENTO DESESPERADO
    log "🚨 ÚLTIMO INTENTO DESESPERADO..."
    docker-compose down
    sleep 5
    docker-compose up --build -d --force-recreate
    sleep 30
    
    # Verificación final final
    if is_container_running "personalfit-db" && is_container_running "personalfit-backend" && is_container_running "personalfit-frontend"; then
        log "✅ ÉXITO: Servicios levantados en último intento"
    else
        log "💀 FALLO TOTAL: No se pudieron levantar los servicios"
        exit 1
    fi
else
    log "✅ ÉXITO: Todos los servicios están corriendo"
fi

# Mostrar estado final
log "📋 Estado final de servicios:"
docker-compose ps

# Recarga suave de nginx si existe
if command -v nginx >/dev/null 2>&1; then
  log "🔄 Recargando Nginx (si configuración es válida)..."
  (nginx -t && systemctl reload nginx) || log "⚠️  No se pudo recargar Nginx (continuando)"
fi

# Verificación de conectividad externa (sin bloquear el deploy)
log "🌐 Verificando conectividad externa (no bloqueante)..."
if curl -sS -I --max-time 10 "$APP_DOMAIN" > /dev/null; then
    log "✅ Frontend accesible en $APP_DOMAIN"
else
    log "⚠️  Frontend aún no responde en $APP_DOMAIN (normal, puede tardar)"
fi

if curl -sS -I --max-time 10 "$BACKEND_PUBLIC" > /dev/null; then
    log "✅ Backend accesible en $BACKEND_PUBLIC"
else
    log "⚠️  Backend aún no responde en $BACKEND_PUBLIC (normal, puede tardar)"
fi

log "🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!"
log "🌐 La aplicación está disponible en:"
log "   - Frontend: $APP_DOMAIN"
log "   - Backend API: $BACKEND_PUBLIC"
log "💾 Base de datos y comprobantes preservados"
log "✅ TODOS LOS SERVICIOS ESTÁN CORRIENDO"

# Mostrar logs finales para debug
log "📋 Últimos logs (para debug):"
echo "=== POSTGRES ==="
docker-compose logs --tail=10 postgres | head -10
echo "=== BACKEND ==="
docker-compose logs --tail=10 personalfit-backend | head -10
echo "=== FRONTEND ==="
docker-compose logs --tail=10 personalfit-frontend | head -10

log "🏁 Script terminado - Los servicios están corriendo"