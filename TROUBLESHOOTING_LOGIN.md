# Troubleshooting Login Issues

## Common Login Problems & Solutions

### Problem: "Login Failed" Error

#### Solution 1: Check Backend is Running
Make sure the backend server is running:
```powershell
cd "T:\INOLIFE HEALTHCARE"
npm run dev
```

You should see: `Server running in development mode on port 3000`

#### Solution 2: Check CORS Configuration
The backend needs to allow requests from the admin dashboard (port 3001).

**Check `.env` file in root folder:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

If it only has `http://localhost:3000`, update it to include both ports.

**Then restart the backend server.**

#### Solution 3: Verify API URL
Check `admin-dashboard/.env` file:
```env
VITE_API_URL=http://localhost:3000/api
```

#### Solution 4: Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for error messages
- **Network tab**: Check if the login request is being made and what the response is

Common errors:
- `CORS policy: No 'Access-Control-Allow-Origin'` → CORS issue (see Solution 2)
- `Network Error` → Backend not running
- `401 Unauthorized` → Wrong email/password
- `404 Not Found` → Wrong API URL

#### Solution 5: Test Login Directly
Test if login works via API:

**PowerShell:**
```powershell
$body = @{email='admin@inolife.com'; password='admin123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body $body
```

If this works, the issue is with the frontend. If it fails, the issue is with the backend.

#### Solution 6: Clear Browser Cache
Sometimes cached data causes issues:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Solution 7: Check Admin Account Exists
Verify the admin account was created:

**PowerShell:**
```powershell
$body = @{email='admin@inolife.com'; password='admin123'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body $body
    Write-Host "✅ Login works!" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
}
```

If login fails, recreate the admin account:
```powershell
cd "T:\INOLIFE HEALTHCARE"
.\create-admin.ps1
```

---

## Quick Fix Checklist

- [ ] Backend is running (`npm run dev` in root folder)
- [ ] MongoDB is running and connected
- [ ] `.env` file has `CORS_ORIGIN=http://localhost:3000,http://localhost:3001`
- [ ] `admin-dashboard/.env` has `VITE_API_URL=http://localhost:3000/api`
- [ ] Admin account exists (email: `admin@inolife.com`)
- [ ] Browser console shows no CORS errors
- [ ] Restarted backend after changing `.env`

---

## Still Not Working?

1. **Check backend logs** - Look for error messages in the terminal where `npm run dev` is running
2. **Check browser Network tab** - See the exact error response from the server
3. **Try incognito mode** - Rules out browser cache issues
4. **Verify MongoDB connection** - Backend should show "MongoDB Connected" on startup
