import React from 'react';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MainLayoutProps } from './MainLayout.types';

const MainLayout: React.FC<MainLayoutProps> = ({ children, user, onLogout }) => {
  return (
    <AppLayout
      header={user ? <Header user={user} onLogout={onLogout} /> : undefined}
      footer={<Footer user={user} />}
    >
      {children}
    </AppLayout>
  );
};

export default MainLayout;

