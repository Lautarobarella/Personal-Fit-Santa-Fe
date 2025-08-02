# Configuración de MercadoPago

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la carpeta `Frontend/` con las siguientes variables:

```bash
# Variables de entorno para MercadoPago
# CREDENCIALES DE PRUEBA - NO USAR EN PRODUCCIÓN

# Access Token de MercadoPago (Sandbox/Pruebas)
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXX

# URL base de la aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Indicador de ambiente de pruebas
NEXT_PUBLIC_MP_ENVIRONMENT=sandbox
```

## Pasos para obtener las credenciales

### 1. Crear cuenta de desarrollador en MercadoPago

1. Ve a [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión o crea una cuenta
3. Ve a la sección "Mis aplicaciones"

### 2. Crear una aplicación de prueba

1. Haz clic en "Crear aplicación"
2. Elige "Pagos online" como producto
3. Nombra tu aplicación (ej: "Personal Fit Gym")
4. Selecciona el modelo de negocio apropiado

### 3. Obtener credenciales de SANDBOX (pruebas)

1. Una vez creada la aplicación, ve a la sección "Credenciales"
2. Asegúrate de estar en la pestaña "Credenciales de prueba"
3. Copia el **Access Token** (empieza con `APP_USR-`)
4. Pega este token en la variable `MP_ACCESS_TOKEN` de tu `.env.local`

### 4. Configurar URL de webhook (Producción)

Para producción, necesitarás configurar una URL pública para el webhook:

1. Si tienes un dominio/IP pública, usa: `https://tudominio.com/api/webhook/mercadopago`
2. Si usas servicios como Ngrok, Railway, Vercel, etc., usa su URL

**Ejemplo para máquina en la nube:**
```bash
NEXT_PUBLIC_BASE_URL=http://tu-ip-publica:3000
```

## Tarjetas de prueba

Para probar los pagos, usa estas tarjetas de prueba:

### Tarjetas que aprueban el pago:
- **Visa:** 4507 9900 0000 0087
- **Mastercard:** 5031 7557 3453 0604
- **American Express:** 3711 8030 3257 522

### Datos de ejemplo:
- **CVV:** 123
- **Fecha de vencimiento:** 11/25
- **Nombre:** APRO (para aprobar) o CONT (para rechazar)
- **DNI:** 12345678

## URLs de redirección

El sistema está configurado para redirigir a:
- **Éxito:** `/success`
- **Error:** `/failure`  
- **Pendiente:** `/pending`

## Webhook

El webhook está configurado en: `/api/webhook/mercadopago`

Esta ruta recibe las notificaciones de MercadoPago cuando cambia el estado de un pago.

## Modo Producción

Para usar en producción:

1. Cambia a credenciales de producción en MercadoPago
2. Actualiza `MP_ACCESS_TOKEN` con el token de producción
3. Cambia `NEXT_PUBLIC_MP_ENVIRONMENT=production`
4. Configura una URL pública para `NEXT_PUBLIC_BASE_URL`

## Verificar configuración

Una vez configurado, puedes verificar que todo funciona:

1. Ejecuta `npm run dev`
2. Ve a `/payments/new-mp`
3. Intenta realizar un pago de prueba
4. Verifica que te redirija a MercadoPago
5. Completa el pago con las tarjetas de prueba
6. Verifica que vuelvas a la aplicación con el estado correcto

## Troubleshooting

### Error: "Cannot find module 'mercadopago'"
- Asegúrate de haber ejecutado `npm install` en la carpeta Frontend

### Error: "MP_ACCESS_TOKEN no definido"
- Verifica que el archivo `.env.local` esté en la carpeta `Frontend/`
- Verifica que la variable `MP_ACCESS_TOKEN` esté correctamente definida
- Reinicia el servidor de desarrollo

### Error de CORS o Webhook
- Verifica que la URL del webhook sea accesible públicamente
- Para desarrollo local, puedes usar herramientas como Ngrok

### El pago no se confirma
- Verifica que el webhook esté recibiendo las notificaciones
- Revisa los logs del servidor en `/api/webhook/mercadopago`