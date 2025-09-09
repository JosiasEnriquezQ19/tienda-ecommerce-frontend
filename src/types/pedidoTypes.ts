export type ProductoDto = { productoId:number; nombre:string; precio:number; imagenUrl?:string };
export type DetallePedidoDto = { detallePedidoId:number; pedidoId:number; productoId:number; cantidad:number; precioUnitario:number; producto?:ProductoDto | null };
export type PedidoDto = {
  pedidoId:number;
  usuarioId:number;
  direccionId:number;
  metodoPagoId:number;
  subtotal:number;
  impuestos:number;
  total:number;
  estado:string;
  fechaPedido:string;
  numeroSeguimiento?:string | null;
  detalles: DetallePedidoDto[];
};
