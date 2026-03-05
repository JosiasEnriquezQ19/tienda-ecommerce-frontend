import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar, FaChevronLeft, FaTruck, FaShieldAlt, FaExchangeAlt, FaHeart, FaSearchPlus } from 'react-icons/fa';
import axios from 'axios';
import { API } from '../api';
import { getComentarios, crearComentario } from '../api/comentariosApi';
import { AuthContext } from '../auth/AuthContext';
import { CartContext } from '../carrito/ContextoCarrito';
import './DetalleProducto.css';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, addItem } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [producto, setProducto] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('descripcion');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  // Comentarios
  const [comentarios, setComentarios] = useState([]);
  const [comentariosLoading, setComentariosLoading] = useState(true);
  const [comentariosError, setComentariosError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // normalize id to number when possible to avoid accidental string ids
        const pidNum = Number(id);
        const pid = Number.isFinite(pidNum) ? pidNum : id;

        // fetch product first; if not found show friendly 'not found' UI
        const productRes = await axios.get(`${API}/Productos/${pid}`);
        if (!cancelled) setProducto(productRes.data);

        // fetch related by category when possible; fallback to related endpoint
        try {
          const prodCategory = productRes.data?.categoria || productRes.data?.Categoria;
          if (prodCategory) {
            let relatedRes;
            // prefer a query-based endpoint, fallback to alternative patterns and finally the legacy 'related' endpoint
            try {
              relatedRes = await axios.get(`${API}/Productos?categoria=${encodeURIComponent(prodCategory)}`);
            } catch (eQuery) {
              try {
                relatedRes = await axios.get(`${API}/Productos/categoria/${encodeURIComponent(prodCategory)}`);
              } catch (eAlt) {
                relatedRes = await axios.get(`${API}/Productos/related/${pid}`);
              }
            }

            if (!cancelled) {
              const items = (relatedRes.data || []).filter(p => {
                const rid = p.productoId ?? p.ProductoId ?? p.id;
                return String(rid) !== String(pid);
              }).slice(0, 4);
              setRelated(items);
            }
          } else {
            const relatedRes = await axios.get(`${API}/Productos/related/${pid}`);
            if (!cancelled) setRelated(relatedRes.data?.slice(0, 4) || []);
          }
        } catch (e2) {
          if (!cancelled) setRelated([]);
        }
      } catch (e) {
        if (!cancelled) {
          // If backend returned 404, show the "Producto no encontrado" UI
          if (e.response?.status === 404) {
            setProducto(null);
            setError(null);
          } else {
            // prefer server-provided message when available
            setError(e.response?.data?.message || e.response?.data || e.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [id]);

  function safeGet(obj, ...keys) {
    for (const k of keys) if (obj && obj[k] !== undefined) return obj[k];
    return undefined;
  }

  function renderRatingStars(rating) {
    const stars = [];
    const r = rating ?? 4.5;
    const full = Math.floor(r);
    const half = (r % 1) >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= full) stars.push(<FaStar key={i} className="ae-star-filled" />);
      else if (i === full + 1 && half) stars.push(<FaStarHalfAlt key={i} className="ae-star-half" />);
      else stars.push(<FaRegStar key={i} className="ae-star-empty" />);
    }
    return stars;
  }

  const formatPrice = (price) => {
    const num = Number(price || 0);
    if (num % 1 === 0) {
      return num.toLocaleString('es-PE');
    }
    return num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const onAddToCart = () => {
    const item = {
      productoId: safeGet(producto, 'productoId', 'ProductoId', 'id'),
      nombre: safeGet(producto, 'nombre', 'Nombre') || 'Producto',
      precio: safeGet(producto, 'precio', 'Precio') || 0,
      cantidad,
      imagen: safeGet(producto, 'imagenUrl', 'ImagenUrl') || 'https://via.placeholder.com/600x400',
      descripcion: safeGet(producto, 'descripcion', 'Descripcion') || '',
      stock: safeGet(producto, 'stock', 'Stock') || 0
    };
    addItem(item);
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // Aquí podrías agregar lógica para guardar en favoritos
  };

  const openReviewForm = () => {
    setActiveTab('opiniones');
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowReviewForm(true);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 150);
  };

  const handleStarClick = (n) => {
    setReviewRating(n);
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    if (!user) {
      setReviewError('Debes iniciar sesión para opinar.');
      return;
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Por favor selecciona una valoración de 1 a 5 estrellas.');
      return;
    }
    try {
      const pid = producto.productoId || producto.ProductoId;
      const nuevoComentario = await crearComentario(pid, { estrellas: reviewRating, texto: reviewText }, user.token);
      setReviewSuccess('¡Gracias por tu opinión!');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(0);
      // Agregar el comentario localmente siempre con nombre Anonymous
      const comentarioConUsuario = {
        ...nuevoComentario,
        usuarioNombre: 'Anonymous',
        fechaComentario: new Date().toISOString()
      };
      setComentarios(prev => [comentarioConUsuario, ...prev]);
    } catch (e) {
      setReviewError('No se pudo enviar la opinión en este momento. Intenta más tarde.');
    }
  };
  // Cargar comentarios al cargar producto
  useEffect(() => {
    if (!producto?.productoId && !producto?.ProductoId) return;
    setComentariosLoading(true);
    setComentariosError('');
    const pid = producto.productoId || producto.ProductoId;
    getComentarios(pid)
      .then(data => setComentarios(data))
      .catch(() => setComentariosError('No se pudieron cargar los comentarios'))
      .finally(() => setComentariosLoading(false));
  }, [producto]);

  if (loading) return (
    <div className="ae-loading">
      <div className="ae-spinner"></div>
      <p>Cargando producto...</p>
    </div>
  );

  if (error) return (
    <div className="ae-error">
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <p>Error al cargar el producto: {String(error)}</p>
      <button onClick={() => window.location.reload()} className="ae-retry-btn">Reintentar</button>
    </div>
  );

  if (!producto) return (
    <div className="ae-empty">
      <svg viewBox="0 0 24 24">
        <path d="M22 13h-8v-2h8v2zm0-6h-8v2h8V7zm-8 10h8v-2h-8v2zm-2-8v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2zm-1.5 6l-2.25-3-1.75 2.26-1.25-1.51L3.5 15h7z" />
      </svg>
      <h3>Producto no encontrado</h3>
      <p>El producto que buscas no está disponible o no existe</p>
      <button onClick={() => navigate('/')} className="ae-back-btn">Volver a la tienda</button>
    </div>
  );

  // Normalizar campos del producto
  const prodId = safeGet(producto, 'productoId', 'ProductoId', 'id');
  const nombre = safeGet(producto, 'nombre', 'Nombre') || 'Producto';
  const descripcion = safeGet(producto, 'descripcion', 'Descripcion') || '';
  const precio = safeGet(producto, 'precio', 'Precio') || 0;
  const precioOriginal = safeGet(producto, 'precioOriginal', 'PrecioOriginal') || precio;
  const descuento = precioOriginal > precio ? Math.round((1 - precio / precioOriginal) * 100) : 0;
  const stock = safeGet(producto, 'stock', 'Stock') || 0;
  const imagenes = safeGet(producto, 'imagenes', 'Imagenes') || [
    safeGet(producto, 'imagenUrl', 'ImagenUrl') || 'https://via.placeholder.com/600x400'
  ];
  const categoriaId = safeGet(producto, 'categoria', 'Categoria', 'categoriaId', 'CategoriaId');
  const categoriaNombre = safeGet(producto, 'categoriaNombre', 'CategoriaNombre', 'categoria_nombre') || 'Sin categoría';
  const marca = safeGet(producto, 'marca', 'Marca') || 'Genérico';
  const especificaciones = safeGet(producto, 'especificaciones', 'Especificaciones') || {};

  // Calcular rating promedio real basado en comentarios
  const rating = comentarios.length > 0
    ? comentarios.reduce((sum, c) => sum + c.estrellas, 0) / comentarios.length
    : 0;

  const reviews = safeGet(producto, 'reviews', 'Reviews') || 128;

  return (
    <div className="ae-product-detail">
      {/* Breadcrumb */}
      <div className="ae-breadcrumb">
        <div className="ae-container">
          <nav aria-label="breadcrumb">
            <ol className="ae-breadcrumb-list">
              <li className="ae-breadcrumb-item">
                <a href="/" className="ae-breadcrumb-link">Inicio</a>
              </li>
              <li className="ae-breadcrumb-item">
                <a href={`/categoria/${categoriaId}`} className="ae-breadcrumb-link">{categoriaNombre}</a>
              </li>
              <li className="ae-breadcrumb-item active" aria-current="page">{nombre}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="ae-container">
        <div className="ae-product-main">
          {/* Product Images Div (Izquierda) */}
          <div className="ae-product-gallery">
            <div className="ae-main-image">
              <span className="ae-image-counter">{selectedImage + 1} / {imagenes.length}</span>
              <div className="ae-zoom-container">
                <Zoom zoomMargin={45}>
                  <img
                    src={imagenes[selectedImage]}
                    alt={nombre}
                    className="ae-product-image"
                  />
                </Zoom>
              </div>
              <div className="ae-image-dots">
                {imagenes.map((_, idx) => (
                  <span
                    key={idx}
                    className={`ae-dot ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  />
                ))}
              </div>
            </div>
            {/* Thumbnails */}
            {imagenes.length > 1 && (
              <div className="ae-thumbnails">
                {imagenes.map((img, idx) => (
                  <div
                    key={idx}
                    className={`ae-thumbnail ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`Vista ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Div (Derecha) */}
          <div className="ae-product-info">
            <h1 className="ae-product-title">{nombre}</h1>

            <div className="ae-product-rating">
              <div className="ae-rating">{renderRatingStars(rating)}</div>
              <span className="ae-rating-number">({rating.toFixed(1)})</span>
              <span className="ae-review-count">{comentarios.length} Comentarios</span>
              <span className="ae-separator">•</span>
              <span className="ae-sold-count">{reviews} Vendidos</span>
            </div>

            <div className="ae-price-section">
              {descuento > 0 ? (
                <>
                  <div className="ae-price-current-line">
                    <span className="ae-price-current">S/ {formatPrice(precio)}</span>
                    <span className="ae-discount-badge">-{descuento}%</span>
                  </div>
                  <div className="ae-price-original-line">
                    <span className="ae-price-original">S/ {formatPrice(precioOriginal)}</span>
                  </div>
                </>
              ) : (
                <div className="ae-price-current-line">
                  <span className="ae-price-current">S/ {formatPrice(precio)}</span>
                </div>
              )}
            </div>

            <div className="ae-variant-group">
              <span className="ae-variant-label">Marca: <span>{marca}</span></span>
              <div className="ae-variant-options">
                <button className="ae-variant-btn active">{marca}</button>
              </div>
            </div>

            <div className="ae-action-row">
              <div className="ae-quantity-controls">
                <button
                  className="ae-quantity-btn"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  disabled={cantidad <= 1}
                >
                  -
                </button>
                <span className="ae-quantity-value">{cantidad}</span>
                <button
                  className="ae-quantity-btn"
                  onClick={() => setCantidad(cantidad + 1)}
                  disabled={cantidad >= stock}
                >
                  +
                </button>
              </div>
              <span className="ae-stock-info">Stock: <b>{stock}</b></span>
            </div>

            <div className="ae-main-buttons">
              <button
                className="ae-buy-now"
                onClick={() => { onAddToCart(); navigate('/carrito'); }}
                disabled={stock <= 0}
              >
                Comprar Ahora
              </button>
              <button
                className="ae-add-to-cart"
                onClick={onAddToCart}
                disabled={stock <= 0}
              >
                <FaShoppingCart className="ae-cart-icon" /> Añadir al carrito
              </button>
            </div>

            <div style={{ marginTop: '32px' }}>
              <div className="ae-delivery-info">
                <div className="ae-info-row">
                  <FaTruck /> <span>Envío gratis a todo el país disponible.</span>
                </div>
                <div className="ae-info-row">
                  <FaShieldAlt style={{ color: '#a855f7' }} /> <span>Transacción garantizada o devolución sin fricciones.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs (Abajo, separados cleanly) */}
        <div className="ae-product-tabs">
          <div className="ae-tab-header">
            <button
              className={`ae-tab-btn ${activeTab === 'descripcion' ? 'active' : ''}`}
              onClick={() => setActiveTab('descripcion')}
            >
              Descripción
            </button>
            <button
              className={`ae-tab-btn ${activeTab === 'especificaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('especificaciones')}
            >
              Especificaciones
            </button>
            <button
              className={`ae-tab-btn ${activeTab === 'opiniones' ? 'active' : ''}`}
              onClick={() => setActiveTab('opiniones')}
            >
              Opiniones
            </button>
          </div>

          <div className="ae-tab-content">
            {activeTab === 'descripcion' && (
              <div className="ae-product-description">
                <h3>{nombre} – Resumen</h3>
                <p>
                  {descripcion && descripcion.length > 300 && !isDescriptionExpanded
                    ? `${descripcion.substring(0, 300)}...`
                    : descripcion}
                </p>
                {descripcion && descripcion.length > 300 && (
                  <button
                    className="ae-see-more-btn"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  >
                    {isDescriptionExpanded ? 'Mostrar menos' : 'Leer más...'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'especificaciones' && (
              <div className="ae-product-specs">
                <table className="ae-specs-table">
                  <tbody>
                    <tr><th>Marca</th><td>{marca}</td></tr>
                    <tr><th>Modelo</th><td>{safeGet(producto, 'modelo', 'Modelo') || 'No especificado'}</td></tr>
                    <tr><th>Categoría</th><td>{categoriaNombre}</td></tr>
                    {Object.entries(especificaciones).map(([key, value]) => (
                      <tr key={key}><th>{key}</th><td>{value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'opiniones' && (
              <div className="ae-product-reviews">
                <div className="ae-reviews-summary">
                  <div className="ae-average-rating">
                    <span className="ae-rating-title">Valoración de clientes</span>
                    <span className="ae-rating-value">{comentarios.length > 0 ? rating.toFixed(1) : '0.0'} <span style={{ fontSize: '16px', color: '#999' }}>/ 5.0</span></span>
                    <div className="ae-rating">{renderRatingStars(rating)}</div>
                    <span className="ae-rating-count">{comentarios.length} opiniones • 100% satisfechos</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    {comentariosLoading ? (
                      <div>Cargando...</div>
                    ) : comentariosError ? (
                      <div className="ae-error">{comentariosError}</div>
                    ) : (
                      <>
                        <button className="ae-write-review" onClick={openReviewForm}>Escribir mi reseña</button>
                        {showReviewForm && (
                          <form className="ae-review-form" onSubmit={handleSubmitReview}>
                            <div className="ae-star-input">
                              {[1, 2, 3, 4, 5].map(n => (
                                <button type="button" key={n} className={`ae-star-input-btn ${reviewRating >= n ? 'active' : ''}`} onClick={() => handleStarClick(n)}>
                                  <FaStar />
                                </button>
                              ))}
                            </div>
                            <textarea placeholder="Cuéntanos más detalladamente (opcional)" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                            {reviewError && <div className="ae-review-error">{reviewError}</div>}
                            {reviewSuccess && <div className="ae-review-success">{reviewSuccess}</div>}
                            <div style={{ display: 'flex' }}>
                              <button type="submit" className="ae-save-btn">Publicar opinión</button>
                              <button type="button" className="ae-secondary-button" onClick={() => { setShowReviewForm(false); setReviewError(''); }}>Cancelar</button>
                            </div>
                          </form>
                        )}
                        {comentarios.length > 0 && (
                          <div className="ae-comments-list" style={{ marginTop: '24px' }}>
                            {comentarios.map(c => (
                              <div key={c.comentarioId} className="ae-comment-card">
                                <div className="ae-comment-header">
                                  <div className="ae-comment-avatar">{(c.usuarioNombre || 'A')[0]}</div>
                                  <div className="ae-comment-info">
                                    <span className="ae-comment-author">{c.usuarioNombre || 'Anonymous'}</span>
                                    <span className="ae-comment-date">{new Date(c.fechaComentario).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  <div className="ae-rating" style={{ marginLeft: 'auto' }}>{renderRatingStars(c.estrellas)}</div>
                                </div>
                                {c.texto && <div className="ae-comment-text">{c.texto}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recomendaciones personalizadas (si las hay) */}
        {related.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <h2 style={{ fontSize: '22px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px', marginBottom: '24px' }}>Recomendaciones basadas en este modelo</h2>
            <div className="ae-related-grid" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
              {related.map(prod => {
                const rId = safeGet(prod, 'productoId', 'ProductoId', 'id');
                const rNombre = safeGet(prod, 'nombre', 'Nombre') || 'Producto';
                const rPrecio = safeGet(prod, 'precio', 'Precio') || 0;
                const rImagen = (safeGet(prod, 'imagenes', 'Imagenes') || [])[0] || safeGet(prod, 'imagenUrl', 'ImagenUrl');

                return (
                  <Link key={rId} to={`/producto/${rId}`} onClick={() => window.scrollTo(0, 0)} style={{ minWidth: '180px', textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', padding: '12px', background: '#fff', height: '100%' }}>
                      <div style={{ aspectRatio: '1/1', background: '#fafafa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', marginBottom: '12px' }}>
                        <img src={rImagen} alt={rNombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <h4 style={{ fontSize: '14px', margin: '0 0 8px', fontWeight: '600' }}>{rNombre}</h4>
                      <strong style={{ fontSize: '16px' }}>S/ {formatPrice(rPrecio)}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de inicio de sesión */}
      {showLoginModal && (
        <div className="ae-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="ae-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ae-modal-header">
              <h3>Inicia sesión para opinar</h3>
              <button className="ae-modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
            </div>
            <div className="ae-modal-body">
              <p>Para escribir una opinión sobre este producto necesitas tener una cuenta.</p>
              <div className="ae-modal-buttons">
                <Link to="/login" className="ae-modal-btn ae-modal-btn-primary">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="ae-modal-btn ae-modal-btn-secondary">
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}