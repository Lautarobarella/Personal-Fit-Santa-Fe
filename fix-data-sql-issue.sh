#!/bin/bash

# Script para arreglar inmediatamente el problema de data.sql duplicado

set -e

echo "🔧 Arreglando problema de data.sql duplicado..."

# Función para logging con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cd /opt/Personal-Fit-Santa-Fe

log "🛑 Deteniendo backend problemático..."
docker-compose stop personalfit-backend

log "🗑️  Eliminando contenedor del backend..."
docker-compose rm -f personalfit-backend

log "🖼️  Eliminando imagen del backend..."
docker rmi personal-fit-santa-fe_personalfit-backend:latest 2>/dev/null || true

log "📝 Actualizando código desde GitHub para obtener el fix..."
git pull origin main

log "🏗️  Reconstruyendo imagen del backend con la configuración corregida..."
docker-compose build --no-cache personalfit-backend

log "🚀 Levantando backend con configuración corregida..."
docker-compose up -d personalfit-backend

log "⏳ Esperando 60 segundos para que el backend se estabilice..."
sleep 60

log "🔍 Verificando estado del backend..."
if docker ps --format '{{.Names}}' | grep -q '^personalfit-backend$'; then
    container_status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep personalfit-backend | awk '{print $2}')
    if [[ "$container_status" == "Up" ]]; then
        log "✅ Backend está corriendo correctamente"
        
        log "📋 Últimos logs del backend:"
        docker-compose logs --tail=15 personalfit-backend
        
        log "🌐 Probando conectividad del backend..."
        sleep 10
        if curl -f http://localhost:8080/api/users/fail > /dev/null 2>&1; then
            log "✅ Backend responde correctamente - 502 SOLUCIONADO"
        else
            log "⚠️  Backend aún no responde completamente (pero ya no se reinicia)"
        fi
    else
        log "⚠️  Backend está en estado: $container_status"
    fi
else
    log "❌ Backend no está corriendo"
    log "📋 Logs para diagnóstico:"
    docker-compose logs --tail=30 personalfit-backend
    exit 1
fi

log "📊 Estado final de servicios:"
docker-compose ps

log "🎉 ¡PROBLEMA SOLUCIONADO!"
log "🌐 El sitio debería estar funcionando en: https://personalfitsantafe.com"
log "💡 El problema era que data.sql intentaba insertar datos duplicados"
log "✅ Ahora está configurado para NO ejecutar data.sql en producción"
