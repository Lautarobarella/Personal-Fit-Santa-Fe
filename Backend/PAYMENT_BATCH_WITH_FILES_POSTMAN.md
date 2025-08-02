# Configuración de Postman para Batch de Pagos con Archivos

## Endpoint
```
POST http://152.170.128.205:8080/api/payment/batch-with-files
```

## Configuración en Postman

### 1. Configurar el método y URL
- **Método**: POST
- **URL**: `http://152.170.128.205:8080/api/payment/batch-with-files`

### 2. Configurar Headers
- **Content-Type**: `multipart/form-data` (se configura automáticamente al seleccionar form-data)

### 3. Configurar Body
Seleccionar **form-data** y agregar:

#### Campo 1: payments (JSON)
- **Key**: `payments`
- **Type**: Text
- **Value**: 
```json
[
  {
    "clientId": 4,
    "clientDni": 33412567,
    "confNumber": 932781241,
    "amount": 50000,
    "createdAt": "2025-07-29T10:00:00",
    "expiresAt": "2025-08-03T10:00:00",
    "methodType": "transfer",
    "paymentStatus": "pending"
  },
  {
    "clientId": 5,
    "clientDni": 29874125,
    "confNumber": 118293374,
    "amount": 50000,
    "createdAt": "2025-07-29T10:00:00",
    "expiresAt": "2025-08-03T10:00:00",
    "methodType": "transfer",
    "paymentStatus": "pending"
  }
]
```

#### Campo 2: files (Archivos múltiples)
- **Key**: `files`
- **Type**: File
- **Value**: Seleccionar múltiples archivos de imagen (JPG, PNG, etc.)

### 4. Estructura de Archivos
Para cada pago en el array JSON, debe haber un archivo correspondiente:
- El primer archivo seleccionado corresponde al primer pago
- El segundo archivo seleccionado corresponde al segundo pago
- Y así sucesivamente...

### 5. Ejemplo Completo
Si tienes 3 pagos en el JSON, necesitas 3 archivos:
- `payments` (JSON con 3 objetos)
- `files` (seleccionar 3 archivos de imagen)

### Notas Importantes
- Los archivos deben ser imágenes (JPG, PNG, etc.)
- El tamaño máximo por archivo es 5MB
- El número de archivos debe coincidir con el número de pagos en el JSON
- Los archivos se procesarán en el orden que aparecen en el JSON 