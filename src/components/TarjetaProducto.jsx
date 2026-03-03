import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa'
import { CartContext } from '../carrito/ContextoCarrito'
import './TarjetaProducto.css'

export default function TarjetaProducto({ p, product }) {
  const { addItem } = useContext(CartContext)
  const item = p || product || {}
  const nombre = item?.nombre || item?.title || 'Producto'
  const precio = item?.precio || item?.price || 0
  const imagen = item?.imagenUrl || item?.url || item?.image || 'https://via.placeholder.com/400x300'
  const descripcion = item?.descripcion || item?.description || ''
  const destacado = item?.destacado || item?.oferta || item?.discount
  const rating = item?.rating ?? item?.valoracion ?? 0
  const envioGratis = item?.envioGratis || item?.freeShipping || false
  const estado = (item?.estado || '').toString().toLowerCase()
  const isOculto = estado === 'oculto' || item?.oculto === true
  const isAgotado = estado === 'agotado' || (item?.stock ?? 0) <= 0
  const isDescontinuado = estado === 'descontinuado'

  const formatPriceParts = (price) => {
    const num = Number(price || 0);
    const parts = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.');
    return { integer: parts[0], decimal: parts[1] };
  }

  const priceParts = formatPriceParts(precio);

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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ ...item, cantidad: 1 });
  }

  const CardWrapper = isOculto || isDescontinuado ? 'article' : Link

  return (
    <CardWrapper
      to={!isOculto && !isDescontinuado ? `/producto/${item.productoId || item.id}` : undefined}
      className={`producto-card ${!isOculto && !isDescontinuado ? 'producto-card-clickable' : ''}`}
    >
      <div className="producto-media">
        <button className="producto-wishlist" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} aria-label="Add to wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
        <img src={imagen} alt={nombre} loading="lazy" />
        {destacado && <span className="badge">Oferta</span>}
        {isAgotado && <span className="badge badge-warning">Agotado</span>}
      </div>
      <div className="producto-body">
        <div className="producto-header">
          <h3 className="producto-title">{nombre}</h3>
          <div className="precio">
            <span className="precio-currency">S/</span>
            <span className="precio-int">{priceParts.integer}</span>
            <span className="precio-dec">.{priceParts.decimal}</span>
          </div>
        </div>
        <p className="producto-desc">
          {descripcion.substring(0, 40)}{descripcion.length > 40 ? '...' : ''}
        </p>
        <div className="producto-rating">
          <div className="rating-stars">{renderRatingStars(rating)}</div>
          <span className="rating-count">({item.reviews || 0})</span>
        </div>
        <div className="producto-action">
          <button
            type="button"
            className="producto-add-bg"
            onClick={handleAddToCart}
            disabled={isAgotado}
          >
            {isAgotado ? 'Agotado' : 'Añadir'}
          </button>
        </div>
      </div>
    </CardWrapper>
  )
}
