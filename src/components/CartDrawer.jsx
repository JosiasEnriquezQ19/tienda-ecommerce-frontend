import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../carrito/ContextoCarrito';
import './CartDrawer.css';

export default function CartDrawer({ open, onClose }) {
    const { items, removeItem, updateQuantity } = useContext(CartContext);
    const navigate = useNavigate();

    const formatPrice = (p) => {
        const n = Number(p || 0);
        if (n % 1 === 0) return n.toLocaleString('es-PE');
        return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const subtotal = items.reduce((sum, i) => sum + (Number(i.precio) || 0) * (Number(i.cantidad) || 1), 0);

    return (
        <>
            {/* Overlay */}
            <div className={`cd-overlay ${open ? 'cd-visible' : ''}`} onClick={onClose} />

            {/* Drawer */}
            <aside className={`cd-drawer ${open ? 'cd-open' : ''}`}>
                {/* Header */}
                <div className="cd-header">
                    <h2 className="cd-title">
                        <svg viewBox="0 0 24 24" className="cd-title-icon"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                        Mi Carrito
                        <span className="cd-count">({items.length})</span>
                    </h2>
                    <button className="cd-close" onClick={onClose} aria-label="Cerrar carrito">
                        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {/* Items */}
                <div className="cd-items">
                    {items.length === 0 ? (
                        <div className="cd-empty">
                            <svg viewBox="0 0 24 24" className="cd-empty-icon"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                            <p>Tu carrito está vacío</p>
                            <button className="cd-shop-btn" onClick={() => { onClose(); navigate('/'); }}>Explorar productos</button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.uid || item.productoId} className="cd-item">
                                <div className="cd-item-img">
                                    <img src={item.imagen || item.imagenUrl || 'https://via.placeholder.com/80'} alt={item.nombre} />
                                </div>
                                <div className="cd-item-info">
                                    <Link
                                        to={`/producto/${item.productoId}`}
                                        className="cd-item-name"
                                        onClick={onClose}
                                    >
                                        {item.nombre || 'Producto'}
                                    </Link>
                                    <span className="cd-item-price">S/ {formatPrice(item.precio)}</span>
                                    <div className="cd-item-qty">
                                        <button
                                            className="cd-qty-btn"
                                            onClick={() => {
                                                const newQty = Math.max(1, (Number(item.cantidad) || 1) - 1);
                                                updateQuantity(item.productoId, newQty);
                                            }}
                                        >−</button>
                                        <span className="cd-qty-num">{item.cantidad || 1}</span>
                                        <button
                                            className="cd-qty-btn"
                                            onClick={() => {
                                                const newQty = (Number(item.cantidad) || 1) + 1;
                                                updateQuantity(item.productoId, newQty);
                                            }}
                                        >+</button>
                                    </div>
                                </div>
                                <button className="cd-item-remove" onClick={() => removeItem(item.productoId)} aria-label="Eliminar">
                                    <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="cd-footer">
                        <div className="cd-subtotal">
                            <span>Subtotal</span>
                            <strong>S/ {formatPrice(subtotal)}</strong>
                        </div>
                        <button className="cd-checkout-btn" onClick={() => { onClose(); navigate('/carrito'); }}>
                            Ver carrito completo
                        </button>
                        <button className="cd-pay-btn" onClick={() => { onClose(); navigate('/pago'); }}>
                            Ir a pagar
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
