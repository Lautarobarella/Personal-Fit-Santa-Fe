# 🔐 Configuración de GitHub Secrets para Firebase

## 📋 Secrets Requeridos

Para que las notificaciones push funcionen en producción, necesitas configurar los siguientes secrets en GitHub:

### 🚀 Cómo Agregar Secrets en GitHub

1. **Ve a tu repositorio en GitHub**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click en "New repository secret"**
4. **Agrega cada uno de estos secrets:**

### 🔑 Firebase Secrets

#### 1. `FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT`
```json
{"type":"service_account","project_id":"personal-fit-santa-fe-12345","private_key_id":"abc123def456...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@personal-fit-santa-fe-12345.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xyz%40personal-fit-santa-fe-12345.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```
**⚠️ IMPORTANTE**: Esto debe ser el contenido completo del archivo JSON descargado de Firebase, pero en una sola línea.

#### 2. `FIREBASE_PROJECT_ID`
```
personal-fit-santa-fe-12345
```
Tu Project ID de Firebase (reemplaza con el real).

#### 3. `FIREBASE_ENABLED`
```
true
```

### 📝 Pasos Detallados para Obtener el JSON

1. **Firebase Console** → Tu proyecto → **Project Settings** (⚙️)
2. **Pestaña "Service accounts"**
3. **Selecciona "Firebase Admin SDK"**
4. **Click "Generate new private key"**
5. **Descarga el archivo JSON**
6. **Abre el archivo y copia TODO el contenido**
7. **Pégalo en el secret `FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT`**

### 🛠️ Ejemplo de Conversión JSON

Si tu archivo descargado se ve así:
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

Debes **minificarlo** (remover saltos de línea y espacios extra) para que quede en una sola línea:
```json
{"type":"service_account","project_id":"personal-fit-santa-fe-12345","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@personal-fit-santa-fe-12345.iam.gserviceaccount.com","client_id":"123456789...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/...","universe_domain":"googleapis.com"}
```

### 🔍 Verificar Configuración

Después de agregar los secrets, en el próximo deployment verás en los logs:

```
✅ Firebase Admin SDK initialized successfully for project: personal-fit-santa-fe-12345
✅ Push notification service ready
```

### 🚨 Troubleshooting

#### Error: "Firebase service account key not configured"
- Verifica que `FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT` esté configurado
- Asegúrate de que el JSON esté en una sola línea

#### Error: "Invalid JSON format"
- Verifica que el JSON esté completo y bien formateado
- Asegúrate de que no falten comillas o llaves

#### Error: "Project ID mismatch"
- Verifica que `FIREBASE_PROJECT_ID` coincida con el `project_id` del JSON

### 📋 Lista de Verificación

- [ ] Secret `FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT` agregado
- [ ] Secret `FIREBASE_PROJECT_ID` agregado  
- [ ] Secret `FIREBASE_ENABLED` agregado
- [ ] JSON minificado y completo
- [ ] Project ID coincide en ambos lugares
- [ ] Deployment ejecutado sin errores

¡Una vez configurado, las notificaciones push funcionarán automáticamente en producción! 🎉