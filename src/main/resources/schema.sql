-- Esquema alineado con los requisitos de LogiTrack S.A (MySQL 8+)
-- Ejecutar con: mysql -u <usuario> -p logitrack < src/main/resources/schema.sql

CREATE DATABASE IF NOT EXISTS logitrack;
USE logitrack;

CREATE TABLE IF NOT EXISTS rol (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    habilitado TINYINT(1) DEFAULT 1,
    ultimo_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario_rol (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bodega (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ubicacion VARCHAR(200) NOT NULL,
    capacidad DECIMAL(12,2) DEFAULT 0,
    encargado VARCHAR(120),
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS producto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    precio DECIMAL(12,2) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_bodega (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bodega_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad DECIMAL(15,3) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_stock_bodega_producto (bodega_id, producto_id),
    CONSTRAINT fk_sb_bodega FOREIGN KEY (bodega_id) REFERENCES bodega(id),
    CONSTRAINT fk_sb_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimiento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('ENTRADA','SALIDA','TRANSFERENCIA') NOT NULL,
    usuario_id BIGINT NOT NULL,
    bodega_origen_id BIGINT NULL,
    bodega_destino_id BIGINT NULL,
    comentario VARCHAR(255),
    referencia VARCHAR(120),
    CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_mov_bodega_origen FOREIGN KEY (bodega_origen_id) REFERENCES bodega(id),
    CONSTRAINT fk_mov_bodega_destino FOREIGN KEY (bodega_destino_id) REFERENCES bodega(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimiento_detalle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    movimiento_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad DECIMAL(15,3) NOT NULL,
    precio_unitario DECIMAL(12,2) DEFAULT 0,
    CONSTRAINT fk_md_mov FOREIGN KEY (movimiento_id) REFERENCES movimiento(id),
    CONSTRAINT fk_md_prod FOREIGN KEY (producto_id) REFERENCES producto(id),
    CONSTRAINT ck_md_cantidad_pos CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entidad VARCHAR(120) NOT NULL,
    entidad_id BIGINT NULL,
    accion ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
    usuario_id BIGINT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valores_anteriores JSON,
    valores_nuevos JSON,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_bodega_nombre ON bodega(nombre);
CREATE INDEX idx_producto_nombre ON producto(nombre);
CREATE INDEX idx_mov_fecha ON movimiento(fecha);
CREATE INDEX idx_aud_fecha ON auditoria(fecha);
