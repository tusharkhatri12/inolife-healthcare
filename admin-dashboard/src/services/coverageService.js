import api from '../config/api';

export const coverageService = {
  // Get individual coverage plans (for table view)
  getCoveragePlans: async (params = {}) => {
    const response = await api.get('/coverage/plans', { params });
    return response.data;
  },

  // Get coverage summary (aggregated)
  getCoverageSummary: async (params = {}) => {
    const response = await api.get('/coverage/summary', { params });
    return response.data;
  },

  // Get admin coverage summary (doctor + MR rows)
  getAdminCoverageSummary: async (params = {}) => {
    const response = await api.get('/coverage/admin/summary', { params });
    return response.data;
  },

  // Create coverage plan
  createCoveragePlan: async (data) => {
    const response = await api.post('/coverage/create', data);
    return response.data;
  },

  // Update coverage plan
  updateCoveragePlan: async (id, data) => {
    const response = await api.put(`/coverage/${id}`, data);
    return response.data;
  },

  // Get MRs for filter dropdown
  getMRs: async () => {
    const response = await api.get('/users', { params: { role: 'MR', isActive: true } });
    return response.data;
  },

  // Create coverage plan (admin endpoint)
  createAdminCoveragePlan: async (data) => {
    const response = await api.post('/coverage/admin/create', data);
    return response.data;
  },
};
