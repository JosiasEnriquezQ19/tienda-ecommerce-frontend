import React from 'react';
import { Outlet } from 'react-router-dom';
import SimpleHeader from './components/SimpleHeader';
import './styles.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <SimpleHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
