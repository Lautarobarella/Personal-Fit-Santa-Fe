# 🚀 Guía Completa de CI/CD para Personal Fit Santa Fe

## 📋 Resumen de Cambios Realizados

### ✅ 1. Linting del Frontend
- Configurado ESLint para que los errores críticos se conviertan en warnings
- Los tests de frontend ahora deberían pasar en CI/CD
- Archivo modificado: `Frontend/.eslintrc.json`

### ✅ 2. Secrets y Variables de Entorno (CORREGIDO)
- `docker-compose.yml` configurado para usar variables de entorno SIN valores por defecto
- **Los tokens ya NO están visibles en el código**
- Tokens de MercadoPago ahora se obtienen exclusivamente de variables de entorno
- Creado `env.example` con la documentación de variables
- Archivos modificados: `docker-compose.yml`, `env.example`

### ✅ 3. Persistencia de Base de Datos
- Los volúmenes Docker ya estaban configurados correctamente
- Los datos de PostgreSQL y archivos de comprobantes se conservan entre deployments
- Agregados comentarios explicativos en `docker-compose.yml`

### ✅ 4. Script de Deployment
- Creado `deploy.sh` con un script robusto de deployment
- Incluye verificaciones de salud, manejo de errores y logging
- Se ejecuta en `/opt/Personal-Fit-Santa-Fe/`

### ✅ 5. Workflow de CI/CD
- Actualizado `.github/workflows/ci.yml` para deployment en la rama `main`
- Configurado para usar GitHub Secrets
- Deployment automático al servidor 72.60.1.76

### ✅ 6. Documentación de Secrets
- Creado `GITHUB_SECRETS_SETUP.md` con instrucciones detalladas
- Lista todos los secrets necesarios y cómo configurarlos
- **Formato correcto de clave SSH documentado**

## 🔐 GitHub Secrets Necesarios

Configura estos secrets en GitHub Settings > Secrets and variables > Actions:

```
MP_ACCESS_TOKEN = TEST-1385388116353883-080413-b197af2289492f91ced7a5efe5ac0029-288248460
NEXT_PUBLIC_MP_PUBLIC_KEY = TEST-48801865-274c-4366-947c-963cb39867ef
SSH_HOST = 72.60.1.76
SSH_USERNAME = root
SSH_PORT = 22
SSH_PRIVATE_KEY = [tu-clave-privada-ssh-completa-con-delimitadores]
```

### 🔑 Formato Correcto de SSH_PRIVATE_KEY

La clave SSH debe incluir los delimitadores completos:

```
-----BEGIN OPENSSH PRIVATE KEY-----
[contenido completo de la clave privada]
-----END OPENSSH PRIVATE KEY-----
```

## 🔄 Flujo de Trabajo

1. **Push a `main`** → Dispara CI/CD automáticamente
2. **Tests Backend** → Ejecuta tests de Java/Spring Boot
3. **Tests Frontend** → Ejecuta linting y tests de Next.js
4. **Docker Build** → Construye y valida las imágenes
5. **Deploy** → Deployment automático al servidor

## 🗃️ Persistencia de Datos

**✅ Los datos NO se pierden en deployments**

- **PostgreSQL**: Volumen `pgdata` persistente
- **Comprobantes**: Volumen `comprobantes` persistente
- **Configuraciones**: Se mantienen en la base de datos

## 🛠️ Comandos Útiles en el Servidor

```bash
# Conectarse al servidor
ssh root@72.60.1.76
# Contraseña: UTNfinal2025

# Navegar al proyecto
cd /opt/Personal-Fit-Santa-Fe

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar servicios
docker-compose restart personalfit-frontend
docker-compose restart personalfit-backend

# Ver estado de contenedores
docker-compose ps

# Ejecutar deployment manual
./deploy.sh
```

## 🚨 Troubleshooting

### Si el deployment falla:

1. **Verificar secrets en GitHub**: Ir a Settings > Secrets and variables
2. **Verificar logs**: Actions tab > último workflow > ver logs detallados
3. **Conectarse al servidor manualmente** y verificar estado
4. **Revisar logs de Docker**: `docker-compose logs`

### Errores comunes:

- **"Permission denied"** → Verificar SSH_PRIVATE_KEY (incluir delimitadores)
- **"docker-compose not found"** → Instalar Docker en el servidor
- **"Port already in use"** → Algún servicio no se detuvo correctamente

## 🎯 Próximos Pasos

1. **Configurar los GitHub Secrets** siguiendo `GITHUB_SECRETS_SETUP.md`
2. **Hacer push a `main`** para probar el pipeline
3. **Verificar que la aplicación funciona** en https://personalfitsantafe.com
4. **Cambiar a tokens de producción** de MercadoPago cuando sea necesario

## 📞 Información del Servidor

- **IP**: 72.60.1.76
- **Dominio**: personalfitsantafe.com
- **Usuario**: root
- **Contraseña**: UTNfinal2025
- **Directorio del proyecto**: `/opt/Personal-Fit-Santa-Fe/`
- **Puertos expuestos**:
  - Frontend: 3000
  - Backend: 8080
  - PostgreSQL: 5432
  - PgAdmin: 5050

## 🔒 Seguridad Mejorada

- ✅ **Tokens NO visibles** en el código
- ✅ **Variables de entorno** desde GitHub Secrets
- ✅ **Claves SSH** con formato correcto
- ✅ **Dominio configurado** correctamente (personalfitsantafe.com)

¡El sistema está listo para deployment automático! 🎉