// frontend/src/services/reportService.js
import apiClient from './apiClient';

const reportService = {
  getSalesReport: async (params) => {
    // params: start_date, end_date, group_by
    try {
      const response = await apiClient.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales report:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getLowStockReport: async () => {
    try {
      const response = await apiClient.get('/reports/stock-summary/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock report:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getDashboardSummary: async () => {
    try {
      const response = await apiClient.get('/reports/dashboard-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default reportService;