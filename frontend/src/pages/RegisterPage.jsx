// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Select, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SolutionOutlined } from '@ant-design/icons'; // MailOutlined opsional
import authService from '../services/authService';
import PageTitle from '../components/common/PageTitle.jsx';

const { Option } = Select;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    if (values.password !== values.confirm_password) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }
    try {
      const userData = {
        username: values.username,
        password: values.password,
        full_name: values.full_name,
        role: values.role || 'staff', // Default role 'staff' jika tidak dipilih
        // Jika username adalah email:
        // email: values.email,
      };
      await authService.register(userData);
      message.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.detail || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5'}}>
      <Card style={{width: 450, boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}}>
        <div style={{textAlign: 'center', marginBottom: '24px'}}>
          <PageTitle title="Register New Account" level={2} style={{marginBottom: 10}}/>
        </div>
        {error && <Alert message={error} type="error" showIcon style={{marginBottom: '24px'}}/>}
        <Form
          form={form}
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your Username!' }, {min: 3, message: 'Username must be at least 3 characters'}]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
          </Form.Item>

          <Form.Item
            name="full_name"
            label="Full Name (Optional)"
          >
            <Input prefix={<SolutionOutlined />} placeholder="Your Full Name" size="large" />
          </Form.Item>

          {/* Jika username BUKAN email, dan Anda ingin email terpisah:
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please input a valid Email!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          */}

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your Password!' }, {min: 6, message: 'Password must be at least 6 characters'}]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your Password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords that you entered do not match!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" size="large" />
          </Form.Item>

           {/* Opsi memilih role, mungkin hanya untuk admin atau skenario tertentu */}
           {/* <Form.Item name="role" label="Role" initialValue="staff">
            <Select size="large">
              <Option value="staff">Staff</Option>
              <Option value="admin">Admin</Option> // Hati-hati memberikan opsi ini ke publik
            </Select>
          </Form.Item> */}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{width: '100%'}} size="large">
              Register
            </Button>
          </Form.Item>
          <div style={{textAlign: 'center'}}>
            Already have an account? <Link to="/login">Log in here!</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;