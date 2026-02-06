import api from '../config/api';

export const reportService = {
  getMRPerformance: async (params = {}) => {
    const response = await api.get('/reports/mr-performance', { params });
    return response.data;
  },

  getDoctorAnalytics: async (params = {}) => {
    const response = await api.get('/reports/doctor-analytics', { params });
    return response.data;
  },

  getProductPushSales: async (params = {}) => {
    const response = await api.get('/reports/product-push-sales', { params });
    return response.data;
  },

  getMRLeaderboard: async (params = {}) => {
    const response = await api.get('/reports/mr-leaderboard', { params });
    return response.data;
  },

  getTodaysFieldActivity: async () => {
    const response = await api.get('/reports/todays-field-activity');
    return response.data;
  },

  getTodaysVisitSummary: async () => {
    const response = await api.get('/reports/todays-visit-summary');
    return response.data;
  },
};
