# Solución de Problemas de Mercado Pago

## Problemas Comunes y Soluciones

### 1. Error: "Una de las partes es de prueba"

**Descripción**: Mercado Pago muestra el error "Una de las partes con la que intentás hacer el pago es de prueba" aunque ambas cuentas sean de prueba.

**Causa**: Este error puede ocurrir por varias razones:
- Configuración incorrecta de datos de prueba
- Conflictos entre cuentas de sandbox
- Configuración de métodos de pago restringida

**Solución**:
1. **Usar datos de prueba diferentes**:
   ```env
   NEXT_PUBLIC_MP_TEST_EMAIL=test-buyer@example.com
   NEXT_PUBLIC_MP_TEST_PHONE=12345678
   NEXT_PUBLIC_MP_TEST_DNI=12345678
   ```

2. **Verificar configuración de preferencia**:
   ```javascript
   const preferenceBody = {
       // ... otros campos
       payment_methods: {
           excluded_payment_types: [],
           excluded_payment_methods: [],
           installments: 12,
           default_installments: 1
       },
       auto_return: "approved",
       binary_mode: false
   };
   ```

3. **Usar tokens de sandbox válidos**:
   - Verificar que el token empiece con `TEST-`
   - Asegurarse de que el token esté activo

### 2. Solo aparecen efectivo y prepaga

**Descripción**: En el checkout de Mercado Pago solo aparecen métodos de pago limitados (efectivo y prepaga) en lugar de todos los métodos disponibles.

**Causa**: 
- Configuración restrictiva de métodos de pago
- Configuración de cuenta de sandbox
- Montos muy bajos o muy altos

**Solución**:

1. **Habilitar todos los métodos de pago**:
   ```javascript
   payment_methods: {
       excluded_payment_types: [],        // No excluir ningún tipo
       excluded_payment_methods: [],      // No excluir ningún método
       installments: 12,                  // Permitir hasta 12 cuotas
       default_installments: 1
   }
   ```

2. **Verificar configuración de cuenta**:
   - Asegurarse de que la cuenta de sandbox tenga todos los métodos habilitados
   - Verificar que no haya restricciones en la configuración de la cuenta

3. **Usar montos apropiados**:
   - Montos muy bajos (< $10) pueden limitar métodos de pago
   - Montos muy altos (> $100,000) también pueden causar restricciones
   - Usar montos entre $50 y $10,000 para pruebas

4. **Configurar variables de entorno**:
   ```env
   NEXT_PUBLIC_MP_ENABLE_ALL_METHODS=true
   NEXT_PUBLIC_MP_ENABLE_CARDS=true
   NEXT_PUBLIC_MP_ENABLE_TRANSFERS=true
   NEXT_PUBLIC_MP_ENABLE_WALLET=true
   ```

### 3. Errores de Contenido Mixto (HTTP vs HTTPS)

**Descripción**: El navegador bloquea las llamadas porque se mezclan HTTP y HTTPS.

**Solución**:
1. **Usar HTTPS en todas las URLs**:
   ```env
   NEXT_PUBLIC_BASE_URL=https://72.60.1.76:3000
   ```

2. **Configurar headers de seguridad**:
   ```javascript
   async headers() {
       return [
           {
               source: '/(.*)',
               headers: [
                   { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                   { key: 'X-Frame-Options', value: 'DENY' },
                   { key: 'X-Content-Type-Options', value: 'nosniff' }
               ]
           }
       ];
   }
   ```

### 4. Webhooks no funcionan

**Descripción**: Los webhooks de Mercado Pago no llegan a la aplicación.

**Solución**:
1. **Verificar URL del webhook**:
   ```javascript
   notification_url: `${baseUrl}/api/webhook/mercadopago`
   ```

2. **Configurar CORS para webhooks**:
   ```javascript
   {
       source: '/api/webhook/mercadopago',
       headers: [
           { key: 'Access-Control-Allow-Origin', value: '*' },
           { key: 'Access-Control-Allow-Methods', value: 'POST, GET, OPTIONS' },
           { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
       ]
   }
   ```

3. **Verificar que el endpoint responda correctamente**:
   - El endpoint debe responder con 200 OK
   - Debe procesar el payload correctamente

## Herramientas de Diagnóstico

### 1. Página de Diagnósticos

Accede a `/admin/diagnostics` para:
- Probar la configuración de Mercado Pago
- Verificar endpoints
- Crear preferencias de prueba

### 2. Endpoint de Prueba

Usa `/api/test-mercadopago-config` para:
- Verificar tokens
- Crear preferencias de prueba
- Verificar configuración de métodos de pago

### 3. Logs de Consola

Revisa los logs en la consola del navegador para:
- Verificar configuración
- Detectar errores
- Monitorear preferencias creadas

## Configuración Recomendada

### Variables de Entorno
```env
# Tokens de Mercado Pago
MP_ACCESS_TOKEN=TEST-3942377988418193-080311-8084950108cc03a2a313a97295909394-288248460
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-191ffd30-141f-46be-97ed-b4a82a1804a9
NEXT_PUBLIC_MP_ENVIRONMENT=sandbox

# URLs HTTPS
NEXT_PUBLIC_BASE_URL=https://72.60.1.76:3000

# Datos de prueba
NEXT_PUBLIC_MP_TEST_EMAIL=test-buyer@example.com
NEXT_PUBLIC_MP_TEST_PHONE=12345678
NEXT_PUBLIC_MP_TEST_DNI=12345678

# Habilitar todos los métodos
NEXT_PUBLIC_MP_ENABLE_ALL_METHODS=true
NEXT_PUBLIC_MP_ENABLE_CARDS=true
NEXT_PUBLIC_MP_ENABLE_TRANSFERS=true
NEXT_PUBLIC_MP_ENABLE_WALLET=true
```

### Configuración de Preferencia
```javascript
const preferenceBody = {
    items: [{
        id: productId,
        title: productName,
        description: productDescription,
        quantity: 1,
        currency_id: "ARS",
        unit_price: productPrice,
    }],
    payer: {
        name: "Comprador",
        surname: "Prueba",
        email: testEmail,
        phone: { area_code: "11", number: testPhone },
        identification: { type: "DNI", number: testDni },
        address: {
            zip_code: "1234",
            street_name: "Calle de Prueba",
            street_number: "123"
        }
    },
    back_urls: {
        success: `${baseUrl}/success`,
        failure: `${baseUrl}/failure`,
        pending: `${baseUrl}/pending`,
    },
    notification_url: `${baseUrl}/api/webhook/mercadopago`,
    external_reference: transactionId,
    payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12,
        default_installments: 1
    },
    auto_return: "approved",
    binary_mode: false,
    expires: true,
    expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    statement_descriptor: "Personal Fit",
};
```

## Pasos de Verificación

1. **Verificar configuración**:
   ```bash
   # Ir a la página de diagnósticos
   http://localhost:3000/admin/diagnostics
   
   # Hacer clic en "Probar MercadoPago"
   ```

2. **Verificar logs**:
   - Abrir herramientas de desarrollador
   - Ir a la pestaña Console
   - Buscar mensajes de Mercado Pago

3. **Probar flujo completo**:
   - Crear un pago
   - Ir al checkout
   - Verificar que aparezcan todos los métodos
   - Completar el pago
   - Verificar webhook

## Contacto y Soporte

Si los problemas persisten:
1. Verificar la documentación oficial de Mercado Pago
2. Revisar los logs de la aplicación
3. Probar con diferentes montos y métodos de pago
4. Contactar soporte de Mercado Pago si es necesario 