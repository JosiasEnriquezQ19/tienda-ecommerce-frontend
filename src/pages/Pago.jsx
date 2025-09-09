import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { API, DEFAULT_USER_ID } from '../api'
import { CartContext } from '../carrito/ContextoCarrito'
import { AuthContext } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { crearPedido } from '../api/pedidosApi'

export default function Pago() {
  const { items, clear } = useContext(CartContext)
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [direccionId, setDireccionId] = useState(null)
  const [direcciones, setDirecciones] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const total = items.reduce((s, i) => s + (i.precio * i.cantidad), 0)

  useEffect(() => {
    if (user) {
      const uid = user.UsuarioId || user.usuarioId || user.id
      setUserId(uid)
      // fetch addresses
      axios.get(`${API}/Direcciones/usuario/${uid}`).then(r => setDirecciones(r.data || [])).catch(err => {
        if (err?.response?.status === 404) setDirecciones([])
      })
      const selAddr = localStorage.getItem('selectedAddressId')
      if (selAddr) setDireccionId(Number(selAddr))
    }
    else {
      // fallback to a default test user if backend was reseeded
      const fallback = DEFAULT_USER_ID
      setUserId(fallback)
      axios.get(`${API}/Direcciones/usuario/${fallback}`).then(r => setDirecciones(r.data || [])).catch(err => { if (err?.response?.status === 404) setDirecciones([]) })
    }
  }, [user])

  async function handleCheckout(e) {
    e.preventDefault()
    if (items.length === 0) { setStatus('Carrito vacío'); return }
    if (!userId) { setStatus('Debes iniciar sesión'); return }
    if (!direccionId) { setStatus('Selecciona una dirección de envío en tu perfil antes de pagar'); return }
    
    try {
      setLoading(true)
      
      // Preparar los items para la función de API
      const pedidoItems = items.map(i => ({ 
        productoId: Number(i.productoId), 
        cantidad: Number(i.cantidad) 
      }));
      
      // Obtener token si existe
      const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
      
      // Usar la función optimizada para el controlador
      console.log("Creando pedido con los siguientes datos:", {
        usuarioId: userId,
        direccionId,
        items: pedidoItems
      });
      
      // Llamar a la API usando la función creada
      const res = await crearPedido(
        userId,
        Number(direccionId),
        pedidoItems,
        token
      );
      const pedidoId = res?.id || res?.pedidoId || res
      setStatus('Pedido creado: ' + (pedidoId || JSON.stringify(res.data)))
      clear()
      
      // Mostrar alerta de éxito al usuario inmediatamente
      alert('Pedido creado. Sigue las instrucciones para completar el pago.');

      if (pedidoId) {
        // Navigate to PagoQR view which will show QR and instructions.
        // We will not generate factura/comprobante automáticamente.
        navigate('/pago-qr', { state: { pedidoId, total, qrUrl: 'https://e7.pngegg.com/pngimages/673/538/png-clipart-qr-code-computer-scan-stick-platform-hero-computer-text-rectangle.png', correo: user?.email || user?.correo || '', telefono: '' } });
        return;
      }
    } catch (e) {
      console.error('Error al crear pedido:', e)
      const resp = e.response
      const body = resp?.data
      setStatus('Error: ' + (resp ? `${resp.status} ${resp.statusText} - ${typeof body === 'string' ? body : JSON.stringify(body)}` : e.message))
    } finally { setLoading(false) }
  }


  return (
    <div className="ae-checkout-container">
      <div className="ae-checkout-card">
        <h1 className="ae-checkout-title">Finalizar Compra</h1>
        
        <div className="ae-checkout-grid">
          {/* Resumen del pedido */}
          <div className="ae-checkout-summary">
            <h2 className="ae-checkout-section-title">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
              Resumen del Pedido
            </h2>
            
            {items.length === 0 ? (
              <div className="ae-checkout-empty">
                <p>Tu carrito está vacío</p>
                <button className="ae-checkout-button" onClick={() => navigate('/')}>Continuar comprando</button>
              </div>
            ) : (
              <>
                <ul className="ae-checkout-items">
                  {items.map(it => (
                    <li key={it.productoId} className="ae-checkout-item">
                      <div className="ae-checkout-item-image">
                        <img src={it.imagen || '/placeholder-product.jpg'} alt={it.nombre} />
                      </div>
                      <div className="ae-checkout-item-details">
                        <h3>{it.nombre}</h3>
                        <div className="ae-checkout-item-price">
                          {it.cantidad} × S/ {Number(it.precio).toFixed(2)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="ae-checkout-totals">
                  <div className="ae-checkout-total-row">
                    <span>Subtotal:</span>
                    <span>S/ {Number(total).toFixed(2)}</span>
                  </div>
                  <div className="ae-checkout-total-row">
                    <span>Envío:</span>
                    <span>Gratis</span>
                  </div>
                  <div className="ae-checkout-total-row ae-checkout-grand-total">
                    <span>Total:</span>
                    <span>S/ {Number(total).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Información de envío y pago */}
          <div className="ae-checkout-info">
            {/* Dirección de envío */}
            <div className="ae-checkout-section">
              <h2 className="ae-checkout-section-title">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Dirección de Envío
              </h2>
              
              {direcciones.length === 0 ? (
                <div className="ae-checkout-empty-section">
                  <p>No hay direcciones registradas</p>
                  <button className="ae-checkout-button" onClick={() => navigate('/perfil')}>Añadir dirección</button>
                </div>
              ) : (
                <div className="ae-checkout-addresses">
                  {direcciones.map(d => (
                    <label key={d.direccionId ?? d.id} className="ae-checkout-address">
                      <input 
                        type="radio" 
                        name="direccion" 
                        checked={Number(direccionId) === Number(d.direccionId ?? d.id)} 
                        onChange={() => setDireccionId(Number(d.direccionId ?? d.id))} 
                      />
                      <div className="ae-checkout-address-content">
                        <div className="ae-checkout-address-main">
                          {d.linea ?? d.direccion ?? d.direccionLinea}
                        </div>
                        <div className="ae-checkout-address-secondary">
                          {d.ciudad}, {d.codigoPostal}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Método de Pago */}
            <div className="ae-checkout-section">
              <h2 className="ae-checkout-section-title">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                Método de Pago
              </h2>
              
              <div className="ae-checkout-payment-methods">
                <div className="ae-checkout-payment-icons">
                  <img src="https://logosenvector.com/logo/img/yape-37283.png" alt="Yape" style={{height: "32px", marginRight: "10px"}} />
                  <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin" style={{height: "32px", marginRight: "10px"}} />
                  <img src="https://cdn-icons-png.flaticon.com/512/4140/4140803.png" alt="transferencia bancaria" style={{height: "32px"}} />
                </div>
                <div className="ae-checkout-payment-content">
                  <p>Aceptamos Yape, Plin o transferencia bancaria</p>
                </div>
              </div>
            </div>

            {/* Botón de confirmación */}
            <div className="ae-checkout-confirm">
              <button 
                className="ae-checkout-button ae-checkout-confirm-button" 
                onClick={handleCheckout} 
                disabled={loading || items.length === 0}
              >
                {loading ? (
                  <>
                    <svg className="ae-spinner" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="20" fill="none" />
                    </svg>
                    Procesando...
                  </>
                ) : 'Realizar pago'}
              </button>
              
              {status && (
                <div className={`ae-checkout-status ${status.includes('Error') ? 'ae-checkout-error' : 'ae-checkout-success'}`}>
                  {status.includes('Error') ? (
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                  <span>{String(status)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}