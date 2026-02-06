import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { visitService } from './visitService';
import { locationService } from './locationService';
import NetInfo from '@react-native-community/netinfo';

export const offlineService = {
  /**
   * Save visit to local storage (pending sync)
   * @param {Object} visitData
   * @returns {Promise}
   */
  savePendingVisit: async (visitData) => {
    try {
      const pendingVisits = await offlineService.getPendingVisits();
      const newVisit = {
        ...visitData,
        id: `pending_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      pendingVisits.push(newVisit);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_VISITS,
        JSON.stringify(pendingVisits)
      );
      return newVisit;
    } catch (error) {
      console.error('Error saving pending visit:', error);
      throw error;
    }
  },

  /**
   * Get all pending visits
   * @returns {Promise<Array>}
   */
  getPendingVisits: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_VISITS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending visits:', error);
      return [];
    }
  },

  /**
   * Remove pending visit after successful sync
   * @param {string} visitId
   * @returns {Promise}
   */
  removePendingVisit: async (visitId) => {
    try {
      const pendingVisits = await offlineService.getPendingVisits();
      const filtered = pendingVisits.filter((v) => v.id !== visitId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_VISITS,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Error removing pending visit:', error);
    }
  },

  /**
   * Save location log to local storage (pending sync)
   * @param {Object} locationData
   * @returns {Promise}
   */
  savePendingLocation: async (locationData) => {
    try {
      const pendingLocations = await offlineService.getPendingLocations();
      const newLocation = {
        ...locationData,
        id: `pending_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      pendingLocations.push(newLocation);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_LOCATIONS,
        JSON.stringify(pendingLocations)
      );
      return newLocation;
    } catch (error) {
      console.error('Error saving pending location:', error);
      throw error;
    }
  },

  /**
   * Get all pending location logs
   * @returns {Promise<Array>}
   */
  getPendingLocations: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_LOCATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending locations:', error);
      return [];
    }
  },

  /**
   * Remove pending location after successful sync
   * @param {string} locationId
   * @returns {Promise}
   */
  removePendingLocation: async (locationId) => {
    try {
      const pendingLocations = await offlineService.getPendingLocations();
      const filtered = pendingLocations.filter((l) => l.id !== locationId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_LOCATIONS,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Error removing pending location:', error);
    }
  },

  /**
   * Check if device is online
   * @returns {Promise<boolean>}
   */
  isOnline: async () => {
    const state = await NetInfo.fetch();
    return state.isConnected;
  },

  /**
   * Sync all pending data when online
   * @returns {Promise<Object>} Sync results
   */
  syncPendingData: async () => {
    const isConnected = await offlineService.isOnline();
    if (!isConnected) {
      return { success: false, message: 'No internet connection' };
    }

    const results = {
      visits: { success: 0, failed: 0 },
      locations: { success: 0, failed: 0 },
    };

    try {
      // Sync pending visits
      const pendingVisits = await offlineService.getPendingVisits();
      for (const visit of pendingVisits) {
        try {
          // Remove pending ID and timestamp before syncing
          const { id, timestamp, ...visitData } = visit;
          
          // Check if visit already exists (duplicate check)
          // If 409 error (duplicate), verify it exists and remove from pending
          try {
            await visitService.createVisit(visitData);
            await offlineService.removePendingVisit(id);
            results.visits.success++;
            console.log(`✓ Synced visit for doctor: ${visitData.doctorId}`);
          } catch (createError) {
            // Handle duplicate visit (409) - visit already exists on server
            if (createError.response?.status === 409) {
              const existingVisitId = createError.response?.data?.data?.existingVisitId;
              const errorMessage = createError.response?.data?.message || 'Visit already exists';
              
              if (existingVisitId) {
                console.log(`⚠ Visit already exists on server (ID: ${existingVisitId}), removing from pending: ${id}`);
                console.log(`   Message: ${errorMessage}`);
                // Visit exists on server, safe to remove from pending
                // Note: Coverage should already be updated if visit was created after coverage plan
                await offlineService.removePendingVisit(id);
                results.visits.success++; // Count as success since visit exists
              } else {
                // 409 but no existing visit ID - might be a different issue
                console.warn(`⚠ 409 error but no existing visit ID found for pending visit: ${id}`);
                console.warn(`   Message: ${errorMessage}`);
                // Still remove from pending to avoid infinite retry loop
                await offlineService.removePendingVisit(id);
                results.visits.success++;
              }
            } else {
              // Other errors - keep in pending list for retry
              const errorMsg = createError.response?.data?.message || createError.message;
              const statusCode = createError.response?.status;
              console.error(`✗ Error syncing visit ${id} (Status: ${statusCode}):`, errorMsg);
              
              // Only keep in pending for retryable errors (4xx except 409, 5xx)
              if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 409) {
                // Client errors (except 409) - might be validation issues, keep for manual review
                results.visits.failed++;
              } else if (statusCode && statusCode >= 500) {
                // Server errors - retry later
                results.visits.failed++;
              } else {
                // Network errors or unknown - retry later
                results.visits.failed++;
              }
            }
          }
        } catch (error) {
          console.error('Error processing pending visit:', error);
          results.visits.failed++;
        }
      }

      // Sync pending locations
      const pendingLocations = await offlineService.getPendingLocations();
      for (const location of pendingLocations) {
        try {
          // Remove pending ID and timestamp before syncing
          const { id, timestamp, ...locationData } = location;
          await locationService.createLocationLog(locationData);
          await offlineService.removePendingLocation(id);
          results.locations.success++;
        } catch (error) {
          console.error('Error syncing location:', error);
          results.locations.failed++;
        }
      }

      return {
        success: true,
        ...results,
      };
    } catch (error) {
      console.error('Error syncing pending data:', error);
      return {
        success: false,
        message: error.message,
        ...results,
      };
    }
  },
};
