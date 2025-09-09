// Lightweight TypeScript interfaces to describe API DTOs used by DetallePedido
// This file is optional but helps editors (VSCode) with intellisense when using JS files.

interface ProductoDto {
  productoId?: number
  id?: number
  nombre?: string
  Nombre?: string
  precio?: number
  Precio?: number
  imagen?: string
  imagenUrl?: string
  sku?: string
  SKU?: string
}

interface DetallePedidoDto {
  productoId?: number
  ProductoId?: number
  cantidad?: number
  Cantidad?: number
  precio?: number
  Precio?: number
  precioUnitario?: number
  producto?: ProductoDto
  Producto?: ProductoDto
  imagen?: string
  nombre?: string
  Nombre?: string
}

interface PedidoDto {
  pedidoId?: number
  PedidoId?: number
  id?: number
  items?: DetallePedidoDto[]
  detalles?: DetallePedidoDto[]
  Detalles?: DetallePedidoDto[]
  subtotal?: number
  total?: number
  fecha?: string
  fechaPedido?: string
  fechaCreacion?: string
  estado?: string
  Estado?: string
  direccion?: any
  metodoPago?: any
}
