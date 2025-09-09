import React from 'react';
import { Outlet } from 'react-router-dom';
import SimpleHeader from './components/SimpleHeader';
import './styles.css';
import './auth-layout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <SimpleHeader />
      <main>
        <div className="auth-centered-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
