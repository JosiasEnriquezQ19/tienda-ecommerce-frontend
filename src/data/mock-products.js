// Datos simulados para desarrollo cuando el backend no está disponible
export const mockProducts = [
  {
    productoId: 1,
    nombre: "iPhone 15 Pro",
    descripcion: "El iPhone más avanzado con chip A17 Pro y cámara de 48MP",
    precio: 3999.99,
    imagenUrl: "https://images.unsplash.com/photo-1592286261019-8363d8d9d2a9?w=400",
    categoria: "Celulares",
    destacado: true,
    stock: 25,
    rating: 4.8,
    reviews: 156,
    estado: "disponible"
  },
  {
    productoId: 2,
    nombre: "MacBook Pro M3",
    descripcion: "Laptop profesional con chip M3 y pantalla Retina de 14 pulgadas",
    precio: 5999.99,
    imagenUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    categoria: "Laptops",
    destacado: true,
    stock: 15,
    rating: 4.9,
    reviews: 89,
    estado: "disponible"
  },
  {
    productoId: 3,
    nombre: "AirPods Pro 3ra Gen",
    descripcion: "Audífonos inalámbricos con cancelación de ruido activa",
    precio: 799.99,
    imagenUrl: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400",
    categoria: "Audífonos",
    destacado: false,
    stock: 50,
    rating: 4.7,
    reviews: 234,
    estado: "disponible"
  },
  {
    productoId: 4,
    nombre: "Samsung Galaxy S24 Ultra",
    descripcion: "Smartphone Android premium con S Pen y cámara de 200MP",
    precio: 3799.99,
    imagenUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
    categoria: "Celulares",
    destacado: true,
    stock: 30,
    rating: 4.6,
    reviews: 178,
    estado: "disponible"
  },
  {
    productoId: 5,
    nombre: "Dell XPS 13",
    descripcion: "Ultrabook compacta con procesador Intel de 13va generación",
    precio: 4299.99,
    imagenUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
    categoria: "Laptops",
    destacado: false,
    stock: 20,
    rating: 4.5,
    reviews: 92,
    estado: "disponible"
  },
  {
    productoId: 6,
    nombre: "Sony WH-1000XM5",
    descripcion: "Audífonos over-ear con la mejor cancelación de ruido del mercado",
    precio: 1299.99,
    imagenUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
    categoria: "Audífonos",
    destacado: false,
    stock: 35,
    rating: 4.8,
    reviews: 267,
    estado: "disponible"
  },
  {
    productoId: 7,
    nombre: "iPad Pro 12.9",
    descripción: "Tablet profesional con chip M2 y pantalla Liquid Retina XDR",
    precio: 3499.99,
    imagenUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    categoria: "Tecnologia",
    destacado: true,
    stock: 18,
    rating: 4.7,
    reviews: 143,
    estado: "disponible"
  },
  {
    productoId: 8,
    nombre: "Google Pixel 8 Pro",
    descripcion: "Smartphone con IA avanzada y cámara computacional",
    precio: 3299.99,
    imagenUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    categoria: "Celulares",
    destacado: false,
    stock: 22,
    rating: 4.5,
    reviews: 98,
    estado: "disponible"
  }
];

export const mockUserAddresses = [
  {
    direccionId: 1,
    alias: "Casa",
    calle: "Av. Javier Prado 123",
    ciudad: "Lima",
    estado: "Lima",
    pais: "Perú",
    codigoPostal: "15001",
    telefono: "987654321",
    esPrincipal: true
  }
];

export const mockPaymentMethods = [
  {
    metodoPagoId: 1,
    tipoTarjeta: "Visa",
    ultimosCuatroDigitos: "1234",
    titular: "Juan Pérez",
    mesExpiracion: 12,
    anioExpiracion: 2025,
    esPrincipal: true
  }
];
