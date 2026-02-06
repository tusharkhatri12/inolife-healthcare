# Fix Google Maps API Key Error

## The Problem
You're getting: `InvalidKeyMapError` or `InvalidKey` error

## Solutions

### Solution 1: Verify API Key is Valid

1. **Check your API key in Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Navigate to: APIs & Services → Credentials
   - Find your API key
   - Make sure it's enabled and not deleted

2. **Verify API is enabled:**
   - Go to: APIs & Services → Library
   - Search for "Maps JavaScript API"
   - Make sure it's **ENABLED**

### Solution 2: Check API Key Restrictions

If your API key has restrictions:

1. **Edit your API key** in Google Cloud Console
2. **Under "API restrictions":**
   - Make sure "Maps JavaScript API" is allowed
   - Or set to "Don't restrict key" (for testing)

3. **Under "Application restrictions":**
   - For development: Set to "None" or "HTTP referrers"
   - Add: `http://localhost:3001/*` and `http://127.0.0.1:3001/*`

### Solution 3: Get a New API Key

1. **Create new API key:**
   - Go to: https://console.cloud.google.com/
   - APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the new key

2. **Update `.env` file:**
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_new_api_key_here
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Solution 4: Enable Billing (If Required)

Google Maps API requires billing to be enabled:

1. Go to: https://console.cloud.google.com/billing
2. Link a billing account to your project
3. Google provides $200 free credit per month

---

## Quick Fix Steps

1. ✅ **Check `.env` file exists** in `admin-dashboard/` folder
2. ✅ **Verify API key** in Google Cloud Console
3. ✅ **Enable Maps JavaScript API**
4. ✅ **Remove restrictions** (for testing) or add `localhost:3001`
5. ✅ **Restart dev server** after changing `.env`

---

## Test Your API Key

Test in browser console (after restarting dev server):
```javascript
// Should not show errors
console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
```

---

## Common Issues

**"InvalidKeyMapError"**
- API key is wrong or deleted
- Maps JavaScript API not enabled
- Billing not enabled

**"RefererNotAllowedMapError"**
- API key has HTTP referrer restrictions
- Add `http://localhost:3001/*` to allowed referrers

**"ApiNotActivatedMapError"**
- Maps JavaScript API not enabled
- Enable it in API Library

---

## Still Not Working?

1. **Check browser console** for exact error message
2. **Verify API key** in Google Cloud Console
3. **Test API key** in a simple HTML file
4. **Check billing** is enabled
5. **Restart dev server** completely
