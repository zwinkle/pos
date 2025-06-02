// frontend/src/services/userService.js
import apiClient from './apiClient';

const userService = {
  getAllUsers: async (params) => {
    // params: skip, limit
    try {
      const response = await apiClient.get('/users', { params });
      return response.data; // Harapannya ini PaginatedResponse
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getUserById: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Jika admin bisa membuat user langsung (selain register publik)
  // Anda perlu endpoint POST /api/v1/users/ di backend juga
  // createUserByAdmin: async (userData) => {
  //   try {
  //     const response = await apiClient.post('/users', userData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error creating user by admin:', error.response?.data || error.message);
  //     throw error.response?.data || error;
  //   }
  // },

  updateUser: async (userId, userData) => {
    // userData adalah skema UserUpdate
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data; // Backend mengembalikan 204, jadi ini mungkin undefined
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default userService;