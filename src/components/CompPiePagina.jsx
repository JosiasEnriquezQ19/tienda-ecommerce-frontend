import React from 'react';
import { Link } from 'react-router-dom';
import './CompPiePagina.css';

export default function CompPiePagina() {
  return (
    <footer className="ae-footer">
      <div className="ae-container">
        {/* Sección superior del footer */}
        <div className="ae-footer-top">
          <div className="ae-footer-section">
            <h4 className="ae-footer-title">Compra con confianza</h4>
            <ul className="ae-footer-links">
              <li><Link to="/proteccion-comprador">Protección al comprador</Link></li>
              <li><Link to="/devoluciones">Devoluciones y reembolsos</Link></li>
              <li><Link to="/garantias">Garantías</Link></li>
            </ul>
          </div>

          <div className="ae-footer-section">
            <h4 className="ae-footer-title">Atención al cliente</h4>
            <ul className="ae-footer-links">
              <li><Link to="/centro-ayuda">Centro de ayuda</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><Link to="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            </ul>
          </div>

          <div className="ae-footer-section">
            <h4 className="ae-footer-title">Sobre nosotros</h4>
            <ul className="ae-footer-links">
              <li><Link to="/sobre-nosotros">Sobre Tienda+</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/trabaja-con-nosotros">Trabaja con nosotros</Link></li>
            </ul>
          </div>

          <div className="ae-footer-section">
            <h4 className="ae-footer-title">Métodos de pago</h4>
            <div className="ae-payment-methods">
              <img src="https://ae01.alicdn.com/kf/Hf2a5d8c5b3e14c1e9e2a5d8c5b3e14c1e.png" alt="Visa" width="40" />
              <img src="https://ae01.alicdn.com/kf/Hd3a5d8c5b3e14c1e9e2a5d8c5b3e14c1e.png" alt="Mastercard" width="40" />
              <img src="https://ae01.alicdn.com/kf/He2a5d8c5b3e14c1e9e2a5d8c5b3e14c1e.png" alt="PayPal" width="40" />
            </div>
            <div className="ae-social-media">
              <a href="#" aria-label="Facebook"><i className="ae-icon-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="ae-icon-twitter"></i></a>
              <a href="#" aria-label="Instagram"><i className="ae-icon-instagram"></i></a>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="ae-footer-divider"></div>

        {/* Sección inferior del footer */}
        <div className="ae-footer-bottom">
          <div className="ae-copyright">
            © {new Date().getFullYear()} Tienda+. Todos los derechos reservados.
          </div>
          <div className="ae-legal-links">
            <Link to="/terminos">Términos y condiciones</Link>
            <Link to="/privacidad">Política de privacidad</Link>
            <Link to="/cookies">Política de cookies</Link>
            <Link to="/mapa-sitio">Mapa del sitio</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}