import React, { useContext } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AuthContext } from '../../auth/AuthContext'
import '../AdminPanel.css'

export default function AdminLayout(){
  const { user } = useContext(AuthContext)
  const { search } = useLocation()
  const debug = new URLSearchParams(search).get('debug') === '1'

  if(!user || !user.esAdministrador) return (
    <div className="ae-admin-denied">
      <div className="ae-denied-content">
        <svg className="ae-denied-icon" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10.14 16.3l-2.73-2.73a.996.996 0 10-1.41 1.41l3.45 3.45c.39.39 1.02.39 1.41 0l7.17-7.17a.996.996 0 10-1.41-1.41z"/>
        </svg>
        <h3>Acceso restringido</h3>
        <p>Debes iniciar sesión como administrador para acceder a esta sección.</p>
        <Link to="/admin/login" className="ae-admin-login-btn">Iniciar sesión</Link>
      </div>
    </div>
  )

  // show debug info when requested via ?debug=1
  if (debug) {
    return (
      <div style={{padding:20}}>
        <h3>Admin layout - Debug</h3>
        <p>Usuario en memoria (desde AuthContext):</p>
        <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:12, borderRadius:6}}>{JSON.stringify(user, null, 2)}</pre>
        <p>¿esAdministrador?: <strong>{String(!!(user && user.esAdministrador))}</strong></p>
        <p>Si el valor es <code>false</code>, revisa <code>localStorage.getItem('user')</code> y el flujo de login.</p>
        <Link to="/admin">Volver al panel</Link>
      </div>
    )
  }

  return (
    <div className="ae-admin-layout">
      <header className="ae-admin-topbar">
        <div className="ae-admin-topbar-left">
          <h2>Panel Admin</h2>
        </div>
        <nav className="ae-admin-topnav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/productos">Productos</Link>
          <Link to="/admin/productos/nuevo">Nuevo Producto</Link>
          <Link to="/admin/configuracion">Configuración</Link>
          <Link to="/admin/pedidos">Pedidos</Link>
          <Link to="/admin/usuarios">Usuarios</Link>
        </nav>
      </header>

      <main className="ae-admin-main">
        <Outlet />
      </main>
    </div>
  )
}
