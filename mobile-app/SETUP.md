# Mobile App - Quick Setup

## Step 1: Install Dependencies

Open terminal in `mobile-app` folder and run:

```bash
npm install
```

This installs:
- Expo SDK
- React Navigation
- Axios
- AsyncStorage
- Expo Location
- React Native Paper
- All other dependencies

## Step 2: Update API URL

Edit `src/config/api.js`:

**For Physical Device:**
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:3000/api'  // Replace with your IP
  : 'https://your-production-api.com/api';
```

**To find your IP:**
- Windows: Open CMD → type `ipconfig` → find "IPv4 Address"
- Example: `http://192.168.1.100:3000/api`

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

**For iOS Simulator:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## Step 3: Start Expo

```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app

## Step 4: Test Features

1. Login with MR credentials
2. Test location tracking
3. Test visit logging
4. Test offline mode (enable airplane mode)

## Troubleshooting

**Can't connect to backend?**
- Use computer's IP address (not localhost)
- Ensure backend is running
- Check phone and computer are on same WiFi
- For emulator, use `10.0.2.2:3000`

**Location not working?**
- Grant location permissions
- Check app permissions in device settings
- For Android, ensure background location is enabled
