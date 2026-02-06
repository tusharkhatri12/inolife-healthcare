import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const schemeService = {
  getSchemes: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.SCHEMES, { params });
    return response.data;
  },

  createScheme: async (data) => {
    const response = await api.post(API_ENDPOINTS.SCHEMES, data);
    return response.data;
  },
};
