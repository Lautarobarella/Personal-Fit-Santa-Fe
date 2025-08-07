#!/bin/bash

# Script de deployment para Personal Fit Santa Fe
# Este script se ejecuta en la máquina remota para hacer el deployment

set -e  # Salir si cualquier comando falla

echo "🚀 Iniciando deployment de Personal Fit Santa Fe..."

# Configuración
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
REPO_URL="https://github.com/Lautarobarella/Personal-Fit-Santa-Fe.git"  # Actualizar con la URL real
BRANCH="main"

# Función para logging con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
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
if [ -z "$MP_ACCESS_TOKEN" ]; then
    log "⚠️  MP_ACCESS_TOKEN no está configurada. Usando valor por defecto."
fi

if [ -z "$NEXT_PUBLIC_MP_PUBLIC_KEY" ]; then
    log "⚠️  NEXT_PUBLIC_MP_PUBLIC_KEY no está configurada. Usando valor por defecto."
fi

# Crear archivo .env temporal con las variables de entorno
log "📝 Creando archivo .env temporal..."
cat > .env << EOF
MP_ACCESS_TOKEN=$MP_ACCESS_TOKEN
NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY
EOF

# Función para verificar si un servicio está saludable
check_service_health() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    local max_attempts=30
    local attempt=1
    
    log "🏥 Verificando salud de $service_name en puerto $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            log "✅ $service_name está respondiendo correctamente"
            return 0
        else
            log "⏳ Intento $attempt/$max_attempts: $service_name aún no está listo..."
            sleep 10
            attempt=$((attempt + 1))
        fi
    done
    
    log "❌ $service_name no respondió después de $max_attempts intentos"
    return 1
}

# Parar los contenedores actuales de forma más agresiva
log "🛑 Deteniendo contenedores actuales..."
docker-compose down --remove-orphans --volumes || true

# Esperar un momento para asegurar que los contenedores se detengan completamente
sleep 5

# Limpiar imágenes y contenedores no utilizados (más agresivo)
log "🧹 Limpiando Docker..."
docker system prune -f --volumes || true

# Eliminar imágenes específicas para forzar rebuild
log "🗑️  Eliminando imágenes existentes para forzar rebuild..."
docker rmi personalfit-frontend personalfit-backend 2>/dev/null || true

# Construir y levantar los nuevos contenedores
log "🏗️  Construyendo y levantando contenedores..."
docker-compose up --build -d

# Esperar a que PostgreSQL esté listo antes de verificar otros servicios
log "⏳ Esperando a que PostgreSQL esté listo..."
sleep 15

# Verificar que los servicios están corriendo
log "✅ Verificando estado de los servicios..."
docker-compose ps

# Verificar la salud de los servicios con reintentos
log "🏥 Verificando salud de la aplicación..."

# Verificar backend primero
if check_service_health "Backend" "8080" "/api/users/fail"; then
    log "✅ Backend verificado correctamente"
else
    log "❌ Backend no está respondiendo, mostrando logs..."
    docker-compose logs --tail=50 personalfit-backend
    # No fallar aquí, continuar con el frontend
fi

# Verificar frontend
if check_service_health "Frontend" "3000" "/api/health"; then
    log "✅ Frontend verificado correctamente"
else
    log "❌ Frontend no está respondiendo, mostrando logs..."
    docker-compose logs --tail=50 personalfit-frontend
    # No fallar aquí, continuar
fi

# Verificación final de todos los servicios
log "🔍 Verificación final de todos los servicios..."
docker-compose ps

# Mostrar logs de los últimos 50 líneas para debugging
log "📋 Últimos logs del frontend:"
docker-compose logs --tail=50 personalfit-frontend

log "📋 Últimos logs del backend:"
docker-compose logs --tail=50 personalfit-backend

log "📋 Últimos logs de PostgreSQL:"
docker-compose logs --tail=20 postgres

# Verificación final de conectividad
log "🌐 Verificación final de conectividad..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ Frontend accesible en localhost:3000"
else
    log "⚠️  Frontend no accesible en localhost:3000"
fi

if curl -f http://localhost:8080 > /dev/null 2>&1; then
    log "✅ Backend accesible en localhost:8080"
else
    log "⚠️  Backend no accesible en localhost:8080"
fi

log "🎉 ¡Deployment completado!"
log "🌐 La aplicación debería estar disponible en:"
log "   - Frontend: https://personalfitsantafe.com"
log "   - Backend API: https://personalfitsantafe.com:8080"
log "   - PgAdmin: http://personalfitsantafe.com:5050"

# Información adicional
log "ℹ️  Para ver logs en tiempo real:"
log "   docker-compose logs -f"
log "ℹ️  Para reiniciar un servicio específico:"
log "   docker-compose restart personalfit-frontend"
log "   docker-compose restart personalfit-backend"
log "ℹ️  Para reiniciar todo si hay problemas:"
log "   docker-compose down -v && docker-compose up --build -d"