import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import './Login.css';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (e) { 
      setError(e.response?.data?.message || e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ae-login-container">
      <div className="ae-login-card">
        {/* Logo */}
        <div className="ae-login-logo">
          <span className="ae-logo-main">Tienda</span>
          <span className="ae-logo-plus">+</span>
        </div>

        <h2 className="ae-login-title">Iniciar sesión</h2>
        <p className="ae-login-subtitle">Ingresa tus credenciales para acceder a tu cuenta</p>

        {/* Mensaje de error */}
        {error && (
          <div className="ae-login-error">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={submit} className="ae-login-form">
          <div className="ae-form-group">
            <label htmlFor="email" className="ae-form-label">Email</label>
            <input
              id="email"
              type="email"
              className="ae-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="ae-form-group">
            <label htmlFor="password" className="ae-form-label">Contraseña</label>
            <input
              id="password"
              type="password"
              className="ae-form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          <div className="ae-form-options">
            <label className="ae-remember-me">
              <input type="checkbox" />
              <span>Recordar mi cuenta</span>
            </label>
            <Link to="/recuperar-contrasena" className="ae-forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>

          <button type="submit" className="ae-login-button" disabled={loading}>
            {loading ? (
              <>
                <svg className="ae-spinner" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
                Iniciando sesión...
              </>
            ) : 'Iniciar sesión'}
          </button>
        </form>

        {/* Redes sociales */}
        <div className="ae-social-login">
          <div className="ae-divider">
            <span>O inicia sesión con</span>
          </div>
          
          
        </div>

        {/* Registro */}
        <div className="ae-signup-link">
          ¿No tienes una cuenta? <Link to="/registro">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}