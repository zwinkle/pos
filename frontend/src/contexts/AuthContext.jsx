// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient'; // Untuk mengatur header default jika perlu (meskipun interceptor sudah ada)

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Untuk loading state awal saat cek token

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Sudah dihandle interceptor
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token mungkin valid tapi user tidak ditemukan, atau error lain selain 401
          localStorage.removeItem('accessToken');
          // delete apiClient.defaults.headers.common['Authorization']; // Sudah dihandle interceptor
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // Error (termasuk 401) akan ditangani oleh interceptor atau di sini
        localStorage.removeItem('accessToken');
        // delete apiClient.defaults.headers.common['Authorization']; // Sudah dihandle interceptor
        setIsAuthenticated(false);
        setUser(null);
        console.error("Failed to load user from token", error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      // Token sudah disimpan di localStorage oleh authService.login
      // Interceptor di api.js akan otomatis menggunakan token baru untuk request berikutnya
      await loadUserFromToken(); // Muat ulang data user setelah login
      setLoading(false);
      return data; // Kembalikan data (termasuk token) jika komponen membutuhkannya
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      // Mungkin tidak otomatis login setelah register, tergantung flow aplikasi
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    authService.logout(); // Menghapus token dari localStorage
    // delete apiClient.defaults.headers.common['Authorization']; // Sudah dihandle interceptor
    setUser(null);
    setIsAuthenticated(false);
    // Redirect ke login bisa dilakukan di komponen atau ProtectedRoute
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    reloadUser: loadUserFromToken // Fungsi untuk memuat ulang user jika diperlukan
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};