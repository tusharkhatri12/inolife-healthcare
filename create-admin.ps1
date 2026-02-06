# Create Admin User Script for INOLIFE Healthcare
# Make sure backend is running before executing this script

Write-Host "Creating Admin User..." -ForegroundColor Yellow
Write-Host ""

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
    Write-Host ""
    Write-Host "Login Credentials:" -ForegroundColor Cyan
    Write-Host "  Email: admin@inolife.com" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now login to the admin dashboard at: http://localhost:3001" -ForegroundColor Green
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
        Write-Host "  1. Backend is running: npm run dev" -ForegroundColor White
        Write-Host "  2. MongoDB is running and connected" -ForegroundColor White
        Write-Host "  3. Server is accessible at http://localhost:3000" -ForegroundColor White
    }
}
