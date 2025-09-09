import React, { useEffect, useState } from 'react'
import { fetchPedidosPorUsuario } from '../api/pedidosApi'

// Plain JSX version to avoid TypeScript generics in this repo setup
export function UserOrders({ usuarioId, token }: { usuarioId?: any, token?: any }) {
  const [pedidos, setPedidos] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
  if (!usuarioId && usuarioId !== 0) throw new Error('Usuario no identificado')
  const data = await fetchPedidosPorUsuario(usuarioId, token)
  // Normalize into array and filter server-side mistakes: ensure only pedidos that belong to usuarioId
  const anyData: any = data
  const arr = Array.isArray(anyData) ? anyData : (anyData && Array.isArray(anyData.data) ? anyData.data : [])
  const filtered = arr.filter((p: any) => String(p.usuarioId || p.UsuarioId || p.userId || p.usuario) === String(usuarioId))
  if (mounted) setPedidos(filtered || [])
      } catch (e) {
  if (mounted) setError(e.message ?? 'Error cargando pedidos')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [usuarioId, token])

  if (loading) return <div>Cargando pedidos...</div>
  if (error) return <div style={{color:'red'}}>Error: {error}</div>
  if (!pedidos || pedidos.length === 0) return <div>No hay pedidos.</div>

  return (
    <div>
      <h2>Mis pedidos</h2>
      <ul style={{listStyle:'none', padding:0}}>
        {pedidos.map(p => {
          const id = p?.pedidoId ?? p?.id ?? p?.PedidoId
          const fecha = p?.fechaPedido ?? p?.fecha ?? p?.createdAt ?? null
          const itemsCount = Array.isArray(p?.detalles) ? p.detalles.length : (Array.isArray(p?.items) ? p.items.length : 0)
          const total = Number(p?.total ?? p?.monto ?? p?.valor ?? 0)
          return (
            <li key={id || Math.random()} style={{border:'1px solid #ddd', padding:12, marginBottom:8}}>
              <div><strong>Pedido #{id ?? '—'}</strong> — {fecha ? new Date(fecha).toLocaleString() : 'Fecha no disponible'}</div>
              <div>Estado: {p?.estado ?? p?.Estado ?? '—'}</div>
              <div>Items: {itemsCount} — Total: S/ {total.toFixed(2)}</div>
              <div style={{marginTop:8}}>
                <button onClick={() => { if (id) window.location.href = `/pedidos/${id}` }}>Ver detalle</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
