# Limpieza de Mercado Pago - Cambios Realizados

## Problema Original
- Solo aparecían "Saldo de cuenta" y "Prepaga" como métodos de pago
- Se usaban datos de prueba simulados en lugar del usuario real
- Configuración excesiva que podía estar interfiriendo con Mercado Pago

## Soluciones Implementadas

### 1. ✅ Limpieza de createSingleProductPreference

**Antes**: Función compleja con múltiples configuraciones, datos de prueba, payer info, payment_methods, etc.

**Después**: Función minimalista que solo envía lo esencial:
```javascript
const preferenceBody = {
    items: [{ 
        id, title, description, quantity: 1, 
        currency_id: "ARS", unit_price 
    }],
    back_urls: { success, failure, pending },
    notification_url: webhook_url,
    external_reference: transactionId,
    auto_return: "approved",
};
```

### 2. ✅ Uso del Usuario Real

**Antes**: 
```javascript
const testEmail = process.env.NEXT_PUBLIC_MP_TEST_EMAIL || 'test-buyer@example.com';
const testDni = process.env.NEXT_PUBLIC_MP_TEST_DNI || '12345678';
```

**Después**: 
```javascript
userEmail: user.email,
userDni: user.dni,
```

### 3. ✅ Eliminación de Variables de Entorno Innecesarias

**Eliminadas del docker-compose.yml**:
```env
NEXT_PUBLIC_MP_ENVIRONMENT: sandbox
NEXT_PUBLIC_MP_TEST_EMAIL: test-buyer@example.com
NEXT_PUBLIC_MP_TEST_PHONE: 12345678
NEXT_PUBLIC_MP_TEST_DNI: 12345678
NEXT_PUBLIC_MP_ENABLE_ALL_METHODS: "true"
NEXT_PUBLIC_MP_ENABLE_CARDS: "true"
NEXT_PUBLIC_MP_ENABLE_TRANSFERS: "true"
NEXT_PUBLIC_MP_ENABLE_WALLET: "true"
```

**Mantenidas**:
```env
MP_ACCESS_TOKEN: APP_USR-2972827090925629-073109-6c99a5ad5e4f3a421988189f8ed623d4-2594861436
NEXT_PUBLIC_MP_PUBLIC_KEY: APP_USR-72dd6bde-61e1-4c0e-96b7-a26d07e510bb
```

### 4. ✅ Eliminación de Configuraciones Problemáticas

**Removido completamente**:
- `payment_methods`: Toda la configuración de métodos de pago
- `payer`: Información del pagador (nombre, teléfono, dirección)
- `binary_mode`: false
- `expires`: true
- `expiration_date_to`: timestamp
- `statement_descriptor`: "Personal Fit"
- Todos los logs excesivos de configuración

### 5. ✅ Simplificación del External Reference

**Antes**: Lógica compleja para extraer DNI de variables de entorno
**Después**: Usa directamente el DNI del usuario logueado en el formato: `${userDni}-${productId}-${timestamp}-${random}`

### 6. ✅ Eliminación Completa de Datos de Prueba

**Antes**: La función `testMercadoPagoConfiguration` creaba preferencias con datos falsos:
```javascript
userEmail: "test@example.com",
userDni: "12345678",
productName: "Producto de Prueba"
```

**Después**: Solo verifica tokens, sin crear preferencias de prueba:
```javascript
// Solo verificación de configuración, sin datos simulados
return {
    success: true,
    message: "Configuración verificada",
    config: { accessToken, environment, publicKey }
};
```

### 7. ✅ Actualización del Flujo de Datos

1. **CheckoutForm.tsx**: Ya envía `user.dni` y `user.email`
2. **checkout/route.ts**: Recibe `userDni` y `userEmail`, los pasa a createSingleProductPreference
3. **mercadopago.ts**: Usa los datos reales del usuario en lugar de datos de prueba
4. **webhook processing**: Extrae el DNI real del external_reference

## Archivos Modificados

1. **Frontend/lib/mercadopago.ts**
   - Simplificada createSingleProductPreference
   - Eliminados datos de prueba
   - Actualizado tipo CreatePrefOptions para incluir userDni

2. **Frontend/app/api/checkout/route.ts**
   - Agregado userDni al llamado de createSingleProductPreference

3. **docker-compose.yml**
   - Eliminadas variables de entorno innecesarias
   - Mantenidos solo los tokens esenciales

## Resultado Esperado

Con estos cambios:
- ✅ Se usa el usuario real (no datos de prueba)
- ✅ No hay configuraciones que puedan interferir con los métodos de pago
- ✅ Mercado Pago decidirá qué métodos mostrar basado en su lógica interna
- ✅ El código es más limpio y mantenible
- ✅ Los pagos se mapearán correctamente al usuario real

## Cómo Probar

1. **Reconstruir contenedores**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Probar el flujo**:
   - Iniciar sesión con un usuario real
   - Crear un pago
   - Verificar que aparezcan todos los métodos de pago
   - Completar el pago
   - Verificar que aparezca en `/payments` con el usuario correcto

## Troubleshooting

Si los métodos de pago siguen sin aparecer:

1. **Verificar en consola**: Los logs ahora son más limpios y fáciles de seguir
2. **Verificar el token**: Asegurar que sea válido y tenga permisos completos
3. **Verificar el monto**: Probar con diferentes montos ($100, $500, $1000)
4. **Verificar la cuenta**: La cuenta de Mercado Pago debe tener todos los métodos habilitados

El enfoque ahora es: "Menos configuración = Menos problemas"