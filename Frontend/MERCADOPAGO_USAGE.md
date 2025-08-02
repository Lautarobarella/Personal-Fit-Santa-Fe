# Guía de Uso de MercadoPago

## 🚨 Error Actual: Token Inválido

Si estás viendo el error **"Error al crear preferencia de pago: Error desconocido"**, esto significa que el token de MercadoPago no está configurado correctamente.

### Solución Rápida:

1. **Obtén un token válido de MercadoPago:**
   - Ve a [https://www.mercadopago.com/developers](https://www.mercadopago.com/developers)
   - Inicia sesión y ve a "Tus integraciones" → "Credenciales"
   - Copia el **Access Token** (debe empezar con `TEST-` para sandbox)

2. **Actualiza el docker-compose.yml:**
   ```yaml
   personalfit-frontend:
     environment:
       MP_ACCESS_TOKEN: TEST-TU_TOKEN_REAL_AQUI  # ← Reemplaza esto
   ```

3. **Reconstruye el contenedor:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## 🔧 Configuración Inicial

### Opción 1: Script Automático (Recomendado)
```bash
cd Frontend
./scripts/setup-mercadopago.sh
```

### Opción 2: Configuración Manual
1. Crea un archivo `.env.local` en la carpeta `Frontend/`
2. Agrega las siguientes variables:
   ```env
   MP_ACCESS_TOKEN=TEST-TU_TOKEN_AQUI
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_MP_ENVIRONMENT=sandbox
   ```

## 📱 Flujo de Usuario

### 1. Selección de Método de Pago
- El usuario va a `/payments/page.tsx`
- Hace clic en "Nuevo"
- Se redirige a `/payments/method-select`
- Elige entre "Pago Online" (MercadoPago) o "Pago Manual"

### 2. Checkout con MercadoPago
- Si elige "Pago Online", va a `/payments/new-mp`
- Ve la información del producto y sus datos
- Hace clic en "Pagar con MercadoPago"
- Se redirige al sandbox de MercadoPago

### 3. Proceso de Pago
- En MercadoPago, el usuario completa el pago
- Puede usar tarjetas de prueba (ver sección de datos de prueba)
- MercadoPago redirige de vuelta según el resultado

### 4. Páginas de Resultado
- **Éxito**: `/success` - Muestra confirmación del pago
- **Error**: `/failure` - Muestra error y opciones para reintentar
- **Pendiente**: `/pending` - Muestra estado pendiente

## 🧪 Datos de Prueba

### Tarjetas de Prueba (Sandbox)

**✅ Tarjeta que aprueba:**
- Número: `4509 9535 6623 3704`
- Fecha: `11/25`
- CVV: `123`
- Nombre: `APRO`

**❌ Tarjeta que rechaza:**
- Número: `4000 0000 0000 0002`
- Fecha: `11/25`
- CVV: `123`
- Nombre: `CONT`

**💳 Tarjeta de débito:**
- Número: `4000 0000 0000 0010`
- Fecha: `11/25`
- CVV: `123`
- Nombre: `DEB`

## 🔍 Verificación y Testing

### 1. Verificar Configuración
```bash
# Endpoint de prueba
curl http://72.60.1.76:3000/api/test-mercadopago
```

### 2. Verificar Webhook
```bash
# Endpoint del webhook
curl http://72.60.1.76:3000/api/webhook/mercadopago
```

### 3. Probar Flujo Completo
1. Ve a `/payments/method-select`
2. Elige "Pago Online"
3. Completa el formulario
4. Usa una tarjeta de prueba
5. Verifica la redirección

## 🐛 Solución de Problemas

### Error: "Token de MercadoPago inválido"
**Síntomas:** Error 401 o mensaje de token inválido
**Solución:**
- Verifica que el token empiece con `TEST-` (sandbox)
- Asegúrate de que tenga 84 caracteres
- Revisa que no haya espacios extra

### Error: "Error de conexión con MercadoPago"
**Síntomas:** Error de red o timeout
**Solución:**
- Verifica conectividad a internet
- Asegúrate de que el puerto 3000 esté abierto
- Verifica que la URL base sea accesible

### Error: "Datos de preferencia inválidos"
**Síntomas:** Error 400 al crear preferencia
**Solución:**
- Verifica que el precio sea un número válido
- Asegúrate de que el email tenga formato correcto
- Verifica que el ID del producto exista

### Error: "Cannot find module 'mercadopago'"
**Síntomas:** Error de módulo no encontrado
**Solución:**
```bash
cd Frontend
npm install mercadopago
```

## 📊 Logs y Debugging

### Ver Logs en Desarrollo
- Abre las herramientas de desarrollador del navegador
- Ve a la pestaña "Console"
- Busca mensajes que empiecen con "==="

### Ver Logs en Producción
```bash
# Ver logs del contenedor
docker logs personalfit-frontend --tail 100

# Ver logs en tiempo real
docker logs personalfit-frontend -f
```

### Logs Importantes a Buscar
- `=== INICIO DE CHECKOUT ===`
- `=== CREANDO PREFERENCIA MERCADOPAGO ===`
- `=== PREFERENCIA CREADA EXITOSAMENTE ===`
- `=== ERROR EN CHECKOUT ===`

## 🔄 Webhooks

### Configuración Automática
El sistema configura automáticamente:
- **Success**: `http://72.60.1.76:3000/success`
- **Failure**: `http://72.60.1.76:3000/failure`
- **Pending**: `http://72.60.1.76:3000/pending`
- **Webhook**: `http://72.60.1.76:3000/api/webhook/mercadopago`

### Procesamiento de Webhooks
- Los webhooks se procesan en `/api/webhook/mercadopago`
- Se registran todos los eventos de pago
- Se actualiza el estado de la transacción

## 🚀 Producción

### Cambiar a Producción
1. Obtén credenciales de producción en MercadoPago
2. Cambia `MP_ACCESS_TOKEN` por el token de producción
3. Cambia `NEXT_PUBLIC_MP_ENVIRONMENT=production`
4. Actualiza `NEXT_PUBLIC_BASE_URL` con tu dominio

### Consideraciones de Seguridad
- Nunca expongas el Access Token en el frontend
- Usa HTTPS en producción
- Configura correctamente los webhooks
- Monitorea los logs regularmente

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración con `/api/test-mercadopago`
3. Prueba con las tarjetas de prueba
4. Consulta la documentación de MercadoPago