# Create Admin User Script for INOLIFE Healthcare
# Creates Owner account in MongoDB (local or Atlas via your backend).
# Set $ApiBase to your backend URL (default: Render deployment).

$ApiBase = if ($env:API_URL) { $env:API_URL.TrimEnd('/') } else { "https://inolife-backend.onrender.com" }
$RegisterUrl = "$ApiBase/api/auth/register"

Write-Host "Creating Admin User..." -ForegroundColor Yellow
Write-Host "Backend: $RegisterUrl" -ForegroundColor Gray
Write-Host ""

$body = @{
    name     = "Admin"
    email    = "admin@inolife.com"
    password = "admin123"
    role     = "Owner"
    phone    = "9876543210"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $RegisterUrl -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "  Email: admin@inolife.com" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "You can login at the admin dashboard (use the same backend URL in dashboard .env)." -ForegroundColor Green
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*already exists*") {
        Write-Host "⚠️  Admin user already exists!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Login Credentials:" -ForegroundColor Cyan
        Write-Host "  Email: admin@inolife.com" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
    } else {
        Write-Host "❌ Error creating admin user:" -ForegroundColor Red
        Write-Host $errorMessage -ForegroundColor Red
        Write-Host ""
        Write-Host "Make sure:" -ForegroundColor Yellow
        Write-Host "  1. Backend is running and reachable at $ApiBase" -ForegroundColor White
        Write-Host "  2. MongoDB (e.g. Atlas) is connected to the backend" -ForegroundColor White
        Write-Host "  3. For local backend set: `$env:API_URL='http://localhost:3000'; .\create-admin.ps1" -ForegroundColor White
    }
}
