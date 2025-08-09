# Script para iniciar Personal Fit con ngrok para HTTPS
Write-Host "🚀 Iniciando Personal Fit con ngrok para HTTPS..." -ForegroundColor Green

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

# Verificar que ngrok esté instalado
try {
    ngrok version | Out-Null
    Write-Host "✅ ngrok encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok no está instalado. Por favor instala ngrok desde https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

# Verificar que existe el archivo .env.ngrok
if (-not (Test-Path ".env.ngrok")) {
    Write-Host "⚠️  Archivo .env.ngrok no encontrado." -ForegroundColor Yellow
    Write-Host "📝 Copiando archivo de ejemplo..." -ForegroundColor Cyan
    Copy-Item "env.ngrok.example" ".env.ngrok"
    Write-Host "✅ Archivo .env.ngrok creado. Por favor edítalo con:" -ForegroundColor Green
    Write-Host "   - NGROK_URL (URL de tu túnel ngrok)" -ForegroundColor White
    Write-Host "   - MP_ACCESS_TOKEN (token de sandbox de MercadoPago)" -ForegroundColor White
    Write-Host "   - NEXT_PUBLIC_MP_PUBLIC_KEY (clave pública de sandbox de MercadoPago)" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "¿Quieres continuar sin configurar ngrok? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Configuración cancelada." -ForegroundColor Red
        exit 1
    }
}

# Detener contenedores existentes si los hay
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose -f docker-compose.ngrok.yml down

# Construir e iniciar los servicios
Write-Host "🔨 Construyendo e iniciando servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.ngrok.yml up --build -d

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar el estado de los servicios
Write-Host "🔍 Verificando estado de los servicios..." -ForegroundColor Yellow
docker-compose -f docker-compose.ngrok.yml ps

Write-Host ""
Write-Host "✅ Personal Fit iniciado con ngrok!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs de acceso:" -ForegroundColor Cyan
Write-Host "   Frontend (local): http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API (local): http://localhost:8080" -ForegroundColor White
Write-Host "   PgAdmin (local): http://localhost:5050" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Para configurar ngrok:" -ForegroundColor Yellow
Write-Host "   1. Ejecuta: ngrok http 3000" -ForegroundColor White
Write-Host "   2. Copia la URL HTTPS que te da ngrok" -ForegroundColor White
Write-Host "   3. Actualiza NGROK_URL en .env.ngrok" -ForegroundColor White
Write-Host "   4. Reinicia el frontend: docker-compose -f docker-compose.ngrok.yml restart personalfit-frontend" -ForegroundColor White
Write-Host ""
Write-Host "📊 Credenciales de PgAdmin:" -ForegroundColor Cyan
Write-Host "   Email: admin@personalfit.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para ver logs: docker-compose -f docker-compose.ngrok.yml logs -f" -ForegroundColor Yellow
Write-Host "🛑 Para detener: docker-compose -f docker-compose.ngrok.yml down" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Configura NGROK_URL en .env.ngrok para que MercadoPago funcione correctamente" -ForegroundColor Red
