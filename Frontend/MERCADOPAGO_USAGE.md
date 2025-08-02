# Guía de Uso - Integración MercadoPago

## 🎉 ¡Implementación Completada!

La integración de MercadoPago está lista y funcionando. Aquí tienes todo lo que necesitas saber:

## 🔧 Configuración Inicial

### 1. Instalar dependencias (YA HECHO)
```bash
cd Frontend
npm install mercadopago
```

### 2. Configurar variables de entorno

Crea el archivo `Frontend/.env.local`:

```bash
# Variables de entorno para MercadoPago
MP_ACCESS_TOKEN=APP_USR-tu-token-aqui
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MP_ENVIRONMENT=sandbox
```

**📝 Nota:** Consulta `Frontend/MERCADOPAGO_SETUP.md` para obtener las credenciales.

## 🚀 Cómo usar la nueva funcionalidad

### Flujo del usuario:

1. **Ir a Pagos:** El usuario va a `/payments`
2. **Crear Nuevo Pago:** Hace clic en "Nuevo"
3. **Seleccionar Método:** Se abre `/payments/method-select` con dos opciones:
   - **Pago Manual:** El método existente (subir comprobante)
   - **Pago Online:** Nueva opción con MercadoPago
4. **Pago con MercadoPago:** Si elige online, va a `/payments/new-mp`
5. **Checkout:** Completa el checkout automático con datos del usuario
6. **Redirección:** Va a MercadoPago Sandbox
7. **Resultado:** Vuelve a success/failure/pending según el resultado

### Rutas nuevas creadas:

- **`/payments/method-select`** - Selección de método de pago
- **`/payments/new-mp`** - Checkout con MercadoPago
- **`/success`** - Pago exitoso
- **`/failure`** - Pago fallido  
- **`/pending`** - Pago pendiente
- **`/api/checkout`** - API para crear preferencias
- **`/api/webhook/mercadopago`** - Webhook para notificaciones

## 💳 Datos de Prueba

### Tarjetas de prueba (en MercadoPago):
- **Aprobada:** 4507 9900 0000 0087
- **Rechazada:** 4000 0000 0000 0002
- **CVV:** 123
- **Vencimiento:** 11/25
- **Nombre:** APRO (aprobar) / CONT (rechazar)

## 🔍 Características implementadas

### ✅ Lo que está listo:
- [x] Integración completa con MercadoPago
- [x] Checkout simplificado (toma datos del usuario logueado)
- [x] Pantalla de selección de método de pago
- [x] Redirección automática a MercadoPago Sandbox
- [x] Páginas de resultado (success/failure/pending)
- [x] Webhook para recibir notificaciones
- [x] Todo en Next.js (sin tocar el backend Java)
- [x] Ambiente de pruebas configurado
- [x] Interfaz móvil responsive

### 💰 Producto configurado:
- **Nombre:** "Cuota mensual gimnasio"
- **Precio:** $1 (precio de prueba)
- **ID:** "123"

## 🌐 Configuración para Producción

### Para usar en una máquina en la nube:

1. **Actualizar URL base:**
```bash
NEXT_PUBLIC_BASE_URL=http://tu-ip-publica:3000
```

2. **Exponer puerto para webhook:**
   - Asegúrate de que el puerto 3000 esté abierto
   - El webhook estará en: `http://tu-ip-publica:3000/api/webhook/mercadopago`

3. **Credenciales de producción:**
   - Cambia a credenciales de producción en MercadoPago
   - Actualiza `MP_ACCESS_TOKEN`
   - Cambia `NEXT_PUBLIC_MP_ENVIRONMENT=production`

## 🛠️ Componentes modificados/creados

### Archivos nuevos:
- `app/api/checkout/route.ts`
- `app/api/webhook/mercadopago/route.ts`
- `app/success/page.tsx`
- `app/failure/page.tsx`
- `app/pending/page.tsx`
- `app/payments/method-select/page.tsx`
- `app/payments/new-mp/page.tsx`

### Archivos modificados:
- `components/payments/CheckoutForm.tsx` - Simplificado y mejorado
- `components/payments/payments-content.tsx` - Botones actualizados
- `app/dashboard/page.tsx` - Enlace actualizado
- `lib/mercadopago.ts` - URLs corregidas

## 🧪 Testing

### Para probar todo funciona:

1. **Ejecutar el servidor:**
```bash
cd Frontend
npm run dev
```

2. **Probar el flujo:**
   - Ve a `http://localhost:3000/payments`
   - Haz clic en "Nuevo"
   - Selecciona "Pago Online"
   - Verifica que se carguen los datos del usuario
   - Haz clic en "Pagar con MercadoPago"
   - Deberías ser redirigido al sandbox de MercadoPago

3. **Verificar webhook:**
   - Ve a `http://localhost:3000/api/webhook/mercadopago`
   - Deberías ver un mensaje de que está funcionando

## 🐛 Solución de problemas

### Error: "Cannot find module 'mercadopago'"
```bash
cd Frontend && npm install
```

### Error: "MP_ACCESS_TOKEN is not defined"
- Verifica que el archivo `.env.local` esté en `Frontend/`
- Reinicia el servidor (`npm run dev`)

### No redirije a MercadoPago
- Verifica las credenciales en `.env.local`
- Revisa la consola del navegador para errores

### Webhook no funciona
- Verifica que la URL sea accesible públicamente
- Para desarrollo local, considera usar Ngrok

## 📞 ¿Necesitas ayuda?

- Revisa `Frontend/MERCADOPAGO_SETUP.md` para configuración detallada
- Verifica los logs del servidor en la terminal
- Consulta la documentación oficial de MercadoPago

## 🎯 Próximos pasos (opcionales)

1. **Personalizar el precio** en `lib/products.ts`
2. **Agregar más productos** si es necesario
3. **Personalizar las páginas de resultado**
4. **Integrar con el sistema de pagos existente**
5. **Configurar notificaciones por email**

¡La integración está completa y lista para usar! 🚀