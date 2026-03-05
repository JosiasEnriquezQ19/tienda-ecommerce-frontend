import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../carrito/ContextoCarrito';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import axios from 'axios';
import { API, DEFAULT_USER_ID } from '../api';
import { crearPedido } from '../api/pedidosApi';
import './Carrito.css';

export default function Carrito() {
  const { items, removeItem, clear, updateQuantity } = useContext(CartContext);
  const [selectedItems, setSelectedItems] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const navigate = useNavigate();

  const fmt = (n) => {
    const v = Number(n || 0);
    return v % 1 === 0
      ? v.toLocaleString('es-PE')
      : v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Items seleccionados o todos si ninguno marcado
  const active = selectedItems.length > 0
    ? items.filter(it => selectedItems.includes(it.uid ?? it.productoId ?? it.servidorId))
    : items;

  const subtotal = active.reduce((s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 0), 0);
  const distinctCount = active.length;
  const totalUnits = active.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);

  // Descuento por volumen (>5 uds = 30% off en esa línea)
  const discountsByItem = active.map(it => {
    const qty = Number(it.cantidad || 0);
    if (qty > 5) return { productoId: it.productoId, descuento: Number(it.precio || 0) * qty * 0.30 };
    return { productoId: it.productoId, descuento: 0 };
  });
  const discountTotal = discountsByItem.reduce((s, d) => s + (Number(d.descuento) || 0), 0);
  const couponEarned = active.some(it => Number(it.cantidad || 0) > 5);
  const envio = (couponEarned || subtotal > 100) ? 0 : 9.99;
  const total = Math.max(0, subtotal - discountTotal + envio);

  // Cargar direcciones
  useEffect(() => {
    if (!user) return;
    const uid = user.UsuarioId || user.usuarioId || user.id || DEFAULT_USER_ID;
    axios.get(`${API}/Direcciones/usuario/${uid}`)
      .then(r => {
        const dirs = r.data || [];
        setDirecciones(dirs);
        if (dirs.length && !selectedAddressId) setSelectedAddressId(Number(dirs[0].direccionId ?? dirs[0].id));
      })
      .catch(() => setDirecciones([]));
  }, [user]);

  const handleQty = (item, val) => {
    const stock = Number(item.stock) || 999;
    const q = Math.max(1, Math.min(stock, parseInt(val) || 1));
    updateQuantity(item.uid ?? item.servidorId ?? item.productoId, q);
  };

  async function hacerPedido() {
    setError(null);
    if (!user) { setError('Debes iniciar sesión para realizar el pedido'); navigate('/login', { state: { from: '/carrito' } }); return; }
    const userId = user.UsuarioId || user.usuarioId || user.id;
    if (!userId) { setError('Usuario inválido'); return; }
    if (active.length === 0) { setError('Selecciona al menos un producto'); return; }
    if (!selectedAddressId) { setError('Selecciona una dirección de envío'); return; }

    setLoading(true);
    try {
      const pedidoItems = active.map(it => ({
        productoId: Number(it.productoId ?? it.productId ?? it.id ?? it.ProductoId),
        cantidad: Number(it.cantidad || 1)
      }));
      const token = user?.token || user?.accessToken || user?.jwt || user?.authToken;
      const res = await crearPedido(userId, Number(selectedAddressId), pedidoItems, token);

      for (const it of active) removeItem(it.uid ?? it.productoId ?? it.servidorId);

      const pedidoId = res?.id || res?.pedidoId || res;
      const facturaId = res?.facturaId || res?.factura?.facturaId || res?.factura?.id;
      const resumen = {
        pedidoId, facturaId,
        subtotal: +subtotal.toFixed(2), descuento: +discountTotal.toFixed(2),
        envio: +envio.toFixed(2), total: +total.toFixed(2),
        couponEarned, rewardCouponValue: couponEarned ? 400 : 0,
        items: active.map(it => ({ productoId: it.productoId, nombre: it.nombre || it.name, cantidad: it.cantidad, precio: it.precio })),
        direccionId: Number(selectedAddressId), descuentosPorItem: discountsByItem
      };
      if (pedidoId) navigate(`/pedidos/${pedidoId}`, { state: { resumen, success: true } });
      else navigate('/pedidos', { state: { resumen, success: true } });
    } catch (e) {
      const resp = e.response;
      const body = resp?.data;
      setError(resp ? `${resp.status} — ${typeof body === 'string' ? body : JSON.stringify(body)}` : e.message);
    } finally { setLoading(false); }
  }

  // Vacío
  if (items.length === 0) {
    return (
      <div className="ct">
        <div className="ct-inner">
          <div className="ct-empty">
            <svg viewBox="0 0 24 24"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
            <h2>Tu carrito est&aacute; vac&iacute;o</h2>
            <p>Agrega productos para empezar tu compra</p>
            <Link to="/">Ir a la tienda</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ct">
      <div className="ct-inner">

        {/* Header */}
        <div className="ct-head">
          <h1>Carrito de compras</h1>
          <span>{distinctCount} producto{distinctCount !== 1 ? 's' : ''} &middot; {totalUnits} unidad{totalUnits !== 1 ? 'es' : ''}</span>
        </div>

        {error && (
          <div className="ct-error">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
            <span>{error}</span>
          </div>
        )}

        <div className="ct-grid">

          {/* Items */}
          <div className="ct-items">
            {items.map((item, idx) => {
              const itemId = item.uid ?? item.servidorId ?? item.productoId ?? idx;
              const checked = selectedItems.includes(itemId);
              const lineTotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 1);
              return (
                <div className="ct-item" key={itemId}>
                  <input
                    type="checkbox" className="ct-check"
                    checked={checked}
                    onChange={e => setSelectedItems(s => e.target.checked ? [...s, itemId] : s.filter(id => id !== itemId))}
                  />
                  <div className="ct-img">
                    <img src={item.imagen || item.image || '/placeholder-product.jpg'} alt={item.nombre || ''} />
                  </div>
                  <div className="ct-details">
                    <div className="ct-row-top">
                      <h3
                        className="ct-name"
                        onClick={() => navigate(`/producto/${item.productoId ?? item.id ?? item.ProductoId}`)}
                      >
                        {item.nombre || item.name || `Producto ${item.productoId}`}
                      </h3>
                      <button className="ct-remove" onClick={() => removeItem(itemId)}>
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                      </button>
                    </div>
                    <div className="ct-price-unit">S/ {fmt(item.precio)} c/u</div>
                    <div className="ct-row-bottom">
                      <div className="ct-qty">
                        <button onClick={() => handleQty(item, (item.cantidad || 1) - 1)} disabled={item.cantidad <= 1}>−</button>
                        <input
                          type="number" min="1" max={item.stock || 999}
                          value={item.cantidad || 1}
                          onChange={e => handleQty(item, e.target.value)}
                        />
                        <button onClick={() => handleQty(item, (item.cantidad || 1) + 1)} disabled={item.cantidad >= (item.stock || 999)}>+</button>
                      </div>
                      <div className="ct-line-total">S/ {fmt(lineTotal)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="ct-sidebar">

            {/* Resumen */}
            <div className="ct-card">
              <h3>Resumen del pedido</h3>
              <div className="ct-row">
                <span>Subtotal ({totalUnits} items)</span>
                <span>S/ {fmt(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="ct-row" style={{ color: '#059669' }}>
                  <span>Descuento por volumen</span>
                  <span>- S/ {fmt(discountTotal)}</span>
                </div>
              )}
              <div className={`ct-row ${envio === 0 ? 'free' : ''}`}>
                <span>Env&iacute;o</span>
                <span>{envio === 0 ? 'Gratis' : `S/ ${fmt(envio)}`}</span>
              </div>
              <div className="ct-divider" />
              <div className="ct-row total">
                <span>Total</span>
                <span>S/ {fmt(total)}</span>
              </div>
            </div>

            {/* Dirección */}
            <div className="ct-card">
              <h4>Direcci&oacute;n de env&iacute;o</h4>
              {direcciones.length > 0 ? (
                <select
                  className="ct-addr-select"
                  value={selectedAddressId ?? ''}
                  onChange={e => setSelectedAddressId(Number(e.target.value))}
                >
                  {direcciones.map(d => (
                    <option key={d.direccionId ?? d.id} value={d.direccionId ?? d.id}>
                      {d.alias ? `${d.alias}: ` : ''}{d.calle ? `${d.calle}, ` : ''}{d.ciudad || ''}{d.pais ? `, ${d.pais}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="ct-no-addr">
                  <p>No tienes direcciones registradas</p>
                  <Link to="/perfil?tab=direcciones">Agregar direcci&oacute;n</Link>
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div className="ct-card">
              <h4>M&eacute;todo de pago</h4>
              <div className="ct-pay-icons">
                <img src="https://logosenvector.com/logo/img/yape-37283.png" alt="Yape" />
                <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin" />
                <img src="https://cdn-icons-png.flaticon.com/512/4140/4140803.png" alt="Transferencia" />
              </div>
              <p className="ct-pay-note">Yape, Plin o transferencia bancaria</p>
            </div>

            {/* Confianza */}
            <div className="ct-trust">
              <div className="ct-trust-row">
                <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                Pago 100% seguro
              </div>
              <div className="ct-trust-row">
                <svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
                Env&iacute;o r&aacute;pido y rastreado
              </div>
              <div className="ct-trust-row">
                <svg viewBox="0 0 24 24"><path d="M12.5 6.9c1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-2.06.45-3.72 1.82-3.72 3.84 0 2.48 2.05 3.71 5.03 4.43 2.68.64 3.22 1.58 3.22 2.57 0 1.74-1.66 2.46-3.22 2.46-2.13 0-2.91-.95-3.03-2.1H5.07c.13 2.22 1.78 3.47 3.93 3.89V22h3v-2.15c2.07-.42 3.72-1.69 3.72-3.85 0-3.05-2.6-4.1-5.03-4.8-2.44-.7-3.03-1.45-3.03-2.54 0-1.12 1.05-1.96 2.84-1.96z" /></svg>
                Devoluci&oacute;n sin costo
              </div>
            </div>

            {/* Acciones */}
            <div className="ct-actions">
              <button
                className="ct-btn-checkout"
                onClick={hacerPedido}
                disabled={loading || !selectedAddressId}
              >
                {loading ? <><div className="ct-spin" /> Procesando...</> : 'Realizar pedido'}
              </button>
              <Link to="/" className="ct-btn-continue">Seguir comprando</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}