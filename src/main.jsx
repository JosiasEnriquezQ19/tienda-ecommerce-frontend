import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import ListaProductos from './pages/ListaProductos'
import DetalleProducto from './pages/DetalleProducto'
import Carrito from './pages/Carrito'
import Pago from './pages/Pago'
import PagoQR from './pages/PagoQR'
import Login from './pages/Login'
import Registro from './pages/Registro'
// Admin panel removed
import Factura from './pages/Factura'
import PefilUsuario from './pages/PefilUsuario'
import MisPedidos from './pages/MisPedidos'
import DetallePedido from './pages/DetallePedido'
import { AuthProvider } from './auth/AuthContext'
import './styles.css'

// Small helper to print fatal errors directly into #root so a blank page shows useful info
function showFatalError(title, err){
  // Avoid direct DOM manipulation (conflicts with React/HMR). Log and alert.
  console.error(title, err)
  try{ alert(`${title}: ${err && (err.message || err.stack || String(err))}`) }catch(e){/*ignore*/}
}

// global handlers so runtime exceptions aren't silently swallowed and the page stays blank
window.addEventListener('error', (ev)=>{
  console.error('Global error captured', ev.error || ev.message, ev)
  // Show a non-intrusive alert so developers can see the error during dev
  showFatalError('Runtime error', ev.error || ev.message || ev)
})
window.addEventListener('unhandledrejection', (ev)=>{
  console.error('Unhandled rejection', ev.reason)
  showFatalError('Unhandled promise rejection', ev.reason)
})

// Importamos el nuevo AuthLayout para las páginas de autenticación
import AuthLayout from './AuthLayout'

try{
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas de autenticación con un diseño simplificado */}
            <Route path="/" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="registro" element={<Registro />} />
            </Route>
            
            {/* Rutas principales con el diseño completo */}
            <Route path="/" element={<App />}>
              <Route index element={<ListaProductos />} />
              <Route path="producto/:id" element={<DetalleProducto />} />
              <Route path="carrito" element={<Carrito />} />
              <Route path="pago" element={<Pago />} />
              <Route path="pago-qr" element={<PagoQR />} />
              <Route path="perfil" element={<PefilUsuario />} />
              {/* Admin panel removed */}
              <Route path="pedidos" element={<MisPedidos />} />
              <Route path="pedidos/:id" element={<DetallePedido />} />
              <Route path="factura" element={<Factura />} />
              <Route path="factura/:id" element={<Factura />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  )
}catch(e){
  console.error('Initial render failed', e)
  showFatalError('Initial render exception', e)
}

// --- Diagnostic helper: visit http://localhost:5173/?diag=1 to see a minimal health page
try{
  const params = new URLSearchParams(window.location.search)
  if(params.get('diag') === '1'){
    console.log('DIAGNOSTIC PAGE - React mount OK. localStorage user:', localStorage.getItem('user') || 'null')
    // keep React render intact; dev can open console to see diagnostics
  }
}catch(e){
  const root = document.getElementById('root')
  if(root){
    root.innerHTML = '<div style="padding:20px;color:#900;background:#fff0f0">Error inicializando diagnóstico: '+String(e)+'</div>'
  }
  console.error('Diagnostic init error', e)
}
