// frontend/src/components/layout/AppSider.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined, // Untuk New Order/POS
  ShoppingOutlined,    // Untuk Products
  SolutionOutlined,    // Untuk Order List
  BarChartOutlined,    // Untuk Reports
  UserOutlined,        // Untuk Users
  AppstoreOutlined,    // Untuk Categories
  InboxOutlined,       // Untuk Stock Management
} from '@ant-design/icons';

const { Sider } = Layout;

const getSelectedKeys = (pathname) => {
  if (pathname.startsWith('/products')) return ['/products'];
  if (pathname === '/orders/new') return ['/orders/new']; // Lebih spesifik untuk New Order
  if (pathname.startsWith('/orders')) return ['/orders'];   // Untuk Order List
  if (pathname.startsWith('/reports')) return ['/reports'];
  if (pathname.startsWith('/users')) return ['/users'];
  if (pathname.startsWith('/categories')) return ['/categories'];
  if (pathname.startsWith('/stock')) return ['/stock'];
  return [pathname]; // Default
};

const AppSider = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const selectedKeys = getSelectedKeys(location.pathname);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: '/orders/new', // Path untuk membuat order baru
      icon: <ShoppingCartOutlined />,
      label: <Link to="/orders/new">New Order (POS)</Link>,
    },
    {
      key: '/orders', // Path untuk daftar order
      icon: <SolutionOutlined />,
      label: <Link to="/orders">Order List</Link>,
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: <Link to="/products">Products</Link>,
    },
    {
      key: '/categories',
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">Categories</Link>,
    },
    {
      key: '/stock',
      icon: <InboxOutlined />,
      label: <Link to="/stock">Stock Management</Link>,
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: <Link to="/reports">Reports</Link>,
    },
    {
      key: '/users', // Asumsi hanya admin yang bisa lihat ini (dikontrol di UsersPage)
      icon: <UserOutlined />,
      label: <Link to="/users">Users</Link>,
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      collapsedWidth="80"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', textAlign: 'center', color: 'white', lineHeight: '32px', overflow: 'hidden' }}>
        {collapsed ? 'POS' : 'POS Application'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        // defaultOpenKeys bisa diatur jika ada submenu
        items={menuItems}
      />
    </Sider>
  );
};

export default AppSider;