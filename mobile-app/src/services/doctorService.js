import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const doctorService = {
  /**
   * Get all assigned doctors for current MR
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getDoctors: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.DOCTORS, { params });
    return response.data;
  },

  /**
   * Get single doctor by ID
   * @param {string} doctorId
   * @returns {Promise}
   */
  getDoctor: async (doctorId) => {
    const response = await api.get(`${API_ENDPOINTS.DOCTORS}/${doctorId}`);
    return response.data;
  },

  /**
   * Create doctor (MR adds from Visit page: isApproved=false, assigned to self)
   * @param {Object} doctorData - { name, specialization, clinicName?, area?, city?, phone? }
   * @returns {Promise}
   */
  createDoctor: async (doctorData) => {
    const response = await api.post(API_ENDPOINTS.DOCTORS, doctorData);
    return response.data;
  },
};
