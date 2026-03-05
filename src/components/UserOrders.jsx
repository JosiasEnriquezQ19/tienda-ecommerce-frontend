import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../api'
import { fetchPedidosPorUsuario, fetchPedidoDetalle } from '../api/pedidosApi'

/* ── Helpers ── */
const normalizeItem = (it) => {
  if (!it) return { imagen: null, nombre: 'Producto', cantidad: 1, precio: 0 }
  const prod = it.producto || it.Producto || it
  const imagen =
    it.imagen || it.image || it.imagenUrl || it.imageUrl || it.urlImagen ||
    prod.imagen || prod.image || prod.imagenUrl || prod.imageUrl ||
    prod.urlImagen || prod.imagenes?.[0] || null
  const nombre =
    it.nombre || it.Nombre || it.name || it.title ||
    prod.nombre || prod.Nombre || prod.name || 'Producto'
  const cantidad = it.cantidad || it.Cantidad || it.qty || it.quantity || 1
  const precio =
    it.precioUnitario || it.PrecioUnitario || it.unitPrice ||
    it.precio || it.Precio || it.price ||
    prod.precio || prod.Precio || prod.price || 0
  return { imagen, nombre, cantidad, precio }
}

const normalizeImageUrl = (src) => {
  if (!src) return null
  if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) return src
  if (typeof src === 'string' && src.startsWith('/')) {
    try { return new URL(window.location.origin).origin + src } catch { return src }
  }
  return src
}

const findOrderItems = (order) => {
  const props = ['detalles', 'Detalles', 'items', 'Items', 'productos', 'Productos', 'lineItems', 'orderItems', 'detalle', 'Detalle', 'articulos']
  for (const p of props) {
    if (order[p] && Array.isArray(order[p]) && order[p].length > 0) return order[p]
  }
  for (const p of ['detalle', 'Detalle', 'order', 'Order']) {
    if (order[p]) {
      for (const ip of props) {
        if (order[p][ip] && Array.isArray(order[p][ip]) && order[p][ip].length > 0) return order[p][ip]
      }
    }
  }
  return []
}

const fmtDate = (raw) => {
  if (!raw) return 'Sin fecha'
  try {
    return new Date(raw).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return 'Sin fecha' }
}

const fmtPrice = (n) => {
  const v = Number(n || 0)
  return v % 1 === 0 ? v.toLocaleString('es-PE') : v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── Component ── */
export function UserOrders({ usuarioId, token }) {
  const [pedidos, setPedidos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingDetalles, setLoadingDetalles] = useState({})

  const cargarDetalles = async (pedidoId) => {
    if (!pedidoId) return null
    setLoadingDetalles(p => ({ ...p, [pedidoId]: true }))
    try {
      const data = await fetchPedidoDetalle(pedidoId, token)
      setLoadingDetalles(p => ({ ...p, [pedidoId]: false }))
      return data
    } catch {
      setLoadingDetalles(p => ({ ...p, [pedidoId]: false }))
      return null
    }
  }

  // Auto-load details for orders missing items
  useEffect(() => {
    let mounted = true
    if (!pedidos || pedidos.length === 0) return
    const missing = pedidos.filter(p => {
      const d = p.detalles || p.items || p.productos || []
      return !Array.isArray(d) || d.length === 0
    }).slice(0, 5)

    missing.forEach(async (p) => {
      const id = p.pedidoId || p.id || p.PedidoId
      if (!id) return
      const det = await cargarDetalles(id)
      if (det && mounted) {
        setPedidos(prev => prev.map(pp =>
          (pp.pedidoId || pp.id || pp.PedidoId) === id ? { ...pp, detalles: det.detalles } : pp
        ))
      }
    })
    return () => { mounted = false }
  }, [pedidos, token])

  // Fetch orders
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!usuarioId && usuarioId !== 0) throw new Error('Usuario no identificado')
        const data = await fetchPedidosPorUsuario(usuarioId, token)
        const arr = Array.isArray(data) ? data : (data?.data || [])
        const filtered = arr.filter(p => {
          const puid = p.usuarioId || p.UsuarioId || p.userId
          return !puid || String(puid) === String(usuarioId)
        })
        if (mounted) setPedidos(filtered)
      } catch (e) {
        if (mounted) setPedidos([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [usuarioId, token])

  /* ── States ── */
  if (loading) return (
    <div className="op-center">
      <div className="op-spinner" />
      <p style={{ color: '#64748b', fontSize: 14 }}>Cargando tus pedidos...</p>
    </div>
  )

  if (error) return (
    <div className="op-error-card">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
      <h3>No pudimos cargar tus pedidos</h3>
      <p>Intenta de nuevo en unos minutos.</p>
      <button onClick={() => window.location.reload()} className="op-btn-retry">Reintentar</button>
    </div>
  )

  if (!pedidos || pedidos.length === 0) return (
    <div className="op-empty">
      <svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
      <h3>No tienes pedidos</h3>
      <p>Cuando realices una compra, aparecera aqui</p>
      <Link to="/">Ir a la tienda</Link>
    </div>
  )

  /* ── Render ── */
  return (
    <div className="op-list">
      {pedidos.map((p, idx) => {
        const orderId = p.pedidoId || p.id || p.PedidoId
        const estado = (p.estado || p.Estado || 'pendiente').toLowerCase()
        const fecha = p.fecha || p.fechaPedido || p.createdAt || p.created_on || null
        const totalVal = Number(p.total || p.monto || p.valor || p.subtotal || 0)
        const detalles = findOrderItems(p)
        const isLoadingItems = loadingDetalles[orderId]

        return (
          <div key={orderId || idx} className="op-card">
            {/* Top bar */}
            <div className="op-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="op-card-id">Pedido #{orderId}</span>
                <span className={`op-status ${estado}`}>{p.estado || p.Estado || 'Pendiente'}</span>
              </div>
              <span className="op-card-date">{fmtDate(fecha)}</span>
            </div>

            {/* Body */}
            <div className="op-card-body">
              <div className="op-thumbs">
                {detalles.length > 0 ? (
                  detalles.slice(0, 4).map((itRaw, i) => {
                    const it = normalizeItem(itRaw)
                    return (
                      <div key={itRaw.productoId || itRaw.ProductoId || itRaw.id || i} className="op-thumb">
                        <img src={normalizeImageUrl(it.imagen) || '/placeholder-product.jpg'} alt={it.nombre} />
                        <div className="op-thumb-info">
                          <span className="op-thumb-name">{it.nombre}</span>
                          <span className="op-thumb-meta">x{it.cantidad} &middot; S/ {fmtPrice(it.precio)}</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="op-no-items">
                    {isLoadingItems ? (
                      <span style={{ color: '#94a3b8' }}>Cargando productos...</span>
                    ) : (
                      <>
                        <span>Sin detalles disponibles</span>
                        <br />
                        <button
                          className="op-load-btn"
                          onClick={async () => {
                            const det = await cargarDetalles(orderId)
                            if (det?.detalles?.length > 0) {
                              setPedidos(prev => prev.map(pp =>
                                (pp.pedidoId || pp.id || pp.PedidoId) === orderId
                                  ? { ...pp, detalles: det.detalles } : pp
                              ))
                            }
                          }}
                        >
                          Cargar productos
                        </button>
                      </>
                    )}
                  </div>
                )}
                {detalles.length > 4 && (
                  <div className="op-thumb" style={{ alignItems: 'center', justifyContent: 'center', minWidth: 60, background: '#f1f5f9' }}>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>+{detalles.length - 4}</span>
                  </div>
                )}
              </div>

              <div className="op-card-total">
                <span className="op-card-total-label">Total</span>
                <div className="op-card-total-amount">S/ {fmtPrice(totalVal)}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="op-card-footer">
              <Link
                to={`/pedidos/${orderId}`}
                className="op-btn-detail"
                state={{ pedido: p }}
              >
                Ver detalles
                <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
