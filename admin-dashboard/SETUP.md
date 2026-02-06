# Admin Dashboard - Quick Setup

## Step 1: Install Dependencies

Open terminal in `admin-dashboard` folder and run:

```bash
npm install
```

This installs:
- React, React Router
- Recharts (charts)
- @react-google-maps/api (Google Maps)
- Axios, Tailwind CSS
- All other dependencies

## Step 2: Get Google Maps API Key

1. Go to: https://console.cloud.google.com/
2. Create new project (or select existing)
3. Enable "Maps JavaScript API"
4. Create API Key (Credentials → Create Credentials → API Key)
5. Copy the API key

## Step 3: Create .env File

In `admin-dashboard/` folder, create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=paste_your_api_key_here
```

**Replace `paste_your_api_key_here` with your actual Google Maps API key!**

## Step 4: Start Development Server

```bash
npm run dev
```

Dashboard will open at: `http://localhost:3001`

## Step 5: Access MR Tracking Map

1. Login as Owner or Manager
2. Click "MR Tracking Map" in sidebar
3. Map should load with MR locations

## Troubleshooting

**Map not loading?**
- Check `.env` file exists
- Verify API key is correct
- Restart dev server: `npm run dev`
- Check browser console for errors

**API errors?**
- Ensure backend is running on port 3000
- Check `VITE_API_URL` in `.env`
