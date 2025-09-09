import React, { useState } from 'react'

export default function Buscador({ onSearch }){
  const [q, setQ] = useState('')
  function submit(e){ e.preventDefault(); onSearch && onSearch(q) }
  return (
    <form className="buscador" onSubmit={submit}>
      <input placeholder="Buscar productos, marcas y más" value={q} onChange={e=> setQ(e.target.value)} />
      <button type="submit">Buscar</button>
    </form>
  )
}
