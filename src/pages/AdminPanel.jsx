import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminPanel(){
	return (
		<div className="ae-admin-panel">
			<h1>Panel de administración</h1>
			<div style={{display:'flex',gap:12,marginTop:12}}>
				<Link to="/admin/productos" className="ae-action-btn">Productos</Link>
				<Link to="/admin/configuracion" className="ae-action-btn">Configuración</Link>
			</div>
		</div>
	)
}
