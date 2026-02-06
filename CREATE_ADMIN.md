
# How to Create Admin Account

## There is NO default admin account!

You need to create the first admin user yourself. Here's how:

---

## Option 1: Using API (Recommended)

### Step 1: Start Backend Server
```bash
cd "T:\INOLIFE HEALTHCARE"
npm run dev
```

### Step 2: Register Admin User

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"name":"Admin","email":"admin@inolife.com","password":"admin123","role":"Owner","phone":"9876543210"}'
```

**Using curl (if installed):**
```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Admin\",\"email\":\"admin@inolife.com\",\"password\":\"admin123\",\"role\":\"Owner\",\"phone\":\"9876543210\"}"
```

**Using Postman or any API client:**
- URL: `POST http://localhost:3000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "name": "Admin",
  "email": "admin@inolife.com",
  "password": "admin123",
  "role": "Owner",
  "phone": "9876543210"
}
```

---

## Option 2: Using Admin Dashboard (After Backend is Running)

1. Start backend: `npm run dev` (in root folder)
2. Start admin dashboard: `npm run dev` (in admin-dashboard folder)
3. Go to: `http://localhost:3001`
4. You'll see login page
5. **But wait!** You need to register first via API (Option 1)

---

## Default Admin Credentials (After Registration)

After running the registration command above, you can login with:

**Email:** `admin@inolife.com`  
**Password:** `admin123`

---

## Create Your Own Admin Account

You can use any email/password you want:

```json
{
  "name": "Your Name",
  "email": "your-email@example.com",
  "password": "your-secure-password",
  "role": "Owner",
  "phone": "9876543210"
}
```

**Important:**
- `role` must be `"Owner"` for full admin access
- `phone` must be a valid 10-digit Indian phone number
- `password` must be at least 6 characters

---

## Verify Admin Account Created

After registration, test login:

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@inolife.com","password":"admin123"}'
```

You should receive a JWT token in the response.

---

## Create Admin When Backend is on Render (MongoDB Atlas)

Your backend is at **https://inolife-backend.onrender.com**. Use one of these:

### Node.js (works on Windows, Mac, Linux, Render Shell)

From the project root:

```bash
node scripts/create-admin.js
```

To target a different backend:

```bash
API_URL=http://localhost:3000 node scripts/create-admin.js
```

### Bash (Mac, Linux, or Render Shell)

```bash
chmod +x scripts/create-admin-render.sh
./scripts/create-admin-render.sh
```

With custom backend:

```bash
API_URL=http://localhost:3000 ./scripts/create-admin-render.sh
```

### PowerShell (Windows)

From the project root:

```powershell
.\create-admin.ps1
```

By default it uses `https://inolife-backend.onrender.com`. For local backend:

```powershell
$env:API_URL = "http://localhost:3000"; .\create-admin.ps1
```

**Note:** On Render’s free tier the first request can take 30–60 seconds while the service wakes. If the script times out, run it again.

---

## Quick Setup Script (legacy local)

Save this as `create-admin.ps1` and run it:

```powershell
# Create Admin User
$body = @{
    name = "Admin"
    email = "admin@inolife.com"
    password = "admin123"
    role = "Owner"
    phone = "9876543210"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
    Write-Host "Email: admin@inolife.com" -ForegroundColor Cyan
    Write-Host "Password: admin123" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Make sure backend is running on http://localhost:3000" -ForegroundColor Yellow
}
```

Run it:
```powershell
.\create-admin.ps1
```

---

## Troubleshooting

**Error: "User already exists"**
- The admin account is already created
- Just login with the credentials

**Error: "Cannot connect to server"**
- Make sure backend is running: `npm run dev`
- Check if port 3000 is available

**Error: "Invalid role"**
- Make sure `role` is exactly `"Owner"` (case-sensitive)
