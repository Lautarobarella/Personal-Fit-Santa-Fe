#!/bin/bash

echo "🔧 Aplicando configuración de nginx para Personal Fit..."

# Verificar si nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx no está instalado. Instalando..."
    sudo apt update
    sudo apt install -y nginx
fi

# Crear backup de la configuración actual
echo "💾 Creando backup de la configuración actual..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No se encontró configuración por defecto"

# Copiar la nueva configuración
echo "📝 Copiando nueva configuración..."
sudo cp nginx-personalfit.conf /etc/nginx/sites-available/personalfit

# Crear enlace simbólico si no existe
if [ ! -L /etc/nginx/sites-enabled/personalfit ]; then
    echo "🔗 Creando enlace simbólico..."
    sudo ln -s /etc/nginx/sites-available/personalfit /etc/nginx/sites-enabled/
fi

# Deshabilitar configuración por defecto si existe
if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "🚫 Deshabilitando configuración por defecto..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Verificar configuración
echo "🔍 Verificando configuración de nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración válida. Recargando nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Configuración aplicada exitosamente!"
    echo ""
    echo "📋 Resumen de la configuración:"
    echo "   - Frontend API routes (/api/checkout, /api/webhook, etc.): van al frontend (puerto 3000)"
    echo "   - Backend API routes (/api/payments, /api/auth, etc.): van al backend (puerto 8080)"
    echo "   - Páginas web: van al frontend (puerto 3000)"
    echo ""
    echo "🌐 Tu aplicación debería estar disponible en: https://personalfitsantafe.com"
else
    echo "❌ Error en la configuración de nginx. Revisa los logs."
    exit 1
fi 