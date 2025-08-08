#!/bin/bash

# Script de diagnóstico y reparación del backend
# Soluciona problemas comunes que causan 502 Bad Gateway

set -e

echo "🔧 Iniciando diagnóstico y reparación del backend..."

# Función para logging con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Navegar al directorio del proyecto
cd /opt/Personal-Fit-Santa-Fe

log "📋 Estado actual de contenedores:"
docker ps -a

log "📊 Verificando logs del backend..."
docker-compose logs --tail=30 personalfit-backend

log "🛑 Deteniendo servicios problemáticos..."
docker-compose stop personalfit-backend

log "🗑️  Eliminando contenedor del backend..."
docker-compose rm -f personalfit-backend

log "🖼️  Eliminando imagen del backend para forzar rebuild..."
docker rmi personal-fit-santa-fe_personalfit-backend:latest 2>/dev/null || true

log "🏗️  Reconstruyendo imagen del backend..."
docker-compose build --no-cache personalfit-backend

log "🔄 Verificando que la base de datos esté funcionando..."
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-db$'; then
    log "⚠️  Base de datos no está corriendo, levantándola..."
    docker-compose up -d postgres
    sleep 15
fi

log "🚀 Levantando backend con configuración limpia..."
docker-compose up -d personalfit-backend

log "⏳ Esperando 45 segundos para que el backend esté listo..."
sleep 45

log "🔍 Verificando estado del backend..."
if docker ps --format '{{.Names}}' | grep -q '^personalfit-backend$'; then
    log "✅ Backend está corriendo"
    
    # Verificar logs para errores
    log "📋 Últimos logs del backend:"
    docker-compose logs --tail=20 personalfit-backend
    
    # Verificar conectividad
    log "🌐 Probando conectividad al backend..."
    if curl -f http://localhost:8080/api/users/fail > /dev/null 2>&1; then
        log "✅ Backend responde correctamente"
    else
        log "⚠️  Backend no responde aún (puede ser normal)"
    fi
else
    log "❌ Backend no está corriendo"
    log "📋 Logs detallados del backend:"
    docker-compose logs --tail=50 personalfit-backend
    exit 1
fi

log "🔄 Recargando configuración de Nginx..."
if command -v nginx >/dev/null 2>&1; then
    if nginx -t; then
        systemctl reload nginx
        log "✅ Nginx recargado correctamente"
    else
        log "❌ Error en configuración de Nginx"
        nginx -t
    fi
else
    log "⚠️  Nginx no encontrado en este servidor"
fi

log "📊 Estado final de todos los servicios:"
docker-compose ps

log "🎉 Reparación completada. El backend debería estar funcionando ahora."
log "🌐 Prueba acceder a: https://personalfitsantafe.com"
