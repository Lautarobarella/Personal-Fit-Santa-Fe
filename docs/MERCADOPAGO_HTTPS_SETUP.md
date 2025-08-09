# Configuración HTTPS para Mercado Pago

## Problemas Solucionados

### 1. Error "No podés pagarte a vos mismo"
Este error ocurre cuando Mercado Pago detecta que el email del pagador es el mismo que el del vendedor en el sandbox.

**Solución implementada:**
- Se configuraron variables de entorno con datos de prueba diferentes
- Se usa un email de prueba específico: `test-buyer@example.com`
- Se usan datos de identificación diferentes para evitar conflictos

### 2. Errores de Contenido Mixto (HTTP vs HTTPS)
Mercado Pago requiere HTTPS para las URLs de redirección y webhooks.

**Solución implementada:**
- Se actualizaron todas las URLs para usar HTTPS
- Se configuraron headers de seguridad apropiados
- Se agregó soporte para certificados SSL autofirmados en desarrollo

## Configuración

### Variables de Entorno Agregadas

```env
# URLs HTTPS
NEXT_PUBLIC_BASE_URL=https://72.60.1.76:3000

# Datos de prueba para evitar "pagar a uno mismo"
NEXT_PUBLIC_MP_TEST_EMAIL=test-buyer@example.com
NEXT_PUBLIC_MP_TEST_PHONE=12345678
NEXT_PUBLIC_MP_TEST_DNI=12345678
```

### Archivos Modificados

1. **docker-compose.yml**
   - Cambiado `NEXT_PUBLIC_BASE_URL` de HTTP a HTTPS
   - Agregadas variables de entorno para datos de prueba

2. **Frontend/lib/mercadopago.ts**
   - Actualizada función `createSingleProductPreference`
   - Uso de datos de prueba en lugar del email real
   - URLs HTTPS para redirecciones y webhooks

3. **Frontend/next.config.mjs**
   - Agregados headers de seguridad para HTTPS
   - Configuración CORS para webhooks de Mercado Pago

4. **Frontend/middleware.ts**
   - Headers de seguridad mejorados
   - Soporte CORS para webhooks

## Instrucciones de Uso

### Para Desarrollo Local (Windows)

1. **Ejecutar el script de configuración:**
   ```powershell
   cd Frontend
   .\scripts\setup-https.ps1
   ```

2. **Instalar OpenSSL (si no está instalado):**
   - Descargar desde: https://slproweb.com/products/Win32OpenSSL.html
   - Agregar al PATH del sistema

3. **Ejecutar con HTTPS:**
   ```bash
   npm run dev:https
   ```

4. **Acceder a la aplicación:**
   - Usar `https://localhost:3000` en lugar de `http://localhost:3000`
   - Aceptar el certificado autofirmado en el navegador

### Para Producción (Docker)

1. **Reconstruir los contenedores:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Verificar la configuración:**
   - Las URLs ahora usan HTTPS
   - Los datos de prueba están configurados
   - Los headers de seguridad están activos

## Verificación

### 1. Verificar Configuración de Mercado Pago

En la consola del navegador, deberías ver:
```
=== CREANDO PREFERENCIA MERCADOPAGO ===
Producto: [Nombre del producto]
Precio: $[Precio]
Email: test-buyer@example.com
Token configurado: TEST-79051...
Ambiente: SANDBOX
URL base configurada: https://72.60.1.76:3000
```

### 2. Verificar URLs HTTPS

Todas las URLs deberían usar HTTPS:
- Success: `https://72.60.1.76:3000/success`
- Failure: `https://72.60.1.76:3000/failure`
- Pending: `https://72.60.1.76:3000/pending`
- Webhook: `https://72.60.1.76:3000/api/webhook/mercadopago`

### 3. Verificar Headers de Seguridad

En las herramientas de desarrollador del navegador, verificar que los headers estén presentes:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`

## Solución de Problemas

### Error: "OpenSSL no encontrado"
```bash
# Instalar OpenSSL en Windows
# Descargar desde: https://slproweb.com/products/Win32OpenSSL.html
# O usar el certificado de desarrollo de Next.js
```

### Error: "Certificado no confiable"
- En desarrollo local, aceptar el certificado autofirmado
- En producción, usar un certificado SSL válido

### Error: "CORS bloqueado"
- Verificar que los headers CORS estén configurados correctamente
- Verificar que las URLs de webhook usen HTTPS

### Error: "Token de Mercado Pago inválido"
- Verificar que `MP_ACCESS_TOKEN` esté configurado correctamente
- Verificar que el token sea de sandbox (empiece con `TEST-`)

## Notas Importantes

1. **Datos de Prueba**: Los datos de prueba están configurados para evitar el error "pagar a uno mismo"
2. **HTTPS Obligatorio**: Mercado Pago requiere HTTPS para todas las URLs de redirección y webhooks
3. **Certificados**: En desarrollo se usan certificados autofirmados, en producción usar certificados válidos
4. **Sandbox**: Asegúrate de usar tokens de sandbox para pruebas

## Próximos Pasos

1. Probar el flujo completo de pago con Mercado Pago
2. Verificar que los webhooks funcionen correctamente
3. Configurar certificados SSL válidos para producción
4. Monitorear los logs para detectar errores 