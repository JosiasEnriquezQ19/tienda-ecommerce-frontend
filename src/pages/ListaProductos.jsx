import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { getComentarios } from '../api/comentariosApi';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useContext as useCtx } from 'react';
import { SearchContext } from '../search/SearchContext';
import TarjetaProducto from '../components/TarjetaProducto';
import Banner from '../components/Banner';
import './ListaProductos.css';

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('search') || '';
  const [sortOption, setSortOption] = useState('popular');

  // Read category from URL param (if navigated from nav dropdown)
  const categoryParam = searchParams.get('category') || '';

  const normalizeCategory = (raw) => {
    if (!raw && raw !== 0) return 'Otros';
    const s = String(raw).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (!s) return 'Otros';
    if (['tecnologia', 'tecnologico'].includes(s)) return 'Tecnologia';
    if (s.includes('laptop') || s.includes('notebook') || s.includes('portatil')) return 'Laptops';
    if (s.includes('aud') || s.includes('auricul') || s.includes('headphone') || s.includes('audifono')) return 'Audífonos';
    if (s.includes('phone') || s.includes('cel') || s.includes('movil') || s.includes('smartphone') || s.includes('telefono')) return 'Celulares';
    if (s.includes('tablet')) return 'Tecnologia';
    if (s === 'laptops') return 'Laptops';
    if (s === 'celulares') return 'Celulares';
    if (s === 'otros') return 'Otros';
    return 'Otros';
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/Categorias`);
        if (!cancelled) {
          const acts = res.data.filter(c => c.estado !== 'oculto' && c.estado !== 'inactivo');
          setDbCategories(acts);
        }
      } catch (e) { }
    };

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.append('search', query);

        const response = await axios.get(`${API}/Productos?${params.toString()}`);
        if (cancelled) return;

        const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
        const normalized = data.map(p => {
          const rawCat = p.categoria ?? p.idCategoria ?? p.categoriaNombre ?? p.category ?? '';
          const rawEstado = (p.estado ?? p.status ?? p.state ?? '').toString().toLowerCase() || 'disponible';
          return {
            productoId: p.productoId ?? p.id,
            nombre: p.nombre ?? p.name,
            descripcion: p.descripcion ?? p.description,
            precio: p.precio ?? p.price ?? 0,
            precioAntes: p.precioAntes || 0,
            imagenUrl: p.imagenUrl ?? p.url ?? p.image,
            categoria: normalizeCategory(rawCat),
            _rawCategoria: rawCat,
            destacado: p.destacado ?? p.oferta ?? false,
            stock: p.stock ?? p.cantidad ?? 0,
            rating: p.valoracion ?? 0,
            reviews: p.numeroRevisiones ?? 0,
            estado: rawEstado,
            oculto: rawEstado === 'oculto',
            agotado: rawEstado === 'agotado',
            descontinuado: rawEstado === 'descontinuado',
            disponible: rawEstado === 'disponible',
          };
        });

        setProductos(normalized);
      } catch (e) {
        if (!cancelled) { setError('Error al cargar los productos: ' + (e.message || e)); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategories();
    fetchProducts();
    return () => cancelled = true;
  }, [query]);

  const handleSortChange = (e) => setSortOption(e.target.value);

  // Filter and sort products
  let productosAMostrar = productos.filter(p => !p.oculto);

  // Apply category from URL param
  if (categoryParam) {
    productosAMostrar = productosAMostrar.filter(p =>
      p.categoria === categoryParam ||
      String(p._rawCategoria).toLowerCase() === categoryParam.toLowerCase()
    );
  }

  if (query) {
    productosAMostrar = productosAMostrar.filter(p =>
      p.nombre?.toLowerCase().includes(query.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Sorting
  switch (sortOption) {
    case 'price-asc': productosAMostrar.sort((a, b) => (a.precio || 0) - (b.precio || 0)); break;
    case 'price-desc': productosAMostrar.sort((a, b) => (b.precio || 0) - (a.precio || 0)); break;
    case 'rating': productosAMostrar.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'newest': productosAMostrar.sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0)); break;
    default: productosAMostrar.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || (b.reviews || 0) - (a.reviews || 0));
  }
  const carouselRef = React.useRef(null);

  return (
    <div className="ae-products-page">
      {/* Banner only when no search & no category filter */}
      {!query && !categoryParam && <Banner />}

      {/* Categories — only when no search */}
      {!query && !categoryParam && dbCategories.length > 0 && (
        <section className="mt-categories-section">
          <h2 className="mt-section-title">Nuestras Categorías</h2>
          <div
            className="mt-categories-carousel"
            ref={carouselRef}
          >
            <div className="mt-categories-grid">
              {dbCategories.map((cat) => (
                <Link
                  key={cat.categoriaId}
                  to={`/?category=${encodeURIComponent(cat.nombre)}`}
                  className="mt-category-card"
                >
                  <img src={cat.imagenUrl || 'https://via.placeholder.com/400x500'} alt={cat.nombre} loading="lazy" />
                  <div className="mt-category-overlay">
                    <span className="mt-category-label">{cat.nombre}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <div className="ae-products-container">
        <main className="ae-products-main ae-products-main-full">
          <div className="ae-products-header">
            <h1 className="ae-products-title">
              {categoryParam ? categoryParam : query ? `Resultados para "${query}"` : 'Nuestros Productos'}
              {productosAMostrar.length > 0 && (
                <span className="ae-products-count">({productosAMostrar.length})</span>
              )}
            </h1>

            {categoryParam && (
              <button className="ae-clear-cat-btn" onClick={() => setSearchParams({})}>
                ✕ Limpiar filtro
              </button>
            )}

            <div className="ae-sort-options">
              <label htmlFor="sort-by">Ordenar:</label>
              <select id="sort-by" value={sortOption} onChange={handleSortChange} className="ae-sort-select">
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
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
              <p>{error}</p>
              <button className="ae-retry-btn" onClick={() => window.location.reload()}>Reintentar</button>
            </div>
          ) : productosAMostrar.length > 0 ? (
            <div className="ae-product-grid">
              {productosAMostrar.map(p => (
                <TarjetaProducto key={p.productoId} product={p} onQuickView={() => navigate(`/producto/${p.productoId}`)} />
              ))}
            </div>
          ) : (
            <div className="ae-no-results">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" /><path d="M12 18c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-1-8h2v-3h-2v3z" /></svg>
              <h3>No se encontraron productos</h3>
              <p>Intenta ajustar tu búsqueda</p>
              <button className="ae-clear-filters-btn" onClick={() => { setSearchParams({}); }}>Limpiar filtros</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}