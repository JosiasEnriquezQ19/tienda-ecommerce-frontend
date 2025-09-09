import { API } from '../api'
import type { PedidoDto } from '../types/pedidoTypes'

// Interfaces para crear pedidos conforme al controlador de la API
interface PedidoItemDto {
  ProductoId: number;
  Cantidad: number;
}

interface CrearPedidoDto {
  DireccionId: number;
  MetodoPagoId?: number | null;
  Items: PedidoItemDto[];
}

/**
 * Normaliza la estructura de un pedido para asegurar que tenga todos los campos necesarios
 * y que los detalles estén en el formato esperado
 */
function normalizarPedido(pedido: any): PedidoDto {
  // Primero identificamos dónde están los detalles/items del pedido
  const posiblesDetalles = [
    pedido.detalles, 
    pedido.Detalles,
    pedido.items,
    pedido.Items,
    pedido.productos,
    pedido.Productos,
    pedido.lineItems,
    pedido.orderItems
  ];

  // Usar el primer array válido que encontremos
  const detallesOriginales = posiblesDetalles.find(d => Array.isArray(d) && d.length > 0) || [];

  // Normalizar cada detalle
  const detalles = detallesOriginales.map(detalle => {
    const producto = detalle.producto || detalle.Producto || null;
    
    return {
      detallePedidoId: detalle.detallePedidoId || detalle.id || 0,
      pedidoId: detalle.pedidoId || pedido.pedidoId || pedido.id || 0,
      productoId: detalle.productoId || detalle.ProductoId || (producto ? producto.productoId || producto.id : 0) || 0,
      cantidad: detalle.cantidad || detalle.Cantidad || 1,
      precioUnitario: detalle.precioUnitario || detalle.PrecioUnitario || detalle.precio || detalle.Precio || 0,
      producto: producto ? {
        productoId: producto.productoId || producto.id || detalle.productoId || 0,
        nombre: producto.nombre || producto.Nombre || producto.name || 'Producto',
        precio: producto.precio || producto.Precio || producto.price || 0,
        imagenUrl: producto.imagenUrl || producto.imagen || producto.imageUrl || producto.image || null
      } : null
    };
  });

  // Construir un pedido normalizado
  return {
    pedidoId: pedido.pedidoId || pedido.id || 0,
    usuarioId: pedido.usuarioId || pedido.UsuarioId || pedido.userId || 0,
    direccionId: pedido.direccionId || pedido.DireccionId || 0,
    metodoPagoId: pedido.metodoPagoId || pedido.MetodoPagoId || 0,
    subtotal: pedido.subtotal || pedido.Subtotal || pedido.montoSubtotal || 0,
    impuestos: pedido.impuestos || pedido.Impuestos || pedido.montoImpuestos || 0,
    total: pedido.total || pedido.Total || pedido.montoTotal || pedido.importe || 0,
    estado: pedido.estado || pedido.Estado || 'pendiente',
    fechaPedido: pedido.fechaPedido || pedido.FechaPedido || pedido.fecha || pedido.createdAt || new Date().toISOString(),
    numeroSeguimiento: pedido.numeroSeguimiento || pedido.NumeroSeguimiento || null,
    detalles
  };
}

/**
 * Obtiene los detalles de un pedido específico por su ID
 * Utiliza el endpoint GET /api/Pedidos/{id} del controlador
 */
export async function fetchPedidoDetalle(pedidoId: number | string, token?: string): Promise<PedidoDto> {
  const headers: Record<string,string> = { 'Content-Type':'application/json', 'Accept':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    console.log(`[API] Obteniendo detalles del pedido ${pedidoId}`);
    const res = await fetch(`${API}/Pedidos/${encodeURIComponent(String(pedidoId))}`, { headers });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`[API] Detalles del pedido obtenidos correctamente`);
      
      // Normalizar la estructura del pedido
      const pedidoNormalizado = normalizarPedido(data);
      console.log('[API] Pedido normalizado:', pedidoNormalizado);
      
      return pedidoNormalizado;
    }
    
    console.error(`[API] Error al obtener detalles del pedido: ${res.status}`);
    throw new Error(`No se pudo obtener el pedido (Código ${res.status})`);
  } catch (e) {
    console.error('[API] Error al obtener detalles del pedido:', e);
    throw e; // Propagar el error ya que aquí sí necesitamos mostrar el error al usuario
  }
}

export async function fetchPedidosPorUsuario(usuarioId: number | string | undefined, token?: string): Promise<PedidoDto[]> {
  if (!usuarioId && usuarioId !== 0) throw new Error('fetchPedidosPorUsuario: usuarioId es requerido')
  const headers: Record<string,string> = { 'Content-Type':'application/json', 'Accept':'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    // Método 1: Endpoint específico para pedidos por usuario
    // GET /api/Pedidos/usuario/{usuarioId} - Este endpoint está optimizado para este caso exacto
    try {
      console.log(`[API] Intentando endpoint específico: /Pedidos/usuario/${usuarioId}`);
      let res = await fetch(`${API}/Pedidos/usuario/${encodeURIComponent(String(usuarioId))}`, { headers });
      if (res.ok) {
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : [rawData];
        console.log(`[API] Endpoint específico exitoso, ${data.length} pedidos encontrados`);
        return data.map(pedido => normalizarPedido(pedido));
      }
      console.log(`[API] Endpoint específico falló con código: ${res.status}`);
    } catch (e) {
      console.log('[API] Error en endpoint específico:', e);
    }

    // Método 2: Endpoint with-user que incluye datos de usuario y productos en un solo request
    // GET /api/Pedidos/with-user?usuarioId={usuarioId}
    try {
      console.log(`[API] Intentando endpoint with-user con parámetro: /Pedidos/with-user?usuarioId=${usuarioId}`);
      let res = await fetch(`${API}/Pedidos/with-user?usuarioId=${encodeURIComponent(String(usuarioId))}`, { headers });
      if (res.ok) {
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : [rawData];
        console.log(`[API] Endpoint with-user exitoso, ${data.length} pedidos encontrados`);
        return data.map(pedido => normalizarPedido(pedido));
      }
      console.log(`[API] Endpoint with-user falló con código: ${res.status}`);
    } catch (e) {
      console.log('[API] Error en endpoint with-user:', e);
    }

    // Método 3: Filtrado por usuarioId
    // GET /api/Pedidos?usuarioId={usuarioId}
    try {
      console.log(`[API] Intentando con parámetro usuarioId: /Pedidos?usuarioId=${usuarioId}`);
      let res = await fetch(`${API}/Pedidos?usuarioId=${encodeURIComponent(String(usuarioId))}`, { headers });
      if (res.ok) {
        const rawData = await res.json();
        const data = Array.isArray(rawData) ? rawData : (Array.isArray(rawData.data) ? rawData.data : [rawData]);
        console.log(`[API] Endpoint con usuarioId exitoso, ${data.length} pedidos encontrados`);
        return data.map(pedido => normalizarPedido(pedido));
      }
      console.log(`[API] Endpoint con usuarioId falló con código: ${res.status}`);
    } catch (e) {
      console.log('[API] Error en endpoint con usuarioId:', e);
    }

    // Método 4: Obtener todos y filtrar (último recurso)
    // Nuestro controlador devuelve lista vacía en caso de error para GET /api/Pedidos
    try {
      console.log('[API] Intentando obtener todos los pedidos y filtrar localmente');
      let res = await fetch(`${API}/Pedidos`, { headers });
      if (res.ok) {
        const allData = await res.json();
        const data = Array.isArray(allData) ? allData : (Array.isArray(allData.data) ? allData.data : [allData]);
        const filtered = data.filter(p => {
          const pedidoUsuarioId = p.usuarioId || p.UsuarioId || p.userId || p.UserId || 
                                 (p.usuario && (p.usuario.id || p.usuario.usuarioId));
          return !pedidoUsuarioId || String(pedidoUsuarioId) === String(usuarioId);
        });
        console.log(`[API] Filtrado manual exitoso, ${filtered.length} pedidos encontrados de ${data.length} totales`);
        return filtered.map(pedido => normalizarPedido(pedido));
      }
      console.log(`[API] Obtener todos los pedidos falló con código: ${res.status}`);
    } catch (e) {
      console.log('[API] Error obteniendo todos los pedidos:', e);
    }

    // Método 5: Intentar obtener pedidos individuales
    // Si no podemos obtener la lista completa, intentemos obtener algunos pedidos recientes
    try {
      console.log('[API] Intentando obtener pedidos individuales');
      // Buscar pedidos recientes (últimos 10)
      const pedidos: PedidoDto[] = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const pedido = await fetchPedidoDetalle(i, token);
          if (pedido && String(pedido.usuarioId) === String(usuarioId)) {
            pedidos.push(pedido);
          }
        } catch (e) {
          // Ignorar errores individuales
        }
      }
      
      if (pedidos.length > 0) {
        console.log(`[API] Se encontraron ${pedidos.length} pedidos individuales`);
        return pedidos;
      }
    } catch (e) {
      console.log('[API] Error obteniendo pedidos individuales:', e);
    }

    // Si llegamos aquí, todos los intentos fallaron pero no queremos romper la UI
    console.warn('[API] Todos los intentos de obtener pedidos fallaron, devolviendo array vacío');
    return [];
    
  } catch (e) {
    console.error('[API] Error general en fetchPedidosPorUsuario:', e);
    // En lugar de propagar el error, retornamos un array vacío
    return [];
  }
}

/**
 * Actualiza el estado de un pedido
 * Utiliza el endpoint PATCH /api/Pedidos/{id} del controlador
 * @param pedidoId ID del pedido a actualizar
 * @param estado Nuevo estado del pedido (pendiente, procesando, enviado, entregado, cancelado)
 * @param token Token de autenticación (opcional)
 */
export async function actualizarEstadoPedido(
  pedidoId: number | string, 
  estado: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado',
  token?: string
): Promise<void> {
  const headers: Record<string,string> = { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  };
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    console.log(`[API] Actualizando estado del pedido ${pedidoId} a "${estado}"`);
    const res = await fetch(`${API}/Pedidos/${encodeURIComponent(String(pedidoId))}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ estado })
    });
    
    if (res.ok) {
      console.log(`[API] Estado del pedido actualizado correctamente`);
      return;
    }
    
    // Si hay un error, intentamos obtener el mensaje
    let errorMsg = `Error al actualizar el estado (Código ${res.status})`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {}
    
    throw new Error(errorMsg);
  } catch (e) {
    console.error('[API] Error al actualizar estado del pedido:', e);
    throw e;
  }
}

// Se eliminó la función de notificaciones

/**
 * Crea un nuevo pedido usando el endpoint POST /api/Pedidos/usuario/{usuarioId}
 * @param usuarioId ID del usuario que hace el pedido
 * @param direccionId ID de la dirección de envío
 * @param items Productos incluidos en el pedido
 * @param token Token de autenticación (opcional)
 * @returns Datos del pedido creado, incluyendo el ID asignado
 */
export async function crearPedido(
  usuarioId: number | string,
  direccionId: number,
  items: Array<{productoId: number, cantidad: number}>,
  token?: string
): Promise<PedidoDto> {
  if (!items.length) {
    throw new Error('El pedido debe contener al menos un producto');
  }
  
  const headers: Record<string,string> = { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  };
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  // Formatear los datos según espera el controlador
  const pedidoDto: CrearPedidoDto = {
    DireccionId: Number(direccionId),
    MetodoPagoId: null, // El controlador ahora acepta null explícitamente
    Items: items.map(item => ({
      ProductoId: Number(item.productoId),
      Cantidad: Number(item.cantidad)
    }))
  };
  
  try {
    console.log(`[API] Creando pedido para usuario ${usuarioId}`, pedidoDto);
    const res = await fetch(`${API}/Pedidos/usuario/${encodeURIComponent(String(usuarioId))}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pedidoDto)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`[API] Pedido creado correctamente con ID: ${data.pedidoId || data.id}`);
      return data;
    }
    
    // Si hay un error, intentamos obtener el mensaje detallado
    let errorMsg = `Error al crear el pedido (Código ${res.status})`;
    try {
      const errorText = await res.text();
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.message || errorData.detail || errorText || errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
    } catch {}
    
    throw new Error(errorMsg);
  } catch (e) {
    console.error('[API] Error al crear pedido:', e);
    throw e;
  }
}

/**
 * Marca un pedido como pagado
 * Utiliza el endpoint POST /api/Pedidos/{id}/pagar del controlador
 * @param pedidoId ID del pedido a marcar como pagado
 * @param token Token de autenticación (opcional)
 * @returns Datos de la factura generada
 */
export async function pagarPedido(
  pedidoId: number | string,
  token?: string
): Promise<any> {
  const headers: Record<string,string> = { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  };
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    console.log(`[API] Marcando pedido ${pedidoId} como pagado`);
    const res = await fetch(`${API}/Pedidos/${encodeURIComponent(String(pedidoId))}/pagar`, {
      method: 'POST',
      headers
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`[API] Pedido marcado como pagado, factura generada`);
      return data;
    }
    
    // Si hay un error, intentamos obtener el mensaje
    let errorMsg = `Error al procesar el pago (Código ${res.status})`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorData.detail || errorMsg;
    } catch {}
    
    throw new Error(errorMsg);
  } catch (e) {
    console.error('[API] Error al marcar pedido como pagado:', e);
    throw e;
  }
}
