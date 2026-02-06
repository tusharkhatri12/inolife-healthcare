import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { locationService } from '../services/locationService';
import { userService } from '../services/userService';
import { format } from 'date-fns';
import { FiMapPin, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
};

const defaultCenter = {
  lat: 20.5937, // India center
  lng: 78.9629,
};

const MRTrackingMap = () => {
  const [mrs, setMRs] = useState([]);
  const [mrLocations, setMRLocations] = useState([]);
  const [selectedMR, setSelectedMR] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filteredMRId, setFilteredMRId] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const mapRef = useRef(null);

  useEffect(() => {
    loadMRs();
  }, []);

  useEffect(() => {
    if (mrs.length > 0) {
      loadMRLocations();
    }
  }, [mrs, filteredMRId]);

  const loadMRs = async () => {
    try {
      const response = await userService.getUsers({ role: 'MR', isActive: true });
      setMRs(response.data?.users || []);
    } catch (error) {
      console.error('Error loading MRs:', error);
      toast.error('Failed to load MRs');
    }
  };

  const loadMRLocations = async () => {
    try {
      setLoading(true);
      
      // Use the efficient endpoint to get all current locations
      const response = await locationService.getAllCurrentLocations();
      let locations = response.data?.locations || [];

      // Filter by selected MR if filter is applied
      if (filteredMRId) {
        locations = locations.filter((loc) => loc.mrId === filteredMRId);
      }

      // Filter by active status: active = updated in last 15 min
      if (activeFilter === 'active' || activeFilter === 'inactive') {
        const now = Date.now();
        const fifteenMin = 15 * 60 * 1000;
        locations = locations.filter((loc) => {
          const ts = new Date(loc.timestamp || loc.createdAt).getTime();
          const isActive = now - ts < fifteenMin;
          return activeFilter === 'active' ? isActive : !isActive;
        });
      }

      // Transform data to match component structure
      const transformedLocations = locations.map((loc) => ({
        mr: loc.mr,
        location: {
          location: loc.location,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          pincode: loc.pincode,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp,
          createdAt: loc.createdAt,
        },
      }));

      setMRLocations(transformedLocations);

      // Update map center if locations exist
      if (transformedLocations.length > 0) {
        const firstLocation = transformedLocations[0].location.location.coordinates;
        setMapCenter({
          lat: firstLocation[1],
          lng: firstLocation[0],
        });
      }
    } catch (error) {
      console.error('Error loading MR locations:', error);
      toast.error('Failed to load MR locations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMRLocations();
    setRefreshing(false);
    toast.success('Locations refreshed');
  };

  const handleMarkerClick = (mrLocation) => {
    setSelectedLocation(mrLocation);
  };

  const handleInfoWindowClose = () => {
    setSelectedLocation(null);
  };

  const [mapLoaded, setMapLoaded] = useState(false);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  const fitBounds = () => {
    if (mapRef.current && mrLocations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      mrLocations.forEach((mrLoc) => {
        const coords = mrLoc.location.location.coordinates;
        bounds.extend({
          lat: coords[1],
          lng: coords[0],
        });
      });
      mapRef.current.fitBounds(bounds);
    }
  };

  useEffect(() => {
    if (mrLocations.length > 0 && mapRef.current) {
      fitBounds();
    }
  }, [mrLocations]);

  const getMarkerColor = (timestamp) => {
    const now = new Date();
    const locationTime = new Date(timestamp);
    const minutesAgo = (now - locationTime) / (1000 * 60);

    if (minutesAgo < 15) return '#4CAF50'; // Green - recent
    if (minutesAgo < 60) return '#FF9800'; // Orange - moderate
    return '#F44336'; // Red - old
  };

  const getMarkerIcon = (timestamp) => {
    if (!mapLoaded || !window.google) return null;
    
    const color = getMarkerColor(timestamp);
    // Create a simple colored circle marker
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
    };
  };

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">MR Tracking Map</h1>
          <p className="text-gray-600 mt-2">Live tracking of Medical Representatives</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-yellow-800 mb-2">Google Maps API Key Required</h3>
          <p className="text-yellow-700 mb-2">
            Please add your Google Maps API key to the environment variables:
          </p>
          <code className="block mt-2 p-2 bg-yellow-100 rounded mb-4">
            VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
          </code>
          <p className="text-yellow-700 text-sm">
            After adding the key, restart the dev server: <code className="bg-yellow-100 px-1 rounded">npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  // Check if API key looks invalid
  if (GOOGLE_MAPS_API_KEY.length < 30 || !GOOGLE_MAPS_API_KEY.startsWith('AIza')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">MR Tracking Map</h1>
          <p className="text-gray-600 mt-2">Live tracking of Medical Representatives</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-bold text-red-800 mb-2">Invalid Google Maps API Key</h3>
          <p className="text-red-700 mb-2">
            The API key in your `.env` file appears to be invalid.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-red-700 font-semibold">To fix this:</p>
            <ol className="list-decimal list-inside text-red-700 space-y-1 ml-4">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Enable "Maps JavaScript API" in API Library</li>
              <li>Create a new API Key in Credentials</li>
              <li>Update `.env` file with the new key</li>
              <li>Restart dev server: <code className="bg-red-100 px-1 rounded">npm run dev</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">MR Tracking Map</h1>
          <p className="text-gray-600 mt-2">Live tracking of Medical Representatives</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filteredMRId}
            onChange={(e) => setFilteredMRId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All MRs</option>
            {mrs.map((mr) => (
              <option key={mr._id} value={mr._id}>
                {mr.name} ({mr.employeeId})
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total MRs</p>
              <p className="text-2xl font-bold text-gray-800">{mrs.length}</p>
            </div>
            <FiMapPin className="text-primary" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Locations</p>
              <p className="text-2xl font-bold text-gray-800">{mrLocations.length}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Last Updated</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <FiRefreshCw className="text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={6}
              onLoad={onMapLoad}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              {mrLocations.map((mrLoc, index) => {
                const coords = mrLoc.location.location.coordinates;
                const position = {
                  lat: coords[1],
                  lng: coords[0],
                };
                const timestamp = mrLoc.location.timestamp || mrLoc.location.createdAt;
                const markerIcon = getMarkerIcon(timestamp);

                return (
                  <Marker
                    key={`${mrLoc.mr._id}-${index}`}
                    position={position}
                    icon={markerIcon}
                    onClick={() => handleMarkerClick(mrLoc)}
                    title={mrLoc.mr.name}
                  >
                    {selectedLocation?.mr._id === mrLoc.mr._id && (
                      <InfoWindow onCloseClick={handleInfoWindowClose}>
                        <div className="p-2">
                          <h3 className="font-bold text-gray-800 mb-2">
                            {selectedLocation.mr.name}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">
                              <span className="font-semibold">Employee ID:</span>{' '}
                              {selectedLocation.mr.employeeId}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-semibold">Territory:</span>{' '}
                              {selectedLocation.mr.territory || 'N/A'}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-semibold">Last Updated:</span>{' '}
                              {format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss')}
                            </p>
                            {selectedLocation.location.address && (
                              <p className="text-gray-600">
                                <span className="font-semibold">Address:</span>{' '}
                                {selectedLocation.location.address}
                              </p>
                            )}
                            {selectedLocation.location.city && (
                              <p className="text-gray-600">
                                <span className="font-semibold">City:</span>{' '}
                                {selectedLocation.location.city}
                              </p>
                            )}
                            {selectedLocation.location.accuracy && (
                              <p className="text-gray-600">
                                <span className="font-semibold">Accuracy:</span>{' '}
                                {selectedLocation.location.accuracy.toFixed(0)}m
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Lat: {coords[1].toFixed(6)}, Lng: {coords[0].toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                );
              })}
            </GoogleMap>
          </LoadScript>
        )}
      </div>

      {/* MR List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">MR Locations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  MR Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mrLocations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No location data available
                  </td>
                </tr>
              ) : (
                mrLocations.map((mrLoc) => {
                  const coords = mrLoc.location.location.coordinates;
                  const timestamp = mrLoc.location.timestamp || mrLoc.location.createdAt;
                  const minutesAgo = Math.round(
                    (new Date() - new Date(timestamp)) / (1000 * 60)
                  );
                  const statusColor =
                    minutesAgo < 15
                      ? 'bg-green-100 text-green-800'
                      : minutesAgo < 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800';

                  return (
                    <tr
                      key={mrLoc.mr._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setMapCenter({
                          lat: coords[1],
                          lng: coords[0],
                        });
                        handleMarkerClick(mrLoc);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mrLoc.mr.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mrLoc.mr.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mrLoc.location.city || 'N/A'}, {mrLoc.location.state || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${statusColor}`}
                        >
                          {minutesAgo < 60
                            ? `${minutesAgo}m ago`
                            : `${Math.round(minutesAgo / 60)}h ago`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MRTrackingMap;
