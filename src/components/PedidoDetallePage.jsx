import React, { useEffect, useState, useContext } from 'react'
import { API } from '../api'
import axios from 'axios'
import { AuthContext } from '../auth/AuthContext'
import FacturaView from './FacturaView'

export default function PedidoDetallePage({ pedidoId, usuarioId }) {
  const [pedido, setPedido] = useState(null)
  const [metodos, setMetodos] = useState([])
  const [selectedMetodoId, setSelectedMetodoId] = useState(null)
  const [factura, setFactura] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useContext(AuthContext)

  useEffect(() => { loadPedido(); loadMetodos(); }, [])

  async function loadPedido() {
    try {
      const r = await fetch(`${API}/Pedidos/${pedidoId}`)
      if (!r.ok) throw new Error(await r.text())
      setPedido(await r.json())
    } catch (e) { setError(e.message || 'Error cargando pedido') }
  }

  async function loadMetodos() {
    try {
      const r = await fetch(`${API}/MetodosPago/usuario/${usuarioId}`)
      if (!r.ok) throw new Error(await r.text())
      setMetodos(await r.json())
    } catch (e) { /* do not block UI */ }
  }

  async function generarComprobante() {
    setError(null)
    if (!pedido) return
    setLoading(true)
    try {
      const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
      const resp = await fetch(`${API}/Pedidos/${pedidoId}/pagar`, { method: 'POST', headers, body: JSON.stringify({ metodoPagoId: selectedMetodoId || undefined }) })
      if (resp.status === 201 || resp.status === 200) {
        const f = await resp.json()
        setFactura(f)
        await loadPedido()
        setLoading(false)
        return
      }
      const txt = await resp.text()
      throw new Error(txt || `Error ${resp.status}`)
    } catch (e) {
      setError(e.message || 'Error al generar comprobante')
      setLoading(false)
    }
  }

  function findOrderItems(order) {
    if (!order) return [];
    // Propiedades comunes donde pueden estar los items
    const itemProperties = [
      'detalles', 'Detalles', 'items', 'Items', 'productos', 'Productos',
      'lineItems', 'orderItems', 'detalle', 'Detalle', 'articulos', 'Articulos'
    ];

    // Buscar en propiedades de nivel superior
    for (const prop of itemProperties) {
      if (order[prop] && Array.isArray(order[prop]) && order[prop].length > 0) {
        console.log(`Encontrados items en propiedad: ${prop}`, order[prop]);
        return order[prop];
      }
    }
    
    // Buscar en propiedades anidadas
    for (const prop of ['detalle', 'Detalle', 'order', 'Order']) {
      if (order[prop]) {
        for (const innerProp of itemProperties) {
          if (order[prop][innerProp] && Array.isArray(order[prop][innerProp]) && order[prop][innerProp].length > 0) {
            return order[prop][innerProp];
          }
        }
      }
    }
    
    console.warn('No se encontraron items en el pedido:', order);
    return [];
  };

  function computeTotalsFromPedido(p) {
    if (!p) return { subtotal:0, impuestos:0, total:0 }
    
    // Buscar en propiedades directas del pedido primero
    if (typeof p.subtotal === 'number' && typeof p.impuestos === 'number' && typeof p.total === 'number') {
      return {
        subtotal: p.subtotal,
        impuestos: p.impuestos,
        total: p.total
      };
    }
    
    // Si no, calcular desde los detalles
    const items = findOrderItems(p);
    const subtotal = items.reduce((s, d) => {
      const precio = d.precioUnitario || d.PrecioUnitario || d.precio || d.Precio || 
                    (d.producto ? (d.producto.precio || d.producto.Precio || 0) : 0);
      const cantidad = d.cantidad || d.Cantidad || d.qty || d.quantity || 1;
      return s + (Number(precio) * Number(cantidad));
    }, 0);
    
    const impuestos = Math.round(subtotal * 0.18 * 100)/100;
    const total = Math.round((subtotal + impuestos) * 100)/100;
    
    return { subtotal, impuestos, total };
  }

  return (
    <div>
      <h2>Pedido #{pedidoId}</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      {!pedido ? <div>Cargando pedido...</div> : (
        <>
          <h3>Items</h3>
          <ul>
            {findOrderItems(pedido).map((d, index) => {
              const producto = d.producto || d.Producto || {};
              const nombre = d.nombre || d.Nombre || producto.nombre || producto.Nombre || 
                            producto.name || `Producto #${d.productoId || d.ProductoId || index+1}`;
              const cantidad = d.cantidad || d.Cantidad || d.qty || d.quantity || 1;
              const precio = d.precioUnitario || d.PrecioUnitario || d.precio || d.Precio || 
                          producto.precio || producto.Precio || 0;
              
              return (
                <li key={d.detallePedidoId || d.id || d.detalleId || `item-${index}`}>
                  {cantidad} x {nombre} — S/ {Number(precio).toFixed(2)}
                  {producto.imagen || producto.imagenUrl ? (
                    <img 
                      src={producto.imagen || producto.imagenUrl} 
                      alt={nombre}
                      style={{height: '50px', marginLeft: '10px', verticalAlign: 'middle'}}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div>
            <label>Seleccionar método de pago: </label>
            <select value={selectedMetodoId ?? ''} onChange={e => setSelectedMetodoId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">(usar método del pedido)</option>
              {metodos.map(m => <option key={m.metodoPagoId} value={m.metodoPagoId}>{m.titular ?? 'Titular'} — ****{m.ultimosCuatroDigitos}</option>)}
            </select>
          </div>

          <button onClick={generarComprobante} disabled={loading || pedido.estado === 'pagado'}>{loading ? 'Generando...' : 'Generar comprobante'}</button>
        </>
      )}

      {factura && <FacturaView factura={factura} onPrint={() => window.print()} />}

      {!factura && pedido && (
        <div style={{marginTop:20}}>
          <h4>Previsualizar totales</h4>
          {(() => {
            const t = computeTotalsFromPedido(pedido)
            return <div>Subtotal: S/ {t.subtotal.toFixed(2)} — Impuestos: S/ {t.impuestos.toFixed(2)} — Total: S/ {t.total.toFixed(2)}</div>
          })()}
        </div>
      )}
    </div>
  )
}
