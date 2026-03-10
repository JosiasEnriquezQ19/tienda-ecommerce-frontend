import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { getComentarios } from '../api/comentariosApi';
import { useNavigate } from 'react-router-dom';
import TarjetaProducto from '../components/TarjetaProducto';
import Banner from '../components/Banner';
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
                    precio: p.precio ?? p.price ?? 0,
                    precioAntes: p.precioAntes,
                    imagenUrl: p.imagenUrl ?? p.url ?? p.image,
                    stock: p.stock ?? p.cantidad ?? 0,
                    estado: (p.estado ?? 'disponible').toString().toLowerCase(),
                    rating: p.valoracion ?? 0,
                    reviews: p.numeroRevisiones ?? 0,
                    ventas: p.ventas ?? 0,
                    marca: p.marca
                }))
                    .filter(p => p.estado !== 'oculto' && p.ventas >= 10)
                    .sort((a, b) => b.ventas - a.ventas);

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
        <div className="mv-page">
            <Banner />

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
