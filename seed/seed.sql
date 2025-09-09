-- Tabla de Comentarios de Productos

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS SimpleMarketplaceDB2;
USE SimpleMarketplaceDB2;

-- Tabla de Usuarios (actualizada con campo estado)
CREATE TABLE Usuarios (
    usuarioId INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    contraseñaHash VARCHAR(255) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    telefono VARCHAR(20),
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Comentarios (
    comentarioId INT AUTO_INCREMENT PRIMARY KEY,
    productoId INT NOT NULL,
    usuarioId INT NOT NULL,
    comentario TEXT NOT NULL,
    estrellas INT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    fechaComentario DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productoId) REFERENCES Productos(productoId) ON DELETE CASCADE,
    FOREIGN KEY (usuarioId) REFERENCES Usuarios(usuarioId) ON DELETE CASCADE
);

-- Tabla de Administradores (nueva tabla)
CREATE TABLE Administradores (
    adminId INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    contraseñaHash VARCHAR(255) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaUltimoAcceso DATETIME,
    nivelAcceso ENUM('basico', 'medio', 'avanzado') DEFAULT 'basico'
);

-- Tabla de Direcciones
CREATE TABLE Direcciones (
    direccionId INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    calle VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    codigoPostal VARCHAR(20) NOT NULL,
    pais VARCHAR(100) NOT NULL DEFAULT 'Perú',
    esPrincipal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuarioId) REFERENCES Usuarios(usuarioId) ON DELETE CASCADE
);

-- Tabla de Métodos de Pago
CREATE TABLE MetodosPago (
    metodoPagoId INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    tipoTarjeta VARCHAR(50) NOT NULL, -- 'Visa', 'Mastercard', etc.
    ultimosCuatroDigitos VARCHAR(4) NOT NULL,
    mesExpiracion INT NOT NULL,
    añoExpiracion INT NOT NULL,
    esPrincipal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuarioId) REFERENCES Usuarios(usuarioId) ON DELETE CASCADE
);

-- Tabla de Productos (actualizada con campo estado)
CREATE TABLE Productos (
    productoId INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagenUrl VARCHAR(255) NOT NULL, -- URL de la imagen principal
    categoria VARCHAR(50) NOT NULL,
    estado ENUM('disponible', 'agotado', 'descontinuado', 'oculto') DEFAULT 'disponible',
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Carrito
CREATE TABLE Carrito (
    carritoId INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    productoId INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fechaAgregado DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuarioId) REFERENCES Usuarios(usuarioId) ON DELETE CASCADE,
    FOREIGN KEY (productoId) REFERENCES Productos(productoId) ON DELETE CASCADE,
    UNIQUE KEY item_unico_carrito (usuarioId, productoId) -- Evita duplicados en el carrito
);

-- Tabla de Pedidos
CREATE TABLE Pedidos (
    pedidoId INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    direccionId INT NOT NULL,
    metodoPagoId INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    costoEnvio DECIMAL(10,2) NOT NULL DEFAULT 0,
    impuestos DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    fechaPedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    numeroSeguimiento VARCHAR(100),
    FOREIGN KEY (usuarioId) REFERENCES Usuarios(usuarioId),
    FOREIGN KEY (direccionId) REFERENCES Direcciones(direccionId),
    FOREIGN KEY (metodoPagoId) REFERENCES MetodosPago(metodoPagoId)
);

-- Tabla de Detalles de Pedido
CREATE TABLE DetallesPedido (
    detallePedidoId INT AUTO_INCREMENT PRIMARY KEY,
    pedidoId INT NOT NULL,
    productoId INT NOT NULL,
    cantidad INT NOT NULL,
    precioUnitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedidoId) REFERENCES Pedidos(pedidoId) ON DELETE CASCADE,
    FOREIGN KEY (productoId) REFERENCES Productos(productoId)
);

-- Tabla de Comprobantes (facturas/recibos)
CREATE TABLE Facturas (
    facturaId INT AUTO_INCREMENT PRIMARY KEY,
    pedidoId INT NOT NULL,
    numeroFactura VARCHAR(50) NOT NULL UNIQUE,
    fechaEmision DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    impuestos DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estadoPago ENUM('pagado', 'pendiente', 'reembolsado') DEFAULT 'pendiente',
    FOREIGN KEY (pedidoId) REFERENCES Pedidos(pedidoId)
);

-- Tabla de Configuraciones del Sistema (nueva tabla)
CREATE TABLE Configuraciones (
    configId INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(50) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion VARCHAR(255),
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Registro de Actividades (logs) (nueva tabla)
CREATE TABLE LogsAdministrativos (
    logId INT AUTO_INCREMENT PRIMARY KEY,
    adminId INT,
    accion VARCHAR(100) NOT NULL,
    detalles TEXT,
    ipAddress VARCHAR(45),
    userAgent VARCHAR(255),
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adminId) REFERENCES Administradores(adminId) ON DELETE SET NULL
);
CREATE TABLE ProductoImagenes (
    imagenId INT AUTO_INCREMENT PRIMARY KEY,
    productoId INT NOT NULL,
    imagenUrl VARCHAR(255) NOT NULL,
    esPrincipal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (productoId) REFERENCES Productos(productoId) ON DELETE CASCADE
);


CREATE INDEX idx_productos_categoria ON Productos(categoria);
CREATE INDEX idx_pedidos_usuario ON Pedidos(usuarioId);
CREATE INDEX idx_pedidos_estado ON Pedidos(estado);
CREATE INDEX idx_carrito_usuario ON Carrito(usuarioId);

-- Tabla para imágenes adicionales de productos


-- Insertar administradores con contraseñas hasheadas (BCrypt)

-- Insertar productos con sus imágenes
INSERT INTO Productos (nombre, descripcion, precio, stock, imagenUrl, categoria) VALUES
-- Teléfonos
('iPhone 15 Pro', 'iPhone 15 Pro con pantalla Super Retina XDR, chip A17 Pro y sistema de cámaras profesional', 3999.00, 50, 'https://http2.mlstatic.com/D_NQ_NP_891263-MLA71783089058_092023-O.webp', 'Smartphones'),
('Samsung Galaxy S24 Ultra', 'Galaxy S24 Ultra con pantalla Dynamic AMOLED 2X, S Pen integrado y cámara de 200MP', 3799.00, 45, 'https://http2.mlstatic.com/D_NQ_NP_906402-MLA78898729191_092024-O.webp', 'Smartphones'),
('Xiaomi 14 Ultra', 'Xiaomi 14 Ultra con pantalla AMOLED, Snapdragon 8 Gen 3 y sistema de cámaras Leica', 3299.00, 40, 'https://http2.mlstatic.com/D_Q_NP_718905-MLA75019481184_032024-O.webp', 'Smartphones'),

-- Laptops
('MacBook Air M3', 'MacBook Air con chip M3, pantalla Retina de 13.6" y hasta 18 horas de batería', 4599.00, 30, 'https://http2.mlstatic.com/D_NQ_NP_2X_891263-MLA71783089058_092023-F.webp', 'Laptops'),
('Dell XPS 13', 'Dell XPS 13 con procesador Intel Core i7, pantalla InfinityEdge y diseño ultradelgado', 3899.00, 25, 'https://m.media-amazon.com/images/I/710EGJBdIML._AC_SL1500_.jpg', 'Laptops'),
('Lenovo ThinkPad X1 Carbon', 'ThinkPad X1 Carbon con procesador Intel vPro, teclado ergonómico y diseño ultraligero', 4199.00, 20, 'https://rymportatiles.com.pe/cdn/shop/files/LENOVO-ThinkPad-X1-Nano-Gen-0.png?v=1715277608&width=600', 'Laptops'),

-- Tablets
('iPad Air M2', 'iPad Air con chip M2, pantalla Liquid Retina y compatibilidad con Apple Pencil (2da gen)', 2799.00, 35, 'https://pe.tiendasishop.com/cdn/shop/files/IMG-13190812_251122a9-d59f-4da4-b3f8-4234137b0fe9.jpg?v=1740442852&width=1000', 'Tablets'),
('Samsung Galaxy Tab S9', 'Galaxy Tab S9 con pantalla Dynamic AMOLED 2X, S Pen incluido y resistencia al agua', 2599.00, 30, 'https://images.samsung.com/is/image/samsung/p6pim/pe/2307/gallery/pe-galaxy-tab-s9-wifi-x710-sm-x710nzahpeo-537323834', 'Tablets'),

-- Audífonos
('AirPods Pro 2da Gen', 'AirPods Pro con cancelación activa de ruido, sonido adaptativo y estuche MagSafe', 899.00, 60, 'https://www.appleperu.pe/wp-content/uploads/pro2da.png', 'Audífonos'),
('Sony WH-1000XM5', 'Audífonos Sony WH-1000XM5 con cancelación de ruido líder en la industria y 30h de batería', 1299.00, 40, 'https://m.media-amazon.com/images/I/61ULAZmt9NL.jpg', 'Audífonos'),
('JBL Tune 760NC', 'Audífonos JBL con cancelación de ruido, 50h de batería y diseño plegable', 599.00, 50, 'https://www.jbl.com.pe/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwdfac31b8/1.JBL_TUNE_760NC_Product%20Image_Hero_Black.png', 'Audífonos'),

-- Smartwatches
('Apple Watch Series 9', 'Apple Watch Series 9 con pantalla Retina siempre activa, GPS y monitor de oxígeno en sangre', 1499.00, 40, 'https://http2.mlstatic.com/D_NQ_NP_2X_604194-MPE77460121286_072024-T-apple-watch-series-9-gps-45mm-sport-band-talla-sm.webp', 'Wearables'),
('Samsung Galaxy Watch6', 'Galaxy Watch6 con Wear OS, monitor de sueño avanzado y resistencia al agua', 1199.00, 35, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTORhweW6fYYLoUNa-Uo4hrL9O4ANJ-KBknKQ&s', 'Wearables'),

-- Consolas
('Sony PlayStation 5', 'Consola PlayStation 5 con lector de discos Ultra HD Blu-ray y control DualSense', 2499.00, 25, 'https://media.falabella.com/falabellaPE/128737584_01/w=800,h=800,fit=pad', 'Consolas'),
('Xbox Series X', 'Consola Xbox Series X con 1TB SSD, 12 teraflops de potencia y compatibilidad con 4K', 2299.00, 20, 'https://i5.walmartimages.com/asr/692b4f9a-36c2-49b3-8ee8-2b7c51504d20.0daff5ea982257b1130c933d87498409.jpeg', 'Consolas'),

-- Cámaras y accesorios
('Canon EOS R6 Mark II', 'Cámara mirrorless Canon EOS R6 Mark II con sensor full-frame y grabación 4K', 6899.00, 15, 'https://media.falabella.com/falabellaPE/128839210_01/w=1500,h=1500,fit=pad', 'Fotografía'),
('Cargador Anker PowerPort III', 'Cargador rápido Anker PowerPort III 65W con tecnología GaN para carga ultrarrápida', 199.00, 100, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQX0Zi5EN2w0TQI1-sJ87PayPVvuzlTE2-oJA&s', 'Accesorios');


-- Insertar usuarios con contraseñas hasheadas (BCrypt)
INSERT INTO Usuarios (email, contraseñaHash, nombre, apellido, telefono) VALUES
-- Password123
('cliente1@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYV6znm6Z7p6f19JGWJ4Y4H6zilKWq', 'Juan', 'Pérez', '987654321'),

-- SecurePass456
('maria.gonzalez@hotmail.com', '$2a$10$SSO5P4mQRyDgFgVrG9QZ0.9LtW6YbYf8JZ8XjN7Kk6t0dQ1W2nZrO', 'María', 'González', '987654322'),

-- MyP@ssw0rd
('carlos.rodriguez@yahoo.com', '$2a$10$XpX3L7kQ9vq6J2W1R8tZUe3d6Y5f4G3H2jK1L0M9N8O7P6Q5V4I3', 'Carlos', 'Rodríguez', '987654323'),

-- Ana789Torres
('ana.torres@gmail.com', '$2a$10$YtT4R7U2I1O0P9Q8W7E6D5F4G3H2J1K0L9M8N7O6P5Q4R3S2T1U0', 'Ana', 'Torres', '987654324'),

-- LuisM2024
('luis.mendoza@outlook.com', '$2a$10$ZrR9U8T2O1Y4E6D5C7B6V5N4M3L2K1J0H9G8F7E6D5C4B3V2N1M0', 'Luis', 'Mendoza', '987654325');




