import React, { useState, useContext, useEffect } from 'react'
import './Login.css'
import './register-mobile.css'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../auth/AuthContext'
import axios from 'axios'
import { API } from '../api'

export default function Registro() {
  const { register } = useContext(AuthContext)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', telefono: '' })
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480)
  const navigate = useNavigate()
  
  // Detector de tamaño de pantalla para aplicar clase compact-form
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function validateEmail(email) {
    try {
      console.log('Intentando validar email en:', `${API}/Usuarios/verificar-email?email=${encodeURIComponent(email)}`);
      const response = await axios.get(`${API}/Usuarios/verificar-email?email=${encodeURIComponent(email)}`)
      // Si la API devuelve datos, interpretamos correctamente la respuesta
      if (response.status === 200) {
        return response.data === false; // Si data es false, email no existe (por lo que es válido)
      }
      return true; // Por defecto, asumimos que es válido
    } catch (error) {
      console.log('Error validando email:', error.message);
      
      // Si el endpoint no existe o hay otro error, asumimos que el email es válido
      if (error.response && error.response.status === 404) {
        // El endpoint existe pero el email no está registrado
        return true;
      }
      
      // Intentamos otra ruta alternativa solo si el primer intento falló con 404 o 400
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        try {
          console.log('Intentando ruta alternativa para validar email');
          const response = await axios.get(`${API}/Auth/verificar-email?email=${encodeURIComponent(email)}`);
          if (response.status === 200) {
            return response.data === false;
          }
        } catch (err) {
          console.log('Error en ruta alternativa para validar email:', err.message);
        }
      }
      
      // Si no podemos verificar, simplemente continuamos con el registro
      console.log('No se pudo validar el email, asumiendo que es válido');
      return true;
    }
  }

  async function validateTelefono(telefono) {
    if (!telefono) return true; // Si no hay teléfono, es válido
    
    try {
      console.log('Intentando validar teléfono en:', `${API}/Usuarios/verificar-telefono?telefono=${encodeURIComponent(telefono)}`);
      const response = await axios.get(`${API}/Usuarios/verificar-telefono?telefono=${encodeURIComponent(telefono)}`);
      // Interpretamos la respuesta correctamente
      if (response.status === 200) {
        return response.data === false; // Si data es false, teléfono no existe (por lo que es válido)
      }
      return true;
    } catch (error) {
      console.log('Error validando teléfono:', error.message);
      // Si el endpoint no existe o hay otro error, asumimos que el teléfono es válido
      return true;
    }
  }

  async function submit(e) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Iniciando proceso de registro para:', form.email);
      
      // Validación de formato básico
      if (!form.email || !form.email.includes('@')) {
        setError("Por favor ingresa un correo electrónico válido");
        return;
      }
      
      if (!form.password || form.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      
      if (!form.nombre || !form.apellido) {
        setError("Nombre y apellido son obligatorios");
        return;
      }

      // Nuevo: telefono obligatorio
      if (!form.telefono) {
        setError("El teléfono es obligatorio");
        setIsLoading(false);
        return;
      }

      // Validación: debe tener exactamente 9 dígitos y empezar con '9'
      const onlyDigits = String(form.telefono).replace(/\D/g, '');
      if (onlyDigits.length !== 9 || onlyDigits[0] !== '9') {
        setError('Número de teléfono no válido o debe contener 9 dígitos');
        setIsLoading(false);
        return;
      }

      // Intentamos hacer validaciones simples, pero si fallan, continuamos con el registro
      try {
        // Validar email
        const emailValido = await validateEmail(form.email);
        if (!emailValido) {
          setError("Este correo electrónico ya está registrado");
          setIsLoading(false);
          return;
        }
        
        // Validar teléfono solo si se proporcionó
        if (form.telefono) {
          const telefonoValido = await validateTelefono(form.telefono);
          if (!telefonoValido) {
            setError("Este número de teléfono ya está registrado");
            setIsLoading(false);
            return;
          }
        }
      } catch (validationError) {
        console.warn('Error en validación, continuando con el registro:', validationError.message);
        // Continuamos con el registro y dejamos que el backend maneje las validaciones
      }
      
      // Registrar al usuario
      console.log('Enviando datos de registro:', { 
        email: form.email, 
        nombre: form.nombre, 
        apellido: form.apellido,
        telefono: form.telefono ? 'Sí (oculto por privacidad)' : 'No proporcionado'
      });
      
      await register(form);
      console.log('Registro exitoso, redirigiendo a inicio');
      navigate('/');
    } catch (e) {
      console.error('Error en el proceso de registro:', e);
      // Mostrar mensaje de error más amigable y descriptivo
      if (e.message && e.message.includes('correo electrónico')) {
        setError(e.message);
      } else if (e.message && e.message.includes('teléfono')) {
        setError(e.message);
      } else if (e.response && typeof e.response.data === 'string') {
        setError(e.response.data);
      } else {
        setError(e.message || "Hubo un error durante el registro. Inténtalo nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="ae-login-container">
      <div className="ae-login-card">
        <h1 className="ae-login-title">Crear cuenta</h1>
        <p className="ae-login-subtitle">Únete a nosotros y disfruta de beneficios exclusivos</p>
        
        {/* Mensaje de error */}
        {error && (
          <div className="ae-login-error">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{String(error)}</span>
          </div>
        )}
        
        {/* Formulario */}
        <form onSubmit={submit} className={`ae-login-form ${isMobile ? 'compact-form' : ''}`}>
          <div className="ae-form-row">
            <div className="ae-form-group">
              <label className="ae-form-label">Nombre</label>
              <input 
                type="text" 
                className="ae-form-input" 
                value={form.nombre} 
                onChange={e => setForm({...form, nombre: e.target.value})} 
                placeholder="Tu nombre"
                required
              />
            </div>
            
            <div className="ae-form-group">
              <label className="ae-form-label">Apellido</label>
              <input 
                type="text" 
                className="ae-form-input" 
                value={form.apellido} 
                onChange={e => setForm({...form, apellido: e.target.value})} 
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>
          
          <div className="ae-form-group">
            <label className="ae-form-label">Correo electrónico</label>
            <input 
              type="email" 
              className="ae-form-input" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          
          <div className="ae-form-group">
            <label className="ae-form-label">Teléfono</label>
            <input 
              type="tel" 
              className="ae-form-input" 
              value={form.telefono} 
              onChange={e => setForm({...form, telefono: e.target.value})} 
              placeholder="+51 999 999 999"
              required
            />
          </div>
          
          <div className="ae-form-group">
            <label className="ae-form-label">Contraseña</label>
            <input 
              type="password" 
              className="ae-form-input" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              placeholder="Mínimo 6 caracteres"
              minLength="6"
              required
            />
          </div>
          
          <div className="ae-terms-checkbox">
            <label className="ae-remember-me">
              <input type="checkbox" required />
              <span>Acepto los <a href="/terminos" target="_blank">términos</a> y <a href="/privacidad" target="_blank">política de privacidad</a></span>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="ae-login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="ae-spinner" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
                Creando cuenta...
              </>
            ) : 'Crear cuenta'}
          </button>
        </form>
        
        {/* Enlace a login */}
        <div className="ae-signup-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  )
}