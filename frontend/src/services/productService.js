// frontend/src/services/productService.js
import apiClient from './apiClient';

const productService = {
  getAllProducts: async (params) => {
    // params bisa berisi: skip, limit, search, category_id, only_active
    try {
      const response = await apiClient.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getProductById: async (productId) => {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/products/', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateProduct: async (productId, productData) => {
    try {
      const response = await apiClient.put(`/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  deleteProduct: async (productId, permanent_delete = false) => {
    try {
      const response = await apiClient.delete(`/products/${productId}`, {
        params: { permanent_delete }
      });
      return response.data; // Biasanya 204 No Content, jadi respons mungkin kosong
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  suggestProducts: async (query, limit = 5) => {
    try {
      const response = await apiClient.get('/products/suggest', {
        params: { query, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error suggesting products:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default productService;