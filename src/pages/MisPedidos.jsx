import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { API, DEFAULT_USER_ID } from '../api'
import { AuthContext } from '../auth/AuthContext'
import { Link } from 'react-router-dom'
import { UserOrders } from '../components/UserOrders'
import { useLocation } from 'react-router-dom'
import './MisPedidos.css'

export default function MisPedidos(){
  const { user } = useContext(AuthContext)
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastStatus, setLastStatus] = useState(null)
  const location = useLocation()
  const [incomingBanner, setIncomingBanner] = useState(null)

  // track deleting states by pedido id
  const [deleting, setDeleting] = useState({})

  // fetch order details and attach items into pedidos state so UI updates
  async function fetchAndAttachOrderItems(orderId) {
    if (!orderId) return
    try {
      const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const r = await axios.get(`${API}/Pedidos/${orderId}`, { headers })
      if (r && r.data) {
  const rawItems = r.data?.items || r.data?.Items || r.data?.detalles || r.data?.detallesPedido || r.data?.productos || r.data?.lineItems || []
  const normalized = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : []
  setPedidos(prev => prev.map(p => (String(p.id || p.pedidoId || p.PedidoId) === String(orderId) ? { ...p, items: normalized } : p)))
      }
    } catch (err) {
      console.debug('[MisPedidos] fetchAndAttachOrderItems failed', err.response?.status || err.message)
      alert('No se pudieron obtener los productos del pedido. Ver consola para más detalles.')
    }
  }

  const normalizeItem = (it) => {
    if (!it) return { imagen: null, nombre: 'Producto', cantidad: 1, precio: 0 }
    const imagen = it.imagen || it.image || it.imagenUrl || it.imageUrl || it.urlImagen || it.urlImagen || it.imagenes?.[0] || it.producto?.imagen || it.producto?.image || it.producto?.imagenUrl || it.producto?.imageUrl || it.producto?.urlImagen || it.producto?.imagenes?.[0] || null
    const nombre = it.nombre || it.Nombre || it.name || it.title || it.producto?.nombre || it.producto?.name || 'Producto'
    const cantidad = it.cantidad || it.Cantidad || it.qty || it.quantity || it.cant || 1
    const precio = (it.precio || it.Precio || it.price || it.unitPrice || it.precioUnitario || it.valorUnitario || it.producto?.precio || it.producto?.price || 0)
    // try to avoid mixed-content issues: if page is https and image is http, prefer https scheme
    let finalImagen = imagen
    try {
      if (typeof finalImagen === 'string' && finalImagen.startsWith('http://') && window && window.location && window.location.protocol === 'https:') {
        finalImagen = 'https://' + finalImagen.slice('http://'.length)
      }
    } catch (e) { /* ignore */ }
    return { imagen: finalImagen, nombre, cantidad, precio }
  }

  const normalizeImageUrl = (src) => {
    if (!src) return null
    // absolute URL already
    if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) return src
    // protocol-relative //domain/path
    if (typeof src === 'string' && src.startsWith('//')) return window.location.protocol + src
    // leading slash: make absolute against API origin
    if (typeof src === 'string' && src.startsWith('/')) {
      try {
        const apiUrl = new URL(API)
        return apiUrl.origin + src
      } catch (e) {
        return src
      }
    }
    // otherwise assume relative path from API root
    try {
      const apiUrl = new URL(API)
      return apiUrl.origin + '/' + src.replace(/^\//, '')
    } catch (e) {
      return src
    }
  }

  // once pedidos are present, auto-fetch items for those that lack an items array (limit to 5 to avoid floods)
  useEffect(() => {
    if (!pedidos || pedidos.length === 0) return
    const missing = pedidos.filter(p => !Array.isArray(p.items) || p.items.length === 0).slice(0, 5)
    if (missing.length === 0) return
    missing.forEach(p => {
      const id = p.id || p.pedidoId || p.PedidoId
      if (id) fetchAndAttachOrderItems(id)
    })
  }, [pedidos])

  useEffect(()=>{
    // If navigated here with state indicating invoice success, show a banner briefly
    if (location && location.state && location.state.invoiceSuccess) {
      setIncomingBanner({ type: 'success', message: location.state.message || 'Factura generada con éxito' })
      // clear history state so refresh won't re-show the banner (best-effort)
      try { window.history.replaceState({}, document.title) } catch(e){ /* ignore */ }
      setTimeout(()=>setIncomingBanner(null), 5000)
    }

    if(!user) {
      // fallback to default test user when backend was reseeded
      const fallback = DEFAULT_USER_ID
      setLoading(true)
      // continue with fallback uid
      const uid = fallback
      // store uid in a local closure and continue below
      // eslint-disable-next-line no-unused-vars
      ;(async function(){
        try { /* the main load logic below expects uid variable; we'll continue by reusing the same logic path via redirect to outer load */ }
        finally { setLoading(false) }
      })()
      return
    }
  // Determine user id from common properties or stored value. Do NOT fall back to DEFAULT_USER_ID here
  // because that can cause listing orders for a different/dev user when the current user's id is missing.
  const uid = user?.UsuarioId || user?.usuarioId || user?.UsuarioID || user?.userId || user?.id || user?.UserId || (user && user.sub) || localStorage.getItem('userId')
    setLoading(true)

    const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const normalize = (raw) => {
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      if (raw.data && Array.isArray(raw.data)) return raw.data
      if (raw.pedidos && Array.isArray(raw.pedidos)) return raw.pedidos
      if (raw.items && Array.isArray(raw.items)) return raw.items
      if (raw.result && Array.isArray(raw.result)) return raw.result
      if (raw.value && Array.isArray(raw.value)) return raw.value
      return []
    }

    const normalizeOrder = (p) => {
      if (!p) return p
      // try a variety of property names for items
      const candidates = p.items || p.Items || p.detalles || p.detallesPedido || p.productos || p.productosPedido || p.lineas || p.lineItems || p.orderItems || p.articulos || p.Items || null
      const itemsArray = Array.isArray(candidates) ? candidates : (Array.isArray(p.items) ? p.items : [])
      const cantidad = p.cantidadItems || p.itemsCount || p.itemsCantidad || (Array.isArray(itemsArray) ? itemsArray.length : 0)
      return { ...p, items: itemsArray, cantidadItems: cantidad }
    }

    (async function load(){
      try {
        if (!uid) {
          setError('No se pudo determinar el ID de usuario. Por favor inicia sesión de nuevo.');
          return
        }

        // Intento 1: call the direct endpoint implemented on backend: /Pedidos/usuario/{id}
        try {
          const r1 = await axios.get(`${API}/Pedidos/usuario/${uid}`, { headers: { ...headers, Accept: 'application/json' } })
          setLastStatus(r1.status)
          const items = normalize(r1.data)
          if (items.length) { setPedidos(items.map(normalizeOrder)); console.debug('[MisPedidos] loaded by usuario id', uid); return }
        } catch (e1) {
          setLastStatus(e1.response?.status || lastStatus)
          console.debug('[MisPedidos] GET /Pedidos/usuario/{id} fallback:', e1.response?.status || e1.message)
        }

        // Intento 2: query param (más compatible) - keep as fallback for older backends
        try {
          const r2 = await axios.get(`${API}/Pedidos`, { params: { usuarioId: uid }, headers: { ...headers, Accept: 'application/json' } })
          setLastStatus(r2.status)
          const items = normalize(r2.data)
          if (items.length) { setPedidos(items.map(normalizeOrder)); console.debug('[MisPedidos] loaded sample', (items || []).slice(0,3)); return }
        } catch (e2) {
          setLastStatus(e2.response?.status || lastStatus)
          console.debug('[MisPedidos] /Pedidos?usuarioId fallback:', e2.response?.status || e2.message)
        }

        // Intento 2: query param alternate (userId)
        try {
          const r5 = await axios.get(`${API}/Pedidos`, { params: { userId: uid }, headers: { ...headers, Accept: 'application/json' } })
          setLastStatus(r5.status)
          const items = normalize(r5.data)
          if (items.length) { setPedidos(items.map(normalizeOrder)); console.debug('[MisPedidos] loaded sample', (items || []).slice(0,3)); return }
        } catch (e5) {
          setLastStatus(e5.response?.status || lastStatus)
          console.debug('[MisPedidos] /Pedidos?userId fallback:', e5.response?.status || e5.message)
        }

        // Intento 3: GET directo a /Pedidos/usuario (sin id) — some backends return current user's pedidos when token provided
        try {
          const r6 = await axios.get(`${API}/Pedidos/usuario`, { headers: { ...headers, Accept: 'application/json' } })
          setLastStatus(r6.status)
          const items = normalize(r6.data)
          if (items.length) { setPedidos(items.map(normalizeOrder)); console.debug('[MisPedidos] loaded sample', (items || []).slice(0,3)); return }
        } catch (e6) {
          setLastStatus(e6.response?.status || lastStatus)
          console.debug('[MisPedidos] GET /Pedidos/usuario (no params) fallback:', e6.response?.status || e6.message)
        }

        // Intento 4: obtener todos y filtrar (último recurso)
        try {
          const all = await axios.get(`${API}/Pedidos`, { headers: { ...headers, Accept: 'application/json' } })
          setLastStatus(all.status)
          const list = normalize(all.data)
          const filtered = list.filter(p => String(p.usuarioId || p.UsuarioId || p.userId || p.usuario) === String(uid))
          if (filtered.length) { setPedidos(filtered.map(normalizeOrder)); console.debug('[MisPedidos] loaded sample (filtered)', (filtered || []).slice(0,3)); return }
        } catch (e4) {
          setLastStatus(e4.response?.status || lastStatus)
          console.debug('[MisPedidos] /Pedidos (all) fallback:', e4.response?.status || e4.message)
        }

        setError('No se pudieron obtener tus pedidos desde el servidor. Código: ' + (lastStatus || 'N/A'))
      } finally {
        setLoading(false)
      }
    })()
  },[user])

  async function deleteOrder(pedido) {
    const id = pedido.id || pedido.pedidoId || pedido.PedidoId
    if (!id) return alert('No se pudo identificar el pedido a eliminar')
  // Do not allow deletion if the pedido has been invoiced; only allow anular (soft-cancel)
  const hasFactura = pedido.facturaId || (pedido.factura && (pedido.factura.id || pedido.factura.facturaId)) || pedido.facturado || pedido.isFacturado
  if (hasFactura) return alert('No se puede eliminar un pedido que ya fue facturado. Puedes contactar al administrador para más opciones.')
  if (!confirm(`¿Deseas anular el pedido #${id}? Esta acción marcará el pedido como anulado.`)) return

    const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    setDeleting(d => ({ ...d, [id]: true }))
    try {
      // Preferred: mark pedido as 'Anulado' (soft cancel)
      try {
        const r = await axios.patch(`${API}/Pedidos/${id}`, { estado: 'Anulado' }, { headers })
        if (r.status >= 200 && r.status < 300) {
          setPedidos(prev => prev.map(p => (String(p.id || p.pedidoId || p.PedidoId) === String(id) ? { ...p, estado: 'Anulado' } : p)))
          alert('Pedido anulado correctamente')
          return
        }
      } catch (e) {
        console.debug('[MisPedidos] PATCH /Pedidos/{id} to Anulado failed', e.response?.status || e.message)
      }

      // Fallback: try DELETE if backend enforces removal (unlikely for invoiced checks)
      try {
        const r2 = await axios.delete(`${API}/Pedidos/${id}`, { headers })
        if (r2.status >= 200 && r2.status < 300) {
          setPedidos(prev => prev.filter(p => String(p.id || p.pedidoId || p.PedidoId) !== String(id)))
          alert('Pedido eliminado')
          return
        }
      } catch (e) { console.debug('[MisPedidos] fallback DELETE failed', e.response?.status || e.message) }

      alert('No se pudo anular/eliminar el pedido. Revisa la consola para más detalles.')
    } finally {
      setDeleting(d => { const copy = { ...d }; delete copy[id]; return copy })
    }
  }

  // If there's no authenticated user, ask them to sign in.
  if(!user) return <div className="container py-4">Debes iniciar sesión para ver tus pedidos.</div>

  // Use the reusable UserOrders component which fetches only the logged-in user's orders via /Pedidos/usuario/{id}
  const uid = user?.UsuarioId || user?.usuarioId || user?.id || user?.userId || user?.UserId || localStorage.getItem('userId')
  const token = user?.token || user?.accessToken || user?.jwt || user?.authToken || localStorage.getItem('authToken')
  
  // Si llegamos con información de un pedido recién creado, mostrar un mensaje de éxito
  useEffect(() => {
    if (location.state?.success) {
      // Mostrar banner temporal de éxito (podría implementarse)
      console.log("Pedido creado exitosamente");
    }
  }, [location]);

  return (
    <div className="ae-orders-container">
      <div className="ae-orders-header">
        <h1>Mis Pedidos</h1>
        <p>Revisa el estado de tus compras recientes</p>
      </div>
      
      {location.state?.success && (
        <div className="ae-order-success-banner">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span>¡Tu pedido ha sido creado exitosamente!</span>
        </div>
      )}
      
      {error ? (
        <div className="ae-error-container">
          <div className="ae-error-card">
            <svg viewBox="0 0 24 24" width="40" height="40">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h3>No pudimos cargar tus pedidos</h3>
            <p>El servidor está experimentando problemas temporales. Tus pedidos están seguros.</p>
            <button onClick={() => window.location.reload()} className="ae-retry-button">
              Intentar nuevamente
            </button>
          </div>
        </div>
      ) : (
        <UserOrders usuarioId={Number(uid)} token={token} />
      )}
      
      <div className="ae-orders-note">
        <p>Si acabas de realizar un pedido, podría tardar unos minutos en aparecer aquí.</p>
      </div>
    </div>
  )
}

// Small helper to display accurate item count by fetching order details when needed
function OrderItemCount({ p }){
  const [count, setCount] = useState(() => Array.isArray(p.items) ? p.items.length : (p.itemsCount || p.itemsCantidad || 0))
  const { user } = useContext(AuthContext)
  useEffect(()=>{
    let mounted = true
    if (count > 0) return
    const id = p.id || p.pedidoId || p.PedidoId
    if (!id) return
    (async ()=>{
      try {
        const token = user?.token || user?.accessToken || user?.jwt || user?.authToken || localStorage.getItem('authToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const r = await axios.get(`${API}/Pedidos/${id}`, { headers })
        if (!mounted) return
        const items = r.data?.items || r.data?.Items || []
        setCount(Array.isArray(items) ? items.length : (r.data?.itemsCount || 0))
      } catch(e){
        // ignore
      }
    })()
    return ()=> mounted = false
  }, [p, count, user])
  return <span>{count} productos</span>
}