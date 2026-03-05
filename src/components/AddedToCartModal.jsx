import React from 'react'
import { Link } from 'react-router-dom'
import './AddedToCartModal.css'

export default function AddedToCartModal({ visible, item, onClose }) {
  if (!visible) return null
  const nombre = item?.nombre || 'Producto'
  const precio = item?.precio ? `S/ ${Number(item.precio).toFixed(2)}` : ''
  const imagen = item?.imagen || ''

  return (
    <div className={`ae-added-toast ${visible ? 'show' : ''}`} role="status" aria-live="polite">
      <div className="ae-added-toast-body">
        <div className="ae-added-toast-image">
          {imagen ? <img src={imagen} alt={nombre} /> : <div className="ae-placeholder">📦</div>}
        </div>
        <div className="ae-added-toast-content">
          <div className="ae-added-toast-header">
            <svg className="ae-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <h4>¡Agregado al carrito!</h4>
          </div>
          <p className="ae-added-toast-name">{nombre}</p>
          <div className="ae-added-toast-footer">
            <Link to="/carrito" className="ae-toast-btn ae-toast-btn-primary" onClick={onClose}>
              Ver carrito
            </Link>
            <button className="ae-toast-btn ae-toast-btn-ghost" onClick={onClose}>
              Seguir
            </button>
          </div>
        </div>
        <button className="ae-toast-close" onClick={onClose} aria-label="Cerrar">×</button>
      </div>
    </div>
  )
}
