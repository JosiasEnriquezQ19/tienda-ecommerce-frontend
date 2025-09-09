import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API } from '../api'
import { AuthContext } from '../auth/AuthContext'
import './DetallePedido.css'

export default function DetallePedido() {
  const { id } = useParams()
  const { user } = useContext(AuthContext)
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [successBanner, setSuccessBanner] = useState(null)

  const pedidoId = id || (pedido && (pedido.id || pedido.pedidoId || pedido.PedidoId))
  const estado = (pedido && (pedido.estado || pedido.Estado)) || 'Pendiente'
  const fecha = pedido && (pedido.fecha || pedido.fechaCreacion || pedido.fechaPedido || pedido.createdAt || pedido.created_on || pedido.created || (pedido.factura && (pedido.factura.fechaEmision || pedido.factura.fecha)))
  // El total ahora es solo subtotal + envío, sin impuestos
  const subtotal = pedido ? Number(pedido.subtotal || pedido.monto || pedido.total || 0) : 0;
  const envio = pedido ? Number(pedido.envio || pedido.shippingFee || 0) : 0;
  const total = (subtotal + envio).toFixed(2);
  const items = pedido ? (pedido.items || pedido.detalles || pedido.Detalles || []) : []

  // Offer: 15% off when 2+ products within 3 days window from creation
  const itemsCount = Array.isArray(pedido?.detalles) ? pedido.detalles.length : (Array.isArray(pedido?.items) ? pedido.items.length : (pedido?.cantidadItems || pedido?.itemsCount || 0))
  const createdAt = pedido?.fecha || pedido?.fechaPedido || pedido?.createdAt || pedido?.created_on || pedido?.created || null
  const createdDate = createdAt ? new Date(createdAt) : null
  const now = new Date()
  const within3Days = createdDate ? ((now - createdDate) / (1000 * 60 * 60 * 24)) <= 3 : false
  const offerEligible = itemsCount >= 2 && within3Days
  const subtotalRaw = subtotal;
  const discountedTotal = offerEligible ? Number((subtotalRaw * 0.85).toFixed(2)) : subtotalRaw;

  // helper: fetch producto DTOs for any detalle missing producto
  async function ensureProductosPopulated(pedidoObj, headers = {}) {
    if (!pedidoObj) return
    const detalles = pedidoObj.items || pedidoObj.detalles || pedidoObj.Detalles || []
    for (const it of detalles) {
      const productoId = it.productoId || it.ProductoId || it.id || it.producto?.id || it.Producto?.id
      if (!it.producto && productoId) {
        try {
          const r = await axios.get(`${API}/Productos/${productoId}`, { headers })
          it.producto = r.data
        } catch (e) {
          console.warn('No se pudo obtener producto', productoId, e)
        }
      }
    }
  }

  // normalize detalle item for display (robust against different DTO shapes)
  const normalizeDetalle = (it) => {
    if (!it) return { nombre: 'Producto', imagen: '/placeholder-product.jpg', cantidad: 1, precioUnit: 0 }
    const producto = it.producto || it.Producto || null
    const nombre = it.nombre || it.Nombre || producto?.nombre || producto?.Nombre || producto?.title || 'Producto'
    const imagenRaw = it.imagen || it.image || producto?.imagen || producto?.imagenUrl || producto?.imageUrl || (Array.isArray(producto?.imagenes) && producto.imagenes[0]) || null
    const imagen = (typeof imagenRaw === 'string' && imagenRaw.length) ? imagenRaw : '/placeholder-product.jpg'
    const cantidad = Number(it.cantidad || it.Cantidad || it.qty || it.cantidadOrdenada || 1)
    const precioUnit = Number(it.precio || it.Precio || it.precioUnitario || producto?.precio || producto?.Precio || 0)
    return { nombre, imagen, cantidad, precioUnit }
  }

  // load pedido by id if not provided via navigation state
  useEffect(() => {
    let cancelled = false
    async function loadPedido() {
      if ((!pedido || !pedido.id) && pedidoId) {
        setLoading(true)
        try {
          const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
          const headers = token ? { Authorization: `Bearer ${token}` } : {}
          const r = await axios.get(`${API}/Pedidos/${pedidoId}`, { headers })
          if (!cancelled) setPedido(r.data)
        } catch (e) {
          console.warn('No se pudo cargar el pedido', e)
          if (!cancelled) setError(e)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
    }
    loadPedido()
    return () => { cancelled = true }
  }, [pedidoId])

  return (
    <div className="ae-order-detail-container">
      <div className="ae-order-detail-card">
        {successBanner && (
          <div className={`ae-success-banner ${successBanner.type || ''}`} role="status">
            {successBanner.message}
          </div>
        )}
        <div className="ae-order-header">
          <div className="ae-order-title">
            <h1>Detalle del Pedido #{pedidoId}</h1>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div className={`ae-order-status ae-status-${estado.toLowerCase()}`}>
                {estado}
              </div>
              {offerEligible && (
                <div style={{background:'#fef3c7',color:'#92400e',padding:'6px 10px',borderRadius:6,fontSize:13}}>
                  Oferta 15% aplicada • expira {createdDate ? new Date(createdDate.getTime() + 3*24*60*60*1000).toLocaleDateString() : '—'}
                </div>
              )}
            </div>
          </div>
          
            <div className="ae-order-meta">
            {pedido?.direccion && (
              <div className="ae-order-address">
                <strong>Envío:</strong> {pedido.direccion?.calle || pedido.direccion?.linea || pedido.direccion}
                {pedido.direccion?.ciudad && `, ${pedido.direccion.ciudad}`}
              </div>
            )}
            <div className="ae-order-payment">
              {pedido?.metodoPago ? (
                <>
                  <strong>Método:</strong> {pedido.metodoPago?.tipo || pedido.metodoPago?.tipoTarjeta || 'Tarjeta'} •••• {String(pedido.metodoPago?.ultimosCuatroDigitos || pedido.metodoPago?.last4 || pedido.metodoPago?.ultimos || '').slice(-4)}
                  <div style={{fontSize:13,color:'#6b7280',marginTop:6}}>Titular: {pedido.metodoPago?.titular || pedido.metodoPago?.Titular || user?.nombre || user?.Nombre || '—'}</div>
                </>
              ) : (
                <div style={{fontSize:13,color:'#6b7280'}}>Titular: {user?.nombre || user?.Nombre || '—'}</div>
              )}
            </div>
            <div className="ae-order-date">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
              </svg>
              {fecha ? new Date(fecha).toLocaleDateString() : 'Fecha no disponible'}
            </div>
            <div style={{marginTop:8}}>
              <button className="ae-secondary-button" onClick={async ()=>{
                if (!pedido) { alert('Pedido no cargado aún. Intenta de nuevo en unos segundos.'); return }
                try {
                  setLoading(true)
                  const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
                  const headers = token ? { Authorization: `Bearer ${token}` } : {}
                  await ensureProductosPopulated(pedido, headers)
                  setPedido({ ...(pedido || {}) })
                  alert('Productos actualizados (si estaban disponibles en la API).')
                } catch(e){ console.error(e); alert('No se pudieron actualizar los productos. Revisa consola.') } finally{ setLoading(false) }
              }}>Refrescar productos</button>
            </div>
            
            {/* Invoice link removed from header to avoid duplication; action placed in actions area */}
          </div>

        </div>

        <div className="ae-order-section">
          <h2>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
            Productos
          </h2>

          <div className="ae-order-items">
            {items.length === 0 ? (
              <div className="ae-order-empty">No hay productos en este pedido</div>
            ) : (
              <table className="ae-order-items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const n = normalizeDetalle(it)
                    const key = (it && (it.productoId || it.ProductoId || it.id)) || idx
                    return (
                      <tr key={key}>
                        <td>
                          <div className="ae-order-item">
                            <div className="ae-order-item-image">
                              <img src={n.imagen} alt={n.nombre} />
                            </div>
                            <div className="ae-order-item-details">
                              <h3>{n.nombre}</h3>
                            </div>
                          </div>
                        </td>
                        <td>{n.cantidad}</td>
                        <td>S/ {Number(n.precioUnit || 0).toFixed(2)}</td>
                        <td>S/ {Number((n.precioUnit || 0) * (n.cantidad || 1)).toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ae-order-summary">
          <div className="ae-order-totals">
            <div className="ae-order-total-row">
              <span>Subtotal:</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="ae-order-total-row">
              <span>Envío:</span>
              <span>S/ {envio.toFixed(2)}</span>
            </div>
            {/* Impuestos ocultos porque no aplica facturación electrónica */}
            {/* <div className="ae-order-total-row">
              <span>Impuestos:</span>
              <span>S/ {Number(pedido?.impuestos || pedido?.tax || 0).toFixed(2)}</span>
            </div> */}
            <div className="ae-order-total-row ae-order-grand-total">
              <span>Total:</span>
              <span>S/ {total}</span>
            </div>
            {offerEligible && (
              <div className="ae-order-total-row" style={{marginTop:8,fontWeight:600,color:'#047857'}}>
                <span>Precio con oferta (15%):</span>
                <span>S/ {discountedTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ae-order-actions">
          <Link to="/pedidos" className="ae-order-back-link">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Volver a mis pedidos
          </Link>
          <button className="ae-order-contact-button">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            Contactar al soporte
          </button>
          {pedido && (() => {
            // Obtener el estado en minúsculas para comparación
            const estadoLower = estado.toLowerCase();
            // Mostrar el botón solo si está en estado pendiente
            // Ocultar para estados: procesando, enviado, entregado
            if (estadoLower === 'pendiente') {
              return (
                <button
                  className="ae-login-button"
                  onClick={() => {
                    const userId = user?.id || user?.usuarioId || '';
                    navigate('/pago-qr', { 
                      state: { 
                        pedidoId, 
                        total, 
                        qrUrl: 'https://e7.pngegg.com/pngimages/673/538/png-clipart-qr-code-computer-scan-stick-platform-hero-computer-text-rectangle.png', 
                        correo: user?.email || user?.correo || '', 
                        telefono: user?.telefono || '' 
                      } 
                    });
                  }}
                >
                  Pagar ahora
                </button>
              );
            }
            // No renderizar nada si el estado no es pendiente
            return null;
          })()}
        </div>
      </div>
    </div>
  )
}