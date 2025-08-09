#!/bin/bash

# Script de reinicio manual para Personal Fit Santa Fe
# Útil cuando hay problemas con el deployment automático

set -e

echo "🔄 Iniciando reinicio manual de Personal Fit Santa Fe..."

# Función para logging con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Navegar al directorio del proyecto
cd /opt/Personal-Fit-Santa-Fe

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    log "❌ Error: No se encontró docker-compose.yml"
    exit 1
fi

# Parar todos los contenedores de forma agresiva
log "🛑 Deteniendo todos los contenedores..."
docker-compose down --remove-orphans --volumes

# Esperar a que se detengan completamente
sleep 10

# Limpiar Docker completamente
log "🧹 Limpiando Docker..."
docker system prune -f --volumes
docker network prune -f

# Eliminar imágenes específicas
log "🗑️  Eliminando imágenes existentes..."
docker rmi personalfit-frontend personalfit-backend 2>/dev/null || true

# Verificar que las variables de entorno estén disponibles
log "🔐 Verificando variables de entorno..."
if [ -z "$MP_ACCESS_TOKEN" ]; then
    log "⚠️  MP_ACCESS_TOKEN no está configurada"
fi

if [ -z "$NEXT_PUBLIC_MP_PUBLIC_KEY" ]; then
    log "⚠️  NEXT_PUBLIC_MP_PUBLIC_KEY no está configurada"
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    log "📝 Creando archivo .env..."
    cat > .env << EOF
MP_ACCESS_TOKEN=$MP_ACCESS_TOKEN
NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY
EOF
fi

# Construir y levantar los contenedores
log "🏗️  Construyendo y levantando contenedores..."
docker-compose up --build -d

# Esperar a que PostgreSQL esté listo
log "⏳ Esperando a que PostgreSQL esté listo..."
sleep 20

# Verificar estado de los servicios
log "✅ Verificando estado de los servicios..."
docker-compose ps

# Función para verificar salud de servicios
check_health() {
    local service=$1
    local port=$2
    local endpoint=$3
    local max_attempts=20
    local attempt=1
    
    log "🏥 Verificando $service..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            log "✅ $service está respondiendo"
            return 0
        else
            log "⏳ Intento $attempt/$max_attempts: $service aún no está listo..."
            sleep 15
            attempt=$((attempt + 1))
        fi
    done
    
    log "❌ $service no respondió después de $max_attempts intentos"
    return 1
}

# Verificar servicios
check_health "Backend" "8080" "/api/users/fail" || true
check_health "Frontend" "3000" "/api/health" || true

# Mostrar logs para debugging
log "📋 Logs del frontend:"
docker-compose logs --tail=30 personalfit-frontend

log "📋 Logs del backend:"
docker-compose logs --tail=30 personalfit-backend

log "📋 Logs de PostgreSQL:"
docker-compose logs --tail=20 postgres

# Verificación final
log "🔍 Estado final de todos los servicios:"
docker-compose ps

log "🌐 Verificando conectividad final..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ Frontend accesible en localhost:3000"
else
    log "❌ Frontend no accesible en localhost:3000"
fi

if curl -f http://localhost:8080 > /dev/null 2>&1; then
    log "✅ Backend accesible en localhost:8080"
else
    log "❌ Backend no accesible en localhost:8080"
fi

log "🎉 ¡Reinicio completado!"
log "ℹ️  Si aún hay problemas, ejecuta:"
log "   docker-compose logs -f"
log "   para ver logs en tiempo real"
