#!/bin/bash

# Script de migración para Personal Fit Santa Fe
# Este script valida la compatibilidad de esquemas antes del deploy

set -e

echo "🔍 Validando compatibilidad de esquemas..."

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

# Función para verificar si la base de datos existe
check_database_exists() {
    echo "🔍 Verificando si la base de datos existe..."
    
    if docker-compose exec -T postgres psql -U personalfit_user -d personalfit -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Base de datos existe"
        return 0
    else
        echo "⚠️ Base de datos no existe o no es accesible"
        return 1
    fi
}

# Función para validar esquemas
validate_schemas() {
    echo "🔍 Validando esquemas de base de datos..."
    
    # Crear un contenedor temporal para validar esquemas
    echo "🏗️ Construyendo imagen temporal para validación..."
    docker-compose build personalfit-backend
    
    # Crear un contenedor temporal que solo valide esquemas
    echo "🔍 Ejecutando validación de esquemas..."
    
    # Crear un archivo temporal de propiedades para validación
    cat > temp-validation.properties << EOF
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.hbm2ddl.auto=validate
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=DEBUG
EOF
    
    # Ejecutar validación
    if docker-compose run --rm \
        -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/personalfit \
        -e SPRING_DATASOURCE_USERNAME=personalfit_user \
        -e SPRING_DATASOURCE_PASSWORD=secret123 \
        -e SPRING_PROFILES_ACTIVE=validation \
        personalfit-backend \
        java -Duser.timezone=America/Argentina/Buenos_Aires -jar app.jar \
        --spring.config.location=classpath:/temp-validation.properties; then
        
        echo "✅ Validación de esquemas exitosa"
        rm -f temp-validation.properties
        return 0
    else
        echo "❌ ERROR: Validación de esquemas falló"
        echo "📋 Esto significa que hay cambios incompatibles en el esquema de la base de datos"
        echo "🔧 Soluciones posibles:"
        echo "   1. Hacer backup de la base de datos actual"
        echo "   2. Ejecutar migraciones manuales"
        echo "   3. Contactar al equipo de desarrollo"
        rm -f temp-validation.properties
        return 1
    fi
}

# Función para hacer backup de la base de datos
backup_database() {
    echo "💾 Creando backup de la base de datos..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backup_personalfit_${timestamp}.sql"
    
    if docker-compose exec -T postgres pg_dump -U personalfit_user -d personalfit > "$backup_file"; then
        echo "✅ Backup creado exitosamente: $backup_file"
        echo "📁 Ubicación: $(pwd)/$backup_file"
    else
        echo "❌ Error al crear backup"
        return 1
    fi
}

# Función para restaurar backup
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Archivo de backup no encontrado: $backup_file"
        return 1
    fi
    
    echo "🔄 Restaurando backup: $backup_file"
    
    if docker-compose exec -T postgres psql -U personalfit_user -d personalfit < "$backup_file"; then
        echo "✅ Backup restaurado exitosamente"
    else
        echo "❌ Error al restaurar backup"
        return 1
    fi
}

# Función para crear base de datos si no existe
create_database_if_not_exists() {
    echo "🔍 Verificando si la base de datos existe..."
    
    if ! check_database_exists; then
        echo "🏗️ Creando base de datos..."
        
        # Crear base de datos
        docker-compose exec -T postgres createdb -U personalfit_user personalfit 2>/dev/null || true
        
        # Verificar que se creó correctamente
        if check_database_exists; then
            echo "✅ Base de datos creada exitosamente"
        else
            echo "❌ Error al crear la base de datos"
            return 1
        fi
    fi
}

# Función para ejecutar migraciones
run_migrations() {
    echo "🔄 Ejecutando migraciones..."
    
    # Crear un contenedor temporal para ejecutar migraciones
    if docker-compose run --rm \
        -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/personalfit \
        -e SPRING_DATASOURCE_USERNAME=personalfit_user \
        -e SPRING_DATASOURCE_PASSWORD=secret123 \
        -e SPRING_PROFILES_ACTIVE=migration \
        personalfit-backend \
        java -Duser.timezone=America/Argentina/Buenos_Aires -jar app.jar \
        --spring.jpa.hibernate.ddl-auto=update; then
        
        echo "✅ Migraciones ejecutadas exitosamente"
        return 0
    else
        echo "❌ Error al ejecutar migraciones"
        return 1
    fi
}

# Función principal de migración
main() {
    echo "🚀 Iniciando proceso de migración..."
    
    # Verificar que PostgreSQL esté corriendo
    if ! docker-compose ps postgres | grep -q "Up"; then
        echo "🔄 Iniciando PostgreSQL..."
        docker-compose up -d postgres
        
        # Esperar a que PostgreSQL esté listo
        echo "⏳ Esperando a que PostgreSQL esté listo..."
        until docker-compose exec -T postgres pg_isready -U personalfit_user -d personalfit; do
            echo "Esperando PostgreSQL..."
            sleep 5
        done
    fi
    
    # Crear base de datos si no existe
    create_database_if_not_exists
    
    # Hacer backup antes de cualquier cambio
    if check_database_exists; then
        echo "💾 Creando backup antes de la migración..."
        backup_database
    fi
    
    # Validar esquemas
    if ! validate_schemas; then
        echo "❌ ERROR: La validación de esquemas falló"
        echo "🔧 Esto significa que hay cambios incompatibles en el esquema"
        echo "📋 Opciones disponibles:"
        echo "   1. Ejecutar migraciones manuales (--migrate)"
        echo "   2. Restaurar backup anterior (--restore <backup_file>)"
        echo "   3. Continuar con deploy (--force)"
        exit 1
    fi
    
    echo "✅ Validación completada exitosamente"
    echo "🚀 Puedes proceder con el deploy"
}

# Manejo de argumentos
case "${1:-}" in
    --migrate)
        echo "🔄 Ejecutando migraciones..."
        run_migrations
        ;;
    --restore)
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar el archivo de backup"
            echo "Uso: $0 --restore <backup_file>"
            exit 1
        fi
        restore_database "$2"
        ;;
    --force)
        echo "⚠️ Forzando migración (sin validación)..."
        run_migrations
        ;;
    --backup)
        backup_database
        ;;
    --help)
        echo "Uso: $0 [OPCIÓN]"
        echo ""
        echo "Opciones:"
        echo "  --migrate    Ejecutar migraciones"
        echo "  --restore    Restaurar backup (requiere archivo)"
        echo "  --force      Forzar migración sin validación"
        echo "  --backup     Crear backup de la base de datos"
        echo "  --help       Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  $0                    # Validar esquemas"
        echo "  $0 --migrate          # Ejecutar migraciones"
        echo "  $0 --restore backup.sql # Restaurar backup"
        echo "  $0 --backup           # Crear backup"
        ;;
    *)
        main
        ;;
esac
