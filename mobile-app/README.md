# INOLIFE Healthcare - MR Mobile App

React Native (Expo) mobile application for Medical Representatives.

## Features

- 🔐 JWT Authentication
- 📍 Background GPS Tracking
- 👨‍⚕️ Doctor List (Assigned Doctors Only)
- 📝 Visit Logging Form
- 📴 Offline Support
- 🔄 Auto-sync when Online

## Tech Stack

- React Native (Expo)
- React Navigation
- Axios for API calls
- AsyncStorage for offline storage
- Expo Location for GPS tracking
- React Native Paper for UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API configuration:
Edit `src/config/api.js` and update `API_BASE_URL` with your backend URL.

3. Start the app:
```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for web

## Project Structure

```
mobile-app/
├── src/
│   ├── config/
│   │   ├── api.js          # Axios configuration
│   │   └── constants.js    # App constants
│   ├── contexts/
│   │   ├── AuthContext.js      # Authentication state
│   │   ├── LocationContext.js  # GPS tracking
│   │   └── OfflineContext.js   # Offline sync
│   ├── navigation/
│   │   └── AppNavigator.js     # Navigation setup
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js
│   │   ├── home/
│   │   │   └── HomeScreen.js
│   │   ├── doctors/
│   │   │   ├── DoctorsScreen.js
│   │   │   └── DoctorDetailScreen.js
│   │   ├── visits/
│   │   │   ├── VisitsScreen.js
│   │   │   ├── VisitFormScreen.js
│   │   │   └── VisitDetailScreen.js
│   │   └── profile/
│   │       └── ProfileScreen.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── doctorService.js
│   │   ├── visitService.js
│   │   ├── locationService.js
│   │   └── offlineService.js
│   └── theme/
│       └── index.js
├── App.js
├── app.json
└── package.json
```

## Key Features

### Authentication
- JWT token-based authentication
- Auto-login on app restart
- Secure token storage

### Location Tracking
- Background location updates every 5 minutes
- Automatic location logging
- Offline location storage

### Offline Support
- Visits saved locally when offline
- Auto-sync when connection restored
- Pending sync indicator

### Visit Management
- Create visits with doctor selection
- Add notes and feedback
- View visit history
- Offline visit creation

## Permissions

The app requires:
- Location permissions (foreground and background)
- Internet access
- Network state

## Configuration

### API Base URL
Update `src/config/api.js`:
```javascript
const API_BASE_URL = 'https://your-api-url.com/api';
```

### Location Tracking Interval
Update `src/config/constants.js`:
```javascript
export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  // ...
};
```

## Building for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

## Notes

- Ensure backend API is accessible from mobile device
- For development, use your local IP address instead of localhost
- Background location requires proper permissions setup
- Test offline functionality by enabling airplane mode
