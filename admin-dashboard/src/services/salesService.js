import api from '../config/api';

export const salesService = {
  getSales: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  createAdminSale: async (data) => {
    const response = await api.post('/sales/admin', data);
    return response.data;
  },

  updateAdminSale: async (id, data) => {
    const response = await api.put(`/sales/admin/${id}`, data);
    return response.data;
  },

  getMonthlySalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales-monthly', { params });
    return response.data;
  },
};
