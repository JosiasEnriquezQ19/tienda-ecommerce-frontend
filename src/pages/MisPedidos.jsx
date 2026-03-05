import React, { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../auth/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { UserOrders } from '../components/UserOrders'
import './MisPedidos.css'

export default function MisPedidos() {
  const { user } = useContext(AuthContext)
  const location = useLocation()

  if (!user) {
    return (
      <div className="op">
        <div className="op-center">
          <p>Debes iniciar sesion para ver tus pedidos.</p>
          <Link to="/login" className="op-btn-retry">Iniciar sesion</Link>
        </div>
      </div>
    )
  }

  const uid = user?.UsuarioId || user?.usuarioId || user?.id || user?.userId || user?.UserId || localStorage.getItem('userId')
  const token = user?.token || user?.accessToken || user?.jwt || user?.authToken || localStorage.getItem('authToken')

  return (
    <div className="op">
      <div className="op-head">
        <h1>Mis pedidos</h1>
        <p>Revisa el estado de tus compras</p>
      </div>

      {location.state?.success && (
        <div className="op-banner success">
          <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
          <span>Tu pedido ha sido creado exitosamente</span>
        </div>
      )}

      <UserOrders usuarioId={Number(uid)} token={token} />

      <p className="op-note">Si acabas de realizar un pedido, podria tardar unos segundos en aparecer.</p>
    </div>
  )
}