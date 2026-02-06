import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const salesService = {
  createSale: async (saleData) => {
    const response = await api.post(API_ENDPOINTS.SALES, saleData);
    return response.data;
  },

  getSales: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.SALES, { params });
    return response.data;
  },
};
