import React, { useState, useContext } from 'react'
import './Login.css'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../auth/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { API } from '../api'
import logoImg from '../assets/logo-ecommerce.png'
import loginArt from '../assets/login-art.png'

export default function Registro() {
  const { register, googleLogin } = useContext(AuthContext)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', telefono: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  async function validateEmail(email) {
    try {
      const response = await axios.get(`${API}/Usuarios/verificar-email?email=${encodeURIComponent(email)}`)
      if (response.status === 200) return response.data === false
      return true
    } catch (error) {
      if (error.response && error.response.status === 404) return true
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        try {
          const response = await axios.get(`${API}/Auth/verificar-email?email=${encodeURIComponent(email)}`)
          if (response.status === 200) return response.data === false
        } catch (err) { /* ignore */ }
      }
      return true
    }
  }

  async function validateTelefono(telefono) {
    if (!telefono) return true
    try {
      const response = await axios.get(`${API}/Usuarios/verificar-telefono?telefono=${encodeURIComponent(telefono)}`)
      if (response.status === 200) return response.data === false
      return true
    } catch (error) { return true }
  }

  async function submit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!form.email || !form.email.includes('@')) { setError("Por favor ingresa un correo electrónico válido"); return }
      if (!form.password || form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return }
      if (!form.nombre || !form.apellido) { setError("Nombre y apellido son obligatorios"); return }
      if (!form.telefono) { setError("El teléfono es obligatorio"); setIsLoading(false); return }

      const onlyDigits = String(form.telefono).replace(/\D/g, '')
      if (onlyDigits.length !== 9 || onlyDigits[0] !== '9') { setError('Número de teléfono no válido o debe contener 9 dígitos'); setIsLoading(false); return }

      try {
        const emailValido = await validateEmail(form.email)
        if (!emailValido) { setError("Este correo electrónico ya está registrado"); setIsLoading(false); return }
        if (form.telefono) {
          const telefonoValido = await validateTelefono(form.telefono)
          if (!telefonoValido) { setError("Este número de teléfono ya está registrado"); setIsLoading(false); return }
        }
      } catch (validationError) { /* continue */ }

      await register(form)
      navigate('/')
    } catch (e) {
      if (e.message && e.message.includes('correo electrónico')) setError(e.message)
      else if (e.message && e.message.includes('teléfono')) setError(e.message)
      else if (e.response && typeof e.response.data === 'string') setError(e.response.data)
      else setError(e.message || "Hubo un error durante el registro. Inténtalo nuevamente.")
    } finally { setIsLoading(false) }
  }

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError(null)
      try {
        await googleLogin({ credential: tokenResponse.access_token, ...tokenResponse })
        navigate('/')
      } catch (e) {
        setError(e.message || 'Error al registrarse con Google')
      } finally { setIsLoading(false) }
    },
    onError: () => setError('No se pudo conectar con Google.'),
    flow: 'implicit',
  })

  return (
    <div className="mt-auth-wrapper">
      {/* ── Left: Form ── */}
      <div className="mt-auth-left">
        <div className="mt-auth-form-box">
          {/* Logo — click to go home */}
          <Link to="/" className="mt-auth-logo">
            <img src={logoImg} alt="MiTienda+" />
          </Link>

          <h1 className="mt-auth-title">Crea tu cuenta</h1>
          <p className="mt-auth-subtitle">Únete y disfruta de beneficios exclusivos.</p>

          {/* Error */}
          {error && (
            <div className="mt-auth-error">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              <span>{String(error)}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="mt-auth-form">
            <div className="mt-field-row">
              <div className="mt-field-group">
                <label className="mt-field-label">Nombre <span className="mt-required">*</span></label>
                <input
                  type="text"
                  className="mt-field-input"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="mt-field-group">
                <label className="mt-field-label">Apellido <span className="mt-required">*</span></label>
                <input
                  type="text"
                  className="mt-field-input"
                  value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>

            <div className="mt-field-group">
              <label className="mt-field-label">Correo electrónico <span className="mt-required">*</span></label>
              <input
                type="email"
                className="mt-field-input"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div className="mt-field-group">
              <label className="mt-field-label">Teléfono <span className="mt-required">*</span></label>
              <input
                type="tel"
                className="mt-field-input"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                placeholder="999 999 999"
                required
              />
            </div>

            <div className="mt-field-group">
              <label className="mt-field-label">Contraseña <span className="mt-required">*</span></label>
              <div className="mt-password-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="mt-field-input"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                  required
                />
                <button type="button" className="mt-toggle-pw" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? (
                    <svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M1 1l22 22" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <label className="mt-terms">
              <input type="checkbox" required />
              <span>Acepto los <a href="/terminos" target="_blank">términos</a> y <a href="/privacidad" target="_blank">política de privacidad</a></span>
            </label>

            <button type="submit" className="mt-auth-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="mt-spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" /></svg>
                  Creando cuenta...
                </>
              ) : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-auth-divider"><span>O regístrate con</span></div>

          {/* Google — custom styled button */}
          <button type="button" className="mt-google-btn" onClick={() => triggerGoogleLogin()} disabled={isLoading}>
            <svg className="mt-google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Registrarse con Google
          </button>

          {/* Switch */}
          <div className="mt-auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </div>
        </div>
      </div>

      {/* ── Right: Art ── */}
      <div className="mt-auth-right">
        <img src={loginArt} alt="" className="mt-auth-art" />
      </div>
    </div>
  )
}