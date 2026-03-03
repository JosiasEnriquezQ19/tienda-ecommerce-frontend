import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { getComentarios } from '../api/comentariosApi';
import { useNavigate } from 'react-router-dom';
import TarjetaProducto from '../components/TarjetaProducto';
import './MasVendidos.css';

export default function MasVendidos() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${API}/Productos`);
                if (cancelled) return;

                const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
                const normalized = data.map(p => ({
                    productoId: p.productoId ?? p.id,
                    nombre: p.nombre ?? p.name,
                    descripcion: p.descripcion ?? p.description,
                    precio: p.precio ?? p.price ?? 0,
                    imagenUrl: p.imagenUrl ?? p.url ?? p.image,
                    categoria: p.categoria ?? p.idCategoria ?? '',
                    destacado: p.destacado ?? p.oferta ?? false,
                    stock: p.stock ?? p.cantidad ?? 0,
                    rating: p.rating ?? p.puntuacion ?? 0,
                    reviews: p.reviews ?? p.resenas ?? 0,
                    estado: (p.estado ?? 'disponible').toString().toLowerCase(),
                })).filter(p => p.estado !== 'oculto');

                // Enrich with reviews count
                try {
                    const withRatings = await Promise.all(normalized.map(async (p) => {
                        try {
                            const comentarios = await getComentarios(p.productoId);
                            const items = Array.isArray(comentarios) ? comentarios : (comentarios.items || []);
                            const getScore = (c) => {
                                for (const k of ['puntuacion', 'puntuacion_estrellas', 'estrellas', 'rating', 'valor', 'score', 'valoracion']) {
                                    if (c[k] != null && c[k] !== '') { const n = Number(c[k]); if (!isNaN(n)) return n; }
                                }
                                return null;
                            };
                            const scores = items.map(getScore).filter(s => s != null && isFinite(s));
                            const count = scores.length;
                            const avg = count ? scores.reduce((s, v) => s + v, 0) / count : (p.rating || 0);
                            return { ...p, rating: Math.round(avg * 10) / 10, reviews: count };
                        } catch { return p; }
                    }));
                    // Sort by reviews descending (most sold = most reviewed)
                    withRatings.sort((a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.rating || 0) - (a.rating || 0));
                    setProductos(withRatings);
                } catch {
                    normalized.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
                    setProductos(normalized);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchProducts();
        return () => cancelled = true;
    }, []);

    return (
        <div className="mv-page">
            <div className="mv-hero">
                <div className="mv-hero-content">
                    <span className="mv-hero-badge">🔥 Tendencia</span>
                    <h1 className="mv-hero-title">Más vendidos</h1>
                    <p className="mv-hero-desc">Descubre los productos más populares que todos están comprando.</p>
                </div>
            </div>

            <div className="mv-container">
                {loading ? (
                    <div className="mv-loading">
                        <div className="mv-spinner"></div>
                        <p>Cargando productos...</p>
                    </div>
                ) : (
                    <>
                        <div className="mv-stats">
                            <span className="mv-stats-text">{productos.length} productos ordenados por popularidad</span>
                        </div>
                        <div className="mv-grid">
                            {productos.map((p, i) => (
                                <div key={p.productoId} className="mv-item" style={{ animationDelay: `${i * 0.04}s` }}>
                                    {i < 3 && <span className="mv-rank">#{i + 1}</span>}
                                    <TarjetaProducto product={p} onQuickView={() => navigate(`/producto/${p.productoId}`)} />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
