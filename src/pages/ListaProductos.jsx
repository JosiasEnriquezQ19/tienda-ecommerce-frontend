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

  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;

  const categoryParam = searchParams.get('category') || '';

  const normalizeCategory = (raw) => {
    if (!raw && raw !== 0) return 'Otros';
    const s = String(raw).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (!s) return 'Otros';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API}/Categorias`);
        if (!cancelled) setDbCategories(res.data.filter(c => c.estado !== 'oculto'));
      } catch (e) { }
    };

    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.append('search', query);
        params.append('page', page);
        params.append('pageSize', pageSize);

        const response = await axios.get(`${API}/Productos?${params.toString()}`);
        if (cancelled) return;

        const data = response.data?.items || [];
        setTotalPages(response.data?.totalPages || 1);

        const normalized = data.map(p => ({
          productoId: p.productoId ?? p.id,
          nombre: p.nombre ?? p.name,
          descripcion: p.descripcion ?? p.description,
          precio: p.precio ?? p.price ?? 0,
          precioAntes: p.precioAntes || 0,
          imagenUrl: p.imagenUrl ?? p.url ?? p.image,
          categoria: normalizeCategory(p.categoriaNombre || p.categoria?.nombre),
          stock: p.stock ?? 0,
          estado: (p.estado || '').toLowerCase()
        }));

        setProductos(normalized);
      } catch (e) {
        if (!cancelled) setError('Error al cargar productos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => cancelled = true;
  }, [query, page]);

  let productosAMostrar = productos.filter(p => p.estado !== 'oculto');
  if (categoryParam) {
    productosAMostrar = productosAMostrar.filter(p => p.categoria.toLowerCase() === categoryParam.toLowerCase());
  }

  const carouselRef = React.useRef(null);

  return (
    <div className="ae-products-page">
      {!query && !categoryParam && <Banner />}

      {/* Sección de Categorías — Restaurada */}
      {!query && !categoryParam && dbCategories.length > 0 && (
        <section className="mt-categories-section">
          <h2 className="mt-section-title">Nuestras Categorías</h2>
          <div className="mt-categories-carousel" ref={carouselRef}>
            <div className="mt-categories-grid">
              {dbCategories.map(cat => (
                <Link
                  key={cat.categoriaId}
                  to={`/?category=${encodeURIComponent(cat.nombre)}`}
                  className="mt-category-card"
                >
                  <img src={cat.imagenUrl || 'https://via.placeholder.com/240'} alt={cat.nombre} />
                  <div className="mt-category-overlay">
                    <span className="mt-category-label">{cat.nombre}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="ae-products-container">
        <main className="ae-products-main ae-products-main-full">
          <div className="ae-products-header">
            <h1 className="ae-products-title">
              {categoryParam ? categoryParam : query ? `Búsqueda: ${query}` : 'Nuestros Productos'}
              <span className="ae-products-count"> (Página {page} de {totalPages})</span>
            </h1>
          </div>

          {loading ? (
            <div className="ae-loading"><div className="ae-spinner"></div></div>
          ) : error ? (
            <div className="ae-error"><p>{error}</p></div>
          ) : productosAMostrar.length > 0 ? (
            <>
              <div className="ae-product-grid">
                {productosAMostrar.map(p => (
                  <TarjetaProducto key={p.productoId} product={p} onQuickView={() => navigate(`/producto/${p.productoId}`)} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="ae-pagination">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="ae-pag-btn">Anterior</button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`ae-pag-num ${page === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="ae-pag-btn">Siguiente</button>
                </div>
              )}
            </>
          ) : (
            <div className="ae-no-results"><h3>No hay productos disponibles</h3></div>
          )}
        </main>
      </div>
    </div>
  );
}