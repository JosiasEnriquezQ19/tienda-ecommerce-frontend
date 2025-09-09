import React from 'react'

export default function FacturaView({ factura, onPrint }) {
  const pedido = factura.pedido
  const numero = factura.numeroFactura || factura.numero || factura.numero_factura || factura.numeroFacturaId
  const fecha = factura.fechaEmision || factura.fecha || factura.fecha_emision
  const items = factura.items || factura.detalles || factura.lineItems || factura.detallesPedido || []
  const fmt = v => Number(v || 0).toFixed(2)

  return (
    <div style={{border:'1px solid #ccc', padding:16, marginTop:20}}>
      <header>
        <h1>FACTURA</h1>
        <div>Nº: {numero}</div>
        <div>Fecha: {fecha ? new Date(fecha).toLocaleString() : '—'}</div>
      </header>

      <section style={{marginTop:12}}>
        <strong>Titular:</strong> {factura.metodoPago?.titular || factura.metodoPago?.Titular || pedido?.metodoPago?.titular || pedido?.metodoPago?.Titular || '---'}
      </section>

      <section style={{marginTop:12}}>
        <h3>Detalles</h3>
        {pedido && (pedido.detalles || pedido.items || []).length>0 ? (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Importe</th></tr>
            </thead>
            <tbody>
              {(pedido.detalles || pedido.items || []).map(d => (
                <tr key={d.detallePedidoId || d.id || Math.random()}>
                  <td>{d.producto?.nombre ?? d.nombre ?? `#${d.productoId}`}</td>
                  <td>{d.cantidad}</td>
                  <td>S/ {fmt(d.precioUnitario || d.precio)}</td>
                  <td>S/ {fmt((d.precioUnitario || d.precio) * (d.cantidad || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div>No hay items en esta factura</div>}
      </section>

	  <section style={{textAlign:'right', marginTop:12}}>
        <div>Subtotal: S/ {fmt(factura.subtotal)}</div>
        {/* Impuestos ocultos porque no aplica facturación electrónica */}
        {/* <div>Impuestos: S/ {fmt(factura.impuestos)}</div> */}
        <div><strong>Total: S/ {fmt(factura.subtotal)}</strong></div>
      </section>

      <div style={{marginTop:12}}>
        <button onClick={onPrint}>Imprimir / Descargar</button>
      </div>
    </div>
  )
}
