-- Seed de datos mínimos para desarrollo/demo

-- Roles
INSERT INTO rol (nombre, descripcion) VALUES
  ('ADMIN', 'Administrador del sistema'),
  ('EMPLEADO', 'Operador de bodega');

-- Usuarios (password: password)
INSERT INTO usuario (nombre, apellido, username, email, password_hash, habilitado) VALUES
  ('Admin', 'General', 'admin', 'admin@logitrack.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8r1b/fm6.HbvZ.08cYfa/U/7pwhzwy', 1),
  ('Laura', 'Operadora', 'loperadora', 'laura@logitrack.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8r1b/fm6.HbvZ.08cYfa/U/7pwhzwy', 1);
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (1, 1), (2, 2);

-- Bodegas
INSERT INTO bodega (nombre, ubicacion, capacidad, encargado, activa) VALUES
  ('CEDI Central', 'Bogota - Zona Industrial 123', 5000, 'Carlos Rojas', 1),
  ('Bodega Norte', 'Medellin - Autopista Norte', 3000, 'Ana Lopez', 1);

-- Productos
INSERT INTO producto (nombre, categoria, stock, precio, activo) VALUES
  ('Laptop Pro 15', 'Electronicos', 120, 4200000.00, 1),
  ('Taladro Percutor 800W', 'Herramientas', 80, 520000.00, 1),
  ('Silla Ergonomica', 'Oficina', 60, 350000.00, 1);

-- Stock por bodega
INSERT INTO stock_bodega (bodega_id, producto_id, cantidad) VALUES
  (1, 1, 70),
  (1, 2, 50),
  (2, 1, 50),
  (2, 3, 60);

-- Movimiento de ejemplo
INSERT INTO movimiento (fecha, tipo, usuario_id, bodega_destino_id, comentario, referencia) VALUES
  (NOW(), 'ENTRADA', 2, 1, 'Recepcion OC-1001', 'OC-1001');
INSERT INTO movimiento_detalle (movimiento_id, producto_id, cantidad, precio_unitario) VALUES
  (1, 1, 20, 4000000.00),
  (1, 2, 10, 500000.00);

-- Auditoria inicial (creacion de admin)
INSERT INTO auditoria (entidad, entidad_id, accion, usuario_id, valores_nuevos, ip, user_agent) VALUES
  ('usuario', 1, 'INSERT', 1, JSON_OBJECT('username','admin'), '127.0.0.1', 'init-script');
