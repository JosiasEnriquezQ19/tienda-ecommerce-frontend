import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API } from '../../api'
import { AuthContext } from '../../auth/AuthContext'
import '../AdminProductos.css'

export default function AdminProductos(){
  const { user } = useContext(AuthContext)
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let cancelled = false
    async function load(){
      try{
        setLoading(true)
        const r = await axios.get(`${API}/Productos`)
        if(!cancelled) setProductos(r.data || [])
      }catch(e){ if(!cancelled) setError(e.message || String(e)) }
      finally{ if(!cancelled) setLoading(false) }
    }
    load()
    return ()=> cancelled = true
  }, [])

  if(!user || !user.esAdministrador) return (
    <div className="ae-admin-denied">
      <div className="ae-denied-content">
        <h3>Acceso restringido</h3>
        <p>Debes iniciar sesión como administrador.</p>
        <Link to="/admin/login" className="ae-admin-login-btn">Iniciar sesión</Link>
      </div>
    </div>
  )

  return (
    <div className="ae-admin-container">
      <div className="ae-admin-header">
        <h1>Productos</h1>
        <Link to="/admin/productos/nuevo" className="ae-primary-button">Crear producto</Link>
      </div>

      {loading ? <p>Cargando productos...</p> : error ? <div>Error: {error}</div> : (
        <table className="ae-products-table">
          <thead>
            <tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.productoId || p.id}>
                <td>{p.productoId || p.id}</td>
                <td>{p.nombre || p.name}</td>
                <td>{p.precio || p.price}</td>
                <td>{p.stock || p.cantidad}</td>
                <td>
                  <Link to={`/admin/productos/${p.productoId || p.id}/editar`} className="ae-action-btn">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
