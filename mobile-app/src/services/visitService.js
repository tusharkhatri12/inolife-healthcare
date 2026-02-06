import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const visitService = {
  /**
   * Get all visits
   * @param {Object} params - Query parameters (startDate, endDate, etc.)
   * @returns {Promise}
   */
  getVisits: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.VISITS, { params });
    return response.data;
  },

  /**
   * Get single visit by ID
   * @param {string} visitId
   * @returns {Promise}
   */
  getVisit: async (visitId) => {
    const response = await api.get(`${API_ENDPOINTS.VISITS}/${visitId}`);
    return response.data;
  },

  /**
   * Create a new visit
   * @param {Object} visitData
   * @returns {Promise}
   */
  createVisit: async (visitData) => {
    const response = await api.post(API_ENDPOINTS.VISITS, visitData);
    return response.data;
  },

  /**
   * Update visit
   * @param {string} visitId
   * @param {Object} visitData
   * @returns {Promise}
   */
  updateVisit: async (visitId, visitData) => {
    const response = await api.put(`${API_ENDPOINTS.VISITS}/${visitId}`, visitData);
    return response.data;
  },

  /**
   * Delete visit
   * @param {string} visitId
   * @returns {Promise}
   */
  deleteVisit: async (visitId) => {
    const response = await api.delete(`${API_ENDPOINTS.VISITS}/${visitId}`);
    return response.data;
  },
};
