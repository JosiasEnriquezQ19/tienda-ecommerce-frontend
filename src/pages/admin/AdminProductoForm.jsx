import React, { useEffect, useState, useContext } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API } from '../../api'
import { AuthContext } from '../../auth/AuthContext'

export default function AdminProductoForm(){
	const { id } = useParams()
	const navigate = useNavigate()
	const { user } = useContext(AuthContext)

	const [nombre, setNombre] = useState('')
	const [descripcion, setDescripcion] = useState('')
	const [precio, setPrecio] = useState(0)
	const [stock, setStock] = useState(0)
	const [imagen, setImagen] = useState('')
	const [oculto, setOculto] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	useEffect(()=>{
		let cancelled = false
		async function load(){
			if (!id) return
			setLoading(true)
			try{
				const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
				const headers = token ? { Authorization: `Bearer ${token}` } : {}
				const r = await axios.get(`${API}/Productos/${id}`, { headers })
				if (cancelled) return
				const p = r.data || {}
				setNombre(p.nombre || p.name || '')
				setDescripcion(p.descripcion || p.description || p.desc || '')
				setPrecio(Number(p.precio || p.price || 0))
				setStock(Number(p.stock || p.cantidad || 0))
				setImagen(p.imagen || p.image || p.imagenUrl || '')
				setOculto(Boolean(p.oculto || p.hidden || p.isHidden || false))
			}catch(e){ if (!cancelled) setError(e.message || String(e)) }
			finally{ if (!cancelled) setLoading(false) }
		}
		load()
		return ()=> cancelled = true
	}, [id, user])

	if (!user || !user.esAdministrador) return (
		<div className="ae-admin-denied">
			<div className="ae-denied-content">
				<h3>Acceso restringido</h3>
				<p>Debes iniciar sesión como administrador.</p>
				<Link to="/admin/login" className="ae-admin-login-btn">Iniciar sesión</Link>
			</div>
		</div>
	)

	const validate = () => {
		if (!nombre || String(nombre).trim().length < 2) { setError('Nombre requerido (mínimo 2 caracteres)'); return false }
		if (isNaN(precio) || Number(precio) < 0) { setError('Precio inválido'); return false }
		if (!Number.isFinite(Number(stock)) || Number(stock) < 0) { setError('Stock inválido'); return false }
		return true
	}

	const onSave = async (e) => {
		e && e.preventDefault()
		setError(null)
		if (!validate()) return
		setLoading(true)
		try{
			const token = user?.token || user?.accessToken || user?.jwt || user?.authToken
			const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' }
			const body = { nombre, descripcion, precio: Number(precio), stock: Number(stock), imagen, oculto }
			if (id) {
				await axios.put(`${API}/Productos/${id}`, body, { headers })
			} else {
				await axios.post(`${API}/Productos`, body, { headers })
			}
			navigate('/admin/productos', { state: { saved: true } })
		}catch(e){
			console.error('Error guardando producto', e)
			setError(e.response?.data?.message || e.message || String(e))
		}finally{ setLoading(false) }
	}

	return (
		<div className="ae-admin-product-form">
			<h1>{id ? 'Editar producto' : 'Crear nuevo producto'}</h1>
			{error && <div className="ae-error-card" style={{marginBottom:12}}>{error}</div>}
			<form onSubmit={onSave} className="ae-form" style={{maxWidth:720}}>
				<label>Nombre</label>
				<input value={nombre} onChange={e=>setNombre(e.target.value)} />

				<label>Descripción</label>
				<textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={4} />

				<label>Precio</label>
				<input type="number" step="0.01" value={precio} onChange={e=>setPrecio(e.target.value)} />

				<label>Stock</label>
				<input type="number" value={stock} onChange={e=>setStock(e.target.value)} />

				<label>Imagen (URL)</label>
				<input value={imagen} onChange={e=>setImagen(e.target.value)} />

				<label style={{display:'flex',alignItems:'center',gap:8}}>
					<input type="checkbox" checked={oculto} onChange={e=>setOculto(e.target.checked)} />
					Marcar como oculto (soft-delete)
				</label>

				<div style={{display:'flex',gap:8,marginTop:12}}>
					<button type="submit" className="ae-primary-button" disabled={loading}>{loading ? 'Guardando...' : (id ? 'Guardar cambios' : 'Crear producto')}</button>
					<Link to="/admin/productos" className="ae-action-btn">Cancelar</Link>
				</div>
			</form>
		</div>
	)
}
