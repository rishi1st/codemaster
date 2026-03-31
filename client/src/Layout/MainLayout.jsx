// layouts/MainLayout.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet /> {/* This is where page content will render */}
      </main>
    </div>
  );
};

export default MainLayout;