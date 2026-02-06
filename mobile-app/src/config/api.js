import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API base URL (deployed on Render)
// For local backend: use 'http://YOUR_IP:3000/api' or 'http://localhost:3000/api'
const API_BASE_URL = 'https://inolife-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // Navigation will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
