// frontend/src/main.jsx
import '@ant-design/v5-patch-for-react-19'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx'; // Kita akan buat ini
import 'antd/dist/reset.css'; // CSS Reset global untuk Ant Design v5+
import './index.css'; // CSS global kustom Anda

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);