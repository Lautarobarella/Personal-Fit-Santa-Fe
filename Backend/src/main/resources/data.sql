-- Insert test users with encrypted passwords (BCrypt)
-- Password for all users: "password123"

-- Configuraciones de la aplicación
INSERT INTO app_settings (setting_key, setting_value, description, created_at) VALUES
('monthly_fee', '25000', 'Cuota mensual del gimnasio', NOW());

-- Administrador
INSERT INTO app_user (id, first_name, last_name, password, phone, email, avatar, join_date, address, birth_date, dni, role, status, deleted_at) VALUES
(1,'Admin', 'Principal', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567890', 'admin@personalfit.com', 'AP', '2024-01-01', '123 Admin St', '1990-01-01', 12345678, 'admin', 'active', NULL);

-- Entrenadores
INSERT INTO app_user (id, first_name, last_name, password, phone, email, avatar, join_date, address, birth_date, dni, role, status, deleted_at) VALUES
(2,'Juan', 'González', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567891', 'juan@personalfit.com', 'JG', '2024-01-02', '456 Trainer Ave', '1985-05-15', 23456789, 'trainer', 'active', NULL),
(3,'María', 'Rodríguez', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567892', 'maria@personalfit.com', 'MR', '2024-01-03', '789 Trainer Blvd', '1988-08-20', 34567890, 'trainer', 'active', NULL);

-- Clientes
INSERT INTO app_user (id, first_name, last_name, password, phone, email, avatar, join_date, address, birth_date, dni, role, status, deleted_at) VALUES
(4,'Carlos', 'García', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567893', 'carlos@personalfit.com', 'CG', '2024-01-04', '321 Fitness St', '1988-12-10', 45678901, 'client', 'inactive', NULL),
(5,'Ana', 'Martínez', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567894', 'ana@personalfit.com', 'AM', '2024-01-05', '654 Health Ave', '1992-03-25', 56789012, 'client', 'inactive', NULL),
(6,'Luis', 'Fernández', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567895', 'luis@personalfit.com', 'LF', '2024-01-06', '987 Wellness Rd', '1990-07-15', 67890123, 'client', 'inactive', NULL),
(7,'Sofia', 'López', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567896', 'sofia@personalfit.com', 'SL', '2024-01-07', '147 Active St', '1995-11-30', 78901234, 'client', 'inactive', NULL),
(8,'Diego', 'Hernández', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567897', 'diego@personalfit.com', 'DH', '2024-01-08', '258 Sport Ave', '1987-04-12', 89012345, 'client', 'inactive', NULL),
(9,'Valentina', 'Torres', '$2a$12$kgRB78e1gpWApw65ve9x.efM9qpuupQUi6VPTiM4nzW39eoecMB6m', '+1234567898', 'valentina@personalfit.com', 'VT', '2024-01-09', '369 Fitness Blvd', '1993-09-18', 90123456, 'client', 'inactive', NULL);

-- Actividades
-- Actividad 1: Ya pasó (completed) - tuvo 3 inscritos, asistieron 2
INSERT INTO activity (id, name, description, location, slots, date, created_at, repeat_every_week, duration, status, trainer_id, is_recurring) VALUES
(1,'Yoga Matutino', 'Clase de yoga para principiantes y avanzados', 'Sala Principal', 15, '2025-08-01 08:00:00', '2024-01-01 10:00:00', false, 60, 'completed', 2, false);

-- Actividad 2: Futura con participantes inscritos
INSERT INTO activity (id, name, description, location, slots, date, created_at, repeat_every_week, duration, status, trainer_id, is_recurring) VALUES
(2,'Spinning Intenso', 'Entrenamiento cardiovascular en bicicleta', 'Sala Spinning', 12, '2025-08-04 18:00:00', '2024-01-01 10:00:00', false, 45, 'active', 3, false);

-- Actividad 3: Futura sin participantes inscritos
INSERT INTO activity (id, name, description, location, slots, date, created_at, repeat_every_week, duration, status, trainer_id, is_recurring) VALUES
(3,'Pilates Avanzado', 'Clase de pilates para nivel avanzado', 'Sala Pilates', 10, '2025-08-06 19:00:00', '2024-01-01 10:00:00', false, 75, 'active', 2, false);

-- Inscripciones para Actividad 1 (ya pasó - completed)
-- 3 inscritos, 2 asistieron, 1 no asistió
INSERT INTO attendance (id, user_id, activity_id, attendance, created_at, updated_at) VALUES
(1, 5, 1, 'present', '2025-08-01 09:00:00', '2024-01-15 08:30:00'),  -- Ana asistió
(2, 6, 1, 'present', '2025-08-01 09:30:00', '2024-01-15 08:15:00'),  -- Luis asistió
(3, 7, 1, 'absent', '2025-08-01 10:00:00', '2024-01-15 08:45:00');   -- Sofia no asistió

-- Inscripciones para Actividad 2 (futura con participantes)
INSERT INTO attendance (id, user_id, activity_id, attendance, created_at, updated_at) VALUES
(4, 5, 2, 'pending', '2025-08-04 09:00:00', '2024-12-20 14:00:00'),  -- Ana inscrita
(5, 6, 2, 'pending', '2025-08-04 15:00:00', '2024-12-20 15:00:00'),  -- Luis inscrito
(6, 7, 2, 'pending', '2025-08-04 16:00:00', '2024-12-20 16:00:00'),  -- Sofia inscrita
(7, 8, 2, 'pending', '2025-08-04 17:00:00', '2024-12-20 17:00:00'),  -- Diego inscrito
(8, 9, 2, 'pending', '2025-08-04 18:00:00', '2024-12-20 18:00:00');  -- Valentina inscrita

-- Actividad 3 no tiene inscripciones (como solicitaste)

-- Resetear las secuencias de PostgreSQL para que empiecen después de los IDs existentes
-- Esto evita conflictos de duplicate key cuando se crean nuevas entidades

-- Resetear secuencia de app_user (último ID usado: 9)
SELECT setval(pg_get_serial_sequence('app_user', 'id'), (SELECT MAX(id) FROM app_user), true);

-- Resetear secuencia de activity (último ID usado: 3)
SELECT setval(pg_get_serial_sequence('activity', 'id'), (SELECT MAX(id) FROM activity), true);

-- Resetear secuencia de attendance (último ID usado: 8)
SELECT setval(pg_get_serial_sequence('attendance', 'id'), (SELECT MAX(id) FROM attendance), true);

-- Resetear secuencia de app_settings (último ID usado: 1)
SELECT setval(pg_get_serial_sequence('app_settings', 'id'), (SELECT MAX(id) FROM app_settings), true);

-- Resetear secuencia de notification (si existe y tiene datos, sino establecer en 1)
SELECT setval(pg_get_serial_sequence('notification', 'id'), 
    CASE 
        WHEN (SELECT COUNT(*) FROM notification) > 0 THEN (SELECT MAX(id) FROM notification)
        ELSE 1
    END, true);

-- Resetear secuencia de payment_file (si existe y tiene datos, sino establecer en 1)
SELECT setval(pg_get_serial_sequence('payment_file', 'id'), 
    CASE 
        WHEN (SELECT COUNT(*) FROM payment_file) > 0 THEN (SELECT MAX(id) FROM payment_file)
        ELSE 1
    END, true);

-- Resetear secuencia de payment (si existe y tiene datos, sino establecer en 1)
SELECT setval(pg_get_serial_sequence('payment', 'id'), 
    CASE 
        WHEN (SELECT COUNT(*) FROM payment) > 0 THEN (SELECT MAX(id) FROM payment)
        ELSE 1
    END, true); 