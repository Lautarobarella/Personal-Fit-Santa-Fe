# Configuración CI/CD - Personal Fit Santa Fe

## 📋 Resumen

Este proyecto utiliza GitHub Actions para implementar un pipeline de CI/CD completo que incluye:

- **Tests automatizados** para Backend (Java/Spring Boot) y Frontend (Next.js/TypeScript)
- **Análisis de cobertura de código** con JaCoCo y Jest
- **Construcción de imágenes Docker** para ambos servicios
- **Deployment automático** a Hostinger VPS cuando se hace push a la rama `main`

## 🏗️ Estructura del Pipeline

### Jobs de GitHub Actions:

1. **backend-test**: Ejecuta tests del backend con Maven y JaCoCo
2. **frontend-test**: Ejecuta linting y tests del frontend con Jest
3. **docker-build**: Construye y valida las imágenes Docker
4. **deploy**: Despliega automáticamente a Hostinger VPS (solo en `main`)

## 🔧 Configuración Requerida

### 1. Secrets de GitHub

Configura los siguientes secrets en tu repositorio de GitHub:

```
HOSTINGER_HOST=tu-servidor.hostinger.com
HOSTINGER_USERNAME=tu-usuario
HOSTINGER_SSH_KEY=tu-clave-ssh-privada
HOSTINGER_PORT=22
```

### 2. Configuración del VPS en Hostinger

#### Instalar Docker y Docker Compose:
```bash
# Conectar al VPS
ssh usuario@tu-servidor.hostinger.com

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar cambios
exit
ssh usuario@tu-servidor.hostinger.com
```

#### Clonar el repositorio:
```bash
cd /home/$USER
git clone https://github.com/tu-usuario/Personal-Fit-Santa-Fe.git
cd Personal-Fit-Santa-Fe
```

#### Configurar variables de entorno:
```bash
# Crear archivo .env para producción
cp .env.example .env
nano .env
```

### 3. Configuración de Dominio (Opcional)

Si tienes un dominio configurado en Hostinger:

1. Configura un proxy reverso con Nginx
2. Configura SSL con Let's Encrypt
3. Actualiza las variables de entorno con el dominio

## 🧪 Tests Implementados

### Backend Tests:
- **UserControllerTest**: Tests para endpoints de usuarios
- **ActivityControllerTest**: Tests para endpoints de actividades
- **PaymentControllerTest**: Tests para endpoints de pagos
- **PersonalFitApplicationTests**: Test de contexto de Spring

### Frontend Tests:
- **Button.test.tsx**: Tests para componente Button
- **LoginForm.test.tsx**: Tests para formulario de login
- **use-client.test.ts**: Tests para hook use-client

## 📊 Cobertura de Código

### Backend:
- Utiliza JaCoCo para generar reportes de cobertura
- Los reportes se suben automáticamente a Codecov
- Configurado en `Backend/pom.xml`

### Frontend:
- Utiliza Jest para generar reportes de cobertura
- Los reportes se suben automáticamente a Codecov
- Configurado en `Frontend/jest.config.js`

## 🚀 Deployment

### Automático:
- Se ejecuta automáticamente al hacer push a `main`
- Utiliza el script `deploy.sh` en el VPS
- Hace backup automático antes del deployment

### Manual:
```bash
# En el VPS
cd /home/$USER/Personal-Fit-Santa-Fe
./deploy.sh
```

## 📁 Archivos de Configuración

### GitHub Actions:
- `.github/workflows/ci.yml`: Pipeline principal

### Backend:
- `Backend/pom.xml`: Configuración Maven con JaCoCo
- `Backend/src/test/resources/application-test.properties`: Configuración de tests
- `Backend/Dockerfile`: Imagen Docker del backend

### Frontend:
- `Frontend/package.json`: Scripts de test y dependencias
- `Frontend/jest.config.js`: Configuración de Jest
- `Frontend/jest.setup.js`: Setup de Jest
- `Frontend/Dockerfile`: Imagen Docker del frontend

### Docker:
- `docker-compose.yml`: Orquestación de servicios
- `deploy.sh`: Script de deployment

## 🔍 Monitoreo

### Logs de Docker:
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f personalfit-backend
docker-compose logs -f personalfit-frontend
```

### Estado de los servicios:
```bash
docker-compose ps
```

## 🛠️ Troubleshooting

### Problemas comunes:

1. **Tests fallan en CI**:
   - Verificar que las dependencias estén actualizadas
   - Revisar logs de GitHub Actions

2. **Deployment falla**:
   - Verificar que los secrets estén configurados correctamente
   - Revisar conectividad SSH con el VPS

3. **Contenedores no inician**:
   - Verificar logs: `docker-compose logs`
   - Verificar variables de entorno
   - Verificar puertos disponibles

### Comandos útiles:
```bash
# Limpiar Docker
docker system prune -a

# Reconstruir sin cache
docker-compose build --no-cache

# Reiniciar servicios
docker-compose restart

# Ver uso de recursos
docker stats
```

## 📞 Soporte

Para problemas o preguntas sobre la configuración CI/CD:

1. Revisar los logs de GitHub Actions
2. Verificar la configuración de secrets
3. Revisar la documentación de GitHub Actions
4. Contactar al equipo de desarrollo 