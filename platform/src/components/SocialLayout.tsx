import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

export const SocialLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};
