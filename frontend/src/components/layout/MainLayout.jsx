// frontend/src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './AppHeader.jsx';
import AppSider from './AppSider.jsx';

const { Content, Footer } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false); // State untuk Sider collapse

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSider collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AppHeader collapsed={collapsed} onToggleSider={() => setCollapsed(!collapsed)} />
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 64px - 48px - 69px)' /* Sesuaikan dengan tinggi header, margin, footer */ }}>
            <Outlet /> {/* Konten halaman akan dirender di sini */}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', padding: '12px 24px' }}>
          POS App ©{new Date().getFullYear()} - Built with Ant Design & React
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;