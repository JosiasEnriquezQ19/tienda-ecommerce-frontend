import React from 'react'
import { Link } from 'react-router-dom'
import './AddedToCartModal.css'

export default function AddedToCartModal({ visible, item, onClose }){
  if(!visible) return null
  const nombre = item?.nombre || 'Producto'
  const precio = item?.precio ? `S/ ${Number(item.precio).toFixed(2)}` : ''
  const imagen = item?.imagen || ''

  return (
    <div className="ae-added-modal-backdrop" onClick={onClose}>
      <div className="ae-added-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ae-added-body">
          <div className="ae-added-image">
            {imagen ? <img src={imagen} alt={nombre} /> : <div className="ae-placeholder">Imagen</div>}
          </div>
          <div className="ae-added-content">
            <h3>Producto agregado al carrito</h3>
            <p className="ae-added-name">{nombre}</p>
            {precio && <p className="ae-added-price">{precio}</p>}
            <div className="ae-added-actions">
              <Link to="/carrito" className="ae-view-cart" onClick={onClose}>Ver carrito</Link>
              <button className="ae-continue" onClick={onClose}>Seguir comprando</button>
            </div>
          </div>
        </div>
        <button className="ae-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
      </div>
    </div>
  )
}
