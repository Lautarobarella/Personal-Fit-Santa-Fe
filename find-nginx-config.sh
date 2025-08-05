#!/bin/bash

echo "🔍 Buscando archivos de configuración de nginx..."

# Buscar archivos de configuración de nginx en ubicaciones comunes
echo "📁 Ubicaciones comunes de nginx:"
echo "1. /etc/nginx/nginx.conf"
echo "2. /etc/nginx/sites-available/"
echo "3. /etc/nginx/sites-enabled/"
echo "4. /etc/nginx/conf.d/"
echo "5. /usr/local/nginx/conf/"
echo "6. /opt/nginx/conf/"

echo ""
echo "🔍 Buscando archivos que contengan 'personalfit' o 'personalfitsantafe':"

# Buscar archivos que contengan referencias al proyecto
find /etc/nginx -name "*.conf" -exec grep -l "personalfit\|personalfitsantafe" {} \; 2>/dev/null

echo ""
echo "🔍 Buscando archivos de configuración en todo el sistema:"
find / -name "nginx.conf" -type f 2>/dev/null | head -10

echo ""
echo "🔍 Verificando si nginx está corriendo:"
systemctl status nginx 2>/dev/null || service nginx status 2>/dev/null || echo "Nginx no encontrado como servicio"

echo ""
echo "🔍 Verificando puertos en uso:"
netstat -tlnp | grep :80
netstat -tlnp | grep :443
netstat -tlnp | grep :3000
netstat -tlnp | grep :8080 