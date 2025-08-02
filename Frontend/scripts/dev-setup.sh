#!/bin/bash

# Script para configurar el entorno de desarrollo

echo "🚀 Configurando entorno de desarrollo para Personal Fit..."

# Verificar si estamos en Docker o desarrollo local
if [ "$NEXT_PUBLIC_IS_DOCKER" = "true" ]; then
    echo "📦 Ejecutando en Docker - usando personalfit-backend:8080"
    export NEXT_PUBLIC_API_URL="http://personalfit-backend:8080"
else
    echo "💻 Ejecutando en desarrollo local - usando localhost:8080"
    export NEXT_PUBLIC_API_URL="http://localhost:8080"
fi

echo "✅ Configuración completada"
echo "🌐 API URL: $NEXT_PUBLIC_API_URL" 