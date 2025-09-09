import React from 'react'

export default function EstadisticasProductos({ productos = [], productosFiltrados = [] }){
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body p-2 d-flex justify-content-between align-items-center">
        <div>Mostrando <strong>{productosFiltrados.length}</strong> de <strong>{productos.length}</strong> productos</div>
        <div style={{color:'#666'}}>Última actualización: ahora</div>
      </div>
    </div>
  )
}
