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

## 🔄 Sistema de Procesamiento de Pagos

### Procesamiento Automático
El sistema ahora incluye un mecanismo robusto para procesar pagos:

1. **Webhook Inmediato**: Cuando MercadoPago envía una notificación
2. **Reintentos Automáticos**: Si el pago no se puede procesar inmediatamente
3. **Almacenamiento Temporal**: Los pagos pendientes se guardan en memoria
4. **Procesamiento Manual**: Endpoint para procesar pagos pendientes

### Endpoints de Administración

#### Ver Pagos Pendientes
```bash
GET /api/process-pending-payments
```

#### Procesar Pagos Pendientes
```bash
POST /api/process-pending-payments
```

#### Página de Administración
```
/admin/payments/pending
```

### Flujo de Procesamiento

1. **Recepción del Webhook**:
   - MercadoPago envía notificación
   - Sistema intenta obtener información del pago
   - Si falla, se guarda como pendiente

2. **Reintentos Automáticos**:
   - Hasta 3 intentos con 2 segundos de espera
   - Si falla, se marca como pendiente

3. **Procesamiento Manual**:
   - Hasta 5 intentos adicionales
   - Si falla, se marca como fallido

4. **Mapeo con Cliente**:
   - Se extrae información del `external_reference`
   - Se simula la creación del pago en el sistema
   - Se muestra información detallada en consola

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

### 3. Verificar Pagos Pendientes
```bash
# Ver pagos pendientes
curl http://72.60.1.76:3000/api/process-pending-payments
```

### 4. Procesar Pagos Pendientes
```bash
# Procesar pagos pendientes
curl -X POST http://72.60.1.76:3000/api/process-pending-payments
```

### 5. Diagnóstico Completo del Sistema
```
/admin/diagnostics
```
Esta página verifica automáticamente todos los endpoints del sistema y muestra:
- Estado de cada endpoint
- Tiempo de respuesta
- Errores específicos
- Timeouts

### 6. Probar Flujo Completo
1. Ve a `/payments/method-select`
2. Elige "Pago Online"
3. Completa el formulario
4. Usa una tarjeta de prueba
5. Verifica la redirección
6. Revisa los logs del servidor
7. Verifica los pagos pendientes en `/admin/payments/pending`
8. Ejecuta el diagnóstico en `/admin/diagnostics`

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

### Error: "Payment not found"
**Síntomas:** Error 404 al obtener información del pago
**Solución:**
- Es normal en los primeros segundos después del pago
- El sistema reintentará automáticamente
- Puedes procesar manualmente desde `/admin/payments/pending`

### Error: "Timeout exceeded" en webhook
**Síntomas:** El webhook no responde o tarda demasiado
**Solución:**
- El webhook ahora responde inmediatamente (sin esperar el procesamiento)
- El procesamiento se hace de forma asíncrona
- Verifica el estado en `/admin/diagnostics`
- Revisa los logs del servidor para ver el procesamiento

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
- `=== PROCESANDO WEBHOOK MERCADOPAGO ===`
- `=== ERROR EN CHECKOUT ===`
- `🔄 Procesando pagos pendientes...`
- `✅ Pago procesado exitosamente`
- `📝 Creando registro de pago pendiente...`

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
- Los pagos fallidos se guardan como pendientes

### Tipos de Notificaciones
- **payment.created**: Pago creado
- **payment.updated**: Pago actualizado
- **merchant_order**: Orden de comerciante

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

### Monitoreo en Producción
- Revisa regularmente `/admin/payments/pending`
- Monitorea los logs del servidor
- Configura alertas para pagos fallidos
- Revisa los webhooks de MercadoPago

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración con `/api/test-mercadopago`
3. Revisa los pagos pendientes en `/admin/payments/pending`
4. Prueba con las tarjetas de prueba
5. Consulta la documentación de MercadoPago

## 🎯 Próximos Pasos

### Mejoras Sugeridas
1. **Base de Datos**: Reemplazar almacenamiento en memoria por base de datos
2. **Notificaciones**: Enviar emails cuando se procesen pagos
3. **Dashboard**: Crear dashboard más detallado para administradores
4. **Integración Backend**: Conectar con el backend Java para crear pagos reales
5. **Cron Jobs**: Configurar procesamiento automático de pagos pendientes