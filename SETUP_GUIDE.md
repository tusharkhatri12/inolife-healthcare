# Complete Setup Guide - INOLIFE Healthcare CRM

This guide will help you set up all components of the system.

## Project Structure

```
INOLIFE HEALTHCARE/
├── (root)                    # Backend API
├── admin-dashboard/          # React Admin Dashboard
└── mobile-app/              # React Native Mobile App
```

---

## 1. Backend API Setup

### Location
Navigate to the root folder:
```bash
cd "T:\INOLIFE HEALTHCARE"
```

### Install Dependencies
```bash
npm install
```

### Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and update:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/inolife-healthcare
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   JWT_EXPIRE=7d
   CORS_ORIGIN=http://localhost:3000
   ```

### Start Backend
```bash
npm run dev
```

Backend will run on: `http://localhost:3000`

---

## 2. Admin Dashboard Setup

### Location
Navigate to admin dashboard folder:
```bash
cd "T:\INOLIFE HEALTHCARE\admin-dashboard"
```

### Install Dependencies
```bash
npm install
```

This will install:
- React & React Router
- Recharts (for charts)
- Axios (for API calls)
- Tailwind CSS (for styling)
- **@react-google-maps/api** (for Google Maps)
- react-hot-toast (for notifications)
- date-fns (for date formatting)
- react-icons (for icons)

### Google Maps API Key Setup

1. **Get Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable "Maps JavaScript API"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key

2. **Add to Environment:**
   Create `.env` file in `admin-dashboard/` folder:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

   **Important:** Replace `your_google_maps_api_key_here` with your actual API key!

3. **Restrict API Key (Recommended):**
   - In Google Cloud Console, edit your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps JavaScript API"
   - Under "Application restrictions", add your domain

### Start Admin Dashboard
```bash
npm run dev
```

Admin dashboard will run on: `http://localhost:3001`

### Access
- Open browser: `http://localhost:3001`
- Login with Owner/Manager credentials
- Navigate to "MR Tracking Map" in sidebar

---

## 3. Mobile App Setup

### Location
Navigate to mobile app folder:
```bash
cd "T:\INOLIFE HEALTHCARE\mobile-app"
```

### Install Dependencies
```bash
npm install
```

This will install:
- Expo CLI and dependencies
- React Navigation
- Axios (for API calls)
- AsyncStorage (for offline storage)
- Expo Location (for GPS tracking)
- React Native Paper (for UI)
- date-fns (for date formatting)
- @react-native-picker/picker (for dropdowns)

### Environment Setup

1. **Update API URL:**
   Edit `src/config/api.js`:
   ```javascript
   const API_BASE_URL = __DEV__ 
     ? 'http://YOUR_COMPUTER_IP:3000/api'  // Replace with your IP
     : 'https://your-production-api.com/api';
   ```

   **To find your computer's IP:**
   - Windows: Open CMD and type `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)
   - Use: `http://192.168.1.100:3000/api`

2. **For Android Emulator:**
   - Use `http://10.0.2.2:3000/api` (special IP for Android emulator)

3. **For iOS Simulator:**
   - Use `http://localhost:3000/api` (works on iOS simulator)

### Start Mobile App
```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app on your phone

---

## Quick Start Checklist

### Backend
- [ ] Navigate to root folder
- [ ] Run `npm install`
- [ ] Create `.env` file
- [ ] Update MongoDB URI
- [ ] Update JWT_SECRET
- [ ] Run `npm run dev`
- [ ] Verify: `http://localhost:3000/api/health`

### Admin Dashboard
- [ ] Navigate to `admin-dashboard/` folder
- [ ] Run `npm install`
- [ ] Get Google Maps API key
- [ ] Create `.env` file with API key
- [ ] Run `npm run dev`
- [ ] Verify: `http://localhost:3001`
- [ ] Login and test MR Tracking Map

### Mobile App
- [ ] Navigate to `mobile-app/` folder
- [ ] Run `npm install`
- [ ] Update API URL in `src/config/api.js`
- [ ] Run `npm start`
- [ ] Test on device/emulator

---

## Common Issues & Solutions

### 1. Google Maps Not Loading
**Problem:** Map shows "API Key Required" message

**Solution:**
- Verify `.env` file exists in `admin-dashboard/` folder
- Check `VITE_GOOGLE_MAPS_API_KEY` is set correctly
- Restart dev server after adding API key
- Verify API key is enabled for "Maps JavaScript API"

### 2. Mobile App Can't Connect to Backend
**Problem:** Network request failed

**Solution:**
- Use your computer's IP address instead of `localhost`
- Ensure backend is running
- Check firewall settings
- For Android emulator, use `10.0.2.2:3000`
- Ensure phone and computer are on same network

### 3. MongoDB Connection Error
**Problem:** Cannot connect to MongoDB

**Solution:**
- Ensure MongoDB is installed and running
- Check MongoDB URI in `.env`
- Default: `mongodb://localhost:27017/inolife-healthcare`
- For MongoDB Atlas, use connection string from Atlas dashboard

### 4. Port Already in Use
**Problem:** Port 3000 or 3001 already in use

**Solution:**
- Change PORT in `.env` file
- Or kill process using the port:
  - Windows: `netstat -ano | findstr :3000`
  - Then: `taskkill /PID <pid> /F`

---

## Testing the System

### 1. Test Backend
```bash
# Health check
curl http://localhost:3000/api/health

# Register user (Owner)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@inolife.com","password":"admin123","role":"Owner","phone":"9876543210"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inolife.com","password":"admin123"}'
```

### 2. Test Admin Dashboard
- Open `http://localhost:3001`
- Login with Owner/Manager credentials
- Check all pages load correctly
- Test MR Tracking Map (requires Google Maps API key)

### 3. Test Mobile App
- Start Expo dev server
- Open on device/emulator
- Login with MR credentials
- Test visit logging
- Test location tracking

---

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT_SECRET (32+ characters)
3. Use MongoDB Atlas or production MongoDB
4. Deploy to Heroku, AWS, or similar

### Admin Dashboard
1. Build: `npm run build`
2. Deploy `dist/` folder to hosting (Netlify, Vercel, etc.)
3. Update `VITE_API_URL` to production API
4. Update Google Maps API key restrictions

### Mobile App
1. Build APK/IPA: `expo build:android` or `expo build:ios`
2. Update API URL to production
3. Submit to app stores

---

## Support

If you encounter issues:
1. Check all dependencies are installed
2. Verify environment variables are set
3. Check console/terminal for error messages
4. Ensure MongoDB is running
5. Verify API endpoints are accessible
