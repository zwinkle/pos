// frontend/src/services/stockService.js
import apiClient from './apiClient';

const stockService = {
  addStockIn: async (stockInData) => {
    // stockInData: { product_id, quantity, remarks, purchase_price (optional) }
    try {
      const response = await apiClient.post('/stock/in', stockInData);
      return response.data;
    } catch (error) {
      console.error('Error adding stock in:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  adjustStock: async (adjustmentData) => {
    // adjustmentData: { product_id, new_quantity, remarks }
    try {
      const response = await apiClient.post('/stock/adjustment', adjustmentData);
      return response.data;
    } catch (error) {
      console.error('Error adjusting stock:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getInventoryLogForProduct: async (productId, params) => {
    // params: skip, limit
    try {
      const response = await apiClient.get(`/stock/log/${productId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory log for product ${productId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  }
};

export default stockService;