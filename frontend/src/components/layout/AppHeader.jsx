// frontend/src/components/layout/AppHeader.jsx
import React from 'react';
import { Layout, Avatar, Dropdown, Menu, Space, Typography, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  // SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = ({ collapsed, onToggleSider }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Arahkan ke halaman login setelah logout
  };

  const menuItems = [
    // {
    //   key: 'profile',
    //   icon: <UserOutlined />,
    //   label: 'Profile',
    //   onClick: () => navigate('/profile'), // Arahkan ke halaman profile jika ada
    // },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: 'Settings',
    //   onClick: () => navigate('/settings'), // Arahkan ke halaman settings jika ada
    // },
    // Menu.Divider ? <Menu.Divider key="divider" /> : null, // Pengecekan karena Menu.Divider bisa null
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ].filter(item => item !== null); // Filter out null items (jika Menu.Divider null)

  return (
    <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
      <Tooltip title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: 'trigger',
          onClick: onToggleSider,
          style: { fontSize: '18px', cursor: 'pointer' },
        })}
      </Tooltip>

      <Space align="center">
        <Text strong style={{ marginRight: 8 }}>
          {user ? `Hi, ${user.full_name || user.username}` : 'Guest'}
        </Text>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow trigger={['click']}>
          <Avatar style={{ backgroundColor: '#87d068', cursor: 'pointer' }} icon={<UserOutlined />} />
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;