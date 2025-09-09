import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../api'
import { fetchPedidosPorUsuario, fetchPedidoDetalle } from '../api/pedidosApi'

// Helper to normalize item shape for thumbnails
const normalizeItem = (it) => {
  if (!it) return { imagen: null, nombre: 'Producto', cantidad: 1, precio: 0 }
  
  // Extraer información del producto
  let producto = it.producto || it.Producto || it;
  
  // Buscar la imagen (intentando diferentes propiedades comunes)
  const imagen = 
    it.imagen || it.image || it.imagenUrl || it.imageUrl || it.urlImagen ||
    producto.imagen || producto.image || producto.imagenUrl || producto.imageUrl || 
    producto.urlImagen || producto.imagenes?.[0] || null;
  
  // Buscar el nombre del producto
  const nombre = 
    it.nombre || it.Nombre || it.name || it.title || 
    producto.nombre || producto.Nombre || producto.name || 'Producto';
  
  // Buscar la cantidad
  const cantidad = 
    it.cantidad || it.Cantidad || it.qty || it.quantity || it.cant || 1;
  
  // Buscar el precio (con prioridad al precio unitario del detalle)
  const precio = 
    it.precioUnitario || it.PrecioUnitario || it.unitPrice || 
    it.precio || it.Precio || it.price || it.valorUnitario || 
    producto.precio || producto.Precio || producto.price || 0;
  
  return { imagen, nombre, cantidad, precio }
}

const normalizeImageUrl = (src) => {
  if (!src) return null
  if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) return src
  if (typeof src === 'string' && src.startsWith('//')) return window.location.protocol + src
  if (typeof src === 'string' && src.startsWith('/')) {
    try { const apiUrl = new URL(window.location.origin); return apiUrl.origin + src } catch (e) { return src }
  }
  return src
}

export function UserOrders({ usuarioId, token }) {
  const [pedidos, setPedidos] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadingDetalles, setLoadingDetalles] = useState({}) // Para rastrear qué pedidos están cargando detalles

  // Función para cargar detalles de un pedido específico
  const cargarDetallesPedido = async (pedidoId) => {
    if (!pedidoId) return null;
    
    // Actualizar estado de carga
    setLoadingDetalles(prev => ({ ...prev, [pedidoId]: true }));
    
    try {
      console.log(`UserOrders: Cargando detalles del pedido ${pedidoId}`);
      const detallePedido = await fetchPedidoDetalle(pedidoId, token);
      console.log(`UserOrders: Detalles del pedido ${pedidoId} cargados:`, detallePedido);
      
      // Marcar como cargado
      setLoadingDetalles(prev => ({ ...prev, [pedidoId]: false }));
      
      return detallePedido;
    } catch (error) {
      console.error(`UserOrders: Error al cargar detalles del pedido ${pedidoId}:`, error);
      
      // Marcar como error en la carga
      setLoadingDetalles(prev => ({ ...prev, [pedidoId]: false }));
      
      return null;
    }
  };

  // Cargar automáticamente los detalles de pedidos que no tienen items
  useEffect(() => {
    let mounted = true;
    
    if (pedidos && pedidos.length > 0) {
      // Identificar pedidos que no tienen detalles
      const pedidosSinDetalles = pedidos.filter(p => {
        // Buscar detalles en diferentes propiedades
        const detalles = p.detalles || p.items || p.productos || p.lineItems || p.orderItems || [];
        return !Array.isArray(detalles) || detalles.length === 0;
      }).slice(0, 3); // Limitar a 3 para evitar muchas llamadas simultáneas
      
      if (pedidosSinDetalles.length > 0) {
        console.log(`UserOrders: Se cargarán detalles de ${pedidosSinDetalles.length} pedidos automáticamente`);
        
        // Cargar detalles de cada pedido
        pedidosSinDetalles.forEach(async (p) => {
          const pedidoId = p.pedidoId || p.id || p.PedidoId;
          if (!pedidoId) return;
          
          const detallePedido = await cargarDetallesPedido(pedidoId);
          
          if (detallePedido && mounted) {
            // Actualizar el estado con los nuevos detalles
            setPedidos(prevPedidos => prevPedidos.map(prevP => 
              (prevP.pedidoId || prevP.id || prevP.PedidoId) === pedidoId
                ? { ...prevP, detalles: detallePedido.detalles }
                : prevP
            ));
          }
        });
      }
    }
    
    return () => { mounted = false; };
  }, [pedidos, token]);

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!usuarioId && usuarioId !== 0) throw new Error('Usuario no identificado')
        
        try {
          console.log('UserOrders: Cargando pedidos para usuario:', usuarioId);
          const data = await fetchPedidosPorUsuario(usuarioId, token)
          
          // No es necesario filtrar ya que el API ya devuelve los pedidos filtrados
          // Pero mantenemos el código por compatibilidad con versiones antiguas del API
          const arr = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : [])
          
          // Verificar si la respuesta requiere filtrado adicional
          // La API debería filtrar por usuario, pero por si acaso filtramos de nuevo
          const filtered = arr.filter(p => {
            const pedidoUsuarioId = p.usuarioId || p.UsuarioId || p.userId || p.UserId || 
                                   (p.usuario && (p.usuario.id || p.usuario.usuarioId));
            return !pedidoUsuarioId || String(pedidoUsuarioId) === String(usuarioId);
          })
          
          console.log(`UserOrders: Pedidos cargados exitosamente: ${filtered.length}`);
          if (mounted) setPedidos(filtered)
        } catch (apiError) {
          console.error('UserOrders: Error al cargar pedidos:', apiError);
          // No propagar el error a la interfaz de usuario, mostrar lista vacía en su lugar
          if (mounted) setPedidos([])
        }
      } catch (e) {
        console.error('UserOrders: Error general:', e);
        // Solo mostramos errores críticos (como falta de ID de usuario)
        if (mounted) setError(e.message ?? 'Error cargando pedidos')
      } finally { 
        if (mounted) setLoading(false) 
      }
    }
    load()
    return () => { mounted = false }
  }, [usuarioId, token])

  if (loading) return (
    <div className="ae-loading-container"><div className="ae-spinner-container"><svg className="ae-spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none"/></svg><p>Cargando tus pedidos...</p></div></div>
  )
  if (error) return (
    <div className="ae-error-container">
      <div className="ae-error-card">
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <h3>No podemos mostrar tus pedidos</h3>
        <p>{String(error)}</p>
        <button onClick={() => window.location.reload()} className="ae-retry-button">
          Intentar nuevamente
        </button>
      </div>
    </div>
  )
  if (!pedidos || pedidos.length === 0) return (
    <div className="ae-empty-orders">
      <svg viewBox="0 0 24 24" width="64" height="64"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
      <h3>No tienes pedidos aún</h3>
      <p>Cuando realices un pedido, aparecerá aquí</p>
      <Link to="/" className="ae-login-button">Ir a comprar</Link>
    </div>
  )

  return (
    <div className="ae-orders-list">
    {pedidos.map((p, idx) => {
        // offer logic: 15% off when 2+ products and created within 3 days
        const itemsCount = Array.isArray(p.detalles) ? p.detalles.length : (Array.isArray(p.items) ? p.items.length : (p.cantidadItems || p.itemsCount || 0))
        const createdAt = p.fecha || p.fechaPedido || p.createdAt || p.created_on || p.created || null
        const createdDate = createdAt ? new Date(createdAt) : null
        const now = new Date()
        const within3Days = createdDate ? ((now - createdDate) / (1000 * 60 * 60 * 24)) <= 3 : false
        const offerEligible = itemsCount >= 2 && within3Days
        const subtotal = Number(p.subtotal || p.monto || p.total || 0)
        const discountedTotal = offerEligible ? Number((subtotal * 0.85).toFixed(2)) : subtotal

        return (
      <div key={p.pedidoId || p.id || idx} className="ae-order-card">
          <div className="ae-order-header">
            <div className="ae-order-number">
              <svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              <span>Pedido #{p.pedidoId || p.id || p.PedidoId}</span>
            </div>
            <div style={{fontSize:13,color:'#6b7280'}}>{p.nombreCliente || p.cliente || p.usuario || p.userName || p.user || ''}</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div className={`ae-order-status ae-status-${(p.estado || p.Estado || 'pendiente').toLowerCase()}`}>{p.estado || p.Estado || 'Pendiente'}</div>
              {offerEligible && <div className="ae-offer-badge">Oferta 15% • expira {(createdDate) ? new Date(createdDate.getTime() + 3*24*60*60*1000).toLocaleDateString() : '—'}</div>}
            </div>
          </div>

          <div className="ae-order-details">
            <div className="ae-order-items-list">
              {(() => {
                // Función para encontrar los detalles del pedido en diferentes ubicaciones
                const findOrderItems = (order) => {
                  // Propiedades comunes donde pueden estar los items
                  const itemProperties = [
                    'detalles', 'Detalles', 'items', 'Items', 'productos', 'Productos',
                    'lineItems', 'orderItems', 'detalle', 'Detalle', 'articulos', 'Articulos'
                  ];

                  // Buscar en propiedades de nivel superior
                  for (const prop of itemProperties) {
                    if (order[prop] && Array.isArray(order[prop]) && order[prop].length > 0) {
                      console.log(`Encontrados items en propiedad: ${prop}`, order[prop]);
                      return order[prop];
                    }
                  }
                  
                  // Buscar en propiedades anidadas
                  for (const prop of ['detalle', 'Detalle', 'order', 'Order']) {
                    if (order[prop]) {
                      for (const innerProp of itemProperties) {
                        if (order[prop][innerProp] && Array.isArray(order[prop][innerProp]) && order[prop][innerProp].length > 0) {
                          return order[prop][innerProp];
                        }
                      }
                    }
                  }
                  
                  // No se encontraron items
                  console.warn('No se encontraron items en el pedido:', order);
                  return [];
                };

                // Buscar los detalles del pedido
                const detalles = findOrderItems(p);
                
                if (detalles.length > 0) {
                  return detalles.slice(0, 3).map(itRaw => {
                    const it = normalizeItem(itRaw);
                    return (
                      <div key={(itRaw.productoId || itRaw.ProductoId || itRaw.id || Math.random())} className="ae-order-item-mini">
                        <img src={normalizeImageUrl(it.imagen) || '/placeholder-product.jpg'} alt={it.nombre} />
                        <div className="ae-order-item-mini-info">
                          <div className="ae-order-item-mini-name">{it.nombre}</div>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            <div className="ae-order-item-mini-qty">x{it.cantidad}</div>
                            <div className="ae-order-item-mini-qty">S/ {Number(it.precio || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                } else {
                  // Si no hay detalles, mostrar mensaje con información de diagnóstico
                  const pedidoId = p.pedidoId || p.id || p.PedidoId;
                  const isLoading = loadingDetalles[pedidoId];
                  
                  return (
                    <div className="ae-order-no-items">
                      {isLoading ? (
                        <div>
                          <div className="ae-spinner-mini" style={{margin: '10px auto'}}>
                            <svg viewBox="0 0 50 50" width="20" height="20">
                              <circle cx="25" cy="25" r="20" fill="none"/>
                            </svg>
                          </div>
                          <div>Cargando artículos...</div>
                        </div>
                      ) : (
                        <>
                          <div>No se encontraron artículos</div>
                          <div style={{fontSize: '0.8rem', color: '#777', marginTop: '5px'}}>
                            ID: {pedidoId || 'N/A'}, 
                            Total: S/ {Number(p.total || p.monto || p.valor || p.subtotal || 0).toFixed(2)}
                          </div>
                          <button 
                            className="ae-order-load-details"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const pedidoId = p.pedidoId || p.id || p.PedidoId;
                              console.log(`Cargando detalles manualmente para pedido ${pedidoId}`);
                              
                              try {
                                // Usar nuestra función reutilizable para cargar detalles
                                const detallePedido = await cargarDetallesPedido(pedidoId);
                                
                                if (detallePedido && detallePedido.detalles && detallePedido.detalles.length > 0) {
                                  console.log('Detalles cargados exitosamente:', detallePedido.detalles);
                                  // Actualizar el pedido con los detalles encontrados
                                  setPedidos(prev => prev.map(pedido => 
                                    (pedido.pedidoId || pedido.id || pedido.PedidoId) === pedidoId
                                      ? { ...pedido, detalles: detallePedido.detalles } 
                                      : pedido
                                  ));
                                } else {
                                  console.warn('No se encontraron detalles para el pedido');
                                  alert('No se pudieron cargar los artículos del pedido');
                                }
                              } catch (error) {
                                console.error('Error cargando detalles:', error);
                                alert(`Error al cargar los detalles: ${error.message}`);
                              }
                            }}
                          >
                            Cargar artículos
                          </button>
                        </>
                      )}
                    </div>
                  );
                }
              })()}
            </div>

            <div className="ae-order-total">
              <span>Totales</span>
              <span className="ae-order-amount">S/ {Number(p.total || p.monto || p.valor || p.subtotal || 0).toFixed(2)}</span>
              {offerEligible && <div style={{fontSize:13,color:'#059669',marginTop:6}}>Precio con descuento: S/ {discountedTotal.toFixed(2)}</div>}
            </div>
          </div>

          <div className="ae-order-footer">
            <span className="ae-order-date">{p.fecha ? new Date(p.fecha).toLocaleDateString() : (p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString() : 'Fecha no disponible')}</span>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <Link to={`/pedidos/${p.pedidoId || p.id || p.PedidoId}`} className="ae-order-link" style={{textDecoration:'none'}} state={{pedido: p}}>
                Ver detalles
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </Link>

              <button className="ae-secondary-button" onClick={() => { if (confirm('¿Eliminar pedido?')) { alert('Funcionalidad de eliminar pendiente de backend') } }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
