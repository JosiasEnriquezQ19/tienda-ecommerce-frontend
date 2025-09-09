import React from 'react'
import { Link } from 'react-router-dom'
import './TarjetaProducto.css'

export default function TarjetaProducto({ p, product }) {
  const item = p || product || {}
  const nombre = item?.nombre || item?.title || 'Producto'
  const precio = item?.precio || item?.price || 0
  const imagen = item?.imagenUrl || item?.url || item?.image || 'https://via.placeholder.com/400x300'
  const destacado = item?.destacado || item?.oferta || item?.discount
  const rating = item?.rating ?? item?.valoracion ?? 0
  const envioGratis = item?.envioGratis || item?.freeShipping || false
  const estado = (item?.estado || '').toString().toLowerCase()
  const isOculto = estado === 'oculto' || item?.oculto === true
  const isAgotado = estado === 'agotado' || (item?.stock ?? 0) <= 0
  const isDescontinuado = estado === 'descontinuado'

  return (
    <article className="card producto-card">
      <div className="producto-media">
        <img src={imagen} alt={nombre} />
  {destacado && <span className="badge">Oferta</span>}
  {isOculto && <span className="badge badge-muted">Oculto</span>}
  {isAgotado && <span className="badge badge-warning">Agotado</span>}
  {isDescontinuado && <span className="badge badge-muted">Descontinuado</span>}
      </div>
      <div className="producto-body">
        <h3 className="producto-title">{nombre}</h3>
  <p className="producto-desc">{item.descripcion || item.description || ''}</p>
        <div className="producto-meta">
          <div>
            <div className="precio">S/ {Number(precio).toFixed(2)}</div>
            <div className="rating">
              <div className="rating-stars" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => {
                  const starPos = i + 1
                  if (rating >= starPos) return <span key={i} className="star full">★</span>
                  if (rating >= starPos - 0.5) return <span key={i} className="star half">★</span>
                  return <span key={i} className="star empty">☆</span>
                })}
              </div>
              <div className="rating-value">{Number(rating).toFixed(1)}{item.reviews ? ` · ${item.reviews}` : ''}</div>
            </div>
            {envioGratis && <div className="envio">Envío gratis</div>}
          </div>
          <div className="acciones">
            {isOculto || isDescontinuado ? (
              <button className="btn-ver disabled" disabled>Ver</button>
            ) : (
              <Link to={`/producto/${item.productoId || item.id}`} className="btn-ver">Ver</Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
