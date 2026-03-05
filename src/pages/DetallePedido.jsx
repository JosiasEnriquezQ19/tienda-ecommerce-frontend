import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API } from '../api'
import { AuthContext } from '../auth/AuthContext'
import { FaStar } from 'react-icons/fa'
import './DetallePedido.css'

export default function DetallePedido() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const pedidoId = id || (pedido && (pedido.id || pedido.pedidoId || pedido.PedidoId))
  const estado = (pedido && (pedido.estado || pedido.Estado)) || 'Pendiente'
  const fecha = pedido && (pedido.fecha || pedido.fechaCreacion || pedido.fechaPedido || pedido.createdAt || pedido.created_on)
  const subtotal = pedido ? Number(pedido.subtotal || pedido.monto || pedido.total || 0) : 0
  const envio = pedido ? Number(pedido.envio || pedido.shippingFee || 0) : 0
  const total = (subtotal + envio).toFixed(2)
  const items = pedido ? (pedido.items || pedido.detalles || pedido.Detalles || []) : []

  const fmtDate = (raw) => {
    if (!raw) return 'Fecha no disponible'
    try { return new Date(raw).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return 'Fecha no disponible' }
  }

  const fmtPrice = (n) => {
    const v = Number(n || 0)
    return v.toFixed(2)
  }

  const normalizeDetalle = (it) => {
    if (!it) return { nombre: 'Producto', imagen: '/placeholder-product.jpg', cantidad: 1, precioUnit: 0, rating: 0, reviews: 0 }
    const prod = it.producto || it.Producto || null
    const nombre = it.nombre || it.Nombre || prod?.nombre || prod?.Nombre || prod?.name || 'Producto'
    const imagenRaw = it.imagen || it.image || prod?.imagen || prod?.imagenUrl || prod?.imageUrl || (Array.isArray(prod?.imagenes) && prod.imagenes[0]) || null
    const imagen = imagenRaw || '/placeholder-product.jpg'
    const cantidad = Number(it.cantidad || it.Cantidad || 1)
    const precioUnit = Number(it.precio || it.Precio || it.precioUnitario || prod?.precio || prod?.Precio || 0)
    const rating = Number(prod?.valoracion || 0)
    const reviews = Number(prod?.numeroRevisiones || 0)
    return { nombre, imagen, cantidad, precioUnit, rating, reviews }
  }

  // Populate missing producto data
  async function ensureProductos(pedidoObj, headers = {}) {
    if (!pedidoObj) return
    const detalles = pedidoObj.items || pedidoObj.detalles || pedidoObj.Detalles || []
    for (const it of detalles) {
      const pid = it.productoId || it.ProductoId || it.producto?.id || it.Producto?.id
      if (!it.producto && pid) {
        try { const r = await axios.get(`${API}/Productos/${pid}`, { headers }); it.producto = r.data } catch { }
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!pedidoId) return
      setLoading(true)
      try {
        const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const r = await axios.get(`${API}/Pedidos/${pedidoId}`, { headers })
        if (!cancelled) {
          await ensureProductos(r.data, headers)
          setPedido(r.data)
        }
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pedidoId])

  if (loading) return (
    <div className="od"><div className="od-center"><div className="od-spinner" /><p style={{ color: '#64748b' }}>Cargando pedido...</p></div></div>
  )

  if (error || !pedido) return (
    <div className="od">
      <div className="od-center">
        <p style={{ color: '#64748b' }}>No se pudo cargar el pedido.</p>
        <Link to="/pedidos" className="od-btn outline" style={{ display: 'inline-flex', marginTop: 16 }}>Volver a mis pedidos</Link>
      </div>
    </div>
  )

  return (
    <div className="od">

      {/* Back */}
      <Link to="/pedidos" className="od-back">
        <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        Mis pedidos
      </Link>

      {/* Header */}
      <div className="od-header">
        <div className="od-header-top">
          <h1>Pedido #{pedidoId}</h1>
          <span className={`od-status ${estado.toLowerCase()}`}>{estado}</span>
        </div>
        <div className="od-meta">
          <div className="od-meta-item">
            <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" /></svg>
            {fmtDate(fecha)}
          </div>
          {pedido?.direccion && (
            <div className="od-meta-item">
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
              {pedido.direccion?.calle || pedido.direccion?.linea || (typeof pedido.direccion === 'string' ? pedido.direccion : '')}
              {pedido.direccion?.ciudad && `, ${pedido.direccion.ciudad}`}
            </div>
          )}
          <div className="od-meta-item">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            {user?.nombre || user?.Nombre || 'Cliente'}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="od-card">
        <div className="od-card-head">Productos ({items.length})</div>
        {items.length === 0 ? (
          <div className="od-empty-items">No hay productos en este pedido</div>
        ) : (
          <table className="od-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const n = normalizeDetalle(it)
                return (
                  <tr key={it.productoId || it.ProductoId || it.id || idx}>
                    <td>
                      <div className="od-prod">
                        <img src={n.imagen} alt={n.nombre} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{n.nombre}</span>
                          {(n.reviews > 0 || n.rating > 0) && (
                            <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', fontSize: '10px', marginTop: '2px', alignItems: 'center' }}>
                              {[...Array(5)].map((_, i) => (
                                <FaStar key={i} style={{ opacity: i < Math.round(n.rating) ? 1 : 0.2 }} />
                              ))}
                              {n.reviews > 0 && <span style={{ color: '#94a3b8', fontSize: '9px', marginLeft: '4px' }}>({n.reviews})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{n.cantidad}</td>
                    <td>S/ {fmtPrice(n.precioUnit)}</td>
                    <td style={{ fontWeight: 600 }}>S/ {fmtPrice(n.precioUnit * n.cantidad)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Summary inside same card */}
        <div className="od-summary">
          <div className="od-totals">
            <div className="od-total-row">
              <span>Subtotal</span>
              <span>S/ {fmtPrice(subtotal)}</span>
            </div>
            <div className={`od-total-row ${envio === 0 ? 'free' : ''}`}>
              <span>Envio</span>
              <span>{envio === 0 ? 'Gratis' : `S/ ${fmtPrice(envio)}`}</span>
            </div>
            <div className="od-total-row grand">
              <span>Total</span>
              <span>S/ {total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="od-actions">
        <Link to="/pedidos" className="od-btn outline">
          <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          Volver a pedidos
        </Link>
        {estado.toLowerCase() === 'pendiente' && (
          <button
            className="od-btn primary"
            onClick={() => {
              navigate('/pago-qr', {
                state: {
                  pedidoId, total,
                  correo: user?.email || user?.correo || '',
                  telefono: user?.telefono || ''
                }
              })
            }}
          >
            Pagar ahora
          </button>
        )}
      </div>

    </div>
  )
}