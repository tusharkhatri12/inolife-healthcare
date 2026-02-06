# MR Tracking Map - Implementation Guide

## Overview

Live Google Maps integration for tracking Medical Representatives in real-time.

## Features

- ✅ Google Maps integration
- ✅ Show all active MRs with last known location
- ✅ Color-coded markers (Green=recent, Orange=moderate, Red=old)
- ✅ Click markers for detailed information
- ✅ Filter by MR
- ✅ Auto-fit bounds to show all MRs
- ✅ Refresh button to update locations
- ✅ Status indicators (time since last update)
- ✅ MR list table with click-to-focus

## Backend Endpoint

### GET /api/location-logs/current-all
- **Access**: Owner, Manager only
- **Description**: Gets latest location for all active MRs
- **Response**: Array of locations with MR details

## Frontend Implementation

### Page: `/mr-tracking`
- **Component**: `src/pages/MRTrackingMap.jsx`
- **Service**: `src/services/locationService.js`
- **Route**: Protected (Owner/Manager only)

### Features

1. **Map Display**
   - Google Maps with all MR locations
   - Color-coded markers based on location recency
   - Info windows with detailed MR information

2. **Filtering**
   - Dropdown to filter by specific MR
   - "All MRs" option to show everyone

3. **Stats Cards**
   - Total MRs count
   - Active locations count
   - Last updated timestamp

4. **MR List Table**
   - Clickable rows to focus on map
   - Shows location, timestamp, status
   - Color-coded status badges

## Setup

1. **Get Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project
   - Enable "Maps JavaScript API"
   - Create API key
   - Add to `.env`: `VITE_GOOGLE_MAPS_API_KEY=your_key`

2. **Install Dependencies**
   ```bash
   npm install @react-google-maps/api
   ```

3. **Access Map**
   - Login as Owner or Manager
   - Navigate to "MR Tracking Map" in sidebar
   - Map loads with all active MR locations

## Marker Colors

- **Green** (#4CAF50): Location updated < 15 minutes ago
- **Orange** (#FF9800): Location updated 15-60 minutes ago
- **Red** (#F44336): Location updated > 60 minutes ago

## Info Window Details

When clicking a marker, shows:
- MR Name
- Employee ID
- Territory
- Last Updated timestamp
- Address (if available)
- City, State
- GPS Accuracy
- Coordinates (Lat/Lng)

## Performance

- Efficient backend endpoint uses MongoDB aggregation
- Gets latest location per MR in single query
- Auto-fits map bounds to show all MRs
- Refresh button for manual updates

## Security

- Only Owner and Manager roles can access
- Managers see only their assigned MRs
- Owners see all MRs
- Protected route with role validation
