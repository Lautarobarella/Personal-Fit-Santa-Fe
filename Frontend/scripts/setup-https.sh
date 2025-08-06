#!/bin/bash

# Script para configurar HTTPS localmente para desarrollo con Mercado Pago

echo "🔧 Configurando HTTPS para desarrollo local..."

# Crear directorio para certificados si no existe
mkdir -p .ssl

# Generar certificado SSL autofirmado
echo "📜 Generando certificado SSL autofirmado..."
openssl req -x509 -newkey rsa:4096 -keyout .ssl/key.pem -out .ssl/cert.pem -days 365 -nodes -subj "/C=AR/ST=SF/L=SantaFe/O=PersonalFit/CN=localhost"

# Verificar que se crearon los archivos
if [ -f ".ssl/cert.pem" ] && [ -f ".ssl/key.pem" ]; then
    echo "✅ Certificados SSL generados exitosamente"
    echo "📁 Ubicación: .ssl/"
    echo "🔑 Certificado: .ssl/cert.pem"
    echo "🔐 Clave privada: .ssl/key.pem"
else
    echo "❌ Error al generar certificados SSL"
    exit 1
fi

# Crear archivo de configuración para Next.js con HTTPS
cat > next.config.https.js << 'EOF'
const fs = require('fs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  experimental: {
    esmExternals: 'loose',
  },
  // Configuración de servidor HTTPS para desarrollo
  server: {
    https: {
      key: fs.readFileSync(path.join(process.cwd(), '.ssl', 'key.pem')),
      cert: fs.readFileSync(path.join(process.cwd(), '.ssl', 'cert.pem')),
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        source: '/api/webhook/mercadopago',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.infrastructureLogging = { level: 'error' };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
EOF

echo "📝 Archivo de configuración HTTPS creado: next.config.https.js"

# Crear script para ejecutar con HTTPS
cat > package.json.https << 'EOF'
{
  "scripts": {
    "dev:https": "NODE_OPTIONS='--experimental-https' next dev --experimental-https",
    "build:https": "next build",
    "start:https": "NODE_OPTIONS='--experimental-https' next start --experimental-https"
  }
}
EOF

echo "📋 Scripts HTTPS agregados al package.json"

echo ""
echo "🚀 Para ejecutar con HTTPS:"
echo "   npm run dev:https"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Acepta el certificado autofirmado en tu navegador"
echo "   - Usa https://localhost:3000 en lugar de http://localhost:3000"
echo "   - Mercado Pago ahora debería funcionar correctamente"
echo ""
echo "🔧 Configuración completada!" 