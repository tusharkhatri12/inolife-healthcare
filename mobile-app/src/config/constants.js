// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  DOCTORS: '/doctors',
  VISITS: '/visits',
  LOCATION_LOGS: '/location-logs',
  COVERAGE: '/coverage',
  STOCKISTS: '/stockists',
  SALES: '/sales',
  SCHEMES: '/schemes',
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  PENDING_VISITS: 'pending_visits',
  PENDING_LOCATIONS: 'pending_locations',
};

// Location Tracking
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
  ACCURACY: 6, // High accuracy
  DISTANCE_INTERVAL: 50, // Minimum distance in meters to update
};

// Offline Sync
export const SYNC_CONFIG = {
  RETRY_INTERVAL: 30 * 1000, // 30 seconds
  MAX_RETRIES: 3,
};
