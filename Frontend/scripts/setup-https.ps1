# Script de PowerShell para configurar HTTPS en Windows para desarrollo con Mercado Pago

Write-Host "🔧 Configurando HTTPS para desarrollo local..." -ForegroundColor Green

# Crear directorio para certificados si no existe
if (!(Test-Path ".ssl")) {
    New-Item -ItemType Directory -Path ".ssl" | Out-Null
}

# Verificar si OpenSSL está disponible
try {
    $opensslVersion = openssl version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ OpenSSL encontrado: $opensslVersion" -ForegroundColor Green
    } else {
        throw "OpenSSL no encontrado"
    }
} catch {
    Write-Host "❌ OpenSSL no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "💡 Instala OpenSSL desde: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "   O usa el certificado de desarrollo de Next.js" -ForegroundColor Yellow
    exit 1
}

# Generar certificado SSL autofirmado
Write-Host "📜 Generando certificado SSL autofirmado..." -ForegroundColor Yellow
openssl req -x509 -newkey rsa:4096 -keyout .ssl/key.pem -out .ssl/cert.pem -days 365 -nodes -subj "/C=AR/ST=SF/L=SantaFe/O=PersonalFit/CN=localhost"

# Verificar que se crearon los archivos
if ((Test-Path ".ssl/cert.pem") -and (Test-Path ".ssl/key.pem")) {
    Write-Host "✅ Certificados SSL generados exitosamente" -ForegroundColor Green
    Write-Host "📁 Ubicación: .ssl/" -ForegroundColor Cyan
    Write-Host "🔑 Certificado: .ssl/cert.pem" -ForegroundColor Cyan
    Write-Host "🔐 Clave privada: .ssl/key.pem" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error al generar certificados SSL" -ForegroundColor Red
    exit 1
}

# Crear archivo de configuración para Next.js con HTTPS
$nextConfigHttps = @"
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
"@

$nextConfigHttps | Out-File -FilePath "next.config.https.js" -Encoding UTF8
Write-Host "📝 Archivo de configuración HTTPS creado: next.config.https.js" -ForegroundColor Green

# Actualizar package.json con scripts HTTPS
Write-Host "📋 Agregando scripts HTTPS al package.json..." -ForegroundColor Yellow

# Leer el package.json actual
$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
    # Agregar scripts HTTPS si no existen
    if (!$packageJson.scripts) {
        $packageJson.scripts = @{}
    }
    
    $packageJson.scripts."dev:https" = "NODE_OPTIONS='--experimental-https' next dev --experimental-https"
    $packageJson.scripts."build:https" = "next build"
    $packageJson.scripts."start:https" = "NODE_OPTIONS='--experimental-https' next start --experimental-https"
    
    # Guardar el package.json actualizado
    $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $packageJsonPath -Encoding UTF8
    Write-Host "✅ Scripts HTTPS agregados al package.json" -ForegroundColor Green
} else {
    Write-Host "⚠️  package.json no encontrado, creando scripts manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Para ejecutar con HTTPS:" -ForegroundColor Green
Write-Host "   npm run dev:https" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Acepta el certificado autofirmado en tu navegador" -ForegroundColor White
Write-Host "   - Usa https://localhost:3000 en lugar de http://localhost:3000" -ForegroundColor White
Write-Host "   - Mercado Pago ahora debería funcionar correctamente" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Configuración completada!" -ForegroundColor Green 