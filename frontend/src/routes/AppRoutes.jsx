// frontend/src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Pages yang akan dirender di dalam MainLayout
import DashboardPage from '../pages/DashboardPage.jsx';
import ProductsPage from '../pages/ProductsPage.jsx';
import ProductDetailPage from '../pages/ProductDetailPage.jsx';
import OrdersPage from '../pages/OrdersPage.jsx';
import NewOrderPage from '../pages/NewOrderPage.jsx';
import OrderDetailPage from '../pages/OrderDetailPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import UsersPage from '../pages/UsersPage.jsx';
import CategoriesPage from '../pages/CategoriesPage.jsx';
import StockManagementPage from '../pages/StockManagementPage.jsx';
// Tambahkan impor halaman lain yang relevan di sini
// import SettingsPage from '../pages/SettingsPage.jsx';

const AppContentRoutes = () => {
  return (
    <Routes>
      {/* Rute default untuk path dasar di dalam area terautentikasi */}
      {/* Misalnya, jika user mengakses "/", akan diarahkan ke "/dashboard" */}
      <Route index element={<Navigate to="dashboard" replace />} />

      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:productId" element={<ProductDetailPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="orders/new" element={<NewOrderPage />} />
      <Route path="orders/:orderId" element={<OrderDetailPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="stock" element={<StockManagementPage />} />
      {/* Tambahkan rute lain untuk halaman di dalam MainLayout di sini */}
      {/* <Route path="settings" element={<SettingsPage />} /> */}

      {/* Fallback untuk path yang tidak dikenal di dalam area terautentikasi */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AppContentRoutes;