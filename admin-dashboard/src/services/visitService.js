import api from '../config/api';

export const visitService = {
  getVisits: async (params = {}) => {
    const response = await api.get('/visits', { params });
    return response.data;
  },
};
