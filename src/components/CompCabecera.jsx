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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Use a ref for lastScrollY to avoid re-binding the event listener on every scroll
  const lastScrollY = useRef(0);
  // We still need state for visibility to trigger re-renders
  const location = useLocation();
  const totalProductosCount = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0) : 0

  // Efecto para controlar la visibilidad del header al hacer scroll
  useEffect(() => {
    const controlHeader = () => {
      if (mobileSearchOpen) return; // Don't hide header if mobile search is active

      const currentScrollY = window.scrollY;

      // Threshold to prevent jitter (e.g., 5px difference)
      if (Math.abs(currentScrollY - lastScrollY.current) < 5) return;

      // If scrolling down and past 80px, hide header
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        // Scrolling DOWN > 80px -> Hide
        setHeaderVisible(false);
      } else {
        // If scrolling up or at top, show header
        // Scrolling UP -> Show
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlHeader, { passive: true });
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [mobileSearchOpen]); // dependency on mobileSearchOpen to prevent hiding while searching

  // Efecto para detectar gestos táctiles (swipe up / swipe down) y mostrar/ocultar header
  useEffect(() => {
    const touchStartYRef = { current: null };

    const handleTouchStart = (e) => {
      if (!e.touches || !e.touches[0]) return;
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!e.touches || !e.touches[0] || touchStartYRef.current == null) return;
      const currentY = e.touches[0].clientY;
      const delta = touchStartYRef.current - currentY; // positivo = swipe up
      const THRESHOLD = 30; // px para considerar gesto

      // aplicar el comportamiento de ocultar/mostrar independientemente de la ruta
      if (delta > THRESHOLD) {
        setHeaderVisible(false);
      } else if (delta < -THRESHOLD) {
        setHeaderVisible(true);
      }

      // actualizar para movimientos continuos
      touchStartYRef.current = currentY;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

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
            <Link to="/" className={`ae-logo ${mobileSearchOpen ? 'ae-logo-hidden' : ''}`}>
              <span className="ae-logo-main">Tienda</span>
              <span className="ae-logo-plus">+</span>
            </Link>

            {/* Mobile Search Toggle */}
            <button
              className={`ae-mobile-search-toggle ${mobileSearchOpen ? 'ae-logo-hidden' : ''}`}
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Buscar"
            >
              <svg className="ae-search-icon-mobile" viewBox="0 0 24 24">
                <path d="M11 3a8 8 0 016 13M21 21l-4-4" />
              </svg>
            </button>

            {/* Buscador */}
            <form
              className={`ae-search-form ${mobileSearchOpen ? 'mobile-active' : ''}`}
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
                  setMobileSearchOpen(false);
                }
              }}
            >
              <div className="ae-search-container">
                {mobileSearchOpen && (
                  <button
                    type="button"
                    className="ae-mobile-close-search"
                    onClick={() => setMobileSearchOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
                <input
                  type="text"
                  className="ae-search-input"
                  placeholder="Buscar productos, marcas y más..."
                  value={searchQuery}
                  onChange={(e) => setTerm(e.target.value)}
                  aria-label="Buscar productos"
                  autoFocus={mobileSearchOpen}
                />
                <button type="submit" className="ae-search-button ae-search-animated" aria-label="Buscar">
                  <svg className="ae-search-icon" viewBox="0 0 24 24">
                    <path d="M11 3a8 8 0 016 13M21 21l-4-4" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Menú de usuario */}
            <div className={`ae-user-menu ${mobileSearchOpen ? 'ae-logo-hidden' : ''}`}>
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
                <div className={`ae-auth-buttons ${mobileSearchOpen ? 'ae-logo-hidden' : ''}`}>
                  <Link to="/login" className="ae-login-btn">Ingresar</Link>
                  <Link to="/registro" className="ae-register-btn">Registrarse</Link>
                </div>
              )}

              {/* Carrito */}
              <Link to="/carrito" className={`ae-cart ${mobileSearchOpen ? 'ae-logo-hidden' : ''}`} aria-label={`Carrito: Tienes ${totalProductosCount} productos`}>
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