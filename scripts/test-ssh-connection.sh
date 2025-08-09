#!/bin/bash

# 🔍 Script de Verificación de Conectividad SSH
# Verifica que se pueda conectar al servidor de producción

set -e

echo "🔍 Verificando conectividad SSH..."

# Verificar variables de entorno requeridas
required_vars=("SSH_HOST" "SSH_USERNAME" "SSH_PASSWORD" "SSH_PORT")

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Error: Variable de entorno $var no está definida"
        exit 1
    fi
done

echo "✅ Variables de entorno verificadas"

# Testear conectividad básica
echo "🌐 Verificando conectividad de red al host ${SSH_HOST}:${SSH_PORT}..."

if timeout 10 bash -c "</dev/tcp/${SSH_HOST}/${SSH_PORT}"; then
    echo "✅ Puerto ${SSH_PORT} es accesible en ${SSH_HOST}"
else
    echo "❌ Error: No se puede conectar a ${SSH_HOST}:${SSH_PORT}"
    exit 1
fi

echo "🔐 Verificando autenticación SSH..."

# Crear archivo temporal para la prueba
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
#!/bin/bash
echo "🔍 Conexión SSH exitosa"
echo "📋 Información del servidor:"
echo "  - Usuario: $(whoami)"
echo "  - Hostname: $(hostname)"
echo "  - Fecha: $(date)"
echo "  - Directorio: $(pwd)"
echo "  - Versión de Docker: $(docker --version 2>/dev/null || echo 'Docker no disponible')"
EOF

# Ejecutar prueba SSH
if sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p "${SSH_PORT}" "${SSH_USERNAME}@${SSH_HOST}" 'bash -s' < "$TEMP_SCRIPT"; then
    echo "✅ Autenticación SSH exitosa"
else
    echo "❌ Error: Falló la autenticación SSH"
    rm -f "$TEMP_SCRIPT"
    exit 1
fi

# Limpiar archivo temporal
rm -f "$TEMP_SCRIPT"

echo ""
echo "🎉 Verificación de conectividad SSH completada exitosamente"
echo "✅ El servidor está listo para el deployment"
