# Mobile App Setup Guide

## Quick Start Checklist

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Or run this:**
```powershell
ipconfig | findstr /i "IPv4"
```

### Step 2: Update API URL

Edit `mobile-app/src/config/api.js`:

**For Physical Device (Phone):**
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_IP_ADDRESS:3000/api'  // Replace YOUR_IP_ADDRESS
  : 'https://your-production-api.com/api';
```

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

**For iOS Simulator:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Step 3: Install Dependencies

```powershell
cd "T:\INOLIFE HEALTHCARE\mobile-app"
npm install
```

### Step 4: Start Expo

```powershell
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with **Expo Go** app on your phone

### Step 5: Create MR Account

You need an MR (Medical Representative) account to login:

**Using PowerShell:**
```powershell
cd "T:\INOLIFE HEALTHCARE"
$body = @{
    name = "Test MR"
    email = "mr@inolife.com"
    password = "mr123456"
    role = "MR"
    phone = "9876543210"
    territory = "North Zone"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
```

**Login Credentials:**
- Email: `mr@inolife.com`
- Password: `mr123456`

---

## Testing the Mobile App

### 1. Login
- Use MR credentials
- Should see home screen after login

### 2. Location Tracking
- App should request location permissions
- Location tracking starts automatically
- Check backend logs for location updates

### 3. Doctor List
- View assigned doctors
- Navigate to doctor details

### 4. Visit Logging
- Create a new visit
- Select doctor
- Add visit details
- Submit visit

### 5. Offline Mode
- Enable airplane mode
- Create a visit
- Disable airplane mode
- Visit should sync automatically

---

## Troubleshooting

### Can't Connect to Backend

**Problem:** Network request failed

**Solutions:**
1. ✅ Use computer's IP address (not localhost)
2. ✅ Ensure backend is running
3. ✅ Phone and computer on same WiFi network
4. ✅ Check firewall settings
5. ✅ For emulator: Use `10.0.2.2:3000`

### Location Not Working

**Problem:** Location permission denied

**Solutions:**
1. Grant location permissions when prompted
2. Check app permissions in device settings
3. For Android: Enable background location
4. Restart app after granting permissions

### Expo Go Not Working

**Problem:** Can't scan QR code or app won't load

**Solutions:**
1. Install Expo Go from Play Store/App Store
2. Ensure phone and computer on same network
3. Try "Tunnel" connection in Expo CLI
4. Check firewall isn't blocking Expo

---

## Important Notes

1. **Backend must be running** - Keep `npm run dev` running in backend folder
2. **Same WiFi network** - Phone and computer must be on same network
3. **IP address changes** - If you change networks, update IP in `api.js`
4. **CORS is configured** - Backend already allows mobile app requests

---

## Next Steps

1. ✅ Update API URL with your IP
2. ✅ Install dependencies
3. ✅ Start Expo
4. ✅ Create MR account
5. ✅ Test login
6. ✅ Test all features
