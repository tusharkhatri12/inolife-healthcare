import api from '../config/api';

export const stockistService = {
  getStockists: async (params = {}) => {
    const response = await api.get('/stockists', { params });
    return response.data;
  },

  getStockist: async (id) => {
    const response = await api.get(`/stockists/${id}`);
    return response.data;
  },

  createStockist: async (data) => {
    const response = await api.post('/stockists', data);
    return response.data;
  },

  updateStockist: async (id, data) => {
    const response = await api.put(`/stockists/${id}`, data);
    return response.data;
  },

  deactivateStockist: async (id) => {
    const response = await api.patch(`/stockists/${id}/deactivate`);
    return response.data;
  },
};
