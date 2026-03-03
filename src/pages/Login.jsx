import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/logo-ecommerce.png';
import loginArt from '../assets/login-art.png';
import './Login.css';

export default function Login() {
  const { login, googleLogin } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        await googleLogin({ credential: tokenResponse.access_token, ...tokenResponse });
        navigate('/');
      } catch (e) {
        setError(e.message || 'Error al iniciar sesión con Google');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('No se pudo iniciar sesión con Google.'),
    flow: 'implicit',
  });

  return (
    <div className="mt-auth-wrapper">
      {/* ── Left: Form ── */}
      <div className="mt-auth-left">
        <div className="mt-auth-form-box">
          {/* Logo — click to go home */}
          <Link to="/" className="mt-auth-logo">
            <img src={logoImg} alt="MiTienda+" />
          </Link>

          <h1 className="mt-auth-title">¡Bienvenido de vuelta!</h1>
          <p className="mt-auth-subtitle">Ingresa tus credenciales para acceder a tu cuenta.</p>

          {/* Error */}
          {error && (
            <div className="mt-auth-error">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="mt-auth-form">
            <div className="mt-field-group">
              <label className="mt-field-label">Email <span className="mt-required">*</span></label>
              <input
                id="login-email"
                type="email"
                className="mt-field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo electrónico"
                required
              />
            </div>

            <div className="mt-field-group">
              <label className="mt-field-label">Contraseña <span className="mt-required">*</span></label>
              <div className="mt-password-wrap">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="mt-field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  minLength="6"
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

            <div className="mt-auth-options">
              <label className="mt-remember">
                <input type="checkbox" />
                <span>Recuérdame</span>
              </label>
              <Link to="/recuperar-contrasena" className="mt-forgot-link">¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" className="mt-auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <svg className="mt-spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" /></svg>
                  Iniciando sesión...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-auth-divider"><span>O inicia sesión con</span></div>

          {/* Google — custom styled button */}
          <button type="button" className="mt-google-btn" onClick={() => triggerGoogleLogin()} disabled={loading}>
            <svg className="mt-google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Iniciar sesión con Google
          </button>

          {/* Switch */}
          <div className="mt-auth-switch">
            ¿No tienes una cuenta? <Link to="/registro">Regístrate aquí</Link>
          </div>
        </div>
      </div>

      {/* ── Right: Art ── */}
      <div className="mt-auth-right">
        <img src={loginArt} alt="" className="mt-auth-art" />
      </div>
    </div>
  );
}