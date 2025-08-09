# Script para iniciar Personal Fit en modo desarrollo local (Windows)
Write-Host "🚀 Iniciando Personal Fit en modo desarrollo local..." -ForegroundColor Green

# Verificar que Docker esté instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop primero." -ForegroundColor Red
    exit 1
}

# Verificar que Docker Compose esté disponible
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está disponible. Por favor instala Docker Compose." -ForegroundColor Red
    exit 1
}

# Verificar que existe el archivo .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Archivo .env.local no encontrado." -ForegroundColor Yellow
    Write-Host "📝 Copiando archivo de ejemplo..." -ForegroundColor Cyan
    Copy-Item "env.local.example" ".env.local"
    Write-Host "✅ Archivo .env.local creado. Por favor edítalo con tus credenciales de MercadoPago." -ForegroundColor Green
    Write-Host "🔑 Necesitas configurar:" -ForegroundColor Yellow
    Write-Host "   - MP_ACCESS_TOKEN (token de sandbox de MercadoPago)" -ForegroundColor White
    Write-Host "   - NEXT_PUBLIC_MP_PUBLIC_KEY (clave pública de sandbox de MercadoPago)" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "¿Quieres continuar sin configurar MercadoPago? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Configuración cancelada." -ForegroundColor Red
        exit 1
    }
}

# Detener contenedores existentes si los hay
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Construir e iniciar los servicios
Write-Host "🔨 Construyendo e iniciando servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up --build -d

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar el estado de los servicios
Write-Host "🔍 Verificando estado de los servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml ps

Write-Host ""
Write-Host "✅ Personal Fit iniciado en modo desarrollo local!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs de acceso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "   PgAdmin: http://localhost:5050" -ForegroundColor White
Write-Host ""
Write-Host "📊 Credenciales de PgAdmin:" -ForegroundColor Cyan
Write-Host "   Email: admin@personalfit.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para ver logs: docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor Yellow
Write-Host "🛑 Para detener: docker-compose -f docker-compose.local.yml down" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Asegúrate de configurar las credenciales de MercadoPago en .env.local" -ForegroundColor Red
