# INOLIFE Healthcare - Admin Dashboard

React admin dashboard for pharma management with role-based access control.

## Features

- 🔐 JWT Authentication
- 🛡️ Role-based Routing (Owner/Manager only)
- 📊 Dashboard Overview
- 👥 MR Performance Analytics
- 🏥 Doctor Analytics
- 📦 Product Analytics
- 🗺️ Live MR Tracking Map
- 📤 CSV Sales Upload

## Tech Stack

- React 18
- React Router v6
- Recharts for data visualization
- Google Maps API for live tracking
- Axios for API calls
- Tailwind CSS for styling
- Vite for build tooling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. Get Google Maps API Key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Maps JavaScript API
   - Create API key
   - Add to `.env` file

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── DashboardLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MRPerformance.jsx
│   │   ├── DoctorAnalytics.jsx
│   │   ├── ProductAnalytics.jsx
│   │   ├── MRTrackingMap.jsx
│   │   └── CSVUpload.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── reportService.js
│   │   ├── locationService.js
│   │   ├── importService.js
│   │   └── ...
│   ├── config/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Pages

### Dashboard
- Overview statistics
- Visit trends chart
- Top MRs leaderboard
- Quick metrics

### MR Performance
- Daily/weekly/monthly performance
- Visits, doctors covered, products promoted
- Filterable by date range

### Doctor Analytics
- Visit frequency analysis
- Category distribution
- Last visit tracking
- Sales metrics

### Product Analytics
- Push vs Sales comparison
- Conversion rates
- Sales value tracking
- Performance metrics

### MR Tracking Map
- Live Google Maps integration
- Real-time MR location tracking
- Filter by MR
- Last known location with timestamp
- Color-coded markers (green=recent, orange=moderate, red=old)
- Click markers for detailed info

### CSV Upload
- MARG ERP sales data import
- Upload progress tracking
- Error reporting
- Success/failure feedback

## Authentication

- JWT token-based authentication
- Token stored in localStorage
- Auto-redirect on token expiry
- Role-based route protection

## API Integration

All API calls use the backend endpoints:
- `/api/auth/*` - Authentication
- `/api/reports/*` - Reporting APIs
- `/api/location-logs/*` - Location tracking
- `/api/import/*` - CSV import

## Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

For production, update with your backend URL and Google Maps API key.

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Maps JavaScript API"
4. Create credentials (API Key)
5. Restrict API key to your domain (recommended)
6. Add key to `.env` file

## Notes

- MR Tracking Map requires Google Maps API key
- Map shows all active MRs with their last known location
- Markers are color-coded based on location recency
- Click markers to see detailed information
- Filter by MR to focus on specific representative
- Auto-refresh available to update locations
