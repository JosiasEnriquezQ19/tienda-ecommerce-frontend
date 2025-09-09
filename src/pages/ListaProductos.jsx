import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { getComentarios } from '../api/comentariosApi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useContext as useCtx } from 'react';
import { SearchContext } from '../search/SearchContext';
import TarjetaProducto from '../components/TarjetaProducto';
import Filtros from '../components/Filtros';
import Banner from '../components/Banner';
import './ListaProductos.css';

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { term: query } = useCtx(SearchContext);
  const [sortOption, setSortOption] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const normalizeCategory = (raw) => {
    if (!raw && raw !== 0) return 'Otros';
    const s = String(raw).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (!s) return 'Otros';
    if (['tecnologia', 'tecnologico'].includes(s)) return 'Tecnologia';
    if (s.includes('laptop') || s.includes('notebook') || s.includes('portatil')) return 'Laptops';
    if (s.includes('aud') || s.includes('auricul') || s.includes('headphone') || s.includes('audifono')) return 'Audífonos';
    if (s.includes('phone') || s.includes('cel') || s.includes('movil') || s.includes('smartphone') || s.includes('telefono')) return 'Celulares';
    if (s.includes('tablet') || s.includes('tablet')) return 'Tecnologia';
    // known canonical values
    if (s === 'laptops') return 'Laptops';
    if (s === 'celulares') return 'Celulares';
    if (s === 'otros') return 'Otros';
    // fallback to Otros
    return 'Otros';
  };

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchProducts = async () => {
      try {
  // Build query params
  const params = new URLSearchParams();
  if (query) params.append('search', query);
  // If filters.categorias is an array, append each category by name so backend can filter
  if (Array.isArray(filters.categorias) && filters.categorias.length) {
          filters.categorias.forEach(c => params.append('category', c));
        } else if (filters.categoria) {
          // backward compatibility with single-value filter key
          params.append('category', filters.categoria);
        }
        if (filters.precioMax) params.append('maxPrice', filters.precioMax);
        
        const response = await axios.get(`${API}/Productos?${params.toString()}`);
        
        if (cancelled) return;
        
        const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const normalized = data.map(p => {
          const rawCat = p.categoria ?? p.idCategoria ?? p.categoriaNombre ?? p.category ?? '';
          const rawEstado = (p.estado ?? p.status ?? p.state ?? '').toString().toLowerCase() || 'disponible'
          return ({
            productoId: p.productoId ?? p.id,
            nombre: p.nombre ?? p.name,
            descripcion: p.descripcion ?? p.description,
            precio: p.precio ?? p.price ?? 0,
            imagenUrl: p.imagenUrl ?? p.url ?? p.image,
            categoria: normalizeCategory(rawCat),
            _rawCategoria: rawCat,
            destacado: p.destacado ?? p.oferta ?? false,
            stock: p.stock ?? p.cantidad ?? 0,
            rating: p.rating ?? p.puntuacion ?? 0,
            reviews: p.reviews ?? p.resenas ?? 0,
            // normalize estado values coming from DB: 'disponible'|'agotado'|'descontinuado'|'oculto'
            estado: rawEstado,
            oculto: rawEstado === 'oculto',
            agotado: rawEstado === 'agotado',
            descontinuado: rawEstado === 'descontinuado',
            disponible: rawEstado === 'disponible'
          })
        });
        
        // Try to enrich products with average rating and reviews count by fetching comentarios
        try {
          const withRatings = await Promise.all(normalized.map(async (p) => {
            try {
              const comentarios = await getComentarios(p.productoId);
              const items = Array.isArray(comentarios) ? comentarios : (comentarios.items || []);

              // robust score extractor - accept different field names
              const getScore = (c) => {
                const candidates = ['puntuacion','puntuacion_estrellas','estrellas','rating','valor','score','valoracion'];
                for (const k of candidates) {
                  if (c[k] != null && c[k] !== '') {
                    const n = Number(c[k]);
                    if (!isNaN(n)) return n;
                  }
                }
                // fallback: try any numeric-looking prop
                for (const key of Object.keys(c)) {
                  const n = Number(c[key]);
                  if (!isNaN(n)) return n;
                }
                return null;
              };

              const scores = items.map(getScore).filter(s => s != null && isFinite(s));
              const count = scores.length;
              const avg = count ? scores.reduce((s, v) => s + v, 0) / count : (p.rating || 0);
              return { ...p, rating: Math.round(avg * 10) / 10, reviews: count };
            } catch (err) {
              // If comments fetch fails for a product, keep original values
              return p;
            }
          }));

          setProductos(withRatings);
        } catch (err) {
          // fallback to original normalized list on any error
          setProductos(normalized);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Error al cargar los productos: ' + (e.message || e));
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    
    return () => cancelled = true;
  }, [query, filters]);

  const handleSearch = (q) => {
    if (q) {
      searchParams.set('search', q);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleFilter = (f) => {
    setFilters(prev => ({ ...prev, ...f }));
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Filter and sort products
  // Exclude products explicitly marked as oculto by default
  let productosAMostrar = productos.filter(p => !p.oculto);
  
  // Client-side filtering as fallback
  if (Array.isArray(filters.categorias) && filters.categorias.length) {
    // keep items whose normalized categoria is included in the selected list
    productosAMostrar = productosAMostrar.filter(p => filters.categorias.includes(p.categoria));
  } else if (filters.categoria) {
    productosAMostrar = productosAMostrar.filter(p => String(p.categoria) === String(filters.categoria));
  }
  
  if (filters.precioMax) {
    productosAMostrar = productosAMostrar.filter(p => (p.precio || 0) <= Number(filters.precioMax));
  }
  
  if (query) {
    productosAMostrar = productosAMostrar.filter(p => 
      p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Apply minimum rating filter (if provided)
  if (filters.ratingMin != null && filters.ratingMin !== '') {
    const min = Number(filters.ratingMin) || 0;
    productosAMostrar = productosAMostrar.filter(p => (Number(p.rating) || 0) >= min);
  }

  // Sorting
  switch (sortOption) {
    case 'price-asc':
      productosAMostrar.sort((a, b) => (a.precio || 0) - (b.precio || 0));
      break;
    case 'price-desc':
      productosAMostrar.sort((a, b) => (b.precio || 0) - (a.precio || 0));
      break;
    case 'rating':
      productosAMostrar.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'newest':
      productosAMostrar.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
      break;
    default: // 'popular'
      productosAMostrar.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || (b.reviews || 0) - (a.reviews || 0));
  }

  return (
    <div className="ae-products-page">
      <Banner />
      
      <div className="ae-products-container">
        {/* Filtros móvil */}
        <button 
          className="ae-mobile-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/>
          </svg>
          Filtros
        </button>
        
        <div className={`ae-filters-sidebar ${showFilters ? 'active' : ''}`}>
          <div className="ae-filters-header">
            <h3>Filtros</h3>
            <button 
              className="ae-close-filters"
              onClick={() => setShowFilters(false)}
            >
              ×
            </button>
          </div>
          <Filtros onFilter={handleFilter} />
        </div>
        
        {/* Contenido principal */}
        <main className="ae-products-main">
          <div className="ae-products-header">
            <h1 className="ae-products-title">
              {query ? `Resultados para "${query}"` : 'Nuestros Productos'}
              {productosAMostrar.length > 0 && (
                <span className="ae-products-count"> ({productosAMostrar.length} productos)</span>
              )}
            </h1>
            
            <div className="ae-sort-options">
              <label htmlFor="sort-by">Ordenar por:</label>
              <select 
                id="sort-by"
                value={sortOption}
                onChange={handleSortChange}
                className="ae-sort-select"
              >
                <option value="popular">Más populares</option>
                <option value="rating">Mejor valorados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="newest">Más recientes</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="ae-loading">
              <div className="ae-spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : error ? (
            <div className="ae-error">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <p>{error}</p>
              <button 
                className="ae-retry-btn"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          ) : productosAMostrar.length > 0 ? (
            <div className="ae-product-grid">
              {productosAMostrar.map(p => (
                <TarjetaProducto 
                  key={p.productoId} 
                  product={p} 
                  onQuickView={() => navigate(`/producto/${p.productoId}`)}
                />
              ))}
            </div>
          ) : (
            <div className="ae-no-results">
              <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                <path d="M12 18c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-1-8h2v-3h-2v3z"/>
              </svg>
              <h3>No se encontraron productos</h3>
              <p>Intenta ajustar tus filtros o términos de búsqueda</p>
              <button 
                className="ae-clear-filters-btn"
                onClick={() => {
                  setFilters({});
                  setSearchParams({});
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}