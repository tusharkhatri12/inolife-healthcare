import api from '../config/api';

export const schemeService = {
  getSchemes: async (params = {}) => {
    const response = await api.get('/schemes', { params });
    return response.data;
  },

  getScheme: async (id) => {
    const response = await api.get(`/schemes/${id}`);
    return response.data;
  },

  createScheme: async (data) => {
    const response = await api.post('/schemes', data);
    return response.data;
  },

  updateScheme: async (id, data) => {
    const response = await api.put(`/schemes/${id}`, data);
    return response.data;
  },

  deactivateScheme: async (id) => {
    const response = await api.patch(`/schemes/${id}/deactivate`);
    return response.data;
  },
};
