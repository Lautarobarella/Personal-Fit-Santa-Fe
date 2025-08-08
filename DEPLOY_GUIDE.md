# 🚀 Guía de Deploy - Personal Fit Santa Fe

## 📋 Resumen

Este sistema de deploy está diseñado para **preservar completamente la base de datos** y **validar la compatibilidad de esquemas** antes de cada deploy.

## 🔒 Características de Preservación de Datos

- ✅ **Base de datos preservada**: Los datos nunca se pierden entre deploys
- ✅ **Validación de esquemas**: Falla si hay cambios incompatibles
- ✅ **Backups automáticos**: Se crea backup antes de cada deploy
- ✅ **Migraciones seguras**: Sistema de migraciones controlado
- ✅ **Rollback automático**: Posibilidad de restaurar backups

## 🛠️ Scripts Disponibles

### 1. `deploy.sh` - Deploy Principal
```bash
# Deploy normal (con validación)
./deploy.sh

# Deploy forzado (sin validación)
./deploy.sh --force

# Ayuda
./deploy.sh --help
```

### 2. `migrate.sh` - Gestión de Migraciones
```bash
# Validar esquemas
./migrate.sh

# Ejecutar migraciones
./migrate.sh --migrate

# Crear backup
./migrate.sh --backup

# Restaurar backup
./migrate.sh --restore backup_personalfit_20241201_143022.sql

# Forzar migración (sin validación)
./migrate.sh --force

# Ayuda
./migrate.sh --help
```

### 3. `diagnose.sh` - Diagnóstico
```bash
# Ejecutar diagnóstico completo
./diagnose.sh
```

## 🔄 Flujo de Deploy

### Deploy Normal (Recomendado)
1. **Validación de esquemas**: Verifica compatibilidad
2. **Backup automático**: Crea backup antes del deploy
3. **Preservación de volúmenes**: Mantiene datos existentes
4. **Deploy de servicios**: Actualiza aplicación
5. **Verificación**: Confirma que todo funciona

### Si Hay Cambios Incompatibles
1. **Error de validación**: El deploy se detiene
2. **Opciones disponibles**:
   - Ejecutar migraciones: `./migrate.sh --migrate`
   - Forzar deploy: `./deploy.sh --force`
   - Restaurar backup: `./migrate.sh --restore <archivo>`

## 📊 Estructura de Datos Preservados

```
📁 Volúmenes Docker (Siempre preservados)
├── 📊 pgdata/                    # Base de datos PostgreSQL
│   ├── 👥 Usuarios
│   ├── 🏃 Actividades
│   ├── 💰 Pagos
│   └── 📈 Asistencias
└── 📄 comprobantes/             # Archivos de comprobantes
    └── 💳 Comprobantes de pago
```

## 🚨 Casos de Uso

### Caso 1: Deploy Normal (Sin Cambios de Esquema)
```bash
./deploy.sh
# ✅ Deploy exitoso - Datos preservados
```

### Caso 2: Deploy con Cambios de Esquema
```bash
./deploy.sh
# ❌ Error: Cambios incompatibles detectados
# 🔧 Solución: ./migrate.sh --migrate
```

### Caso 3: Deploy Forzado (Peligroso)
```bash
./deploy.sh --force
# ⚠️ Deploy exitoso pero puede causar pérdida de datos
```

### Caso 4: Restaurar Backup
```bash
./migrate.sh --restore backup_personalfit_20241201_143022.sql
# ✅ Backup restaurado exitosamente
```

## 🔍 Monitoreo y Diagnóstico

### Verificar Estado de Servicios
```bash
docker-compose ps
```

### Ver Logs
```bash
# Logs del backend
docker-compose logs personalfit-backend

# Logs del frontend
docker-compose logs personalfit-frontend

# Logs de PostgreSQL
docker-compose logs postgres
```

### Verificar Conectividad
```bash
# Health check del backend
curl https://personalfitsantafe.com:8080/api/health

# Verificar frontend
curl https://personalfitsantafe.com
```

## 🛡️ Seguridad y Backup

### Backups Automáticos
- Se crean automáticamente antes de cada deploy
- Formato: `backup_personalfit_YYYYMMDD_HHMMSS.sql`
- Ubicación: Directorio raíz del proyecto

### Backups Manuales
```bash
# Crear backup manual
./migrate.sh --backup

# Listar backups disponibles
ls -la backup_personalfit_*.sql
```

### Restaurar Backup
```bash
# Restaurar backup específico
./migrate.sh --restore backup_personalfit_20241201_143022.sql
```

## ⚠️ Consideraciones Importantes

### Antes del Deploy
1. **Verificar cambios**: Revisar qué cambios se van a deployar
2. **Backup manual**: Si es crítico, hacer backup manual
3. **Horario**: Evitar deploys en horarios de alta actividad

### Durante el Deploy
1. **No interrumpir**: No detener el proceso una vez iniciado
2. **Monitorear logs**: Revisar logs si hay problemas
3. **Tener paciencia**: El proceso puede tomar varios minutos

### Después del Deploy
1. **Verificar funcionalidad**: Probar las funcionalidades principales
2. **Revisar logs**: Confirmar que no hay errores
3. **Notificar equipo**: Informar sobre el deploy completado

## 🆘 Solución de Problemas

### Error: "Validación de esquemas falló"
```bash
# Opción 1: Ejecutar migraciones
./migrate.sh --migrate

# Opción 2: Forzar deploy (peligroso)
./deploy.sh --force

# Opción 3: Restaurar backup anterior
./migrate.sh --restore <archivo_backup>
```

### Error: "Backend no responde"
```bash
# Verificar logs
docker-compose logs personalfit-backend

# Verificar conectividad
curl https://personalfitsantafe.com:8080/api/health

# Reiniciar servicios
docker-compose restart personalfit-backend
```

### Error: "Base de datos no accesible"
```bash
# Verificar PostgreSQL
docker-compose logs postgres

# Verificar conectividad
docker-compose exec postgres pg_isready -U personalfit_user -d personalfit

# Reiniciar PostgreSQL
docker-compose restart postgres
```

## 📞 Contacto y Soporte

Si encuentras problemas durante el deploy:

1. **Ejecutar diagnóstico**: `./diagnose.sh`
2. **Revisar logs**: Ver logs específicos del servicio
3. **Contactar equipo**: Proporcionar logs y diagnóstico

---

## 🎯 Resumen de Comandos Principales

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `./deploy.sh` | Deploy normal con validación | Deploy seguro |
| `./deploy.sh --force` | Deploy forzado | Solo en emergencias |
| `./migrate.sh` | Validar esquemas | Verificar compatibilidad |
| `./migrate.sh --migrate` | Ejecutar migraciones | Aplicar cambios de esquema |
| `./migrate.sh --backup` | Crear backup | Backup manual |
| `./diagnose.sh` | Diagnóstico completo | Solución de problemas |

## 🌐 URLs de Acceso

- **Frontend**: https://personalfitsantafe.com
- **Backend API**: https://personalfitsantafe.com:8080
- **PgAdmin**: https://personalfitsantafe.com:5050
- **Health Check**: https://personalfitsantafe.com:8080/api/health
