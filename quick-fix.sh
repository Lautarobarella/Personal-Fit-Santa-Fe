#!/bin/bash

echo "🔧 Diagnóstico rápido del backend..."

cd /opt/Personal-Fit-Santa-Fe

echo "📋 Estado actual:"
docker ps -a | grep backend

echo "📊 Logs completos del backend:"
docker-compose logs --tail=50 personalfit-backend

echo "🚀 Intentando levantar el backend:"
docker-compose up -d personalfit-backend

echo "⏳ Esperando 30 segundos..."
sleep 30

echo "📋 Estado después del intento:"
docker ps | grep backend

echo "📋 Logs recientes:"
docker-compose logs --tail=20 personalfit-backend

echo "🌐 Probando conectividad:"
curl -I http://localhost:8080/actuator/health || echo "No responde en /actuator/health"
curl -I http://localhost:8080/ || echo "No responde en /"
