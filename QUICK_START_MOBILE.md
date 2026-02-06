# Quick Start - Mobile App Testing

## Step 1: Create Dummy Data

Run the dummy data script to create test doctors and visits:

```powershell
cd "T:\INOLIFE HEALTHCARE"
.\create-dummy-data.ps1
```

This will:
- ✅ Create 5 dummy doctors assigned to your MR account
- ✅ Create multiple visits per doctor (last 7 days)
- ✅ Assign all doctors to MR: `mr@inolife.com`

## Step 2: Start Mobile App

```powershell
cd "T:\INOLIFE HEALTHCARE\mobile-app"
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator  
- Scan QR code with Expo Go app

## Step 3: Login

- **Email:** `mr@inolife.com`
- **Password:** `mr123456`

## Step 4: Test Features

### ✅ Location Tracking
- Should auto-start when you login
- Check home screen - should show "Active" status
- Location updates every 5 minutes
- Check backend logs for location updates

### ✅ Doctors List
- Go to "Doctors" tab
- Should see 5 doctors
- Click on any doctor to see details

### ✅ Visits
- Go to "Visits" tab
- Should see visits from last 7 days
- Click "Log New Visit" to create a new visit

### ✅ Offline Mode
- Enable airplane mode
- Create a visit
- Disable airplane mode
- Visit should sync automatically

---

## Location Tracking Fix

Location tracking now:
- ✅ Auto-starts when you login
- ✅ Works with foreground permissions (if background denied)
- ✅ Falls back to interval-based tracking
- ✅ Handles errors gracefully

If tracking doesn't start:
1. Grant location permissions when prompted
2. Check app permissions in device settings
3. Restart the app

---

## Troubleshooting

**No doctors showing?**
- Run `.\create-dummy-data.ps1` again
- Check backend is running
- Verify MR account exists

**Location not tracking?**
- Grant location permissions
- Check home screen shows "Active"
- Restart app if needed

**Can't connect to backend?**
- Ensure backend is running: `npm run dev`
- Check API URL in `mobile-app/src/config/api.js`
- Phone and computer on same WiFi
