# Configuración de Comunicación entre Contenedores Docker

## Problema Resuelto
- Los contenedores Docker no pueden comunicarse usando `localhost`
- Necesitamos usar el nombre del servicio del contenedor backend
- **Solución**: Red Docker dedicada para comunicación segura y eficiente

## Solución Implementada

### 1. **Red Docker Dedicada**
```yaml
# docker-compose.yml
networks:
  personalfit-network:
    driver: bridge
    name: personalfit-network
```
- Todos los servicios están en la misma red
- Comunicación segura y aislada
- Resolución de nombres automática

### 2. **Configuración Centralizada**
- Archivo: `Frontend/lib/config.ts`
- Maneja URLs dinámicamente según el entorno

### 3. **Variables de Entorno**
```yaml
# docker-compose.yml
environment:
  NEXT_PUBLIC_API_URL: http://personalfit-backend:8080
  NEXT_PUBLIC_IS_DOCKER: "true"
```

### 3. **URLs por Entorno**

#### Desarrollo Local (fuera de Docker)
```
http://localhost:8080
```

#### Docker (entre contenedores)
```
http://personalfit-backend:8080
```

## Cómo Funciona

### En Desarrollo Local
1. Ejecutar `npm run dev` en el frontend
2. Ejecutar el backend en tu IDE
3. Las APIs usarán `localhost:8080`

### En Docker
1. Ejecutar `docker-compose up`
2. Los contenedores se comunican usando `personalfit-backend:8080`
3. No hay ruteo externo necesario

## Archivos Modificados

### Frontend
- `Frontend/lib/config.ts` - Configuración central
- `Frontend/api/payment/paymentsApi.ts` - Usa configuración central
- `Frontend/api/clients/clientsApi.ts` - Usa configuración central
- `Frontend/api/activities/activitiesApi.ts` - Usa configuración central
- `Frontend/api/notifications/notificationsApi.ts` - Usa configuración central

### Docker
- `docker-compose.yml` - Variables de entorno actualizadas

## Beneficios

✅ **Red dedicada** para comunicación segura
✅ **Comunicación directa** entre contenedores
✅ **Sin ruteo externo** necesario
✅ **Aislamiento de red** para mayor seguridad
✅ **Resolución de nombres** automática
✅ **Desarrollo local** sigue funcionando
✅ **Configuración centralizada** y mantenible
✅ **Variables de entorno** para flexibilidad

## Uso

### Desarrollo Local
```bash
# Terminal 1 - Backend
cd Backend
./mvnw spring-boot:run

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

### Docker
```bash
# Ejecutar todo
docker-compose up --build

# Solo backend
docker-compose up personalfit-backend

# Solo frontend
docker-compose up personalfit-frontend
```

## Troubleshooting

### Si no funciona la comunicación:
1. Verificar que ambos contenedores estén corriendo: `docker-compose ps`
2. Verificar logs: `docker-compose logs personalfit-frontend`
3. Verificar conectividad: `docker exec personalfit-frontend ping personalfit-backend`
4. Verificar red: `docker network ls` y `docker network inspect personalfit-network`
5. Verificar que todos los servicios estén en la misma red: `docker inspect personalfit-frontend | grep -A 10 "NetworkMode"`

## Comandos Útiles para Gestión de Red

### Ver redes disponibles:
```bash
docker network ls
```

### Inspeccionar la red:
```bash
docker network inspect personalfit-network
```

### Ver contenedores en la red:
```bash
docker network inspect personalfit-network --format='{{range .Containers}}{{.Name}} {{end}}'
```

### Limpiar redes no utilizadas:
```bash
docker network prune
``` 