#!/bin/bash

# Script de deployment para Hostinger VPS
# Personal Fit Santa Fe

set -e

echo "🚀 Iniciando deployment de Personal Fit Santa Fe..."

# Variables
PROJECT_DIR="/home/$USER/Personal-Fit-Santa-Fe"
BACKUP_DIR="/home/$USER/backups/personalfit"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

echo "📦 Creando backup de la versión actual..."
if [ -d "$PROJECT_DIR" ]; then
    tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$PROJECT_DIR" .
    echo "✅ Backup creado: backup_$DATE.tar.gz"
fi

echo "🔄 Actualizando código desde GitHub..."
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/main

echo "🐳 Deteniendo contenedores actuales..."
docker-compose down

echo "🧹 Limpiando imágenes Docker no utilizadas..."
docker system prune -f

echo "🔨 Construyendo nuevas imágenes..."
docker-compose build --no-cache

echo "🚀 Iniciando servicios..."
docker-compose up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 30

echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo "✅ Deployment completado exitosamente!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8080"
echo "🗄️  PgAdmin: http://localhost:5050" 