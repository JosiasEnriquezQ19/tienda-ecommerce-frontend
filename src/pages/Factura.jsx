import React, { useEffect, useState, useContext } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API } from '../api'
import { AuthContext } from '../auth/AuthContext'
import './Factura.css'

// track in-flight pedidoId requests to avoid duplicate network calls (React StrictMode)
const inFlightPedidos = new Set()

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function Factura() {
  const { id } = useParams()
  const query = useQuery()
  const pedidoId = query.get('pedidoId')
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const location = useLocation()
  // prefer factura/pedido passed through navigation state (DetallePedido should send { pedido })
  const initialState = (location && location.state) ? location.state : (typeof window !== 'undefined' && window.history && window.history.state ? window.history.state : null)
  const [factura, setFactura] = useState(initialState && initialState.factura ? initialState.factura : null)
  const [pedido, setPedido] = useState(initialState && initialState.pedido ? initialState.pedido : null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // If the initial factura is a primitive (id) or lacks date/status fields, try to fetch a full factura object
  useEffect(() => {
    let mounted = true
    async function ensureFacturaObject() {
      try {
        if (!factura) return
        // if factura is a primitive id (string/number) or not an object with expected fields, try to fetch it
        const isPrimitive = (typeof factura === 'string' || typeof factura === 'number')
        // also accept literal keys like 'fecha de emision' (with/without accent) and underscored variants
        const hasFields = factura && (
          factura.fechaEmision ||
          (factura['fecha de emision'] || factura['fecha de emisión']) ||
          factura.fecha ||
          factura.fecha_emision ||
          factura.numero || factura.id || factura.facturaId
        )
        if (!hasFields || isPrimitive) {
          const fid = isPrimitive ? String(factura) : (factura.id || factura.facturaId || factura.numero || null)
          if (!fid) return
          const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
          const headers = token ? { Authorization: `Bearer ${token}` } : {}
          try {
            const r = await axios.get(`${API}/Facturas/${fid}`, { headers })
            if (mounted && r && r.data) {
              setFactura(r.data)
              // if factura includes pedido embed, set it too
              if (r.data.pedido) setPedido(r.data.pedido)
            }
          } catch (e) {
            // try query by pedidoId as fallback
            try {
              const r2 = await axios.get(`${API}/Facturas`, { params: { pedidoId: fid }, headers })
              if (mounted && r2 && r2.data) {
                // normalize responses that may be arrays
                const data = Array.isArray(r2.data) ? (r2.data[0] || null) : (r2.data && r2.data[0] ? r2.data[0] : r2.data)
                if (data) setFactura(data)
              }
            } catch (e2) { /* ignore */ }
          }
        }
      } catch (ex) { /* ignore */ }
    }
    ensureFacturaObject()
    return () => { mounted = false }
  }, [factura, user])

  // If navigation provided a factura via location.state but it's missing date/estado, fetch the full factura
  useEffect(() => {
    let mounted = true
    async function fixPartialFromLocation() {
      try {
        const navFact = location && location.state && location.state.factura ? location.state.factura : null
        if (!navFact) return
  // accept 'fecha de emision' (with/without accent) used by some backends
  const hasDate = navFact?.fechaEmision || (navFact && (navFact['fecha de emision'] || navFact['fecha de emisión'])) || navFact?.fecha || navFact?.fecha_emision || navFact?.createdAt || navFact?.issuedAt
        const hasEstado = navFact?.estadoPago || navFact?.estado || navFact?.status || navFact?.paymentStatus
        if (hasDate && hasEstado) return
        const fid = navFact?.id || navFact?.facturaId || navFact?.numero || null
        const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        if (fid) {
          try {
            const r = await axios.get(`${API}/Facturas/${fid}`, { headers })
            if (mounted && r && r.data) {
              setFactura(r.data)
              if (r.data.pedido) setPedido(r.data.pedido)
              return
            }
          } catch (e) { /* ignore */ }
        }
        // fallback: clear factura so the main loader effect will attempt to find by query/id
        if (mounted) setFactura(null)
      } catch (ex) { /* ignore */ }
    }
    fixPartialFromLocation()
    return () => { mounted = false }
  }, [location, user])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // If navigation state provided a pedido with detalles, prefer to build factura from that
        if (pedido && (!factura || !Array.isArray(factura.items) || factura.items.length === 0)) {
          const detalles = pedido.detalles || pedido.items || pedido.Detalles || []
          const detallesArr = Array.isArray(detalles) ? detalles : []
          const itemsFromPedido = detallesArr.map(d => {
            const nombre = d.nombre || d.Nombre || d.producto?.nombre || d.producto?.Nombre || d.productoNombre || 'Producto'
            const cantidad = Number(d.cantidad || d.Cantidad || d.qty || 1)
            const precioUnitario = Number(d.precioUnitario || d.precio || d.Precio || (d.producto && (d.producto.precio || d.producto.price)) || 0)
            const imagen = d.imagen || d.image || (d.producto && (d.producto.imagen || d.producto.imagenUrl || d.producto.image)) || null
            return { nombre, cantidad, precioUnitario, imagen }
          })
          const computedSubtotal = itemsFromPedido.reduce((s, it) => s + (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)), 0)
          const impuestosFromPedido = pedido.impuestos || pedido.tax || (factura && factura.impuestos) || 0
          const totalFromPedido = Number(pedido.total || pedido.monto || (factura && factura.total) || computedSubtotal + Number(impuestosFromPedido || 0))
          const provisional = { ...(factura || {}), items: itemsFromPedido, subtotal: computedSubtotal, impuestos: impuestosFromPedido, total: totalFromPedido, pedido }
          if (!cancelled) {
            setFactura(provisional)
            setLoading(false)
          }
          return
        }

        // If factura already present and has items, nothing to fetch
        if (factura && Array.isArray(factura.items) && factura.items.length > 0) {
          if (!cancelled) setLoading(false)
          return
        }

        let res
        const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        // avoid duplicate concurrent loads for the same pedidoId (helps in StrictMode)
        // eslint-disable-next-line no-use-before-define
        if (pedidoId && inFlightPedidos.has(pedidoId)) {
          // another effect already requested this pedidoId; skip to avoid duplicate logs
          if (!cancelled) return
        }

        if (pedidoId) inFlightPedidos.add(pedidoId)

        try {
          // Prefer query param - many backends expose /Facturas?pedidoId=NN
          try { res = await axios.get(`${API}/Facturas`, { params: { pedidoId }, headers }) } catch (e) { res = null }

          // alternate param name
          if (!res) {
            try { res = await axios.get(`${API}/Facturas`, { params: { orderId: pedidoId }, headers }) } catch (e) { res = null }
          }

          // direct by factura id if user provided 'id' route param
          if (!res && id) {
            try { res = await axios.get(`${API}/Facturas/${id}`, { headers }) } catch (e) { res = null }
          }

          // try resource-style route if present
          if (!res) {
            try { res = await axios.get(`${API}/Facturas/pedido/${pedidoId}`, { headers }) } catch (e) { res = null }
          }

          // POST fallbacks last
          if (!res) {
            try { res = await axios.post(`${API}/Facturas/findByPedido`, { pedidoId }, { headers }) } catch (e) { res = null }
          }
          if (!res) {
            try { res = await axios.post(`${API}/Facturas`, { pedidoId }, { headers }) } catch (e) { res = null }
          }
        } finally {
          if (pedidoId) inFlightPedidos.delete(pedidoId)
        }
        if (!res) {
          // no factura found — try to load pedido details so user can create/pay the factura
          try {
            const p = await axios.get(`${API}/Pedidos/${pedidoId}`, { headers })
            if (!cancelled) setPedido(p.data)
          } catch (pe) {
            // ignore — we'll show a user-friendly message below
          }
        } else {
          if (!cancelled) {
            const fact = res.data
            // If factura includes an embedded pedido object, prefer to populate from it
            const embeddedPedido = fact?.pedido || fact?.Pedido || fact?.order || null
            if (embeddedPedido) {
              try {
                const rawDetalles = embeddedPedido.detalles || embeddedPedido.items || embeddedPedido.Detalles || embeddedPedido.lineItems || embeddedPedido.productos || []
                const detallesArr = Array.isArray(rawDetalles) ? rawDetalles : []
                if (detallesArr.length > 0) {
                  const itemsFromPedido = detallesArr.map(d => {
                    const nombre = d.nombre || d.Nombre || d.productoNombre || d.producto?.nombre || d.producto?.Nombre || d.descripcion || 'Producto'
                    const cantidad = Number(d.cantidad || d.Cantidad || d.qty || d.cantidadPedido || 1)
                    const precioUnitario = Number(d.precioUnitario || d.precio || d.Precio || d.unitPrice || (d.producto && (d.producto.precio || d.producto.price)) || 0)
                    const imagen = d.imagen || d.image || (d.producto && (d.producto.imagen || d.producto.imagenUrl || d.producto.image)) || null
                    return { nombre, cantidad, precioUnitario, imagen }
                  })
                  const computedSubtotal = itemsFromPedido.reduce((s, it) => s + (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)), 0)
                  const impuestosFromPedido = embeddedPedido.impuestos || embeddedPedido.tax || fact.impuestos || 0
                  const totalFromPedido = Number(embeddedPedido.total || embeddedPedido.monto || fact.total || computedSubtotal + Number(impuestosFromPedido || 0))
                  const merged = { ...fact, items: itemsFromPedido, subtotal: computedSubtotal, impuestos: impuestosFromPedido, total: totalFromPedido }
                  setFactura(merged)
                  setPedido(embeddedPedido)
                  console.debug('[Factura] poblada a partir de factura.pedido embebido')
                  return
                }
              } catch (epErr) {
                console.warn('Fallo al poblar factura desde fact.pedido embebido:', epErr)
              }
            }

            // If factura exists but has no items or totals are zero, try to populate from the linked pedido via API
            const needsPopulate = (!fact.items || (Array.isArray(fact.items) && fact.items.length === 0)) || !(fact.subtotal > 0) || !(fact.total > 0)
            if (needsPopulate) {
              // prefer factura.pedidoId, else fallback to query param
              const linkedPedidoId = fact?.pedidoId || pedidoId || (fact && (fact.pedido || fact.PedidoId || fact.pedidoId))
              if (linkedPedidoId) {
                try {
                  const p = await axios.get(`${API}/Pedidos/${linkedPedidoId}`, { headers })
                  const pedidoData = p.data
                  if (pedidoData) {
                    // try several candidate paths for detalles
                    const rawDetalles = pedidoData.detalles || pedidoData.items || pedidoData.Detalles || pedidoData.detallesPedido || pedidoData.lineItems || []
                    const detallesArr = Array.isArray(rawDetalles) ? rawDetalles : []
                    const itemsFromPedido = detallesArr.map(d => {
                      // map DetallesPedido shape to factura item shape expected by normalizeItem
                      const nombre = d.nombre || d.Nombre || d.productoNombre || d.producto?.nombre || d.producto?.Nombre || d.descripcion || 'Producto'
                      const cantidad = Number(d.cantidad || d.cantidadPedido || d.Cantidad || d.qty || 1)
                      const precioUnitario = Number(d.precioUnitario || d.precio || d.precio_unitario || d.precio_unit || d.precioUnit || d.unitPrice || (d.producto && (d.producto.precio || d.producto.price)) || 0)
                      const imagen = d.imagen || d.image || (d.producto && (d.producto.imagen || d.producto.imagenUrl || d.producto.image)) || null
                      return { nombre, cantidad, precioUnitario, imagen }
                    })
                    const computedSubtotal = itemsFromPedido.reduce((s, it) => s + (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)), 0)
                    const impuestosFromPedido = pedidoData.impuestos || pedidoData.tax || fact.impuestos || 0
                    const totalFromPedido = Number(pedidoData.total || pedidoData.monto || fact.total || computedSubtotal + Number(impuestosFromPedido || 0))
                    const merged = { ...fact, items: itemsFromPedido, subtotal: computedSubtotal, impuestos: impuestosFromPedido, total: totalFromPedido }
                    setFactura(merged)
                    // also keep pedido in local state for display
                    setPedido(pedidoData)
                    return
                  }
                } catch (pf) {
                  console.warn('No se pudo obtener pedido vinculado para poblar factura:', pf?.response?.status || pf.message)
                }
              }
            }
            setFactura(fact)
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data || e.message || 'No se encontró la factura')
      } finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => cancelled = true
  }, [id, pedidoId])

  function fmt(v) { return Number(v || 0).toFixed(2) }

  const normalizeImageUrl = (src) => {
    if (!src) return '/placeholder-product.jpg'
    if (typeof src !== 'string') return '/placeholder-product.jpg'
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    if (src.startsWith('//')) return window.location.protocol + src
    try { const apiUrl = new URL(API); return src.startsWith('/') ? apiUrl.origin + src : apiUrl.origin + '/' + src.replace(/^\//, '') } catch(e) { return src }
  }

  const normalizeItem = (it) => {
    if (!it) return { nombre: 'Producto', cantidad: 1, precioUnitario: 0, imagen: '/placeholder-product.jpg' }
    const nombre = it.nombre || it.name || it.descripcion || it.title || (it.producto && (it.producto.nombre || it.producto.name)) || 'Producto'
    const cantidad = Number(it.cantidad || it.quantity || it.cantidad || 1)
    const precioUnitario = Number(it.precioUnitario || it.precio || it.price || it.unitPrice || (it.producto && (it.producto.precio || it.producto.price)) || 0)
    const imagenRaw = it.imagen || it.image || it.imagenUrl || it.imageUrl || it.urlImagen || (it.producto && (it.producto.imagen || it.producto.image || it.producto.imagenUrl)) || (Array.isArray(it.imagenes) && it.imagenes[0]) || null
    const imagen = normalizeImageUrl(imagenRaw)
    return { nombre, cantidad, precioUnitario, imagen }
  }

  if (!user) return (
    <div className="ae-access-denied">
      <div className="ae-access-denied-card">
        <h3>Acceso denegado</h3>
        <p>Debes iniciar sesión para ver facturas</p>
        <button className="ae-login-button" onClick={() => navigate('/login')}>Iniciar sesión</button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="ae-loading-container">
      <div className="ae-spinner-container">
        <svg className="ae-spinner" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" />
        </svg>
        <p>Cargando factura...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="ae-error-container">
      <div className="ae-error-card">
        <div className="ae-login-error">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{String(error)}</span>
        </div>
        <button className="ae-login-button" onClick={() => navigate(-1)}>Volver</button>
      </div>
    </div>
  )

  if (!factura) return (
    <div className="ae-invoice-create-container">
      <div className="ae-invoice-create-card">
        <h3>Factura no encontrada</h3>
        {pedido ? (
          <>
            <p>Se encontró el pedido asociado. Revisa el resumen y pulsa "Pagar" para generar la factura.</p>
            <div className="ae-order-summary">
              <div><strong>Pedido #{pedido.pedidoId || pedido.id || pedido.PedidoId}</strong></div>
              <div>Cliente: {pedido.nombreCliente || pedido.cliente || pedido.usuarioId || '—'}</div>
              <div>Subtotal: S/ {Number(pedido.subtotal || pedido.monto || pedido.total || 0).toFixed(2)}</div>
              <div>Total: S/ {Number(pedido.total || pedido.monto || 0).toFixed(2)}</div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="ae-login-button" onClick={() => navigate(-1)}>Volver</button>
              <button className="ae-login-button" onClick={async () => {
                try {
                  setLoading(true)
                  const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
                  const headers = token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }
                  const body = { pedidoId: pedido.pedidoId || pedido.id || pedido.PedidoId }
                  const created = await axios.post(`${API}/Facturas`, body, { headers })
                    // if created returns the factura, use it and navigate, else set and navigate
                    const f = created.data || created
                    setFactura(f)
                } catch (err) {
                  alert('No se pudo crear la factura. Revisa la consola para más detalles.'); console.error(err)
                } finally { setLoading(false) }
              }}>Pagar / Generar factura</button>
            </div>
          </>
        ) : (
          <>
            <p>No se encontró una factura ni el pedido asociado.</p>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="ae-login-button" onClick={() => navigate(-1)}>Volver</button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  const numero = factura.numeroFactura || factura.numero || factura.numero_factura || factura.numeroFacturaId
  // robust fecha extraction: check many common names and embedded pedido
  const _fechaRaw = factura?.fechaEmision || (factura && (factura['fecha de emision'] || factura['fecha de emisión'])) || factura?.fecha || factura?.fecha_emision || factura?.createdAt || factura?.created_on || factura?.created || factura?.issuedAt || factura?.emitidaEn || factura?.fecha_emision_iso || factura?.pedido?.fecha || factura?.pedido?.createdAt || null
  let fecha = null
  try {
    if (_fechaRaw) {
      const d = new Date(_fechaRaw)
      fecha = isNaN(d.getTime()) ? null : d
    }
  } catch (e) { fecha = null }
  const subtotal = factura.subtotal || factura.monto || factura.total ? factura.subtotal : 0
  const impuestos = factura.impuestos || factura.tax || 0
  const total = factura.total || factura.monto || factura.totalComprobante || 0
  // support frontend-provided resumen fields (from carrito) if present
  const descuento = (factura.descuento ?? factura.descuentoTotal ?? factura.descuento_total ?? (pedido && pedido.descuento)) || 0
  const envio = (factura.envio ?? factura.shipping ?? factura.Envio ?? (pedido && (pedido.envio || pedido.shipping))) || 0
  const couponEarned = (factura.couponEarned ?? factura.cuponObtenido ?? (pedido && Boolean(pedido.couponEarned))) || false
  const rewardCouponValue = (factura.rewardCouponValue ?? factura.cuponValor ?? (pedido && (pedido.rewardCouponValue || 0))) || 0
  const items = factura.items || factura.detalles || factura.lineItems || factura.detallesPedido || []
  const itemsNorm = Array.isArray(items) ? items.map(normalizeItem) : []
  const computedSubtotal = itemsNorm.reduce((s, it) => s + (Number(it.precioUnitario || 0) * Number(it.cantidad || 1)), 0)
  const subtotalFinal = factura.subtotal || factura.monto || factura.subtotal || computedSubtotal
  const impuestosFinal = factura.impuestos || factura.tax || factura.impuestos || 0
  const totalFinal = factura.total || factura.monto || factura.totalComprobante || subtotalFinal + impuestosFinal

  // customer / billing info
  const clienteNombre = factura?.clienteNombre || factura?.nombreCliente || factura?.cliente || pedido?.nombreCliente || pedido?.cliente || factura?.usuario || pedido?.usuario || user?.nombre || user?.Nombre || user?.displayName || user?.email || 'Cliente'
  const clienteEmail = factura?.clienteEmail || factura?.email || pedido?.email || ''
  const clienteDireccion = factura?.direccion || factura?.direccionEnvio || pedido?.direccion || (pedido && (pedido.direccion?.calle || pedido.direccionLinea || '')) || ''

  // metodoPago titular fallback: prefer factura.metodoPago.titular then pedido then logged-in user
  const titularTarjeta = factura?.metodoPago?.titular || factura?.metodoPago?.Titular || pedido?.metodoPago?.titular || pedido?.metodoPago?.Titular || user?.nombre || user?.Nombre || null

  // normalize estado (many backends use different names)
  const estadoRaw = factura?.estadoPago || factura?.estado || factura?.status || factura?.paymentStatus || factura?.estado_factura || factura?.estadoPagoDescripcion || ''
  const estadoLabel = estadoRaw ? String(estadoRaw).toUpperCase() : '—'
  const estadoClass = estadoRaw ? String(estadoRaw).toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'unknown'

  

  return (
    <div className="ae-invoice-container">
      <div className="ae-invoice-card ae-invoice-premium">
        <div className="ae-invoice-top">
          <div className="ae-invoice-brand">
            <div className="ae-invoice-logo-mark">MT</div>
            <div className="ae-invoice-brand-text">
              <div className="ae-store-name">Mi Tienda+</div>
              <div className="ae-store-sub">Comprobante fiscal</div>
            </div>
          </div>
          {/* QR code block: show generated QR for the factura (may be a fake payload) */}
          {/* QR removed as requested */}
          <div className="ae-invoice-meta">
            <div className="ae-invoice-number">FACTURA {numero ? `#${numero}` : ''}</div>
            <div className="ae-invoice-date">Emitida: {fecha ? fecha.toLocaleString() : '—'}</div>
            <div className={`ae-invoice-badge ae-badge-${estadoClass}`}>{estadoLabel}</div>
          </div>
        </div>

        <div className="ae-invoice-grid">
          <div className="ae-invoice-block ae-invoice-buyer">
            <h4>Cliente</h4>
            <p className="ae-strong">{clienteNombre}</p>
            {clienteEmail && <p>{clienteEmail}</p>}
            {clienteDireccion && <p>{clienteDireccion}</p>}
          </div>

          <div className="ae-invoice-block ae-invoice-seller">
            <h4>Vendedor</h4>
            <p className="ae-strong">Mi Tienda+</p>
            <p>RUC: 20389345361</p>
            <p>contacto@mitienda.example</p>
          </div>

          <div className="ae-invoice-block ae-invoice-refs">
            <h4>Detalle</h4>
            <p><strong>Pedido:</strong> {pedido?.pedidoId || pedido?.id || factura?.pedidoId || '—'}</p>
            <p><strong>Fecha:</strong> {fecha ? new Date(fecha).toLocaleString() : '—'}</p>
            {titularTarjeta && <p><strong>Titular:</strong> {titularTarjeta}</p>}
          </div>
        </div>

        <section className="ae-invoice-items-section">
          <h3>Productos</h3>
          <div className="ae-invoice-items">
            {itemsNorm.length === 0 ? (
              <div className="ae-invoice-empty">No hay items en esta factura</div>
            ) : (
              <table className="ae-invoice-table ae-premium-table">
                <thead>
                  <tr>
                    <th style={{width: '48%'}}>Producto</th>
                    <th style={{width: '12%'}}>Cantidad</th>
                    <th style={{width: '20%'}}>Precio unitario</th>
                    <th style={{width: '20%'}}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsNorm.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="ae-invoice-item">
                          <div className="ae-invoice-item-image"><img src={it.imagen || '/placeholder-product.jpg'} alt={it.nombre} /></div>
                          <div className="ae-invoice-item-desc">
                            <div className="ae-item-name">{it.nombre}</div>
                          </div>
                        </div>
                      </td>
                      <td className="ae-center">{it.cantidad}</td>
                      <td className="ae-right">S/ {fmt(it.precioUnitario)}</td>
                      <td className="ae-right">S/ {fmt(Number(it.precioUnitario) * Number(it.cantidad))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="ae-invoice-footer-grid">
          <div className="ae-invoice-notes">
            <p className="muted">Gracias por tu compra. Guarda este comprobante para tus registros.</p>
          </div>
          <div className="ae-invoice-totals">
            <div className="ae-invoice-summary">
              <div className="ae-invoice-summary-row"><span>Subtotal:</span><span>S/ {fmt(subtotalFinal)}</span></div>
              {descuento > 0 && <div className="ae-invoice-summary-row"><span>Descuento aplicado:</span><span>- S/ {fmt(Number(descuento))}</span></div>}
              <div className="ae-invoice-summary-row"><span>Impuestos:</span><span>S/ {fmt(impuestosFinal)}</span></div>
              <div className="ae-invoice-summary-row"><span>Envío:</span><span>{Number(envio) === 0 ? 'Gratis' : `S/ ${fmt(Number(envio))}`}</span></div>
              <div className="ae-invoice-summary-row ae-invoice-total"><span>Total:</span><span>S/ {fmt(totalFinal)}</span></div>
              {couponEarned && (
                <div className="ae-invoice-summary-row ae-coupon-earned"><span>Has ganado un cupón:</span><span>S/ {fmt(Number(rewardCouponValue))}</span></div>
              )}
            </div>
          </div>
        </div>

        <div className="ae-invoice-footer">
          <p>Mi Tienda+ — Comprobante fiscal</p>
          <div style={{marginTop:8}}>
            <button className="ae-login-button" onClick={() => navigate('/pedidos')}>Volver a mis pedidos</button>
          </div>
        </div>
      </div>
    </div>
  )
}