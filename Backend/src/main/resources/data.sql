-- Insert test users with encrypted passwords (BCrypt)
-- Password for all users: "password123"

INSERT INTO app_user (first_name, last_name, password, phone, email, avatar, join_date, address, birth_date, dni, role, status, deleted_at) VALUES
('Admin', 'User', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1234567890', 'admin@personalfit.com', 'AU', '2024-01-01', '123 Admin St', '1990-01-01', 12345678, 'admin', 'active', NULL),
('John', 'Trainer', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1234567891', 'trainer@personalfit.com', 'JT', '2024-01-02', '456 Trainer Ave', '1985-05-15', 23456789, 'trainer', 'active', NULL),
('Maria', 'Client', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1234567892', 'client@personalfit.com', 'MC', '2024-01-03', '789 Client Blvd', '1995-08-20', 34567890, 'client', 'active', NULL),
('Carlos', 'Garcia', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1234567893', 'carlos@personalfit.com', 'CG', '2024-01-04', '321 Fitness St', '1988-12-10', 45678901, 'client', 'active', NULL),
('Ana', 'Martinez', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1234567894', 'ana@personalfit.com', 'AM', '2024-01-05', '654 Health Ave', '1992-03-25', 56789012, 'client', 'active', NULL); 