import api from '../config/api';

export const userService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  listMRs: async () => {
    const response = await api.get('/users/mr');
    return response.data;
  },

  createMR: async (data) => {
    const response = await api.post('/users/mr', data);
    return response.data;
  },

  deactivateMR: async (id) => {
    const response = await api.patch(`/users/mr/${id}/deactivate`);
    return response.data;
  },

  resetMRPassword: async (id, newPassword) => {
    const response = await api.post(`/users/mr/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  },
};
