#!/bin/bash

echo "🔧 Configuración de MercadoPago para Personal Fit"
echo "================================================"
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Este script debe ejecutarse desde la carpeta Frontend/"
    exit 1
fi

echo "📋 Pasos para configurar MercadoPago:"
echo ""
echo "1. Ve a https://www.mercadopago.com/developers"
echo "2. Inicia sesión con tu cuenta de MercadoPago"
echo "3. Ve a 'Tus integraciones' → 'Credenciales'"
echo "4. Copia tu Access Token (empieza con TEST- para sandbox)"
echo ""

# Solicitar el token
read -p "🔑 Ingresa tu Access Token de MercadoPago: " MP_TOKEN

if [ -z "$MP_TOKEN" ]; then
    echo "❌ Error: No se ingresó ningún token"
    exit 1
fi

# Verificar formato del token
if [[ ! $MP_TOKEN =~ ^(TEST-|APP_USR-)[A-Za-z0-9-]+$ ]]; then
    echo "⚠️  Advertencia: El token no parece tener el formato correcto"
    echo "   Los tokens válidos empiezan con 'TEST-' (sandbox) o 'APP_USR-' (producción)"
    read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Crear archivo .env.local
echo "📝 Creando archivo .env.local..."
cat > .env.local << EOF
# Configuración de MercadoPago
MP_ACCESS_TOKEN=$MP_TOKEN
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MP_ENVIRONMENT=sandbox

# Otras configuraciones
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_IS_DOCKER=false
EOF

echo "✅ Archivo .env.local creado exitosamente"
echo ""

# Mostrar configuración
echo "📋 Configuración actual:"
echo "   Token: ${MP_TOKEN:0:10}..."
echo "   Ambiente: sandbox"
echo "   URL Base: http://localhost:3000"
echo ""

# Instrucciones adicionales
echo "🚀 Próximos pasos:"
echo "1. Reinicia el servidor de desarrollo: npm run dev"
echo "2. Ve a http://localhost:3000/api/test-mercadopago para verificar la configuración"
echo "3. Prueba el pago en http://localhost:3000/payments/new-mp"
echo ""

echo "💡 Para producción, actualiza el archivo docker-compose.yml con tu token"
echo ""

echo "✅ Configuración completada!" 