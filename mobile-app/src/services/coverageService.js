import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const coverageService = {
  /**
   * Get MR coverage summary (doctor-wise) for a given month
   * Backend: GET /coverage/my-coverage?month=YYYY-MM&groupBy=doctor
   * Uses simpler endpoint that doesn't require passing MR ID
   *
   * @param {Object} params
   * @param {string} params.mrId - MR user ID (optional, not used in new endpoint)
   * @param {string} params.month - Month in YYYY-MM format
   * @returns {Promise}
   */
  getMrCoverage: async ({ mrId, month }) => {
    // Use simpler endpoint that auto-detects MR from JWT token
    const response = await api.get(`${API_ENDPOINTS.COVERAGE}/my-coverage`, {
      params: {
        month,
        groupBy: 'doctor',
      },
    });
    return response.data;
  },
};

