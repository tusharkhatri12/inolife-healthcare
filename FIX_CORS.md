# Fix CORS Error - Quick Guide

## The Problem
You're getting: `Access to XMLHttpRequest... has been blocked by CORS policy`

## The Solution

### Step 1: Restart Backend Server

**IMPORTANT:** The backend server MUST be restarted after CORS configuration changes!

1. **Stop the backend server:**
   - Go to the terminal where `npm run dev` is running
   - Press `Ctrl + C` to stop it

2. **Start it again:**
   ```powershell
   cd "T:\INOLIFE HEALTHCARE"
   npm run dev
   ```

3. **Verify it's running:**
   You should see: `Server running in development mode on port 3000`

### Step 2: Try Login Again

After restarting, try logging in:
- Email: `admin@inolife.com`
- Password: `admin123`

---

## What Was Fixed

✅ Updated CORS to allow `http://localhost:3001` (admin dashboard)
✅ Added explicit methods and headers for preflight requests
✅ CORS now properly handles OPTIONS requests

---

## Still Getting CORS Error?

1. **Check backend is actually restarted** - Look for "Server running" message
2. **Clear browser cache** - Press `Ctrl + Shift + Delete` and clear cache
3. **Try incognito mode** - Rules out browser cache issues
4. **Check browser console** - Look for any other errors

---

## Verify CORS is Working

Test in browser console (F12):
```javascript
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this works without CORS error, the backend is configured correctly!
