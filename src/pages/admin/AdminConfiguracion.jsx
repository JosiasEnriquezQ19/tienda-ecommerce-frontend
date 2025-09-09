import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminConfiguracion(){
	return (
		<div className="ae-admin-config">
			<div className="ae-admin-header">
				<h1>Configuración del sitio</h1>
				<Link to="/admin" className="ae-action-btn">Volver al panel</Link>
			</div>

			<section style={{marginTop:16}}>
				<p>Área de configuración administrativa. Aquí puedes ajustar opciones del sitio.</p>
				<p style={{color:'#666',fontSize:13}}>Este componente es un marcador de posición. Implementa las opciones reales según tu backend.</p>
			</section>
		</div>
	)
}
