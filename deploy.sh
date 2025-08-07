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

# Parar todos los contenedores pero preservar volúmenes
log "🛑 Deteniendo contenedores (preservando volúmenes)..."
docker-compose down || true

# Esperar un momento para asegurar que los contenedores se detengan
sleep 5

# Limpiar solo imágenes no utilizadas (sin volúmenes)
log "🧹 Limpiando imágenes no utilizadas..."
docker image prune -f || true

# Construir y levantar los contenedores (esto reconstruirá con los cambios)
log "🏗️  Construyendo y levantando contenedores con cambios..."
docker-compose up --build -d

# Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar que los servicios están corriendo
log "✅ Verificando estado de los servicios..."
docker-compose ps

# Verificar la salud de los servicios de forma simple
log "🏥 Verificando salud de la aplicación..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log "✅ Frontend está respondiendo correctamente"
else
    log "⚠️  Frontend aún no está respondiendo (puede necesitar más tiempo)"
fi

if curl -f http://localhost:8080 > /dev/null 2>&1; then
    log "✅ Backend está respondiendo correctamente"
else
    log "⚠️  Backend aún no está respondiendo (puede necesitar más tiempo)"
fi

# Mostrar logs de los últimos 20 líneas para debugging
log "📋 Últimos logs del frontend:"
docker-compose logs --tail=20 personalfit-frontend

log "📋 Últimos logs del backend:"
docker-compose logs --tail=20 personalfit-backend

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
log "   docker-compose down && docker-compose up --build -d"