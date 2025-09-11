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
  
  // Calcular totales solo de los seleccionados
  const filteredItems = selectedItems.length > 0 ? items.filter(it => selectedItems.includes(it.uid ?? it.productoId ?? it.servidorId)) : items;
  const subtotal = filteredItems.reduce((sum, item) => sum + ((Number(item.precio) || 0) * (Number(item.cantidad) || 0)), 0);
  const distinctCount = filteredItems.length;
  const totalUnits = filteredItems.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
  // Impuestos deshabilitados
  const impuestos = 0;

  // Business rule: if any item has more than 5 units, that item gets 30% off, shipping is free, and customer *earns* a S/400 coupon (for future use).
  const discountsByItem = filteredItems.map(it => {
    const qty = Number(it.cantidad || 0);
    if (qty > 5) {
      const base = Number(it.precio || 0) * qty;
      const discount = base * 0.30; // 30% discount on that product line
      return { productoId: it.productoId, descuento: discount };
    }
    return { productoId: it.productoId, descuento: 0 };
  });
  const discountTotal = discountsByItem.reduce((s, d) => s + (Number(d.descuento) || 0), 0);
  const couponEarned = filteredItems.some(it => Number(it.cantidad || 0) > 5);
  const rewardCouponValue = couponEarned ? 400 : 0;

  // Shipping becomes free if couponEarned OR if subtotal > 100 (legacy rule)
  const envio = (couponEarned || subtotal > 100) ? 0 : 9.99;
  const total = Math.max(0, subtotal - discountTotal + envio); // No impuestos

  // Procesar pedido
  async function hacerPedido() {
    setError(null);
    
    // Validaciones
    if(!user) { 
      setError('Debes iniciar sesión para realizar el pedido');
      navigate('/login', { state: { from: '/carrito' } });
      return;
    }
    
    const userId = user.UsuarioId || user.usuarioId || user.id;
    if(!userId) { setError('Usuario inválido'); return; }
  if(filteredItems.length === 0) { setError('Selecciona al menos un producto para comprar'); return; }
    if(!selectedAddressId) { setError('Selecciona una dirección de envío'); return; }

    setLoading(true);
    
    try {
      // Preparar los items para la creación del pedido
      const normalizeProductoId = (it) => Number(it.productoId ?? it.productId ?? it.id ?? it.ProductoId);
      const pedidoItems = filteredItems.map(it => ({ 
        productoId: normalizeProductoId(it), 
        cantidad: Number(it.cantidad || 1) 
      }));
      
      console.log("Creando pedido con los siguientes datos:", {
        usuarioId: userId,
        direccionId: selectedAddressId,
        items: pedidoItems
      });
      
      // Obtener el token del usuario
      const userToken = user?.token || user?.accessToken || user?.jwt || user?.authToken;
      
      // Usar nuestra nueva función API optimizada para el controlador
      const res = await crearPedido(
        userId, 
        Number(selectedAddressId), 
        pedidoItems,
        userToken
      );

      // Éxito - eliminar solo los productos seleccionados del carrito
      for (const it of filteredItems) {
        removeItem(it.uid ?? it.productoId ?? it.servidorId);
      }
  const facturaId = res?.facturaId || res?.factura?.facturaId || res?.factura?.id;
  const pedidoId = res?.id || res?.pedidoId || res;
      
      const resumen = {
        pedidoId,
        facturaId,
        subtotal: Number(subtotal.toFixed(2)),
        descuento: Number(discountTotal.toFixed(2)),
        envio: Number(envio.toFixed(2)),
        total: Number(total.toFixed(2)),
        couponEarned,
        rewardCouponValue,
        items: filteredItems.map(it => ({
          productoId: it.productoId,
          nombre: it.nombre || it.name,
          cantidad: it.cantidad,
          precio: it.precio
        })),
        direccionId: Number(selectedAddressId),
        descuentosPorItem: discountsByItem
      };
      
  // Redirigir directamente sin mostrar mensaje de agradecimiento
  try {
    if (pedidoId) {
      navigate(`/pedidos/${pedidoId}`, { state: { resumen, success: true } });
    } else {
      navigate('/pedidos', { state: { resumen, success: true } });
    }
  } catch (navError) {
    console.error('Error al navegar después de crear el pedido:', navError);
    // Si hay error al navegar, simplemente quedarse en la página actual
  }
    } catch(e) {
      console.error('Error al crear pedido:', e);
      const resp = e.response;
      const body = resp?.data;
      const msg = resp ? 
        `${resp.status} ${resp.statusText} - ${typeof body === 'string' ? body : JSON.stringify(body)}` : 
        e.message;
      setError(msg);
    } finally { 
      setLoading(false); 
    }
  }

  // Cargar direcciones
  useEffect(() => {
    async function load() {
      try {
        if(!user) return;
        const userId = user.UsuarioId || user.usuarioId || user.id || DEFAULT_USER_ID;
        
        const dirsRes = await axios.get(`${API}/Direcciones/usuario/${userId}`)
          .catch(e => ({ data: [], status: e?.response?.status }));
        
        const dirs = dirsRes?.data || [];
        setDirecciones(dirs);
        
        // Seleccionar primera dirección disponible
        if(dirs.length && !selectedAddressId) setSelectedAddressId(Number(dirs[0].direccionId ?? dirs[0].id));
      } catch(err) { 
        console.warn('Error cargando direcciones:', err); 
      }
    }
    
    load();
  }, [user]);

  // Actualizar cantidad de un producto (acepta productoId o servidorId)
  const handleQuantityChange = (id, newQuantity) => {
    const quantity = Math.max(1, Math.min(100, parseInt(newQuantity) || 1));
    updateQuantity(id, quantity);
  };

  // Carrito vacío (ubicado después de los hooks para mantener el orden estable)
  if(items.length === 0) {
    return (
      <div className="ae-empty-cart">
        <div className="ae-empty-content">
          <svg className="ae-empty-icon" viewBox="0 0 24 24">
            <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos para continuar con tu compra</p>
          <Link to="/" className="ae-back-to-shop">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ae-cart-page">
      <div className="ae-cart-container">
        {/* Encabezado */}
        <div className="ae-cart-header">
          <h1>Tu Carrito</h1>
          <div className="ae-cart-summary">
            {distinctCount} producto(s) • {totalUnits} unidad(es)
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="ae-cart-error">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Contenido principal */}
        <div className="ae-cart-content">
          {/* Lista de productos */}
          <div className="ae-cart-items">
            {items.map((item, idx) => {
              const itemId = item.uid ?? item.servidorId ?? item.productoId ?? idx;
              const isChecked = selectedItems.includes(itemId);
              return (
                <div className="ae-cart-item" key={itemId} style={{position:'relative'}}>
                  {/* Checkbox en esquina superior izquierda */}
                  <input
                    type="checkbox"
                    className="ae-item-checkbox"
                    checked={isChecked}
                    onChange={e => {
                      setSelectedItems(sel => e.target.checked ? [...sel, itemId] : sel.filter(id => id !== itemId));
                    }}
                  />
                  <div className="ae-item-image">
                    <img 
                      src={item.imagen || item.image || '/placeholder-product.jpg'} 
                      alt={item.nombre || item.name || ''} 
                    />
                  </div>
                  <div className="ae-item-details">
                    <div className="ae-item-header" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <h3 className="ae-item-name" style={{margin:0}}>
                        {item.nombre || item.name || `Producto ${item.productoId ?? item.id ?? item.ProductoId}`}
                      </h3>
                      <button 
                        className="ae-item-remove"
                        onClick={() => removeItem(itemId)}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                    <button
                      className="ae-item-viewmore"
                      onClick={() => navigate(`/producto/${item.productoId ?? item.id ?? item.ProductoId}`)}
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{marginRight:'6px',verticalAlign:'middle'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                      Ver más
                    </button>
                    <div className="ae-item-price">
                      S/ {(item.precio || 0).toFixed(2)}
                    </div>
                    <div className="ae-item-actions">
                      <div className="ae-quantity-selector">
                        <button 
                          className="ae-quantity-btn"
                          onClick={() => handleQuantityChange(itemId, (item.cantidad || 1) - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.cantidad || 1}
                          onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                          className="ae-quantity-input"
                        />
                        <button 
                          className="ae-quantity-btn"
                          onClick={() => handleQuantityChange(itemId, (item.cantidad || 1) + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="ae-item-total">
                        S/ {((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de compra */}
          <div className="ae-cart-summary">
            <div className="ae-summary-card">
              <h3>Resumen de compra</h3>
              <div className="ae-summary-row">
                <span>Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="ae-summary-row">
                <span>Envío</span>
                <span>{envio === 0 ? 'Gratis' : `S/ ${envio.toFixed(2)}`}</span>
              </div>
              {/* Impuestos ocultos porque no aplica facturación electrónica */}
              {/* <div className="ae-summary-row">
                <span>Impuestos</span>
                <span>S/ {impuestos.toFixed(2)}</span>
              </div> */}
              <div className="ae-summary-divider"></div>
              <div className="ae-summary-row ae-total">
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              {/* Selección de dirección */}
              <div className="ae-shipping-section">
                <h4>Dirección de envío</h4>
                {direcciones.length ? (
                  <select 
                    className="ae-form-select"
                    value={selectedAddressId ?? ''} 
                    onChange={e => setSelectedAddressId(Number(e.target.value))}
                  >
                    {direcciones.map(dir => (
                      <option 
                        key={dir.direccionId ?? dir.id} 
                        value={dir.direccionId ?? dir.id}
                      >
                        {dir.nombre ? `${dir.nombre}: ` : ''}
                        {dir.calle ? `${dir.calle}, ` : ''}
                        {dir.ciudad || ''}
                        {dir.pais ? `, ${dir.pais}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="ae-no-address">
                    <p>No hay direcciones registradas</p>
                    <Link to="/perfil" className="ae-add-address">
                      Agregar dirección
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Información de pago */}
              <div className="ae-payment-section">
                <h4>Método de pago</h4>
                <div className="ae-payment-icons" style={{display: "flex", marginBottom: "10px"}}>
                  <img src="https://logosenvector.com/logo/img/yape-37283.png" alt="Yape" style={{height: "32px", marginRight: "10px"}} />
                  <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin" style={{height: "32px", marginRight: "10px"}} />
                  <img src="https://cdn-icons-png.flaticon.com/512/4140/4140803.png" alt="transferencia bancaria" style={{height: "32px"}} />
                </div>
                <div className="ae-payment-info">
                  <p>Aceptamos Yape, Plin o transferencia bancaria</p>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="ae-cart-actions">
                <Link to="/" className="ae-continue-shopping">
                  Seguir comprando
                </Link>
                <button 
                  className="ae-checkout-btn"
                  onClick={hacerPedido}
                  disabled={loading || !selectedAddressId}
                >
                  {loading ? (
                    <>
                      <svg className="ae-spinner" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    'Realizar pedido'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}