import React from 'react'
import { Link } from 'react-router-dom'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
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

  const formatPrice = (price) => {
    const num = Number(price || 0);
    if (num % 1 === 0) {
      return num.toLocaleString('es-PE');
    }
    return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const renderRatingStars = (rating) => {
    const stars = [];
    const r = rating ?? 0;
    const full = Math.floor(r);
    const half = (r % 1) >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= full) stars.push(<FaStar key={i} className="star-filled" />);
      else if (i === full + 1 && half) stars.push(<FaStarHalfAlt key={i} className="star-half" />);
      else stars.push(<FaRegStar key={i} className="star-empty" />);
    }
    return stars;
  }

  const CardWrapper = isOculto || isDescontinuado ? 'article' : Link

  return (
    <CardWrapper 
      to={!isOculto && !isDescontinuado ? `/producto/${item.productoId || item.id}` : undefined}
      className={`card producto-card ${!isOculto && !isDescontinuado ? 'producto-card-clickable' : ''}`}
    >
      <div className="producto-media">
        <img src={imagen} alt={nombre} />
  {destacado && <span className="badge">Oferta</span>}
  {isOculto && <span className="badge badge-muted">Oculto</span>}
  {isAgotado && <span className="badge badge-warning">Agotado</span>}
  {isDescontinuado && <span className="badge badge-muted">Descontinuado</span>}
      </div>
      <div className="producto-body">
        <h3 className="producto-title">{nombre}</h3>
        <div className="producto-meta">
          <div>
            <div className="rating">
              <span className="rating-number">{Number(rating).toFixed(1)}</span>
              <div className="rating-stars">
                {renderRatingStars(rating)}
              </div>
              <span className="rating-count">({item.reviews || 0})</span>
            </div>
            <div className="precio">S/ {formatPrice(precio)}</div>
            {envioGratis && <div className="envio">Envío gratis</div>}
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}
