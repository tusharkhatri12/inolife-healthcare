import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const stockistService = {
  getStockists: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.STOCKISTS, { params });
    return response.data;
  },
};
