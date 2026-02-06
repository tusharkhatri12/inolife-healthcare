import api from '../config/api';

export const importService = {
  uploadMargERP: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import/marg-erp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadProductsExcel: async (file, updateExisting = false, clearExisting = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (updateExisting) formData.append('updateExisting', 'true');
    if (clearExisting) formData.append('clearExisting', 'true');
    const response = await api.post('/import/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadDoctorsExcel: async (file, updateExisting = false) => {
    const formData = new FormData();
    formData.append('file', file);
    if (updateExisting) formData.append('updateExisting', 'true');
    const response = await api.post('/import/doctors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
