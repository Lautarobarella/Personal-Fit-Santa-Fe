# 🔔 PWA Push Notifications - Personal Fit

## Implementación Completa de Notificaciones Push

Esta implementación proporciona un sistema profesional y completo de notificaciones push para la PWA de Personal Fit, incluyendo:

- ✅ Soporte completo para PWA
- ✅ Firebase Cloud Messaging (FCM)
- ✅ Notificaciones en foreground y background
- ✅ Acciones interactivas en notificaciones
- ✅ Gestión de preferencias de usuario
- ✅ Manejo automático de tokens inválidos
- ✅ Integración con el backend Spring Boot

## 🚀 Configuración Inicial

### 1. Firebase Setup

1. **Crear proyecto en Firebase Console:**
   ```
   https://console.firebase.google.com/
   ```

2. **Habilitar Cloud Messaging:**
   - Ve a Project Settings → Cloud Messaging
   - Genera las Web credentials (VAPID key)

3. **Configurar variables de entorno:**
   ```bash
   # Reemplaza en .env.local
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu_vapid_key
   ```

4. **Actualizar Service Worker:**
   Edita `/public/firebase-messaging-sw.js` con tu configuración real de Firebase.

### 2. Backend Integration

El frontend ya incluye las APIs necesarias para comunicarse con el backend:

- `POST /api/notifications/register-device` - Registrar token de dispositivo
- `DELETE /api/notifications/unregister-device/{token}` - Eliminar token
- `GET /api/notifications/preferences/{userId}` - Obtener preferencias
- `PUT /api/notifications/preferences/{userId}` - Actualizar preferencias
- `POST /api/notifications/send-test` - Enviar notificación de prueba

## 📱 Uso en la Aplicación

### Configurar Notificaciones

```tsx
import { NotificationSetup } from '@/components/notifications/notification-setup';

// En cualquier página
<NotificationSetup />
```

### Usar el Hook de Notificaciones

```tsx
import { usePWANotificationContext } from '@/components/providers/pwa-notification-provider';

function MyComponent() {
  const { 
    isActive, 
    requestPermission, 
    preferences,
    updatePreferences 
  } = usePWANotificationContext();

  // Tu lógica aquí
}
```

### Verificar Estado de Notificaciones

```tsx
import { useNotificationStatus } from '@/components/providers/pwa-notification-provider';

function StatusComponent() {
  const { 
    canReceiveNotifications, 
    needsPermission, 
    isBlocked 
  } = useNotificationStatus();

  if (canReceiveNotifications) {
    return <span>✅ Notificaciones activas</span>;
  }
}
```

## 🎯 Tipos de Notificaciones Soportadas

### 1. Recordatorios de Clases (`class_reminder`)
```json
{
  "notification": {
    "title": "🏋️ Recordatorio de Clase",
    "body": "Tu clase de Funcional comienza en 30 minutos",
    "image": "https://personalfit.com/images/gym.jpg"
  },
  "data": {
    "type": "class_reminder",
    "activityId": "123",
    "startTime": "2025-09-20T18:00:00"
  }
}
```

**Acciones disponibles:**
- ✅ Confirmar asistencia
- 👀 Ver detalles de la clase

### 2. Pagos Vencidos (`payment_due`)
```json
{
  "notification": {
    "title": "💳 Pago Pendiente",
    "body": "Tienes un pago pendiente de $15,000"
  },
  "data": {
    "type": "payment_due",
    "paymentId": "456",
    "amount": "15000"
  }
}
```

**Acciones disponibles:**
- 💳 Pagar ahora
- ⏰ Recordar después

### 3. Nuevas Clases (`new_class`)
```json
{
  "notification": {
    "title": "🆕 Nueva Clase Disponible",
    "body": "Nueva clase de Crossfit disponible para mañana"
  },
  "data": {
    "type": "new_class",
    "activityId": "789"
  }
}
```

**Acciones disponibles:**
- 📝 Inscribirme
- 👀 Ver detalle

### 4. Clases Canceladas (`class_cancelled`)
```json
{
  "notification": {
    "title": "❌ Clase Cancelada",
    "body": "Tu clase de Funcional ha sido cancelada"
  },
  "data": {
    "type": "class_cancelled",
    "activityId": "123"
  }
}
```

**Acciones disponibles:**
- 🔄 Ver alternativas
- 📞 Contactar

## 🛠️ Arquitectura Técnica

### Flujo de Datos

```
1. Usuario acepta notificaciones
2. Frontend obtiene token de FCM
3. Token se registra en el backend
4. Backend envía notificación vía FCM
5. FCM entrega a dispositivo
6. Service Worker intercepta mensaje
7. Sistema muestra notificación
8. Usuario interactúa → PWA se abre/navega
```

### Componentes Principales

```
├── lib/
│   ├── firebase-config.ts          # Configuración Firebase
│   └── firebase-messaging.ts       # Funciones de messaging
├── hooks/notifications/
│   └── use-pwa-notifications.ts     # Hook principal
├── components/
│   ├── notifications/
│   │   ├── notification-setup.tsx   # Componente de configuración
│   │   └── notification-settings-page.tsx
│   └── providers/
│       └── pwa-notification-provider.tsx
├── api/notifications/
│   └── notificationsApi.ts         # API extendida
└── public/
    └── firebase-messaging-sw.js    # Service Worker
```

## 🔄 Manejo de Estados

### Estados del Permission
- `default` - No se ha pedido permiso
- `granted` - Permisos concedidos
- `denied` - Permisos denegados

### Estados de la Aplicación
- `isSupported` - Browser soporta notificaciones
- `isGranted` - Permisos concedidos
- `isActive` - Token válido y registrado
- `canReceiveNotifications` - Listo para recibir notificaciones

## 🧪 Testing

### Enviar Notificación de Prueba

```tsx
import { sendTestNotification } from '@/api/notifications/notificationsApi';

await sendTestNotification({
  userId: 123,
  title: "🧪 Notificación de Prueba",
  body: "Esta es una notificación de prueba",
  type: "general",
  data: { test: "true" }
});
```

### Simular Diferentes Escenarios

```javascript
// En DevTools Console
// Simular notificación de clase
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification("🏋️ Recordatorio de Clase", {
    body: "Tu clase comienza en 30 minutos",
    data: { type: "class_reminder", activityId: "123" },
    actions: [
      { action: "confirm", title: "✅ Confirmar" },
      { action: "view", title: "👀 Ver Clase" }
    ]
  });
});
```

## 🚨 Troubleshooting

### Notificaciones no aparecen
1. Verificar que el usuario haya dado permisos
2. Comprobar que FCM esté configurado correctamente
3. Verificar que el service worker esté registrado
4. Revisar la consola del navegador para errores

### Token inválido
- El sistema limpia automáticamente tokens inválidos
- Los usuarios deben volver a activar las notificaciones

### Service Worker no se registra
- Verificar que `/firebase-messaging-sw.js` esté en `/public/`
- Comprobar la configuración de Firebase en el SW
- Revisar errores en DevTools → Application → Service Workers

## 📝 Próximos Pasos

1. **Configurar Firebase** con credenciales reales
2. **Implementar backend** con los endpoints necesarios
3. **Testear notificaciones** en diferentes dispositivos
4. **Configurar analytics** para tracking de notificaciones
5. **Implementar segmentación** de usuarios para notificaciones targeted

## 🔐 Seguridad y Privacidad

- ✅ Tokens encriptados y protegidos
- ✅ Limpieza automática de tokens inválidos
- ✅ No se comparten datos con terceros
- ✅ Usuario puede desactivar en cualquier momento
- ✅ Preferencias granulares por tipo de notificación

---

**✨ ¡La implementación está lista para usar! Solo necesitas configurar Firebase y el backend para tener notificaciones push completamente funcionales.**