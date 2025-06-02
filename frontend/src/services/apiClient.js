// frontend/src/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token otentikasi ke setiap request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // atau dari mana pun Anda menyimpan token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// (Opsional) Interceptor untuk menangani error global, misalnya token kedaluwarsa
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthenticated error, misalnya redirect ke login
      // localStorage.removeItem('accessToken');
      // window.location.href = '/login'; // atau menggunakan React Router history
      console.error('Unauthorized, redirecting to login...');
    }
    return Promise.reject(error);
  }
);

export default apiClient;