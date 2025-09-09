import React from 'react'
import { Link } from 'react-router-dom'

export default function OrdenCard({ pedido }){
  const id = pedido.id || pedido.pedidoId || pedido.PedidoId
  return (
    <Link to={`/pedidos/${id}`} className="card mb-2 p-3 text-decoration-none text-dark">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Pedido #{id}</strong>
          <div className="text-muted">Items: {Array.isArray(pedido.items) ? pedido.items.length : pedido.itemsCount || 0}</div>
        </div>
        <div>
          <div>S/ {Number(pedido.total || pedido.monto || 0).toFixed(2)}</div>
          <small className="text-muted">{pedido.estado || pedido.Estado || 'Pendiente'}</small>
        </div>
      </div>
    </Link>
  )
}
