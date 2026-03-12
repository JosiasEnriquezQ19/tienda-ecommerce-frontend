import React, { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CartProvider } from './carrito/ContextoCarrito';
import { SearchProvider } from './search/SearchContext';
import CompCabecera from './components/CompCabecera';
import ChatLauncher from './components/ChatLauncher';
import logoImg from './assets/logo-ecommerce.png';
import API_BASE from './api';


export default function App() {
  
  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const res = await fetch(`${API_BASE}/Configuraciones`);
        if (res.ok) {
          const data = await res.json();
          let title = '';
          let desc = '';
          let keywords = '';
          
          data.forEach(item => {
            if (item.clave === 'SEO_TITLE') title = item.valor;
            if (item.clave === 'SEO_DESCRIPTION') desc = item.valor;
            if (item.clave === 'SEO_KEYWORDS') keywords = item.valor;
          });

          if (title) document.title = title;
          
          if (desc) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.name = 'description';
              document.head.appendChild(metaDesc);
            }
            metaDesc.content = desc;
          }

          if (keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
              metaKeywords = document.createElement('meta');
              metaKeywords.name = 'keywords';
              document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = keywords;
          }
        }
      } catch (err) {
        console.error('Error fetching SEO config', err);
      }
    };
    
    fetchSEO();
  }, []);

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
              <div className="ae-footer-grid">
                {/* Brand Column */}
                <div className="ae-footer-col ae-footer-brand-col">
                  <img src={logoImg} alt="MiTienda+" className="ae-footer-logo" />
                  <p className="ae-footer-desc">
                    Tu destino de compras en linea. Productos de calidad con envio a todo el pais.
                  </p>
                  <div className="ae-footer-socials">
                    <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                    </a>
                    <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86-4.43V7.56a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.19 0z" /></svg>
                    </a>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="ae-footer-col">
                  <h4 className="ae-footer-heading">Tienda</h4>
                  <ul className="ae-footer-list">
                    <li><Link to="/">Todos los productos</Link></li>
                    <li><Link to="/mas-vendidos">Mas vendidos</Link></li>
                    <li><Link to="/mejor-valorados">Mejor valorados</Link></li>
                    <li><Link to="/?category=Tecnologia">Tecnologia</Link></li>
                    <li><Link to="/?category=Celulares">Celulares</Link></li>
                  </ul>
                </div>

                {/* Customer Service */}
                <div className="ae-footer-col">
                  <h4 className="ae-footer-heading">Ayuda</h4>
                  <ul className="ae-footer-list">
                    <li><Link to="/contacto">Centro de ayuda</Link></li>
                    <li><Link to="/terminos">Terminos y condiciones</Link></li>
                    <li><Link to="/privacidad">Politica de privacidad</Link></li>
                    <li><Link to="/pedidos">Seguir mi pedido</Link></li>
                  </ul>
                </div>

                {/* Contact */}
                <div className="ae-footer-col">
                  <h4 className="ae-footer-heading">Contacto</h4>
                  <ul className="ae-footer-list ae-footer-contact">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      Lima, Peru
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      soporte@mitiendaplus.com
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                      +51 999 999 999
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="ae-footer-bottom">
                <p>© {new Date().getFullYear()} MiTienda+ — Todos los derechos reservados.</p>
              </div>
            </div>
          </footer>
        </div>
      </SearchProvider>
    </CartProvider>
  );
}