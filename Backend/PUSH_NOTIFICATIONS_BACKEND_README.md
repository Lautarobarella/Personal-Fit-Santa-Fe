# Backend Push Notifications - Documentación de Implementación

## Resumen de la Implementación

Se ha implementado un sistema completo de notificaciones push para el backend de Personal Fit usando Firebase Cloud Messaging (FCM). La solución incluye:

## 📁 Estructura de Archivos Creados/Modificados

### Modelos de Datos
- `models/UserDeviceToken.java` - Almacena tokens de dispositivos para notificaciones push
- `models/NotificationPreferences.java` - Preferencias de notificación por usuario

### Repositorios
- `repository/UserDeviceTokenRepository.java` - Operaciones CRUD para tokens de dispositivos
- `repository/NotificationPreferencesRepository.java` - Operaciones CRUD para preferencias

### Servicios
- `services/PushNotificationService.java` - Servicio principal para envío de notificaciones
- `services/NotificationTriggerService.java` - Triggers automáticos para eventos del sistema
- `services/NotificationSchedulerService.java` - Tareas programadas para notificaciones

### Configuración
- `config/FirebaseConfig.java` - Configuración de Firebase Admin SDK

### DTOs
- `dto/Notification/RegisterDeviceTokenRequest.java` - Request para registrar tokens
- `dto/Notification/SendNotificationRequest.java` - Request para enviar notificaciones
- `dto/Notification/NotificationPreferencesDTO.java` - DTO para preferencias
- `dto/Notification/BulkNotificationRequest.java` - Request para notificaciones masivas

### Controladores
- `controllers/NotificationController.java` - Endpoints PWA agregados

### Configuración
- `pom.xml` - Dependencia Firebase Admin SDK agregada
- `application.properties` - Variables de entorno para Firebase

## 🔧 Configuración Requerida

### Variables de Entorno

Agregar las siguientes variables al archivo `.env` o configuración del servidor:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/firebase-service-account-key.json
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_ENABLED=true
```

### Archivo de Credenciales Firebase

1. Ir a Firebase Console → Project Settings → Service Accounts
2. Generar una nueva clave privada (JSON)
3. Guardar el archivo en la ruta especificada en `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`
4. Asegurar que la aplicación tenga permisos de lectura al archivo

### Ejemplo de estructura del archivo JSON:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40your-project-id.iam.gserviceaccount.com"
}
```

## 📡 Endpoints Disponibles

### Gestión de Tokens
- `POST /api/notifications/pwa/register-device` - Registrar token de dispositivo
- `DELETE /api/notifications/pwa/unregister-device/{token}` - Eliminar token

### Preferencias de Usuario
- `GET /api/notifications/pwa/preferences` - Obtener preferencias
- `PUT /api/notifications/pwa/preferences` - Actualizar preferencias

### Envío de Notificaciones (Solo ADMIN)
- `POST /api/notifications/pwa/send` - Enviar notificación individual
- `POST /api/notifications/pwa/send-bulk` - Enviar notificaciones masivas

## 📊 Base de Datos

### Tablas Nuevas

#### `user_device_tokens`
```sql
CREATE TABLE user_device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    token VARCHAR(1024) UNIQUE NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- PWA, WEB, ANDROID, IOS
    device_info VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    last_used TIMESTAMP
);
```

#### `notification_preferences`
```sql
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES app_user(id),
    class_reminders BOOLEAN DEFAULT true,
    payment_due BOOLEAN DEFAULT true,
    new_classes BOOLEAN DEFAULT true,
    promotions BOOLEAN DEFAULT false,
    class_cancellations BOOLEAN DEFAULT true,
    general_announcements BOOLEAN DEFAULT true
);
```

## 🚀 Uso de los Servicios

### Registrar Token de Dispositivo
```java
@Autowired
private PushNotificationService pushService;

// Registrar token
boolean success = pushService.registerDeviceToken(userId, token, deviceInfo);
```

### Enviar Notificación Individual
```java
SendNotificationRequest request = SendNotificationRequest.builder()
    .userId(userId)
    .title("Título de la notificación")
    .body("Contenido del mensaje")
    .type("payment_due")
    .saveToDatabase(true)
    .build();

boolean sent = pushService.sendNotificationToUser(request);
```

### Enviar Notificaciones Masivas
```java
BulkNotificationRequest request = BulkNotificationRequest.builder()
    .userIds(Arrays.asList(1L, 2L, 3L))
    .title("Promoción especial")
    .body("¡50% de descuento en membresías!")
    .type("promotion")
    .saveToDatabase(true)
    .build();

boolean sent = pushService.sendBulkNotifications(request);
```

## 🎯 Triggers Automáticos

El `NotificationTriggerService` proporciona métodos para enviar notificaciones basadas en eventos:

### Eventos de Pago
```java
@Autowired
private NotificationTriggerService triggerService;

// Recordatorio de pago
triggerService.sendPaymentDueReminder(user, amount, dueDate);

// Confirmación de pago
triggerService.sendPaymentConfirmation(user, amount, paymentMethod);
```

### Eventos de Clases
```java
// Recordatorio de clase
triggerService.sendClassReminder(user, className, classTime, location);

// Clase cancelada
triggerService.sendClassCancellation(user, className, originalTime, reason);

// Nueva clase disponible
triggerService.sendNewClassAvailable(users, className, classTime, instructor, spots);
```

### Otros Eventos
```java
// Bienvenida a nuevo usuario
triggerService.sendWelcomeNotification(user);

// Meta alcanzada
triggerService.sendGoalAchievement(user, goalType, achievement);

// Recordatorio de asistencia
triggerService.sendAttendanceReminder(user, className, classTime);
```

## ⏰ Tareas Programadas

El `NotificationSchedulerService` ejecuta automáticamente:

- **Cada hora**: Recordatorios de clases próximas (1 hora antes)
- **Diario 9:00 AM**: Recordatorios de pagos próximos a vencer
- **Diario 8:00 PM**: Recordatorios de asistencia
- **Lunes 10:00 AM**: Notificaciones de nuevas clases semanales
- **1er día del mes 10:00 AM**: Promociones mensuales
- **Domingos 2:00 AM**: Limpieza de tokens inactivos

## 🔒 Seguridad

- Todos los endpoints requieren autenticación JWT
- Los endpoints de envío están restringidos a rol ADMIN
- Los usuarios solo pueden gestionar sus propios tokens y preferencias
- Validación de permisos en cada operación

## 🧪 Testing

### Ejemplo de Request para Registrar Token
```bash
curl -X POST http://localhost:8080/api/notifications/pwa/register-device \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "fcm-token-here",
    "deviceInfo": "Chrome 96.0 on Windows 10"
  }'
```

### Ejemplo de Request para Enviar Notificación
```bash
curl -X POST http://localhost:8080/api/notifications/pwa/send \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Test Notification",
    "body": "This is a test notification",
    "type": "general",
    "saveToDatabase": true
  }'
```

## 📋 Próximos Pasos

1. **Configurar Firebase**: Obtener credenciales y configurar variables de entorno
2. **Testing**: Probar endpoints con tokens reales
3. **Integración**: Conectar triggers con eventos existentes del sistema
4. **Monitoreo**: Implementar métricas y logging avanzado
5. **Optimización**: Revisar performance y ajustar batching si es necesario

## 🔧 Troubleshooting

### Error: Firebase not configured
- Verificar que `FIREBASE_ENABLED=true`
- Confirmar que el archivo de credenciales existe y es accesible
- Revisar que `FIREBASE_PROJECT_ID` sea correcto

### Error: Invalid token
- Los tokens FCM expiran, implementar renovación automática
- Verificar que el token corresponda al proyecto correcto

### Error: Permission denied
- Confirmar que el service account tenga permisos FCM
- Verificar que el proyecto tenga habilitado FCM API

### Notificaciones no llegan
- Verificar que el usuario tenga preferencias habilitadas
- Confirmar que el token esté activo en la base de datos
- Revisar logs del servicio Firebase

## 🏗️ Arquitectura

```
Frontend (PWA) 
    ↓ (Registration)
NotificationController 
    ↓
PushNotificationService 
    ↓
Firebase Admin SDK 
    ↓
Firebase Cloud Messaging 
    ↓
User Device (Push Notification)
```

La implementación está diseñada para ser:
- **Escalable**: Manejo de notificaciones masivas con batching
- **Confiable**: Manejo de errores y tokens inválidos
- **Flexible**: Soporte para múltiples tipos de notificaciones
- **Mantenible**: Código bien estructurado y documentado