import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CartProvider } from './carrito/ContextoCarrito';
import { SearchProvider } from './search/SearchContext';
import CompCabecera from './components/CompCabecera';
import ChatLauncher from './components/ChatLauncher';

export default function App() {
  return (
    <CartProvider>
      <SearchProvider>
      <div className="ae-app">
        <CompCabecera />
  <ChatLauncher />
        <main className="ae-main-content">
          <Outlet />
        </main>
        <footer className="ae-footer">
          <div className="ae-container">
            <div className="ae-footer-content">
              <p>© 2023 Tienda+ - Compra Global</p>
              <div className="ae-footer-links">
                <Link to="/terminos">Términos y condiciones</Link>
                <Link to="/privacidad">Política de privacidad</Link>
                <Link to="/contacto">Contacto</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
      </SearchProvider>
    </CartProvider>
  );
}