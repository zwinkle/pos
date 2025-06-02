// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'; // useEffect ditambahkan
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext.jsx';
// import styles from './LoginPage.module.css'; // Jika Anda menggunakan CSS Modules
import PageTitle from '../components/common/PageTitle.jsx'; // Menggunakan PageTitle

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading: authLoading } = useAuth(); // Ambil authLoading
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onFinish = async (values) => {
    setFormLoading(true);
    setError('');
    try {
      await login({ username: values.username, password: values.password });
      // Navigasi akan dihandle oleh useEffect setelah isAuthenticated true
    } catch (err) {
      setError(err.detail || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setFormLoading(false);
    }
  };

  // Jika context auth masih loading, jangan render form dulu untuk menghindari redirect cepat
  if (authLoading && !isAuthenticated && localStorage.getItem('accessToken')) {
    return (
     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
       <Spin size="large" tip="Checking session...">
         {/* Tambahkan children minimal untuk Spin jika masih ada warning tip */}
         <div style={{ padding: '50px', minWidth: '100px', minHeight: '100px' }} />
       </Spin>
     </div>
   );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5'}}>
      <Card style={{width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}}>
        <div style={{textAlign: 'center', marginBottom: '24px'}}>
          {/* <img src="/path-to-your-logo.png" alt="App Logo" style={{height: '60px', marginBottom: '10px'}} /> */}
          <PageTitle title="POS Application Login" level={2} style={{marginBottom: 10}}/>
        </div>
        {error && <Alert message={error} type="error" showIcon style={{marginBottom: '24px'}}/>}
        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={formLoading} style={{width: '100%'}} size="large">
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;