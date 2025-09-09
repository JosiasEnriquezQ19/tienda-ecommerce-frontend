import React from 'react';
import { Link } from 'react-router-dom';
import './SimpleHeader.css';

export default function SimpleHeader() {
  return (
    <header className="simple-header">
      <div className="simple-header-container">
        <Link to="/" className="simple-logo">
          <span className="ae-logo-main">Tienda</span>
          <span className="ae-logo-plus">+</span>
        </Link>
      </div>
    </header>
  );
}
