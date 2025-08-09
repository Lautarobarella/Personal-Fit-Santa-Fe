#!/bin/bash

echo "🔍 Diagnóstico de Personal Fit Santa Fe"
echo "========================================"

# Verificar Docker
echo "🐳 Verificando Docker..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker está corriendo"
else
    echo "❌ Docker no está corriendo"
    exit 1
fi

# Verificar docker-compose
echo "📦 Verificando docker-compose..."
if command -v docker-compose &> /dev/null; then
    echo "✅ docker-compose está instalado"
else
    echo "❌ docker-compose no está instalado"
    exit 1
fi

# Verificar estado de contenedores
echo "📊 Estado de contenedores:"
docker-compose ps

# Verificar logs de cada servicio
echo ""
echo "📋 Logs de PostgreSQL:"
docker-compose logs --tail=20 postgres

echo ""
echo "📋 Logs de Backend:"
docker-compose logs --tail=20 personalfit-backend

echo ""
echo "📋 Logs de Frontend:"
docker-compose logs --tail=20 personalfit-frontend

# Verificar conectividad
echo ""
echo "🌐 Verificando conectividad..."

# Verificar PostgreSQL
if docker-compose exec -T postgres pg_isready -U personalfit_user -d personalfit > /dev/null 2>&1; then
    echo "✅ PostgreSQL está respondiendo"
else
    echo "❌ PostgreSQL no está respondiendo"
fi

# Verificar Backend
if curl -f https://personalfitsantafe.com:8080/api/health > /dev/null 2>&1; then
    echo "✅ Backend está respondiendo"
else
    echo "❌ Backend no está respondiendo"
fi

# Verificar Frontend
if curl -f https://personalfitsantafe.com > /dev/null 2>&1; then
    echo "✅ Frontend está respondiendo"
else
    echo "❌ Frontend no está respondiendo"
fi

# Verificar recursos del sistema
echo ""
echo "💻 Recursos del sistema:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memoria: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Disco: $(df -h / | awk 'NR==2{print $5}')"

echo ""
echo "🔍 Diagnóstico completado"
