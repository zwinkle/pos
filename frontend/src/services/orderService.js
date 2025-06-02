// frontend/src/services/orderService.js
import apiClient from './apiClient';

const orderService = {
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getAllOrders: async (params) => {
    // params: skip, limit, userId, startDate, endDate, status
    try {
      const response = await apiClient.get('/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  updateOrderStatus: async (orderId, statusData) => {
    // statusData diharapkan berbentuk { order_status: "new_status" }
    try {
      const response = await apiClient.patch(`/orders/${orderId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error(`Error updating status for order ${orderId}:`, error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default orderService;