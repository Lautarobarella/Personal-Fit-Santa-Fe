#!/bin/bash

echo "🔧 Solución definitiva para el backend..."

cd /opt/Personal-Fit-Santa-Fe

echo "📋 Estado inicial:"
docker ps -a

echo "🛑 Deteniendo y eliminando backend problemático..."
docker-compose stop personalfit-backend
docker-compose rm -f personalfit-backend

echo "🖼️  Eliminando imágenes del backend..."
docker rmi personal-fit-santa-fe_personalfit-backend:latest 2>/dev/null || true
docker rmi personalfit-backend:latest 2>/dev/null || true

echo "📥 Actualizando código desde GitHub..."
git pull origin main

echo "🏗️  Reconstruyendo imagen del backend completamente..."
docker-compose build --no-cache personalfit-backend

echo "🔄 Verificando que postgres esté funcionando..."
if ! docker ps --format '{{.Names}}' | grep -q '^personalfit-db$'; then
    echo "⚠️  Levantando postgres..."
    docker-compose up -d postgres
    sleep 15
fi

echo "🚀 Levantando backend con configuración corregida..."
docker-compose up -d personalfit-backend

echo "⏳ Esperando 60 segundos para inicialización completa..."
sleep 60

echo "📋 Verificando estado final:"
docker ps

echo "📊 Logs del backend:"
docker-compose logs --tail=30 personalfit-backend

echo "🌐 Probando conectividad:"
curl -I http://localhost:8080/ || echo "Backend aún no responde"

echo "📋 Estado final de todos los servicios:"
docker-compose ps

echo "🎉 ¡Proceso completado!"
