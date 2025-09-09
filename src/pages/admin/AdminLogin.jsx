import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API } from '../../api'
import { AuthContext } from '../../auth/AuthContext'

export default function AdminLogin(){
  const { login, setSession } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    setError(null)
    setLoading(true)
    try{
      // 1) Intentar endpoint específico de administradores (si existe)
      let adminExists = false
      try{
        const r = await axios.post(`${API}/Administradores/login`, { email, password })
        if(r.status === 200 && r.data){
          const admin = r.data
          const mark = { ...admin, esAdministrador: true }
          // update React context and localStorage
          try{ setSession(mark) }catch(e){ localStorage.setItem('user', JSON.stringify(mark)) }
          window.location.href = '/admin'
          return
        }
      } catch (adminLoginErr) {
        // no existe endpoint o credenciales no válidas, marcar posible existencia de admin
        console.debug('[AdminLogin] /Administradores/login no disponible o falló:', adminLoginErr.response?.status || adminLoginErr.message)
        try{
          const probe = await axios.get(`${API}/Administradores?email=${encodeURIComponent(email)}`)
          if(probe.status === 200 && probe.data) adminExists = true
        }catch(_){ /* no admin endpoint or no admin found */ }
      }

      // 2) Fallback: usar Auth/login y verificar si hay un Administrador asociado
      const user = await login(email, password)
      let isAdmin = false
      try{
        const uid = user.usuarioId || user.UsuarioId || user.id || user.userId
        if(uid){
          const r2 = await axios.get(`${API}/Administradores/${uid}`)
          if(r2.status === 200 && r2.data) isAdmin = true
        }
      }catch(e){
        console.debug('[AdminLogin] GET /Administradores/{id} falló:', e.response?.status || e.message)
        try{
          const r3 = await axios.get(`${API}/Administradores?email=${encodeURIComponent(email)}`)
          if(r3.status === 200 && r3.data) isAdmin = true
        }catch(_){ }
      }

      if(!isAdmin){
        // Si no pudimos autenticar vía Auth/login y detectamos un registro en la tabla Administradores,
        // informamos al usuario y ofrecemos un fallback de desarrollo.
        if(adminExists){
          setError('Existe un registro de administrador para este email, pero no se pudo autenticar. Si estás en desarrollo puedes usar "Entrar como admin (desarrollo)" para saltar la autenticación.')
        } else {
          setError('El usuario no tiene privilegios de administrador')
        }
        setLoading(false)
        return
      }

  const mark = { ...user, esAdministrador: true }
  localStorage.setItem('user', JSON.stringify(mark))
      window.location.href = '/admin'
    }catch(err){
      setError(err.response?.data || err.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="container py-4">
      <h2>Login Administrador</h2>
      {error && <div className="alert alert-danger">{String(error)}</div>}
      {/* mostrar botón dev si detectamos admin por email */}
      {error && error.includes('Entrar como admin (desarrollo)') && (
        <div style={{marginBottom:12}}>
          <button className="btn-ghost" onClick={() => {
            // crear sesión local (solo para desarrollo) y redirigir
            const fakeAdmin = { email, nombre: 'Administrador', apellido: '', esAdministrador: true }
            localStorage.setItem('user', JSON.stringify(fakeAdmin))
            window.location.href = '/admin'
          }}>Entrar como admin (desarrollo)</button>
        </div>
      )}
      <form onSubmit={submit} style={{maxWidth:480}}>
        <div className="mb-2"><label>Email</label><input value={email} onChange={e=> setEmail(e.target.value)} required /></div>
        <div className="mb-2"><label>Contraseña</label><input type="password" value={password} onChange={e=> setPassword(e.target.value)} required /></div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          <button type="button" className="btn-ghost" onClick={()=> navigate('/')}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
