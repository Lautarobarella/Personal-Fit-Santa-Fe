#!/bin/bash

# Script para iniciar Personal Fit en modo desarrollo local
echo "🚀 Iniciando Personal Fit en modo desarrollo local..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está disponible. Por favor instala Docker Compose."
    exit 1
fi

# Verificar que existe el archivo .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  Archivo .env.local no encontrado."
    echo "📝 Copiando archivo de ejemplo..."
    cp env.local.example .env.local
    echo "✅ Archivo .env.local creado. Por favor edítalo con tus credenciales de MercadoPago."
    echo "🔑 Necesitas configurar:"
    echo "   - MP_ACCESS_TOKEN (token de sandbox de MercadoPago)"
    echo "   - NEXT_PUBLIC_MP_PUBLIC_KEY (clave pública de sandbox de MercadoPago)"
    echo ""
    echo "¿Quieres continuar sin configurar MercadoPago? (y/n)"
    read -r response
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        echo "❌ Configuración cancelada."
        exit 1
    fi
fi

# Detener contenedores existentes si los hay
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f docker-compose.local.yml down

# Construir e iniciar los servicios
echo "🔨 Construyendo e iniciando servicios..."
docker-compose -f docker-compose.local.yml up --build -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar el estado de los servicios
echo "🔍 Verificando estado de los servicios..."
docker-compose -f docker-compose.local.yml ps

echo ""
echo "✅ Personal Fit iniciado en modo desarrollo local!"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   PgAdmin: http://localhost:5050"
echo ""
echo "📊 Credenciales de PgAdmin:"
echo "   Email: admin@personalfit.com"
echo "   Password: admin123"
echo ""
echo "🔧 Para ver logs: docker-compose -f docker-compose.local.yml logs -f"
echo "🛑 Para detener: docker-compose -f docker-compose.local.yml down"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de configurar las credenciales de MercadoPago en .env.local"
