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

# Parar los contenedores actuales (si existen)
log "🛑 Deteniendo contenedores actuales..."
docker-compose down || true

# Limpiar imágenes y contenedores no utilizados
log "🧹 Limpiando Docker..."
docker system prune -f

# Construir y levantar los nuevos contenedores
log "🏗️  Construyendo y levantando contenedores..."
docker-compose up --build

# Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar que los servicios están corriendo
log "✅ Verificando estado de los servicios..."
docker-compose ps

# Verificar la salud de los servicios
log "🏥 Verificando salud de la aplicación..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Frontend está respondiendo correctamente"
else
    log "❌ Frontend no está respondiendo"
fi

if curl -f http://localhost:8080/api/users/fail > /dev/null 2>&1; then
    log "✅ Backend está respondiendo correctamente"
else
    log "❌ Backend no está respondiendo"
fi

# Mostrar logs de los últimos 50 líneas para debugging
log "📋 Últimos logs del frontend:"
docker-compose logs --tail=50 personalfit-frontend

log "📋 Últimos logs del backend:"
docker-compose logs --tail=50 personalfit-backend

log "🎉 ¡Deployment completado con éxito!"
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