# Installation Guide - All Components

## 📍 Where to Install Dependencies

### 1. Backend API (Root Folder)

**Location:** `T:\INOLIFE HEALTHCARE\`

```bash
cd "T:\INOLIFE HEALTHCARE"
npm install
```

**Installs:**
- Express.js
- Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- dotenv
- cors
- multer
- csv-parser
- express-validator

---

### 2. Admin Dashboard

**Location:** `T:\INOLIFE HEALTHCARE\admin-dashboard\`

```bash
cd "T:\INOLIFE HEALTHCARE\admin-dashboard"
npm install
```

**Installs:**
- React 18
- React Router
- Recharts (for charts)
- **@react-google-maps/api** (for Google Maps) ⭐
- Axios
- Tailwind CSS
- react-hot-toast
- date-fns
- react-icons

**⭐ Google Maps Setup:**
1. Get API key from Google Cloud Console
2. Create `.env` file in this folder:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```

---

### 3. Mobile App

**Location:** `T:\INOLIFE HEALTHCARE\mobile-app\`

```bash
cd "T:\INOLIFE HEALTHCARE\mobile-app"
npm install
```

**Installs:**
- Expo SDK
- React Navigation
- Axios
- AsyncStorage
- Expo Location
- React Native Paper
- date-fns
- @react-native-picker/picker

---

## 🚀 Quick Start Commands

### Terminal 1: Backend
```bash
cd "T:\INOLIFE HEALTHCARE"
npm install
npm run dev
```

### Terminal 2: Admin Dashboard
```bash
cd "T:\INOLIFE HEALTHCARE\admin-dashboard"
npm install
# Create .env file with Google Maps API key
npm run dev
```

### Terminal 3: Mobile App
```bash
cd "T:\INOLIFE HEALTHCARE\mobile-app"
npm install
# Update API URL in src/config/api.js
npm start
```

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Backend: `http://localhost:3000/api/health` returns success
- [ ] Admin Dashboard: `http://localhost:3001` loads login page
- [ ] Mobile App: Expo dev server starts without errors
- [ ] Google Maps: API key added to admin-dashboard/.env

---

## 🔑 Google Maps API Key Setup

### Step-by-Step:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name: "INOLIFE Healthcare"
   - Click "Create"

3. **Enable Maps JavaScript API**
   - Go to "APIs & Services" → "Library"
   - Search "Maps JavaScript API"
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

5. **Add to Admin Dashboard**
   - Create `.env` in `admin-dashboard/` folder:
     ```
     VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
     ```

6. **Restart Admin Dashboard**
   ```bash
   npm run dev
   ```

---

## 📝 Environment Files Needed

### Backend (.env in root)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/inolife-healthcare
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### Admin Dashboard (.env in admin-dashboard/)
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Mobile App (Update src/config/api.js)
```javascript
const API_BASE_URL = 'http://YOUR_IP:3000/api';
```

---

## 🆘 Need Help?

1. **Check node_modules exist** in each folder
2. **Verify .env files** are created
3. **Check terminal errors** for missing packages
4. **Restart dev servers** after adding API keys
