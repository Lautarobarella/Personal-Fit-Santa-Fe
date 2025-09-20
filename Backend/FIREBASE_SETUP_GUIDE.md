# 🔥 Configuración de Firebase para Notificaciones Push

## 📋 Pasos de Configuración

### 1. Crear/Configurar Proyecto en Firebase

1. **Ve a [Firebase Console](https://console.firebase.google.com/)**
2. **Selecciona tu proyecto existente** o crea uno nuevo:
   - Nombre del proyecto: `personal-fit-santa-fe` (o similar)
   - Habilita Google Analytics (opcional)

### 2. Configurar Firebase Cloud Messaging (FCM)

1. **En Firebase Console**, ve a **Project Settings** (⚙️)
2. **Pestaña "Cloud Messaging"**:
   - Copia el **Server Key** y **Sender ID** (para el frontend)
3. **Pestaña "Service accounts"**:
   - Selecciona **"Firebase Admin SDK"**
   - Lenguaje: **Java**
   - Click **"Generate new private key"**
   - **Descarga el archivo JSON**

### 3. Colocar Archivo de Credenciales

Guarda el archivo JSON descargado en:
```
Backend/config/firebase/firebase-service-account-key.json
```

**⚠️ IMPORTANTE**: 
- **NO** subas este archivo a Git
- Agrégalo a `.gitignore`
- Es información sensible

### 4. Configurar Variables de Entorno

#### Para GitHub Secrets (Producción)

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions y agrega:

```
FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT={"type":"service_account","project_id":"tu-project-id",...}
FIREBASE_PROJECT_ID=tu-project-id-aqui
FIREBASE_ENABLED=true
```

#### Para Desarrollo Local (.env)
```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT={"type":"service_account","project_id":"tu-project-id-aqui","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQ...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xyz@tu-project-id.iam.gserviceaccount.com","client_id":"123456789...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/...","universe_domain":"googleapis.com"}
FIREBASE_PROJECT_ID=tu-project-id-aqui
FIREBASE_ENABLED=true
```

### 5. Ejemplo de Archivo JSON (firebase-service-account-key.json)

```json
{
  "type": "service_account",
  "project_id": "personal-fit-santa-fe-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@personal-fit-santa-fe-12345.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

### 6. Configuración del Frontend

El frontend también necesita configuración de Firebase. En tu archivo de configuración del frontend:

```javascript
// Frontend/lib/firebase-config.ts
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "personal-fit-santa-fe-12345.firebaseapp.com",
  projectId: "personal-fit-santa-fe-12345",
  storageBucket: "personal-fit-santa-fe-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

### 7. Configuración de Docker

#### Agregar al docker-compose.yml
```yaml
services:
  personalfit-backend:
    environment:
      # Firebase Configuration
      FIREBASE_SERVICE_ACCOUNT_KEY_PATH: ${FIREBASE_SERVICE_ACCOUNT_KEY_PATH}
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_ENABLED: ${FIREBASE_ENABLED}
    volumes:
      # Mapear archivo de credenciales
      - ./Backend/config/firebase:/app/config/firebase:ro
```

#### Dockerfile Backend (agregar si es necesario)
```dockerfile
# Copiar configuración de Firebase
COPY config/firebase/firebase-service-account-key.json /app/config/firebase/
```

### 8. Verificar Configuración

#### Backend
```bash
# Verificar que el archivo existe
ls Backend/config/firebase/firebase-service-account-key.json

# Verificar variables de entorno
echo $FIREBASE_PROJECT_ID
```

#### Logs de la aplicación
```
INFO: Firebase initialized successfully with project: personal-fit-santa-fe-12345
INFO: Push notification service ready
```

### 9. Seguridad

#### .gitignore (Backend)
```gitignore
# Firebase credentials
config/firebase/firebase-service-account-key.json

# Environment files
.env
.env.local
.env.production
```

#### Permisos de archivos (Linux/Mac)
```bash
chmod 600 Backend/config/firebase/firebase-service-account-key.json
```

### 10. Testing

#### Test Manual
```bash
curl -X POST http://localhost:8080/api/notifications/pwa/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Test Notification",
    "body": "Testing Firebase integration",
    "type": "general"
  }'
```

### 11. Troubleshooting

#### Error: "Firebase not configured"
- ✅ Verificar que `FIREBASE_ENABLED=true`
- ✅ Verificar que el archivo JSON existe
- ✅ Verificar permisos de lectura del archivo

#### Error: "Invalid project ID"
- ✅ Verificar `FIREBASE_PROJECT_ID` en .env
- ✅ Verificar que coincida con el project_id del JSON

#### Error: "Permission denied"
- ✅ Verificar que el service account tenga rol "Firebase Admin SDK Administrator Service Agent"
- ✅ Verificar que FCM API esté habilitado en Google Cloud Console

### 12. Estructura Final de Archivos

```
Backend/
├── config/
│   └── firebase/
│       ├── firebase-service-account-key.json     ← Tu archivo real
│       └── firebase-service-account-key.json.example  ← Ejemplo
├── src/
├── .env                                          ← Variables de desarrollo
├── .env.example                                  ← Ejemplo de variables
└── .gitignore                                    ← Incluir archivos a ignorar
```