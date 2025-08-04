# Configuración de MercadoPago

## 1. Obtener Credenciales de MercadoPago

### Paso 1: Crear cuenta en MercadoPago Developers
1. Ve a [https://www.mercadopago.com/developers](https://www.mercadopago.com/developers)
2. Inicia sesión con tu cuenta de MercadoPago
3. Ve a "Tus integraciones" → "Credenciales"

### Paso 2: Obtener Access Token
1. En la sección de credenciales, encontrarás:
   - **Public Key**: Para el frontend
   - **Access Token**: Para el backend (este es el que necesitamos)

2. **Para pruebas (Sandbox)**:
   - Usa el Access Token que comienza con `TEST-`
   - Ejemplo: `TEST-1234567890abcdef-123456-abcdef1234567890abcdef1234567890-123456789`

3. **Para producción**:
   - Usa el Access Token que comienza con `APP_USR-`
   - Ejemplo: `APP_USR-1234567890abcdef-123456-abcdef1234567890abcdef1234567890-123456789`

## 2. Configurar Variables de Entorno

### En el archivo `docker-compose.yml`:

```yaml
personalfit-frontend:
  # ... otras configuraciones ...
  environment:
    NEXT_PUBLIC_API_URL: http://personalfit-backend:8080
    NEXT_PUBLIC_IS_DOCKER: "true"
    NEXT_PUBLIC_BASE_URL: http://72.60.1.76:3000
    MP_ACCESS_TOKEN: TEST-TU_TOKEN_AQUI  # ← Reemplaza con tu token real
    NEXT_PUBLIC_MP_ENVIRONMENT: sandbox
```

### Para desarrollo local (archivo `.env.local`):

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MP_ACCESS_TOKEN=TEST-TU_TOKEN_AQUI
NEXT_PUBLIC_MP_ENVIRONMENT=sandbox
```

## 3. Verificar la Configuración

### Endpoint de prueba
Una vez configurado, puedes verificar que todo esté funcionando visitando:
```
http://72.60.1.76:3000/api/test-mercadopago
```

Deberías ver una respuesta como:
```json
{
  "success": true,
  "config": {
    "hasMpToken": true,
    "mpTokenLength": 84,
    "mpTokenPreview": "TEST-12345...",
    "baseUrl": "http://72.60.1.76:3000",
    "environment": "sandbox",
    "nodeEnv": "production"
  },
  "message": "Configuración de MercadoPago verificada"
}
```

## 4. URLs de Webhook

### Configuración automática
El sistema configura automáticamente las siguientes URLs:

- **Success**: `http://72.60.1.76:3000/success`
- **Failure**: `http://72.60.1.76:3000/failure`
- **Pending**: `http://72.60.1.76:3000/pending`
- **Webhook**: `http://72.60.1.76:3000/api/webhook/mercadopago`

### Verificar webhook
Puedes probar el webhook visitando:
```
http://72.60.1.76:3000/api/webhook/mercadopago
```

## 5. Datos de Prueba

### Tarjetas de prueba para Sandbox:

**Tarjeta de crédito aprobada:**
- Número: `4509 9535 6623 3704`
- Fecha: `11/25`
- CVV: `123`
- Nombre: `APRO`

**Tarjeta de crédito rechazada:**
- Número: `4000 0000 0000 0002`
- Fecha: `11/25`
- CVV: `123`
- Nombre: `CONT`

**Tarjeta de débito:**
- Número: `4000 0000 0000 0010`
- Fecha: `11/25`
- CVV: `123`
- Nombre: `DEB`

## 6. Solución de Problemas

### Error: "Token de MercadoPago inválido"
- Verifica que el token comience con `TEST-` para sandbox
- Asegúrate de que el token esté completo (84 caracteres)
- Verifica que no haya espacios extra

### Error: "Error de conexión con MercadoPago"
- Verifica la conectividad a internet
- Asegúrate de que el puerto 3000 esté abierto
- Verifica que la URL base sea accesible públicamente

### Error: "Datos de preferencia inválidos"
- Verifica que el precio sea un número válido
- Asegúrate de que el email tenga formato válido
- Verifica que el ID del producto exista

## 7. Logs de Debug

El sistema incluye logs detallados para debugging. Puedes ver los logs en:
- **Desarrollo**: Consola del navegador
- **Producción**: Logs del contenedor Docker

### Comandos útiles para ver logs:
```bash
# Ver logs del frontend
docker logs personalfit-frontend --tail 100

# Ver logs en tiempo real
docker logs personalfit-frontend -f
```