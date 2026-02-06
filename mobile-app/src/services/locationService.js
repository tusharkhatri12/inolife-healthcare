import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const locationService = {
  /**
   * Create location log
   * @param {Object} locationData
   * @returns {Promise}
   */
  createLocationLog: async (locationData) => {
    const response = await api.post(API_ENDPOINTS.LOCATION_LOGS, locationData);
    return response.data;
  },

  /**
   * Get location logs
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getLocationLogs: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.LOCATION_LOGS, { params });
    return response.data;
  },

  /**
   * Get current location
   * @returns {Promise}
   */
  getCurrentLocation: async () => {
    const response = await api.get(`${API_ENDPOINTS.LOCATION_LOGS}/current`);
    return response.data;
  },
};
