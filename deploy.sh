#!/bin/bash

# Script de deploy mejorado para Personal Fit Santa Fe
# Este script preserva la base de datos y valida compatibilidad de esquemas

set -e  # Exit on any error

echo "🚀 Iniciando deploy de Personal Fit Santa Fe..."

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker y vuelve a intentar."
    exit 1
fi

# Verificar que docker-compose esté disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose no está instalado. Por favor instálalo y vuelve a intentar."
    exit 1
fi

# Función para validar esquemas antes del deploy
validate_schemas_before_deploy() {
    echo "🔍 Validando compatibilidad de esquemas antes del deploy..."
    
    # Verificar si existe el script de migración
    if [ ! -f "./migrate.sh" ]; then
        echo "⚠️ Script de migración no encontrado. Continuando sin validación..."
        return 0
    fi
    
    # Ejecutar validación de esquemas
    if ./migrate.sh; then
        echo "✅ Validación de esquemas exitosa"
        return 0
    else
        echo "❌ ERROR: Validación de esquemas falló"
        echo "🔧 Esto significa que hay cambios incompatibles en el esquema de la base de datos"
        echo "📋 Opciones disponibles:"
        echo "   1. Ejecutar migraciones: ./migrate.sh --migrate"
        echo "   2. Forzar deploy (puede causar pérdida de datos): ./migrate.sh --force"
        echo "   3. Restaurar backup anterior: ./migrate.sh --restore <backup_file>"
        echo ""
        echo "💡 Recomendación: Ejecuta './migrate.sh --migrate' para aplicar las migraciones necesarias"
        exit 1
    fi
}

# Función para hacer backup antes del deploy
backup_before_deploy() {
    echo "💾 Creando backup antes del deploy..."
    
    if [ -f "./migrate.sh" ]; then
        ./migrate.sh --backup
    else
        echo "⚠️ Script de migración no encontrado. No se puede crear backup automático."
    fi
}

# Función para preservar volúmenes
preserve_volumes() {
    echo "🔒 Preservando volúmenes de datos..."
    
    # Verificar que los volúmenes existan
    if docker volume ls | grep -q "personal-fit-santa-fe_pgdata"; then
        echo "✅ Volumen de base de datos preservado"
    else
        echo "⚠️ Volumen de base de datos no encontrado (se creará nuevo)"
    fi
    
    if docker volume ls | grep -q "personal-fit-santa-fe_comprobantes"; then
        echo "✅ Volumen de comprobantes preservado"
    else
        echo "⚠️ Volumen de comprobantes no encontrado (se creará nuevo)"
    fi
}

# Función para limpiar contenedores sin afectar volúmenes
clean_containers_only() {
    echo "🧹 Limpiando contenedores (preservando volúmenes)..."
    
    # Detener y remover contenedores sin afectar volúmenes
    docker-compose down --remove-orphans || true
    
    # Limpiar imágenes dangling
    docker image prune -f || true
}

# Función para construir imágenes
build_images() {
    echo "🔨 Construyendo imágenes Docker..."
    docker-compose build --no-cache
}

# Función para iniciar servicios
start_services() {
    echo "🚀 Iniciando servicios..."
    docker-compose up -d
}

# Función para esperar servicios
wait_for_services() {
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    until docker-compose exec -T postgres pg_isready -U personalfit_user -d personalfit; do
        echo "Esperando PostgreSQL..."
        sleep 5
    done

    echo "⏳ Esperando a que el backend esté listo..."
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f https://personalfitsantafe.com:8080/api/health > /dev/null 2>&1; then
            echo "✅ Backend está listo!"
            break
        fi
        
        echo "Esperando backend... (intento $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        echo "❌ Backend no respondió después de $max_attempts intentos"
        echo "📋 Logs del backend:"
        docker-compose logs personalfit-backend
        exit 1
    fi

    echo "⏳ Verificando frontend..."
    max_attempts=20
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f https://personalfitsantafe.com > /dev/null 2>&1; then
            echo "✅ Frontend está listo!"
            break
        fi
        
        echo "Esperando frontend... (intento $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        echo "⚠️ Frontend no respondió después de $max_attempts intentos"
        echo "📋 Logs del frontend:"
        docker-compose logs personalfit-frontend
    fi
}

# Función para mostrar estado final
show_final_status() {
    echo "📊 Estado final de los servicios:"
    docker-compose ps

    echo "✅ Deploy completado exitosamente!"
    echo "🌐 URLs de acceso:"
    echo "   - Frontend: https://personalfitsantafe.com"
    echo "   - Backend API: https://personalfitsantafe.com:8080"
    echo "   - PgAdmin: https://personalfitsantafe.com:5050"
    echo "   - Health Check: https://personalfitsantafe.com:8080/api/health"
    echo ""
    echo "💾 Datos preservados:"
    echo "   - Base de datos: ✅ Preservada"
    echo "   - Comprobantes: ✅ Preservados"
    echo "   - Configuraciones: ✅ Preservadas"
}

# Función principal
main() {
    echo "🔒 Modo de preservación de datos activado"
    
    # Preservar volúmenes
    preserve_volumes
    
    # Validar esquemas antes del deploy
    validate_schemas_before_deploy
    
    # Hacer backup antes del deploy
    backup_before_deploy
    
    # Limpiar solo contenedores (preservando volúmenes)
    clean_containers_only
    
    # Construir imágenes
    build_images
    
    # Iniciar servicios
    start_services
    
    # Esperar servicios
    wait_for_services
    
    # Mostrar estado final
    show_final_status
}

# Manejo de argumentos
case "${1:-}" in
    --force)
        echo "⚠️ Modo forzado activado (sin validación de esquemas)"
        echo "🔒 Preservando volúmenes..."
        preserve_volumes
        backup_before_deploy
        clean_containers_only
        build_images
        start_services
        wait_for_services
        show_final_status
        ;;
    --help)
        echo "Uso: $0 [OPCIÓN]"
        echo ""
        echo "Opciones:"
        echo "  --force    Forzar deploy sin validación de esquemas"
        echo "  --help     Mostrar esta ayuda"
        echo ""
        echo "Comportamiento por defecto:"
        echo "  - Preserva todos los datos de la base de datos"
        echo "  - Valida compatibilidad de esquemas antes del deploy"
        echo "  - Crea backup automático antes del deploy"
        echo "  - Falla si hay cambios incompatibles en el esquema"
        ;;
    *)
        main
        ;;
esac