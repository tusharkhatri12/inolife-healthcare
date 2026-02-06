import api from '../config/api';

export const locationService = {
  /**
   * Get current location for a specific MR
   * @param {string} mrId - MR ID (optional, defaults to current user)
   * @returns {Promise}
   */
  getCurrentLocation: async (mrId) => {
    const url = mrId ? `/location-logs/current/${mrId}` : '/location-logs/current';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get all current MR locations (for tracking map)
   * @returns {Promise}
   */
  getAllCurrentLocations: async () => {
    const response = await api.get('/location-logs/current-all');
    return response.data;
  },

  /**
   * Get location logs with filters
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getLocationLogs: async (params = {}) => {
    const response = await api.get('/location-logs', { params });
    return response.data;
  },
};
