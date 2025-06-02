// frontend/src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { useAuth } from './contexts/AuthContext.jsx';

// Import Halaman Login dan Register
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Import komponen Layout
import AppHeader from './components/layout/AppHeader.jsx';
import AppSider from './components/layout/AppSider.jsx';

// Import definisi rute untuk konten di dalam MainLayout
import AppContentRoutes from './routes/AppRoutes.jsx';

const { Content, Footer } = Layout;

// 1. Komponen MainLayout didefinisikan di dalam App.jsx
// Outlet di dalam Content akan menjadi tempat AppContentRoutes dirender.
const MainLayoutComponent = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSider collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout>
        <AppHeader collapsed={collapsed} onToggleSider={() => setCollapsed(!collapsed)} />
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 64px - 48px - 69px)' /* Sesuaikan jika tinggi header/footer berubah */ }}>
            {/* Outlet ini akan merender elemen dari child Route, yaitu AppContentRoutes */}
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', padding: '12px 24px' }}>
          POS App ©{new Date().getFullYear()} - Built with Ant Design & React
        </Footer>
      </Layout>
    </Layout>
  );
};

// 2. Komponen ProtectedRoute untuk menjaga rute yang memerlukan autentikasi
// Children di sini akan menjadi <MainLayoutComponent /> yang membungkus <Outlet /> untuk AppContentRoutes
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Authenticating...">
          <div style={{ padding: '50px', minWidth: '100px', minHeight: '100px' }} />
        </Spin>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect ke halaman login, simpan lokasi asal agar bisa kembali setelah login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children; // Jika terautentikasi, render children (yaitu MainLayoutComponent)
};

// 3. Komponen App utama yang mengatur struktur routing level atas
function App() {
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Menampilkan spinner loading global saat AuthContext sedang memvalidasi token
  // terutama saat aplikasi pertama kali dibuka (cold start dengan token yang ada)
  if (authLoading && !isAuthenticated && localStorage.getItem('accessToken')) {
    return (
      <Spin size="large" tip="Loading...">
        <div style={{ padding: '50px', minWidth: '100px', minHeight: '100px' }} />
      </Spin>
    );
  }

  return (
    <Routes>
      {/* Rute untuk halaman Login */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rute untuk semua path lain yang terproteksi (misal: /dashboard, /products, dll.) */}
      {/* Semua path yang cocok dengan "/*" akan melewati ProtectedRoute */}
      <Route
        path="/*" // Menangkap semua path seperti /dashboard, /products, /settings, dll.
        element={
          <ProtectedRoute>
            <MainLayoutComponent /> {/* MainLayout akan dirender jika user terautentikasi */}
          </ProtectedRoute>
        }
      >
        {/* Rute-rute ini adalah anak dari "/*" dan akan dirender di dalam <Outlet />
            milik MainLayoutComponent. Path di sini relatif terhadap "/*".
            Karena AppContentRoutes sudah memiliki <Routes> sendiri, kita bisa
            menggunakannya sebagai elemen untuk path="*" di dalam nested route ini.
        */}
        <Route path="*" element={<AppContentRoutes />} />
      </Route>
    </Routes>
  );
}

export default App;