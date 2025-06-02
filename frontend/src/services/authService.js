// frontend/src/services/authService.js
import apiClient from './apiClient';

const authService = {
  login: async (credentials) => {
    // Backend mengharapkan form data untuk login (OAuth2PasswordRequestForm)
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if (response.data && response.data.access_token) {
        localStorage.setItem('accessToken', response.data.access_token);
        // Anda mungkin ingin menyimpan detail user atau role juga
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/users/me');
      return response.data;
    } catch (error) {
      // Error akan ditangani oleh interceptor global atau bisa ditangani di sini juga
      // console.error('Get current user error:', error.response?.data || error.message);
      // throw error.response?.data || error;
      // Jika interceptor sudah menangani 401, mungkin tidak perlu throw lagi di sini,
      // tergantung bagaimana Anda ingin komponen menangani error.
      if (error.response && error.response.status !== 401) { // Jangan throw error 401 jika sudah ditangani interceptor
        console.error('Get current user error:', error.response?.data || error.message);
        throw error.response?.data || error;
      }
      // Jika 401, interceptor akan redirect, return null atau biarkan errornya (tergantung implementasi interceptor)
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    // Tambahkan logika lain yang diperlukan saat logout, misalnya membersihkan state user
  },

  // Anda bisa menambahkan fungsi untuk mendapatkan/memperbarui/menghapus user lain di sini
  // jika endpointnya ada di /users dan bukan /auth
  // Contoh:
  // getUsers: async (params) => {
  //   try {
  //     const response = await apiClient.get('/users', { params });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error fetching users:', error.response?.data || error.message);
  //     throw error.response?.data || error;
  //   }
  // },
};

export default authService;