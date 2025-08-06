#!/bin/bash

echo "🔍 Verificando configuración actual de nginx..."

echo "📄 Contenido del archivo de configuración actual:"
cat /etc/nginx/sites-available/personalfitsantafe.com

echo ""
echo "🔗 Enlaces simbólicos en sites-enabled:"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "📊 Estado de nginx:"
systemctl status nginx --no-pager -l 