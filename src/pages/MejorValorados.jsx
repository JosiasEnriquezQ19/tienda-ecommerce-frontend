import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { getComentarios } from '../api/comentariosApi';
import { useNavigate } from 'react-router-dom';
import TarjetaProducto from '../components/TarjetaProducto';
import Banner from '../components/Banner';
import './MejorValorados.css';

export default function MejorValorados() {
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
                    precioAntes: p.precioAntes ?? 0,
                    imagenUrl: p.imagenUrl ?? p.url ?? p.image,
                    categoria: p.categoria ?? p.idCategoria ?? '',
                    destacado: p.destacado ?? p.oferta ?? false,
                    stock: p.stock ?? p.cantidad ?? 0,
                    marca: p.marca ?? '',
                    rating: p.valoracion ?? 0,
                    reviews: p.numeroRevisiones ?? 0,
                    estado: (p.estado ?? 'disponible').toString().toLowerCase(),
                }))
                    .filter(p => p.estado !== 'oculto' && p.reviews > 0 && p.rating >= 4.7)
                    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);

                setProductos(normalized);
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
        <div className="mbv-page">
            <Banner />

            <div className="mbv-container">
                {loading ? (
                    <div className="mbv-loading">
                        <div className="mbv-spinner"></div>
                        <p>Cargando productos...</p>
                    </div>
                ) : (
                    <>
                        <div className="mbv-stats">
                            <span className="mbv-stats-text">
                                {productos.length} producto{productos.length !== 1 ? 's' : ''} con calificación de 4.7★ o superior
                            </span>
                        </div>

                        {productos.length === 0 ? (
                            <div className="mbv-empty">
                                <div className="mbv-empty-icon">⭐</div>
                                <h3>Aún no hay productos con esta calificación</h3>
                                <p>Los productos aparecerán aquí cuando los clientes dejen reseñas con 4.7 estrellas o más.</p>
                            </div>
                        ) : (
                            <div className="mbv-grid">
                                {productos.map((p, i) => (
                                    <div key={p.productoId} className="mbv-item" style={{ animationDelay: `${i * 0.04}s` }}>
                                        <TarjetaProducto product={p} onQuickView={() => navigate(`/producto/${p.productoId}`)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
