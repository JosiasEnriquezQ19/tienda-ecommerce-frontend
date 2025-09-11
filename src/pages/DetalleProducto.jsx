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

  const onAddToCart = () => {
    const item = { 
      productoId: safeGet(producto, 'productoId', 'ProductoId', 'id'),
      nombre: safeGet(producto, 'nombre', 'Nombre') || 'Producto',
      precio: safeGet(producto, 'precio', 'Precio') || 0,
      cantidad,
      imagen: safeGet(producto, 'imagenUrl', 'ImagenUrl') || 'https://via.placeholder.com/600x400',
      descripcion: safeGet(producto, 'descripcion', 'Descripcion') || ''
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
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>Error al cargar el producto: {String(error)}</p>
      <button onClick={() => window.location.reload()} className="ae-retry-btn">Reintentar</button>
    </div>
  );

  if (!producto) return (
    <div className="ae-empty">
      <svg viewBox="0 0 24 24">
        <path d="M22 13h-8v-2h8v2zm0-6h-8v2h8V7zm-8 10h8v-2h-8v2zm-2-8v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2zm-1.5 6l-2.25-3-1.75 2.26-1.25-1.51L3.5 15h7z"/>
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
  const categoria = safeGet(producto, 'categoria', 'Categoria');
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
                <a href={`/categoria/${categoria}`} className="ae-breadcrumb-link">{categoria || 'Productos'}</a>
              </li>
              <li className="ae-breadcrumb-item active" aria-current="page">{nombre}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="ae-container">
        <div className="ae-product-main">
          {/* Product Images */}
          <div className="ae-product-gallery">
            <div className="ae-main-image">
              <div className="ae-zoom-container">
                <Zoom>
                  <img 
                    src={imagenes[selectedImage]} 
                    alt={nombre} 
                    className="ae-product-image"
                  />
                </Zoom>
                <div className="ae-zoom-hint">
                  <FaSearchPlus /> 
                  <span>Haz clic para ampliar</span>
                </div>
              </div>
            </div>
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
          </div>

          {/* Product Info */}
          <div className="ae-product-info">
            <div className="ae-product-header">
              <h1 className="ae-product-title">{nombre}</h1>
              <div className="ae-product-meta">
                <div className="ae-rating">
                  {renderRatingStars(rating)}
                  <span className="ae-review-count">({comentarios.length} opiniones)</span>
                </div>
                <div className="ae-sku">SKU: {prodId}</div>
              </div>
            </div>

            <div className="ae-price-section">
              {descuento > 0 && (
                <div className="ae-discount-badge">-{descuento}%</div>
              )}
              <div className="ae-price-current">S/ {Number(precio).toFixed(2)}</div>
              {descuento > 0 && (
                <div className="ae-price-original">S/ {Number(precioOriginal).toFixed(2)}</div>
              )}
            </div>

            <div className="ae-shipping-info">
              <FaTruck className="ae-shipping-icon" />
              <span>Envío gratis a todo el país</span>
            </div>

            <div className="ae-stock-info">
              {stock > 0 ? (
                <span className="ae-in-stock">Disponible ({stock} unidades)</span>
              ) : (
                <span className="ae-out-of-stock">Agotado</span>
              )}
            </div>

            <div className="ae-quantity-selector">
              <label>Cantidad:</label>
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
            </div>

            <div className="ae-action-buttons">
              <button 
                className="ae-add-to-cart"
                onClick={onAddToCart}
                disabled={stock <= 0}
              >
                <FaShoppingCart className="ae-cart-icon" />
                Añadir al carrito
              </button>
              <button 
                className="ae-buy-now"
                onClick={() => { onAddToCart(); navigate('/carrito'); }}
                disabled={stock <= 0}
              >
                Comprar ahora
              </button>
              {/* Wishlist (me gusta) eliminado */}
            </div>

            <div className="ae-payment-methods">
              <span>Métodos de pago:</span>
              <div className="ae-payment-icons">
                <img src="https://logosenvector.com/logo/img/yape-37283.png" alt="Yape" />
                <img src="https://images.seeklogo.com/logo-png/38/1/plin-logo-png_seeklogo-386806.png" alt="Plin" />
                <img src="https://cdn-icons-png.flaticon.com/512/4140/4140803.png" alt="transferencia bancaria" />
              </div>
              <div className="ae-payment-details">
                <p>Aceptamos Yape, Plin o transferencia bancaria</p>
              </div>
            </div>

            <div className="ae-shipping-options">
              <div className="ae-shipping-option">
                <FaTruck className="ae-option-icon" />
                <div>
                  <div className="ae-option-title">Envío rápido</div>
                  <div className="ae-option-desc">Recíbelo en 3-7 días</div>
                </div>
              </div>
              <div className="ae-shipping-option">
                <FaShieldAlt className="ae-option-icon" />
                <div>
                  <div className="ae-option-title">Protección al comprador</div>
                  <div className="ae-option-desc">Garantía de reembolso</div>
                </div>
              </div>
              <div className="ae-shipping-option">
                <FaExchangeAlt className="ae-option-icon" />
                <div>
                  <div className="ae-option-title">Devoluciones</div>
                  <div className="ae-option-desc">30 días para devolver</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
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
              Opiniones ({comentarios.length})
            </button>
          </div>

          <div className="ae-tab-content">
            {activeTab === 'descripcion' && (
              <div className="ae-product-description">
                <h3>Descripción del producto</h3>
                <p>{descripcion}</p>
              </div>
            )}

            {activeTab === 'especificaciones' && (
              <div className="ae-product-specs">
                <h3>Especificaciones técnicas</h3>
                <table className="ae-specs-table">
                  <tbody>
                    <tr>
                      <th>Marca</th>
                      <td>{marca}</td>
                    </tr>
                    <tr>
                      <th>Modelo</th>
                      <td>{safeGet(producto, 'modelo', 'Modelo') || 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Categoría</th>
                      <td>{categoria || 'N/A'}</td>
                    </tr>
                    {Object.entries(especificaciones).map(([key, value]) => (
                      <tr key={key}>
                        <th>{key}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'opiniones' && (
              <div className="ae-product-reviews">
                <h3>Opiniones de clientes</h3>
                <div className="ae-reviews-summary">
                  <div className="ae-average-rating">
                    <span className="ae-rating-value">{comentarios.length > 0 ? rating.toFixed(1) : '0.0'}</span>
                    <div className="ae-rating-stars">{renderRatingStars(rating)}</div>
                    <span className="ae-rating-count">{comentarios.length} opiniones</span>
                  </div>
                  <div style={{flex:1}}>
                    {comentariosLoading ? (
                      <div className="ae-loading"><div className="ae-spinner" />Cargando opiniones...</div>
                    ) : comentariosError ? (
                      <div className="ae-error">{comentariosError}</div>
                    ) : (
                      <>
                        {comentarios.length === 0 && (
                          <div className="ae-reviews-empty">
                            <p>Este producto aún no tiene opiniones. ¡Sé el primero en opinar!</p>
                          </div>
                        )}
                        <button className="ae-write-review" onClick={openReviewForm}>Escribir opinión</button>
                        {showReviewForm && (
                          <form className="ae-review-form" onSubmit={handleSubmitReview}>
                            <div className="ae-star-input">
                              {[1,2,3,4,5].map(n => (
                                <button type="button" key={n} className={`ae-star-input-btn ${reviewRating>=n? 'active':''}`} onClick={() => handleStarClick(n)} aria-label={`${n} estrellas`}>
                                  <FaStar />
                                </button>
                              ))}
                            </div>
                            <textarea placeholder="Cuenta tu experiencia (opcional)" value={reviewText} onChange={(e)=>setReviewText(e.target.value)} />
                            {reviewError && <div className="ae-review-error">{reviewError}</div>}
                            {reviewSuccess && <div className="ae-review-success">{reviewSuccess}</div>}
                            <div style={{display:'flex',gap:8,marginTop:8}}>
                              <button type="submit" className="ae-save-btn">Enviar opinión</button>
                              <button type="button" className="ae-secondary-button" onClick={() => { setShowReviewForm(false); setReviewError(''); }}>Cancelar</button>
                            </div>
                          </form>
                        )}
                        {comentarios.length > 0 && (
                          <div className="ae-comments-list">
                            {comentarios.map(c => (
                              <div key={c.comentarioId} className="ae-comment-card">
                                <div className="ae-comment-header">
                                  <div className="ae-comment-avatar">
                                    {"A"}
                                  </div>
                                  <div className="ae-comment-info">
                                    <span className="ae-comment-author">Anonymous</span>
                                    <div className="ae-comment-rating">{renderRatingStars(c.estrellas)}</div>
                                    <span className="ae-comment-date">{new Date(c.fechaComentario).toLocaleDateString('es-ES', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}</span>
                                  </div>
                                </div>
                                {c.texto && (
                                  <div className="ae-comment-text">{c.texto}</div>
                                )}
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

        {/* Recomendaciones personalizadas */}
        <div className="ae-related-products">
          <h2 className="ae-section-title">Recomendaciones para ti</h2>
          <p className="ae-recommendation-subtitle">Basado en tus preferencias y este producto</p>
          <div className="ae-related-grid">
            {related.length > 0 ? (
              related.map(prod => {
                const rId = safeGet(prod, 'productoId', 'ProductoId', 'id');
                const rNombre = safeGet(prod, 'nombre', 'Nombre') || 'Producto';
                const rPrecio = safeGet(prod, 'precio', 'Precio') || 0;
                const rPrecioOriginal = safeGet(prod, 'precioOriginal', 'PrecioOriginal') || rPrecio;
                const rDescuento = rPrecioOriginal > rPrecio ? Math.round((1 - rPrecio / rPrecioOriginal) * 100) : 0;
                const rImagen = (safeGet(prod, 'imagenes', 'Imagenes') || [])[0] || 
                                safeGet(prod, 'imagenUrl', 'ImagenUrl') || 
                                'https://via.placeholder.com/300x200';
                const rRating = safeGet(prod, 'rating', 'Rating') || 4.0;
                const rCategoria = safeGet(prod, 'categoria', 'Categoria') || 'General';

                return (
                  <div key={rId} className="ae-related-card">
                    <div className="ae-related-image">
                      <img src={rImagen} alt={rNombre} />
                      {rDescuento > 0 && (
                        <div className="ae-related-discount">-{rDescuento}%</div>
                      )}
                      <div className="ae-recommendation-tag">Recomendado</div>
                    </div>
                    <div className="ae-related-info">
                      <div className="ae-related-category">{rCategoria}</div>
                      <h3 className="ae-related-title">
                        <Link to={`/producto/${rId}`}>{rNombre}</Link>
                      </h3>
                      <div className="ae-related-rating">
                        {renderRatingStars(rRating)}
                      </div>
                      <div className="ae-related-price">
                        <span className="ae-current-price">S/ {Number(rPrecio).toFixed(2)}</span>
                        {rDescuento > 0 && (
                          <span className="ae-original-price">S/ {Number(rPrecioOriginal).toFixed(2)}</span>
                        )}
                      </div>
                      <div className="ae-related-actions">
                        <Link to={`/producto/${rId}`} className="ae-view-btn" onClick={() => window.scrollTo(0,0)}>
                          Ver
                        </Link>
                        <button className="ae-quick-add" onClick={() => addItem({
                          productoId: rId,
                          nombre: rNombre,
                          precio: rPrecio,
                          cantidad: 1,
                          imagen: rImagen,
                          descripcion: safeGet(prod, 'descripcion', 'Descripcion') || ''
                        })}>Añadir al carrito</button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ae-no-recommendations">
                <svg viewBox="0 0 24 24" className="ae-no-recommendations-icon">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <p>No hay recomendaciones disponibles en este momento.</p>
                <p>Te sugerimos revisar nuestros <Link to="/productos/destacados">productos destacados</Link>.</p>
              </div>
            )}
          </div>
        </div>
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