import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { API } from '../api'
import { AuthContext } from '../auth/AuthContext'
import { DEFAULT_USER_ID } from '../api'
import AddedToCartModal from '../components/AddedToCartModal'
import { useNavigate } from 'react-router-dom'

export const CartContext = createContext()

export function CartProvider({ children }){
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  // Inicializar carrito vacío - los items se cargarán desde el servidor cuando haya usuario
  const [items, setItems] = useState([])

  // toast/modal state for added-to-cart feedback
  const [toast, setToast] = useState({ visible: false, item: null })

  // persist locally only if user is logged in
  useEffect(()=>{ 
    try{ 
      if(user) {
        localStorage.setItem('cart', JSON.stringify(items));
      } else if(items.length === 0) {
        localStorage.removeItem('cart');
      }
    }catch{} 
  }, [items, user])

  // When user logs in, load server-side cart and merge with local
  // When user logs out, clear the cart
  useEffect(()=>{
    let cancelled = false
    async function loadServerCart(){
      // Si no hay usuario (logout), vaciar carrito
      if(!user) {
        setItems([]);
        localStorage.removeItem('cart');
        return;
      }
      
      const uid = user.UsuarioId || user.usuarioId || user.id || DEFAULT_USER_ID
      if(!uid) return
      try{
        const res = await axios.get(`${API}/Carrito/usuario/${uid}`)
        if(cancelled) return
        const serverItems = Array.isArray(res.data) ? res.data : []
        // Map server items to local shape: productoId, cantidad, nombre, precio, servidorId
        const mapped = serverItems.map(si => {
          const producto = si.producto || si.Producto || {}
          const base = {
            productoId: si.productoId ?? si.ProductoId ?? producto.productoId ?? producto.id,
            cantidad: si.cantidad ?? si.Cantidad ?? 1,
            nombre: producto.nombre ?? producto.Nombre ?? producto.name,
            precio: producto.precio ?? producto.Precio ?? producto.price,
            servidorId: si.carritoId ?? si.id,
            // Agregar datos adicionales importantes para mostrar correctamente el producto
            imagen: producto.imagenUrl ?? producto.ImagenUrl ?? producto.imagen ?? producto.Imagen,
            descripcion: producto.descripcion ?? producto.Descripcion ?? producto.description
          }
          return { ...base, uid: String(base.servidorId ?? base.productoId ?? Math.random().toString(36).slice(2) + Date.now()) }
        })

        // Para productos sin imagen o descripción, cargar detalles completos
        const itemsWithMissingDetails = mapped.filter(item => !item.imagen || !item.descripcion);
        
        if (itemsWithMissingDetails.length > 0) {
          // Cargar detalles faltantes para cada producto
          const loadProductDetails = async () => {
            const updatedItems = [...mapped];
            
            for (const item of itemsWithMissingDetails) {
              try {
                // Intentar obtener los detalles completos del producto
                const prodRes = await axios.get(`${API}/Productos/${item.productoId}`);
                const producto = prodRes.data;
                
                // Actualizar el item con los detalles completos
                const index = updatedItems.findIndex(i => i.uid === item.uid);
                if (index !== -1) {
                  updatedItems[index] = {
                    ...updatedItems[index],
                    nombre: producto.nombre ?? producto.Nombre ?? updatedItems[index].nombre,
                    precio: producto.precio ?? producto.Precio ?? updatedItems[index].precio,
                    imagen: producto.imagenUrl ?? producto.ImagenUrl ?? producto.imagen ?? producto.Imagen,
                    descripcion: producto.descripcion ?? producto.Descripcion ?? producto.description
                  };
                }
              } catch (e) {
                console.warn(`Error cargando detalles del producto ${item.productoId}:`, e);
              }
            }
            
            // Actualizar el carrito con los items completos
            if (!cancelled) {
              setItems(updatedItems);
            }
          };
          
          loadProductDetails();
        } else {
          // Si todos los items tienen datos completos, usar directamente
          setItems(mapped);
        }
      }catch(e){
        // ignore load errors and keep local cart
      }
    }
    loadServerCart()
    return ()=> cancelled = true
  }, [user])

  // helper to upsert locally
  function upsertLocal(item){
    setItems(prev => {
      const idx = prev.findIndex(p=> String(p.productoId) === String(item.productoId))
      if(idx >= 0){
        const copy = [...prev]; copy[idx] = { ...copy[idx], ...item, cantidad: (Number(copy[idx].cantidad)||0) + (Number(item.cantidad)||0) }; return copy
      }
      const newItem = { ...item, uid: item.uid ?? String(item.servidorId ?? item.productoId ?? Math.random().toString(36).slice(2) + Date.now()) }
      return [...prev, newItem]
    })
  }

  // show toast/modal with automatic hide
  function showAddedToast(item){
    try{ setToast({ visible: true, item }) }catch{}
    // hide after 3s
    setTimeout(()=>{ setToast({ visible: false, item: null }) }, 3000)
  }

  async function addItem(item){
    // item: { productoId, cantidad, ... }
    // If user is not logged in, prevent adding and prompt to login
    if(!user){
      try{ alert('Debes iniciar sesión para agregar productos al carrito.') }catch{}
      try{ navigate('/login') }catch{}
      return
    }
    // proceed with adding locally and showing feedback
    upsertLocal(item)
    try{ showAddedToast(item) }catch{}
    // if user logged, push to server
    if(user){
      const uid = user.UsuarioId || user.usuarioId || user.id || DEFAULT_USER_ID
      if(!uid) return
      try{
        const res = await axios.post(`${API}/Carrito/usuario/${uid}`, { productoId: item.productoId, cantidad: item.cantidad })
        const serverItem = res.data
        // update local item with servidorId if returned
        if(serverItem){
          setItems(prev => prev.map(p => (String(p.productoId) === String(item.productoId) ? { ...p, servidorId: serverItem.id ?? serverItem.carritoId ?? serverItem.CarritoId, uid: p.uid ?? String(serverItem.id ?? serverItem.carritoId ?? serverItem.CarritoId ?? p.productoId) } : p)))
        }
      }catch(e){
        // couldn't save server-side; keep offline changes
      }
    }
  }

  async function removeItem(id){
    // id may be productoId, servidorId or uid
    const target = items.find(p => String(p.productoId) === String(id) || String(p.servidorId) === String(id) || String(p.uid) === String(id))
    setItems(prev => prev.filter(p => !(String(p.productoId) === String(id) || String(p.servidorId) === String(id) || String(p.uid) === String(id))))
    // if server id exists, delete remote
    const servidorId = target?.servidorId
    if(user && servidorId){
      try{ await axios.delete(`${API}/Carrito/${servidorId}`) }catch(e){/*ignore*/}
    }
  }

  async function clear(){
    // clear locally
    const toDelete = items.map(i => i.servidorId).filter(Boolean)
    setItems([])
    if(user && toDelete.length){
      try{
        await Promise.allSettled(toDelete.map(id => axios.delete(`${API}/Carrito/${id}`)))
      }catch(e){/*ignore*/}
    }
  }

  // update quantity for a cart item (by productoId or servidorId)
  function updateQuantity(id, newQuantity){
    setItems(prev => prev.map(p => {
      if(String(p.productoId) === String(id) || String(p.servidorId) === String(id) || String(p.uid) === String(id)){
        return { ...p, cantidad: Number(newQuantity) }
      }
      return p
    }))
  }

  return (
    <>
      <CartContext.Provider value={{ items, addItem, removeItem, clear, updateQuantity }}>{children}</CartContext.Provider>
      <AddedToCartModal visible={toast.visible} item={toast.item} onClose={() => setToast({ visible: false, item: null })} />
    </>
  )
}
