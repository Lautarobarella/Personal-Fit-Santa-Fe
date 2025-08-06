# Casos de Prueba - Personal Fit Santa Fe

## Resumen de Datos de Prueba

### Usuarios Creados
- **1 Administrador**
- **2 Entrenadores**
- **6 Clientes**

### Actividades Creadas
- **1 Actividad Completada** (Yoga Matutino) - 3 inscritos, 2 asistencias
- **2 Actividades Futuras** - Una con 5 inscritos, otra sin inscritos

## Cómo Ejecutar

### 1. Levantar la Aplicación
```bash
docker-compose up --build
```

### 2. Verificar que los Servicios Estén Corriendo
```bash
docker-compose ps
```

### 3. Ver Logs del Backend
```bash
docker-compose logs backend
```

## Datos de Acceso

### Administrador
- **Email**: `admin@personalfit.com`
- **Password**: `password123`
- **DNI**: `12345678`

### Entrenadores
1. **Juan González**
   - Email: `juan@personalfit.com`
   - Password: `password123`
   - DNI: `23456789`

2. **María Rodríguez**
   - Email: `maria@personalfit.com`
   - Password: `password123`
   - DNI: `34567890`

### Clientes
1. **Carlos García** - `carlos@personalfit.com` / `password123` / DNI: `45678901`
2. **Ana Martínez** - `ana@personalfit.com` / `password123` / DNI: `56789012`
3. **Luis Fernández** - `luis@personalfit.com` / `password123` / DNI: `67890123`
4. **Sofia López** - `sofia@personalfit.com` / `password123` / DNI: `78901234`
5. **Diego Hernández** - `diego@personalfit.com` / `password123` / DNI: `89012345`
6. **Valentina Torres** - `valentina@personalfit.com` / `password123` / DNI: `90123456`

## Actividades de Prueba

### Actividad 1: Yoga Matutino (Completada)
- **ID**: 1
- **Estado**: `completed`
- **Fecha**: 15/01/2024 08:00
- **Entrenador**: Juan González
- **Inscritos**: 3 (Ana, Luis, Sofia)
- **Asistencia**: 
  - Ana: Presente
  - Luis: Presente
  - Sofia: Ausente

### Actividad 2: Spinning Intenso (Futura)
- **ID**: 2
- **Estado**: `active`
- **Fecha**: 25/12/2024 18:00
- **Entrenador**: María Rodríguez
- **Inscritos**: 5 (Ana, Luis, Sofia, Diego, Valentina)
- **Estado**: Todos pendientes

### Actividad 3: Pilates Avanzado (Futura)
- **ID**: 3
- **Estado**: `active`
- **Fecha**: 30/12/2024 19:00
- **Entrenador**: Juan González
- **Inscritos**: 0

## Casos de Prueba con Postman

### 1. Autenticación

#### Login de Administrador
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@personalfit.com",
  "password": "password123"
}
```

#### Login de Entrenador
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "juan@personalfit.com",
  "password": "password123"
}
```

#### Login de Cliente
```http
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "email": "carlos@personalfit.com",
  "password": "password123"
}
```

### 2. Endpoints de Prueba

#### Obtener Todas las Actividades
```http
GET http://localhost:8080/api/v1/activities
Authorization: Bearer {{token}}
```

#### Obtener Actividad por ID
```http
GET http://localhost:8080/api/v1/activities/1
Authorization: Bearer {{token}}
```

#### Obtener Asistencias de una Actividad
```http
GET http://localhost:8080/api/v1/attendance/activity/1
Authorization: Bearer {{token}}
```

#### Obtener Todos los Usuarios
```http
GET http://localhost:8080/api/v1/users
Authorization: Bearer {{token}}
```

## Flujo de Prueba Recomendado

### Paso 1: Verificar Datos Cargados
1. Login como administrador
2. Obtener todas las actividades
3. Verificar que hay 3 actividades con los estados correctos
4. Obtener todos los usuarios
5. Verificar que hay 9 usuarios (1 admin + 2 trainers + 6 clients)

### Paso 2: Probar Roles
1. Login como entrenador
2. Intentar crear una nueva actividad
3. Marcar asistencias en actividades existentes
4. Login como cliente
5. Inscribirse a una actividad

### Paso 3: Probar Funcionalidades Específicas
1. Verificar asistencias de la actividad completada
2. Verificar inscripciones de actividades futuras
3. Probar gestión de pagos
4. Probar gestión de usuarios

## Variables de Entorno para Postman

Crea las siguientes variables en tu colección:
- `base_url`: `http://localhost:8080/api/v1`
- `admin_token`: Token JWT del administrador
- `trainer_token`: Token JWT del entrenador
- `client_token`: Token JWT del cliente

## Notas Importantes

- **Contraseña**: Todos los usuarios usan `password123`
- **Tokens JWT**: Tienen duración limitada, renueva cuando sea necesario
- **Fechas**: Las actividades futuras están configuradas para diciembre 2024
- **IDs**: Los usuarios van del 1 al 9 (1=admin, 2-3=entrenadores, 4-9=clientes)
- **Base de Datos**: Se inicializa automáticamente con los datos de prueba

## Troubleshooting

### Si los datos no se cargan:
1. Verificar que PostgreSQL esté corriendo
2. Verificar logs del backend: `docker-compose logs backend`
3. Reiniciar los contenedores: `docker-compose down && docker-compose up --build`

### Si hay problemas de conexión:
1. Verificar que el puerto 8080 esté disponible
2. Verificar que Docker esté corriendo
3. Verificar que no haya conflictos de puertos

## Archivos Modificados

- `Backend/src/main/resources/data.sql` - Datos de prueba
- `Backend/src/main/resources/application.properties` - Configuración para cargar datos
- `Backend/PAYMENT_BATCH_WITH_FILES_POSTMAN.md` - Documentación de Postman 