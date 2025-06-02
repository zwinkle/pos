// frontend/src/services/categoryService.js
import apiClient from './apiClient';

const categoryService = {
  getAllCategories: async (params) => {
    try {
      const response = await apiClient.get('/categories/', { params }); // Pastikan ada trailing slash jika backend redirect ke sana
      // Jika backend mengembalikan PaginatedResponse { total: N, data: [...] }
      return response.data; // Ini akan menjadi objek { total: N, data: [...] }
    } catch (error) {
      console.error('Error fetching categories:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getCategoryById: async (categoryId) => {
    try {
      const response = await apiClient.get(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await apiClient.post('/categories/', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const response = await apiClient.delete(`/categories/${categoryId}`);
      return response.data; // Biasanya 204 No Content
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default categoryService;