import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const productService = {
  /**
   * Get all products
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  /**
   * Get single product by ID
   * @param {string} productId
   * @returns {Promise}
   */
  getProduct: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },
};
