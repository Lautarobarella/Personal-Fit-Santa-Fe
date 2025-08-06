# Configuración de GitHub Secrets para CI/CD

Esta guía explica cómo configurar los GitHub Secrets necesarios para el pipeline de CI/CD del proyecto Personal Fit Santa Fe.

## 📋 Secrets Requeridos

### 1. Variables de MercadoPago

#### `MP_ACCESS_TOKEN` (CRÍTICO - MANTENER PRIVADO)
- **Descripción**: Token de acceso privado de MercadoPago
- **Valor actual de desarrollo**: `TEST-1385388116353883-080413-b197af2289492f91ced7a5efe5ac0029-288248460`
- **⚠️ IMPORTANTE**: Cambiar por el token de producción cuando vayan a producción

#### `NEXT_PUBLIC_MP_PUBLIC_KEY` (Público)
- **Descripción**: Clave pública de MercadoPago
- **Valor actual**: `TEST-48801865-274c-4366-947c-963cb39867ef`
- **Nota**: Esta clave es pública y se puede ver en el frontend

### 2. Variables de SSH para Deployment

#### `SSH_HOST`
- **Descripción**: Dirección IP del servidor
- **Valor**: `72.60.1.76`

#### `SSH_USERNAME`
- **Descripción**: Usuario SSH
- **Valor**: `root`

#### `SSH_PORT`
- **Descripción**: Puerto SSH
- **Valor**: `22`

#### `SSH_PRIVATE_KEY` (CRÍTICO - MANTENER PRIVADO)
- **Descripción**: Clave privada SSH para acceder al servidor
- **Formato**: Debe incluir las líneas completas con los delimitadores:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[contenido completo de la clave privada]
-----END OPENSSH PRIVATE KEY-----
```
- **⚠️ IMPORTANTE**: Incluir las líneas `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`

## 🔧 Cómo Configurar los Secrets

### Paso 1: Acceder a la Configuración
1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (Configuración)
3. En el menú lateral, haz clic en **Secrets and variables** > **Actions**

### Paso 2: Agregar cada Secret
1. Haz clic en **New repository secret**
2. Ingresa el **Name** (nombre exacto de la tabla anterior)
3. Ingresa el **Value** (valor correspondiente)
4. Haz clic en **Add secret**

### Paso 3: Generar la Clave SSH (si es necesario)

Si necesitas generar una nueva clave SSH:

```bash
# En tu máquina local
ssh-keygen -t rsa -b 4096 -f ~/.ssh/personalfit_deploy
```

Luego:
1. Copia el contenido de `~/.ssh/personalfit_deploy` (clave privada) al secret `SSH_PRIVATE_KEY`
2. Copia el contenido de `~/.ssh/personalfit_deploy.pub` (clave pública) al servidor

En el servidor (72.60.1.76):
```bash
# Conectarte al servidor
ssh root@72.60.1.76

# Agregar la clave pública a authorized_keys
echo "tu-clave-publica-aqui" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## ✅ Verificar la Configuración

Una vez configurados todos los secrets, puedes verificar que funcionan:

1. Haz un push a la rama `main`
2. Ve a la pestaña **Actions** en GitHub
3. Verifica que el workflow se ejecute correctamente
4. Si hay errores, revisa los logs en cada paso

## 🔄 Flujo de Deployment

Cuando hagas push a `main`:
1. Se ejecutan los tests del backend
2. Se ejecutan los tests del frontend (incluyendo linting)
3. Se construyen las imágenes Docker
4. Si todo pasa, se hace deployment automático al servidor

## 🛡️ Seguridad

- ✅ Los secrets están encriptados en GitHub
- ✅ Solo son visibles para el workflow de CI/CD
- ✅ No aparecen en los logs
- ✅ Los tokens ya NO están hardcodeados en el código
- ⚠️ Cambiar `MP_ACCESS_TOKEN` por el de producción cuando sea necesario

## 📱 Datos de Conexión SSH

Para conectarte manualmente al servidor:
```bash
ssh root@72.60.1.76
# Contraseña: UTNfinal2025
```

El proyecto se deployará en `/opt/Personal-Fit-Santa-Fe/`

## 🗃️ Persistencia de Datos

Los volúmenes Docker están configurados para persistir:
- **Base de datos PostgreSQL**: Los datos NO se pierden en deployments
- **Archivos de comprobantes**: Los archivos subidos NO se pierden

## 🚨 Solución de Problemas

### Error: "Permission denied (publickey)"
- Verificar que `SSH_PRIVATE_KEY` está correctamente configurado
- Verificar que la clave pública está en `~/.ssh/authorized_keys` del servidor

### Error: "docker-compose: command not found"
- Instalar Docker y Docker Compose en el servidor

### Error: "git: command not found"
- Instalar Git en el servidor

```bash
# En el servidor
apt update
apt install -y git docker.io docker-compose
systemctl start docker
systemctl enable docker
```