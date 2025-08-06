# Casos de Prueba Personal Fit - Postman Collection

## Configuración Base
- **Base URL**: `http://localhost:8080/api/v1`
- **Content-Type**: `application/json`

## Usuarios de Prueba Disponibles

### Administrador
- **Email**: `admin@personalfit.com`
- **Password**: `password123`
- **DNI**: `12345678`

### Entrenadores
- **Juan González**: `juan@personalfit.com` / `password123` / DNI: `23456789`
- **María Rodríguez**: `maria@personalfit.com` / `password123` / DNI: `34567890`

### Clientes
- **Carlos García**: `carlos@personalfit.com` / `password123` / DNI: `45678901`
- **Ana Martínez**: `ana@personalfit.com` / `password123` / DNI: `56789012`
- **Luis Fernández**: `luis@personalfit.com` / `password123` / DNI: `67890123`
- **Sofia López**: `sofia@personalfit.com` / `password123` / DNI: `78901234`
- **Diego Hernández**: `diego@personalfit.com` / `password123` / DNI: `89012345`
- **Valentina Torres**: `valentina@personalfit.com` / `password123` / DNI: `90123456`

## Actividades de Prueba

### Actividad 1: Yoga Matutino (Completada)
- **ID**: 1
- **Estado**: `completed`
- **Fecha**: 15/01/2024 08:00
- **Inscritos**: 3 (Ana, Luis, Sofia)
- **Asistencia**: 2 presentes, 1 ausente

### Actividad 2: Spinning Intenso (Futura)
- **ID**: 2
- **Estado**: `active`
- **Fecha**: 25/12/2024 18:00
- **Inscritos**: 5 (Ana, Luis, Sofia, Diego, Valentina)
- **Estado**: Todos pendientes

### Actividad 3: Pilates Avanzado (Futura)
- **ID**: 3
- **Estado**: `active`
- **Fecha**: 30/12/2024 19:00
- **Inscritos**: 0

## Casos de Prueba por Endpoint

### 1. Autenticación

#### Login de Administrador
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@personalfit.com",
  "password": "password123"
}
```

#### Login de Entrenador
```http
POST /auth/login
Content-Type: application/json

{
  "email": "juan@personalfit.com",
  "password": "password123"
}
```

#### Login de Cliente
```http
POST /auth/login
Content-Type: application/json

{
  "email": "carlos@personalfit.com",
  "password": "password123"
}
```

### 2. Gestión de Usuarios

#### Obtener Todos los Usuarios (Admin)
```http
GET /users
Authorization: Bearer {{admin_token}}
```

#### Obtener Usuario por DNI
```http
GET /users/dni/12345678
Authorization: Bearer {{admin_token}}
```

#### Crear Nuevo Usuario
```http
POST /users
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "email": "nuevo@personalfit.com",
  "password": "password123",
  "phone": "+1234567899",
  "dni": "99999999",
  "role": "client",
  "address": "Dirección de prueba",
  "birthDate": "1990-01-01"
}
```

### 3. Gestión de Actividades

#### Obtener Todas las Actividades
```http
GET /activities
Authorization: Bearer {{admin_token}}
```

#### Obtener Actividad por ID
```http
GET /activities/1
Authorization: Bearer {{admin_token}}
```

#### Crear Nueva Actividad
```http
POST /activities
Authorization: Bearer {{trainer_token}}
Content-Type: application/json

{
  "name": "Nueva Actividad",
  "description": "Descripción de la actividad",
  "location": "Sala Principal",
  "slots": 20,
  "date": "2024-12-31T10:00:00",
  "duration": 60,
  "trainerId": 2
}
```

#### Actualizar Actividad
```http
PUT /activities/1
Authorization: Bearer {{trainer_token}}
Content-Type: application/json

{
  "name": "Yoga Matutino Actualizado",
  "description": "Descripción actualizada",
  "location": "Sala Principal",
  "slots": 15,
  "date": "2024-01-15T08:00:00",
  "duration": 60,
  "trainerId": 2
}
```

### 4. Gestión de Asistencias

#### Obtener Asistencias de una Actividad
```http
GET /attendance/activity/1
Authorization: Bearer {{admin_token}}
```

#### Inscribir Usuario a Actividad
```http
POST /attendance/enroll
Authorization: Bearer {{client_token}}
Content-Type: application/json

{
  "userId": 4,
  "activityId": 3
}
```

#### Marcar Asistencia
```http
PUT /attendance/mark
Authorization: Bearer {{trainer_token}}
Content-Type: application/json

{
  "userId": 4,
  "activityId": 1,
  "attendance": "present"
}
```

### 5. Gestión de Pagos

#### Obtener Todos los Pagos
```http
GET /payments
Authorization: Bearer {{admin_token}}
```

#### Crear Pago
```http
POST /payments
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "userId": 4,
  "amount": 50.00,
  "paymentType": "CASH",
  "description": "Pago mensual"
}
```

#### Verificar Pago
```http
POST /payments/verify
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "paymentId": 1,
  "status": "APPROVED"
}
```

## Variables de Entorno para Postman

Crea las siguientes variables en tu colección de Postman:

- `base_url`: `http://localhost:8080/api/v1`
- `admin_token`: Token JWT del administrador
- `trainer_token`: Token JWT del entrenador
- `client_token`: Token JWT del cliente

## Flujo de Prueba Recomendado

1. **Login como Administrador**
   - Obtener token JWT
   - Verificar acceso a todas las funcionalidades

2. **Login como Entrenador**
   - Obtener token JWT
   - Crear nueva actividad
   - Marcar asistencias

3. **Login como Cliente**
   - Obtener token JWT
   - Inscribirse a actividades
   - Ver actividades disponibles

4. **Pruebas de Autorización**
   - Intentar acceder a endpoints sin token
   - Intentar acceder con token de rol incorrecto

5. **Pruebas de Datos**
   - Verificar que las actividades de prueba se cargan correctamente
   - Verificar asistencias y estados

## Comandos para Ejecutar

```bash
# Levantar la aplicación con datos de prueba
docker-compose up --build

# Verificar que los servicios estén corriendo
docker-compose ps

# Ver logs del backend
docker-compose logs backend
```

## Notas Importantes

- Todos los usuarios tienen la contraseña: `password123`
- Los tokens JWT tienen una duración limitada
- Las fechas de las actividades están configuradas para diciembre 2024 para que sean futuras
- La actividad completada tiene fecha del 15 de enero de 2024
- Los IDs de usuario van del 1 al 9 (1=admin, 2-3=entrenadores, 4-9=clientes) 