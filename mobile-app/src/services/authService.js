import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const authService = {
  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise}
   */
  login: async (email, password) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Get current user
   * @returns {Promise}
   */
  getCurrentUser: async () => {
    const response = await api.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Logout (client-side only)
   */
  logout: async () => {
    // Token removal handled by AuthContext
    return Promise.resolve();
  },
};
