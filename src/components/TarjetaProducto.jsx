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
  const precioAntes = item?.precioAntes || 0
  const imagen = item?.imagenUrl || item?.url || item?.image || 'https://via.placeholder.com/400x300'
  const descripcion = item?.descripcion || item?.description || ''
  const hasDescuento = precioAntes > precio
  const destacado = item?.destacado || item?.oferta || item?.discount || hasDescuento
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
        <img src={imagen} alt={nombre} loading="lazy" />
        {hasDescuento && (
          <span className="badge badge-discount">
            -{Math.round(((precioAntes - precio) / precioAntes) * 100)}%
          </span>
        )}
        {!hasDescuento && destacado && <span className="badge">Oferta</span>}
        {isAgotado && <span className="badge badge-warning">Agotado</span>}
      </div>
      <div className="producto-body">
        <div className="producto-header">
          <h3 className="producto-title">{nombre}</h3>
          {item.marca && (
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '-4px', marginBottom: '4px' }}>
              {item.marca}
            </div>
          )}
          <div className="precio-group">
            {hasDescuento && (
              <span className="precio-antes">S/ {precioAntes.toFixed(2)}</span>
            )}
            <div className="precio">
              <span className="precio-currency">S/</span>
              <span className="precio-int">{priceParts.integer}</span>
              <span className="precio-dec">.{priceParts.decimal}</span>
            </div>
          </div>
        </div>

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
