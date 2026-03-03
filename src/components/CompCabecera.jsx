import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { CartContext } from '../carrito/ContextoCarrito';
import { useContext as useCtx } from 'react';
import { SearchContext } from '../search/SearchContext';
import axios from 'axios';
import { API } from '../api';
import logoImg from '../assets/logo-ecommerce.png';
import CartDrawer from './CartDrawer';
import './CompCabecera.css';

export default function CompCabecera({ totalProductos = 0 }) {
  const { user, logout } = useContext(AuthContext);
  const { items } = useContext(CartContext);
  const [pulseCount, setPulseCount] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const totalProductosCount = Array.isArray(items) ? items.length : 0;

  useEffect(() => {
    let cancelled = false;
    const fetchCats = async () => {
      try {
        const res = await axios.get(`${API}/Categorias`);
        if (!cancelled) {
          const acts = res.data.filter(c => c.estado !== 'oculto' && c.estado !== 'inactivo');
          setDbCategories(acts);
        }
      } catch (e) { }
    }
    fetchCats();
    return () => cancelled = true;
  }, []);

  useEffect(() => {
    const controlHeader = () => {
      if (mobileSearchOpen) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', controlHeader, { passive: true });
    return () => window.removeEventListener('scroll', controlHeader);
  }, [mobileSearchOpen]);

  useEffect(() => {
    setPulseCount(true);
    const t = setTimeout(() => setPulseCount(false), 450);
    return () => clearTimeout(t);
  }, [totalProductosCount]);

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

  const { term: searchQuery, setTerm } = useCtx(SearchContext);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/Productos?search=${encodeURIComponent(searchQuery)}`);
        if (active) {
          // Filter out hidden/discontinued products if necessary, 
          // but usually search should show active ones.
          const visible = res.data.filter(p => p.estado !== 'oculto' && p.estado !== 'descontinuado').slice(0, 6);
          const withRatings = await Promise.all(visible.map(async (p) => {
            try {
              const ratRes = await axios.get(`${API}/productos/${p.productoId}/comentarios/promedio`);
              return { ...p, rating: ratRes.data.promedio || 0, reviews: ratRes.data.totalComentarios || 0 };
            } catch {
              return { ...p, rating: 0, reviews: 0 };
            }
          }));
          setSuggestions(withRatings);
          setShowSuggestions(withRatings.length > 0);
        }
      } catch (e) {
        if (active) setSuggestions([]);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const renderStars = (rat = 0) => {
    const stars = [];
    const full = Math.floor(rat);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg key={i} className={`ae-suggest-star ${i <= full ? 'active' : ''}`} viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    }
    return stars;
  };

  return (
    <>
      <header className={`ae-header ${headerVisible ? '' : 'ae-header-hidden'}`}>
        <div className="ae-main-bar">
          <div className="ae-container">
            <div className="ae-header-content">
              {/* Mobile: hamburger + logo grouped together */}
              <div className="ae-header-left">
                <button
                  className="ae-mobile-menu-btn"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Abrir menú"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>

                {/* Logo */}
                <Link to="/" className="ae-logo">
                  <img src={logoImg} alt="MiTienda+" className="ae-logo-img" />
                </Link>
              </div>

              {/* ── Navigation ── */}
              <nav className="ae-nav">
                <div className="ae-nav-item ae-nav-dropdown">
                  <span className="ae-nav-link ae-nav-link-dropdown">
                    Categorías
                    <svg className="ae-nav-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                  <div className="ae-dropdown-panel">
                    {dbCategories.map(cat => (
                      <Link
                        key={cat.categoriaId}
                        to={`/?category=${encodeURIComponent(cat.nombre)}`}
                        className="ae-dropdown-cat-item"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/?category=${encodeURIComponent(cat.nombre)}`);
                        }}
                      >
                        <img src={cat.imagenUrl || 'https://via.placeholder.com/24'} alt={cat.nombre} className="ae-nav-cat-img" />
                        <span>{cat.nombre}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                <Link to="/mas-vendidos" className="ae-nav-link">Más vendidos</Link>
                <Link to="/" className="ae-nav-link">Novedades</Link>
              </nav>

              {/* Buscador */}
              <div className={`ae-search-wrapper ${mobileSearchOpen ? 'mobile-active' : ''}`} ref={searchRef}>
                <form
                  className="ae-search-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
                      setMobileSearchOpen(false);
                      setShowSuggestions(false);
                    }
                  }}
                >
                  <div className="ae-search-container">
                    <input
                      type="text"
                      className="ae-search-input"
                      placeholder="Search Product"
                      value={searchQuery}
                      onChange={(e) => setTerm(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      aria-label="Buscar productos"
                    />
                    <button type="submit" className="ae-search-button" aria-label="Buscar">
                      <svg className="ae-search-icon" viewBox="0 0 24 24">
                        <path d="M11 3a8 8 0 016 13M21 21l-4-4" />
                      </svg>
                    </button>
                  </div>
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="ae-search-suggestions">
                    {suggestions.map(p => (
                      <Link
                        key={p.productoId}
                        to={`/producto/${p.productoId}`}
                        className="ae-suggestion-item"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <div className="ae-suggest-img-box">
                          <img src={p.imagenUrl || 'https://via.placeholder.com/60'} alt={p.nombre} />
                        </div>
                        <div className="ae-suggest-info">
                          <span className="ae-suggest-name">{p.nombre}</span>
                          {p.reviews > 0 && (
                            <div className="ae-suggest-meta">
                              <div className="ae-suggest-stars">
                                {renderStars(p.rating)}
                              </div>
                              <span className="ae-suggest-reviews">({p.reviews})</span>
                            </div>
                          )}
                        </div>
                        <div className="ae-suggest-price">
                          S/ {p.precio.toFixed(2)}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: auth + cart */}
              <div className="ae-user-menu">
                {/* Botón de búsqueda solo móvil */}
                <button
                  className="ae-mobile-search-toggle"
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  aria-label="Abrir buscador"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </button>

                {user ? (
                  <div className={`ae-user-profile ${showDropdown ? 'open' : ''}`} ref={profileRef}>
                    <div
                      className="ae-user-greeting"
                      role="button"
                      tabIndex={0}
                      aria-expanded={showDropdown}
                      onClick={() => setShowDropdown(s => !s)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDropdown(s => !s); }}
                    >
                      <svg className="ae-user-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      <span className="ae-user-name">
                        {user.nombre || user.name || (user.email || '').split('@')[0] || 'Usuario'}
                      </span>
                      <svg className="ae-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
                    </div>

                    {showDropdown && (
                      <div className="ae-dropdown-menu" role="menu">
                        <Link to="/perfil" className="ae-dropdown-item" onClick={() => setShowDropdown(false)}>
                          <svg className="ae-dropdown-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          Mi perfil
                        </Link>
                        <Link to="/pedidos" className="ae-dropdown-item" onClick={() => setShowDropdown(false)}>
                          <svg className="ae-dropdown-icon" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>
                          Mis pedidos
                        </Link>
                        <div className="ae-dropdown-divider"></div>
                        <button className="ae-dropdown-item ae-logout-btn" onClick={handleLogout}>
                          <svg className="ae-dropdown-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ae-auth-buttons">
                    <Link to="/login" className="ae-login-btn">
                      <svg viewBox="0 0 24 24" className="ae-btn-icon"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Ingresar
                    </Link>
                  </div>
                )}

                {/* Cart button — opens drawer */}
                <button
                  type="button"
                  className="ae-cart"
                  onClick={() => setCartOpen(true)}
                  aria-label={`Carrito: ${totalProductosCount} productos`}
                >
                  <svg className="ae-cart-icon" viewBox="0 0 24 24">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  {totalProductosCount > 0 && (
                    <span className={`ae-cart-badge ${pulseCount ? 'pop' : ''}`}>{totalProductosCount}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`ae-mobile-nav-overlay ${mobileNavOpen ? 'active' : ''}`} onClick={() => setMobileNavOpen(false)} />
      <div className={`ae-mobile-nav-drawer ${mobileNavOpen ? 'active' : ''}`}>
        <div className="ae-mobile-nav-header">
          <img src={logoImg} alt="MiTienda+" style={{ height: '24px' }} />
          <button className="ae-mobile-nav-close" onClick={() => setMobileNavOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="ae-mobile-nav-content">
          <div className="ae-mobile-nav-section">
            <h4>Categorías</h4>
            {dbCategories.map(cat => (
              <Link
                key={cat.categoriaId}
                to={`/?category=${encodeURIComponent(cat.nombre)}`}
                className="ae-mobile-nav-link"
                onClick={() => setMobileNavOpen(false)}
              >
                <img src={cat.imagenUrl || 'https://via.placeholder.com/24'} alt="" className="ae-mobile-nav-cat-img" />
                {cat.nombre}
              </Link>
            ))}
          </div>
          <div className="ae-mobile-nav-section">
            <h4>Secciones</h4>
            <Link to="/mas-vendidos" className="ae-mobile-nav-link" onClick={() => setMobileNavOpen(false)}>Más vendidos</Link>
            <Link to="/" className="ae-mobile-nav-link" onClick={() => setMobileNavOpen(false)}>Novedades</Link>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}