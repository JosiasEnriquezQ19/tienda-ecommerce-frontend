import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { CartContext } from '../carrito/ContextoCarrito';
import { useContext as useCtx } from 'react'
import { SearchContext } from '../search/SearchContext'
import './CompCabecera.css';

export default function CompCabecera({ totalProductos = 0 }) {
  const { user, logout } = useContext(AuthContext);
  const { items } = useContext(CartContext)
  const [pulseCount, setPulseCount] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const totalProductosCount = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0) : 0
  
  // Efecto para controlar la visibilidad del header al hacer scroll
  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      // Si estamos en la página principal, aplicamos el comportamiento de ocultar al hacer scroll down
      if (location.pathname === '/' || location.pathname === '/productos') {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scroll hacia abajo y más de 100px - ocultamos el header
          setHeaderVisible(false);
        } else {
          // Scroll hacia arriba - mostramos el header
          setHeaderVisible(true);
        }
      } else {
        // En otras páginas, siempre mostramos el header
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', controlHeader);
    
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [lastScrollY, location.pathname]);

  useEffect(() => {
    // trigger a small pop animation when the cart count changes
    setPulseCount(true)
    const t = setTimeout(() => setPulseCount(false), 450)
    return () => clearTimeout(t)
  }, [totalProductosCount])
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleDocClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setShowDropdown(false);
    }

    function handleEsc(e) {
      if (e.key === 'Escape') setShowDropdown(false);
    }

    document.addEventListener('click', handleDocClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleDocClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);
  const { term: searchQuery, setTerm } = useCtx(SearchContext)

  const handleLogout = () => { 
    logout(); 
    navigate('/');
    setShowDropdown(false);
  };

  const handleSearch = (e) => { e.preventDefault(); /* no navigation; search is live */ }

  return (
    <header className={`ae-header ${headerVisible ? '' : 'ae-header-hidden'}`}>
      {/* Barra superior */}
      <div className="ae-top-bar">
        <div className="ae-container">
          <div className="ae-top-links">
            
            {/* Admin panel removed: admin link hidden */}
          </div>
        </div>
      </div>

      {/* Barra principal */}
      <div className="ae-main-bar">
        <div className="ae-container">
          <div className="ae-header-content">
            {/* Logo */}
            <Link to="/" className="ae-logo">
              <span className="ae-logo-main">Tienda</span>
              <span className="ae-logo-plus">+</span>
            </Link>

            {/* Buscador */}
            <form className="ae-search-form" onSubmit={(e)=>{e.preventDefault(); if (searchQuery.trim()) navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)}}>
              <div className="ae-search-container">
                <input
                  type="text"
                  className="ae-search-input"
                  placeholder="Buscar productos, marcas y más..."
                  value={searchQuery}
                  onChange={(e) => setTerm(e.target.value)}
                  aria-label="Buscar productos"
                />
                <button type="submit" className="ae-search-button ae-search-animated" aria-label="Buscar">
                  <svg className="ae-search-icon" viewBox="0 0 24 24">
                    <path d="M11 3a8 8 0 016 13M21 21l-4-4" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Menú de usuario */}
            <div className="ae-user-menu">
              {user ? (
                <div 
                  className={`ae-user-profile ${showDropdown ? 'open' : ''}`}
                  ref={profileRef}
                >
                  <div
                    className="ae-user-greeting"
                    role="button"
                    tabIndex={0}
                    aria-expanded={showDropdown}
                    onClick={() => setShowDropdown(s => !s)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDropdown(s => !s); }}
                  >
                    <span className="ae-user-name">
                      {user.nombre || user.name || (user.email || '').split('@')[0] || 'Usuario'}
                    </span>
                    <svg className="ae-chevron" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  {showDropdown && (
                    <div className="ae-dropdown-menu" role="menu">
                      <Link to="/perfil" className="ae-dropdown-item">
                        <svg className="ae-dropdown-icon" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        Mi perfil
                      </Link>
                      <Link to="/pedidos" className="ae-dropdown-item" onClick={() => setShowDropdown(false)}>
                        <svg className="ae-dropdown-icon" viewBox="0 0 24 24">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                        </svg>
                        Mis pedidos
                      </Link>
                      <div className="ae-dropdown-divider"></div>
                      <button 
                        className="ae-dropdown-item ae-logout-btn"
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                      >
                        <svg className="ae-dropdown-icon" viewBox="0 0 24 24">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ae-auth-buttons">
                  <Link to="/login" className="ae-login-btn">Ingresar</Link>
                  <Link to="/registro" className="ae-register-btn">Registrarse</Link>
                </div>
              )}

              {/* Carrito */}
              <Link to="/carrito" className="ae-cart" aria-label={`Carrito: Tienes ${totalProductosCount} productos`}>
                <svg className="ae-cart-icon" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span className="ae-cart-text">Carrito</span>
                {/* elegant responsive counter next to the cart text (desktop) */}
                <span className="ae-cart-counter" aria-hidden>
                  Tienes <span className={`ae-count-number ${pulseCount ? 'pop' : ''}`}>{totalProductosCount}</span> productos
                </span>
                {/* compact badge for small screens */}
                {totalProductosCount > 0 && (
                  <span className="ae-cart-badge">{totalProductosCount}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}