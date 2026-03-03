import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo-ecommerce.png';
import './SimpleHeader.css';

export default function SimpleHeader() {
  return (
    <header className="simple-header">
      <div className="simple-header-container">
        <Link to="/" className="simple-logo">
          <img src={logoImg} alt="MiTienda+" style={{ height: '30px', width: 'auto' }} />
        </Link>
      </div>
    </header>
  );
}
