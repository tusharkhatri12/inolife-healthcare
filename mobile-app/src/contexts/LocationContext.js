import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationService } from '../services/locationService';
import { offlineService } from '../services/offlineService';
import { LOCATION_CONFIG } from '../config/constants';
import { useAuth } from './AuthContext';

const LOCATION_TASK_NAME = 'background-location-task';

const LocationContext = createContext({});

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

// Define background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];

    if (location) {
      const locationData = {
        location: {
          type: 'Point',
          coordinates: [location.coords.longitude, location.coords.latitude],
        },
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        altitude: location.coords.altitude,
        timestamp: new Date(location.timestamp),
        deviceInfo: {
          platform: 'Android', // or iOS
        },
      };

      try {
        const isOnline = await offlineService.isOnline();
        if (isOnline) {
          await locationService.createLocationLog(locationData);
        } else {
          await offlineService.savePendingLocation(locationData);
        }
      } catch (error) {
        console.error('Error saving location:', error);
        // Save to offline storage as fallback
        await offlineService.savePendingLocation(locationData);
      }
    }
  }
});

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      requestPermissions().then(() => {
        // Auto-start tracking when authenticated and permissions granted
        startTracking();
      });
    }
    return () => {
      stopTracking();
    };
  }, [isAuthenticated]);

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        try {
          const backgroundResult = await Location.requestBackgroundPermissionsAsync();
          if (backgroundResult.status === 'granted') {
            console.log('Background location permission granted');
          } else {
            console.log('Background location permission denied, using foreground only');
          }
        } catch (error) {
          // Background permissions might not be available (e.g., on web)
          console.log('Background permissions not available:', error);
        }
      }
      return status;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return 'denied';
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        await requestPermissions();
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        coords: currentLocation.coords,
        timestamp: currentLocation.timestamp,
      };

      setLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const startTracking = async () => {
    try {
      // First check foreground permissions
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        const result = await requestPermissions();
        if (result !== 'granted') {
          console.warn('Location permissions not granted');
          return;
        }
      }

      // Try to get background permissions
      let backgroundStatus = 'undetermined';
      try {
        backgroundStatus = await Location.getBackgroundPermissionsAsync();
      } catch (error) {
        // Background permissions might not be available on all platforms
        console.log('Background permissions check failed, using foreground only');
      }

      // If background is granted, use background tracking
      if (backgroundStatus === 'granted') {
        try {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: LOCATION_CONFIG.UPDATE_INTERVAL,
            distanceInterval: LOCATION_CONFIG.DISTANCE_INTERVAL,
            foregroundService: {
              notificationTitle: 'Location Tracking',
              notificationBody: 'Tracking your location for visit logging',
            },
          });
          setIsTracking(true);
          console.log('Background location tracking started');
        } catch (error) {
          console.warn('Background tracking failed, using foreground only:', error);
          // Fall through to foreground tracking
        }
      }

      // If background tracking didn't start, use foreground interval tracking
      if (!isTracking) {
        // Start interval-based foreground tracking
        intervalRef.current = setInterval(async () => {
          const location = await getCurrentLocation();
          if (location) {
            const locationData = {
              location: {
                type: 'Point',
                coordinates: [location.coords.longitude, location.coords.latitude],
              },
              accuracy: location.coords.accuracy,
              speed: location.coords.speed || 0,
              timestamp: new Date(location.timestamp),
            };

            try {
              const isOnline = await offlineService.isOnline();
              if (isOnline) {
                await locationService.createLocationLog(locationData);
              } else {
                await offlineService.savePendingLocation(locationData);
              }
            } catch (error) {
              console.error('Error saving location:', error);
              await offlineService.savePendingLocation(locationData);
            }
          }
        }, LOCATION_CONFIG.UPDATE_INTERVAL);

        setIsTracking(true);
        console.log('Foreground location tracking started');
      }

      // Get initial location
      await getCurrentLocation();
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    try {
      // Stop background tracking if running
      try {
        const isRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isRunning) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      } catch (error) {
        // Background task might not be registered
        console.log('Background task not running');
      }

      // Stop foreground interval tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsTracking(false);
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      setIsTracking(false);
    }
  };

  const value = {
    location,
    isTracking,
    permissionStatus,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermissions,
  };

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
};
