# Script para actualizar la URL de ngrok dinámicamente
param(
    [Parameter(Mandatory=$true)]
    [string]$NgrokUrl
)

Write-Host "🔄 Actualizando URL de ngrok a: $NgrokUrl" -ForegroundColor Green

# Verificar que la URL sea válida
if (-not $NgrokUrl.StartsWith("https://")) {
    Write-Host "❌ Error: La URL debe comenzar con https://" -ForegroundColor Red
    exit 1
}

# Actualizar el archivo .env.ngrok
if (Test-Path ".env.ngrok") {
    $content = Get-Content ".env.ngrok" -Raw
    $content = $content -replace "NGROK_URL=.*", "NGROK_URL=$NgrokUrl"
    Set-Content ".env.ngrok" $content
    Write-Host "✅ Archivo .env.ngrok actualizado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archivo .env.ngrok no encontrado. Creando uno nuevo..." -ForegroundColor Yellow
    Copy-Item "env.ngrok.example" ".env.ngrok"
    $content = Get-Content ".env.ngrok" -Raw
    $content = $content -replace "NGROK_URL=.*", "NGROK_URL=$NgrokUrl"
    Set-Content ".env.ngrok" $content
    Write-Host "✅ Archivo .env.ngrok creado y actualizado" -ForegroundColor Green
}

# Reiniciar el frontend para aplicar los cambios
Write-Host "🔄 Reiniciando frontend para aplicar los cambios..." -ForegroundColor Yellow
docker-compose -f docker-compose.ngrok.yml restart personalfit-frontend

Write-Host ""
Write-Host "✅ URL de ngrok actualizada correctamente!" -ForegroundColor Green
Write-Host "🌐 Tu aplicación ahora está disponible en: $NgrokUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 URLs de acceso:" -ForegroundColor Yellow
Write-Host "   Frontend (ngrok): $NgrokUrl" -ForegroundColor White
Write-Host "   Backend API (local): http://localhost:8080" -ForegroundColor White
Write-Host "   PgAdmin (local): http://localhost:5050" -ForegroundColor White
Write-Host ""
Write-Host "🔗 MercadoPago webhooks ahora funcionarán correctamente con HTTPS" -ForegroundColor Green
