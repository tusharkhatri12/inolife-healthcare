import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineService } from '../services/offlineService';
import { SYNC_CONFIG } from '../config/constants';

const OfflineContext = createContext({});

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingVisitsCount, setPendingVisitsCount] = useState(0);
  const [pendingLocationsCount, setPendingLocationsCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        // Auto-sync when coming back online
        syncPendingData();
      }
    });

    // Check initial network state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected);
    });

    // Load pending counts
    loadPendingCounts();

    // Set up periodic sync check
    const syncInterval = setInterval(() => {
      if (isOnline) {
        syncPendingData();
      }
    }, SYNC_CONFIG.RETRY_INTERVAL);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, []);

  const loadPendingCounts = async () => {
    try {
      const visits = await offlineService.getPendingVisits();
      const locations = await offlineService.getPendingLocations();
      setPendingVisitsCount(visits.length);
      setPendingLocationsCount(locations.length);
    } catch (error) {
      console.error('Error loading pending counts:', error);
    }
  };

  const syncPendingData = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await offlineService.syncPendingData();
      if (result.success) {
        await loadPendingCounts();
      }
      return result;
    } catch (error) {
      console.error('Error syncing:', error);
      return { success: false, message: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    isOnline,
    pendingVisitsCount,
    pendingLocationsCount,
    isSyncing,
    syncPendingData,
    loadPendingCounts,
  };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
};
