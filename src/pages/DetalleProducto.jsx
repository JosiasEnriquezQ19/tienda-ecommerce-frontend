import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar,
  FaTruck, FaShieldAlt, FaUndoAlt, FaPlus, FaMinus,
  FaExclamationTriangle, FaStar as FaStarFull
} from 'react-icons/fa';
import axios from 'axios';
import { API } from '../api';
import { getComentarios, crearComentario } from '../api/comentariosApi';
import { AuthContext } from '../auth/AuthContext';
import { CartContext } from '../carrito/ContextoCarrito';
import TarjetaProducto from '../components/TarjetaProducto';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import './DetalleProducto.css';

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [producto, setProducto] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [activeTab, setActiveTab] = useState('descripcion');
  const [comentarios, setComentarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [revRating, setRevRating] = useState(0);
  const [revText, setRevText] = useState('');
  const [revError, setRevError] = useState('');
  const [showMoreDesc, setShowMoreDesc] = useState(false);

  // Sync mobile slider dots
  useEffect(() => {
    const el = document.querySelector('.dp-slider');
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      setSelectedImg(idx);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  });

  // Fetch product
  useEffect(() => {
    let off = false;
    setLoading(true);
    setError(null);
    setRelated([]);
    (async () => {
      try {
        const pid = isNaN(id) ? id : Number(id);
        const { data } = await axios.get(`${API}/Productos/${pid}`);
        if (off) return;
        setProducto(data);
        // Related
        const catId = data.categoriaId;
        if (catId) {
          try {
            // Buscamos productos de la misma categoría. 
            // La API de productos suele devolver un objeto paginado o un array según la versión.
            const r = await axios.get(`${API}/Productos?categoriaId=${catId}&pageSize=10`);
            const relatedData = r.data?.items || (Array.isArray(r.data) ? r.data : []);

            const filtered = relatedData
              .filter(p => (p.productoId ?? p.id) != pid && p.estado !== 'oculto')
              .map(p => ({
                productoId: p.productoId ?? p.id,
                id: p.productoId ?? p.id,
                nombre: p.nombre,
                precio: p.precio,
                precioAntes: p.precioAntes,
                imagenUrl: p.imagenUrl,
                rating: p.valoracion ?? 0,
                reviews: p.numeroRevisiones ?? 0,
                estado: p.estado
              }))
              .slice(0, 4);

            setRelated(filtered);
          } catch (e) { console.error("Error fetching related:", e); }
        }
      } catch (e) {
        if (!off) {
          if (e.response?.status === 404) setProducto(null);
          else setError(e.message);
        }
      } finally { if (!off) setLoading(false); }
    })();
    return () => { off = true; };
  }, [id]);

  // Fetch comments
  useEffect(() => {
    if (!producto) return;
    getComentarios(producto.productoId || producto.id)
      .then(d => setComentarios(d || []))
      .catch(() => setComentarios([]));
  }, [producto]);

  // Derived
  const p = useMemo(() => {
    if (!producto) return {};
    const price = producto.precio || 0;
    const old = producto.precioAntes || producto.PrecioAntes || 0;
    const disc = old > price ? Math.round(((old - price) / old) * 100) : 0;
    const imgs = producto.imagenes?.length > 0
      ? producto.imagenes
      : [producto.imagenUrl].filter(Boolean);
    const avg = comentarios.length > 0
      ? comentarios.reduce((s, c) => s + (c.estrellas || 0), 0) / comentarios.length
      : 0;
    return {
      id: producto.productoId || producto.id,
      nombre: producto.nombre || 'Producto',
      desc: producto.descripcion || '',
      precio: price, precioAntes: old, descuento: disc,
      stock: producto.stock || 0,
      imgs: imgs.length ? imgs : ['https://via.placeholder.com/600'],
      cat: producto.categoriaNombre || 'General',
      marca: producto.marca || '-',
      rating: avg, reviews: comentarios.length
    };
  }, [producto, comentarios]);

  const stars = (r) => {
    const out = [];
    const full = Math.floor(r), half = (r % 1) >= 0.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= full) out.push(<FaStarFull key={i} />);
      else if (i === full + 1 && half) out.push(<FaStarHalfAlt key={i} />);
      else out.push(<FaRegStar key={i} />);
    }
    return out;
  };

  const addToCart = () => addItem({
    ...producto, cantidad,
    imagen: p.imgs[0], nombre: p.nombre, precio: p.precio
  });

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!revRating) return setRevError('Selecciona estrellas');
    try {
      const c = await crearComentario(p.id, { estrellas: revRating, texto: revText }, user.token);
      setComentarios(prev => [c, ...prev]);
      setShowForm(false); setRevText(''); setRevRating(0);
    } catch { setRevError('Error al enviar'); }
  };

  // Loading
  if (loading) return (
    <div className="dp"><div className="dp-wrap dp-center"><div className="dp-spinner" /><p>Cargando...</p></div></div>
  );
  // Error / Not found
  if (error || !producto) return (
    <div className="dp"><div className="dp-wrap dp-center">
      <FaExclamationTriangle size={40} color="#94a3b8" />
      <h2 style={{ margin: '16px 0 8px' }}>Producto no disponible</h2>
      <Link to="/" className="dp-link">Volver al catálogo</Link>
    </div></div>
  );

  return (
    <div className="dp">
      <div className="dp-wrap">

        {/* Breadcrumb */}
        <ul className="dp-bread">
          <li><Link to="/">Inicio</Link></li>
          <li>/</li>
          <li><Link to={`/categoria/${p.cat}`}>{p.cat}</Link></li>
          <li>/</li>
          <li className="active">{p.nombre}</li>
        </ul>

        <div className="dp-grid">

          {/* ─── GALERÍA ESCRITORIO ─── */}
          <div className="dp-gallery">
            <div className="dp-img-main">
              <img src={p.imgs[selectedImg]} alt={p.nombre} />
            </div>
            {p.imgs.length > 1 && (
              <div className="dp-thumbs">
                {p.imgs.map((img, i) => (
                  <div key={i} className={`dp-thumb ${selectedImg === i ? 'sel' : ''}`} onClick={() => setSelectedImg(i)}>
                    <img src={img} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── GALERÍA MÓVIL ─── */}
          <div className="dp-mobile-gallery">
            <div className="dp-slider">
              {p.imgs.map((img, i) => (
                <div key={i} className="dp-slide">
                  <img src={img} alt={`${p.nombre} ${i + 1}`} />
                </div>
              ))}
            </div>
            {p.imgs.length > 1 && (
              <div className="dp-dots">
                {p.imgs.map((_, i) => <span key={i} className={`dp-dot ${selectedImg === i ? 'on' : ''}`} />)}
              </div>
            )}
          </div>

          {/* ─── INFO ─── */}
          <div className="dp-info">
            <div className="dp-stock-tag">
              {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}
            </div>

            <h1 className="dp-name">{p.nombre}</h1>

            {(p.reviews > 0) && (
              <div className="dp-rating-line">
                <div className="dp-stars">{stars(p.rating)}</div>
                <span className="dp-rating-num">{p.rating.toFixed(1)}</span>
                <span className="dp-sep">·</span>
                <button className="dp-link" onClick={() => { setActiveTab('opiniones'); setTimeout(() => document.querySelector('.dp-tabs')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>
                  {p.reviews} reseñas
                </button>
                <span className="dp-sep">|</span>
                <span style={{ color: '#64748b', fontSize: '14px' }}>Marca: <b style={{ color: '#0f172a' }}>{p.marca}</b></span>
              </div>
            )}
            {p.reviews === 0 && (
              <div style={{ fontSize: '14px', marginTop: '-10px' }}>
                <span style={{ color: '#64748b' }}>Marca: <b style={{ color: '#0f172a' }}>{p.marca}</b></span>
              </div>
            )}

            {/* Precio */}
            <div className="dp-price-box">
              {p.descuento > 0 && <span className="dp-price-old">S/ {p.precioAntes.toFixed(2)}</span>}
              <div className="dp-price-row">
                <span className="dp-price">S/ {p.precio.toFixed(2)}</span>
                {p.descuento > 0 && <span className="dp-off">-{p.descuento}%</span>}
              </div>
            </div>

            {/* Compra */}
            <div className="dp-actions">
              <div className="dp-qty">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} disabled={cantidad <= 1}><FaMinus /></button>
                <span>{cantidad}</span>
                <button onClick={() => setCantidad(Math.min(p.stock, cantidad + 1))} disabled={cantidad >= p.stock}><FaPlus /></button>
              </div>
              <div className="dp-btns">
                <button className="dp-btn-main" onClick={addToCart} disabled={p.stock <= 0}>
                  <FaShoppingCart /> Agregar al carrito
                </button>
                <button className="dp-btn-alt" onClick={() => { addToCart(); navigate('/carrito'); }} disabled={p.stock <= 0}>
                  Comprar ahora
                </button>
              </div>
            </div>

            <div className="dp-trust">
              <div className="dp-trust-row"><FaTruck /> Envío express garantizado</div>
              <div className="dp-trust-row"><FaShieldAlt /> Pago seguro SSL</div>
              <div className="dp-trust-row"><FaUndoAlt /> 30 días de devolución</div>
            </div>
          </div>

        </div>

        {/* ── TABS ── */}
        <section className="dp-tabs">
          <div className="dp-tab-bar">
            {['descripcion', 'especificaciones', 'opiniones'].map(t => (
              <button key={t} className={`dp-tab ${activeTab === t ? 'on' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'descripcion' ? 'Descripción' : t === 'especificaciones' ? 'Características' : `Opiniones (${comentarios.length})`}
              </button>
            ))}
          </div>

          <div className="dp-tab-body">
            {activeTab === 'descripcion' && (
              <div className="dp-desc-container">
                <p className={`dp-desc-text ${showMoreDesc ? 'full' : ''}`}>
                  {p.desc || 'Sin descripción disponible.'}
                </p>
                {(p.desc && p.desc.length > 160) && (
                  <button
                    className="dp-btn-more"
                    onClick={() => setShowMoreDesc(!showMoreDesc)}
                  >
                    {showMoreDesc ? 'Ver menos' : 'Ver más...'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'especificaciones' && (
              <div className="dp-specs">
                <div className="dp-spec"><span className="dp-spec-k">Categoría</span><span className="dp-spec-v">{p.cat}</span></div>
                <div className="dp-spec"><span className="dp-spec-k">Marca</span><span className="dp-spec-v">{p.marca}</span></div>
                <div className="dp-spec"><span className="dp-spec-k">Modelo</span><span className="dp-spec-v">{producto.modelo || 'N/A'}</span></div>
                <div className="dp-spec"><span className="dp-spec-k">Stock</span><span className="dp-spec-v">{p.stock > 0 ? 'Disponible' : 'Agotado'}</span></div>
              </div>
            )}

            {activeTab === 'opiniones' && (
              <div className="dp-reviews">
                {/* Resumen horizontal */}
                <div className="dp-rev-summary">
                  <div className="dp-rev-big">{p.rating.toFixed(1)}</div>
                  <div className="dp-rev-meta">
                    <div className="dp-stars" style={{ fontSize: 16 }}>{stars(p.rating)}</div>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{p.reviews} valoraciones</span>
                  </div>
                  <button className="dp-rev-write" onClick={() => user ? setShowForm(!showForm) : navigate('/login')}>
                    {showForm ? 'Cancelar' : 'Escribir reseña'}
                  </button>
                </div>

                {/* Formulario */}
                {showForm && (
                  <form className="dp-rev-card" onSubmit={submitReview} style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, borderBottom: 'none' }}>
                    <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Tu valoración</p>
                    <div className="dp-stars" style={{ fontSize: 20, cursor: 'pointer', marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} onClick={() => { setRevRating(n); setRevError(''); }}>
                          {revRating >= n ? <FaStarFull /> : <FaRegStar />}
                        </span>
                      ))}
                    </div>
                    <textarea rows="3" placeholder="Comparte tu experiencia..." value={revText} onChange={e => setRevText(e.target.value)}
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                    {revError && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{revError}</p>}
                    <button type="submit" className="dp-btn-main" style={{ height: 40, marginTop: 12, width: 160, fontSize: 13 }}>Publicar</button>
                  </form>
                )}

                {/* Lista de reseñas */}
                <div>
                  {comentarios.length > 0 ? comentarios.map((c, i) => (
                    <div key={i} className="dp-rev-card">
                      <div className="dp-rev-head">
                        <div className="dp-avatar">{(c.usuarioNombre || 'U')[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.usuarioNombre || 'Usuario'}</div>
                          <div className="dp-stars" style={{ fontSize: 11 }}>{stars(c.estrellas)}</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {c.fechaComentario ? new Date(c.fechaComentario).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {c.texto && <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{c.texto}</p>}
                    </div>
                  )) : (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Sé el primero en opinar</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── RELACIONADOS ── */}
        {related.length > 0 && (
          <section className="dp-related">
            <h2 className="dp-related-title">Productos que podrían interesarte</h2>
            <div className="dp-related-grid">
              {related.map(prod => (
                <TarjetaProducto
                  key={prod.id}
                  product={prod}
                  onQuickView={() => {
                    navigate(`/producto/${prod.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}