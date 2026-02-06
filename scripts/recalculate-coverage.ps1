# Script to recalculate coverage plans from existing visits
# This is useful if visits were created before coverage plans existed
# Usage: .\scripts\recalculate-coverage.ps1

$baseUrl = "http://localhost:3000/api"
$adminEmail = "admin@inolife.com"
$adminPassword = "admin123"

Write-Host "Recalculating Coverage Plans from Existing Visits..." -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "`n[1/3] Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get all coverage plans
Write-Host "`n[2/3] Fetching coverage plans..." -ForegroundColor Yellow
try {
    $plansResponse = Invoke-RestMethod -Uri "$baseUrl/coverage/plans" -Method Get -Headers $headers
    $plans = $plansResponse.data.plans
    Write-Host "✓ Found $($plans.Count) coverage plan(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to fetch coverage plans: $_" -ForegroundColor Red
    exit 1
}

if ($plans.Count -eq 0) {
    Write-Host "No coverage plans found. Please create coverage plans first." -ForegroundColor Yellow
    exit 0
}

# Step 3: Recalculate each plan by updating it (which triggers recalculation)
Write-Host "`n[3/3] Recalculating coverage plans..." -ForegroundColor Yellow
$updatedCount = 0
$errorCount = 0

foreach ($plan in $plans) {
    $planId = $plan._id
    $doctorName = $plan.doctorId.name
    $month = $plan.month
    
    try {
        # Update with same plannedVisits to trigger recalculation
        $updateBody = @{
            plannedVisits = $plan.plannedVisits
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/coverage/$planId" -Method Put -Body $updateBody -Headers $headers
        
        $actual = $updateResponse.data.plan.actualVisits
        $compliance = $updateResponse.data.plan.compliancePercentage
        $status = $updateResponse.data.plan.status
        
        Write-Host "  ✓ Updated: $doctorName ($month) - Actual: $actual, Compliance: $compliance%, Status: $status" -ForegroundColor Green
        $updatedCount++
    } catch {
        Write-Host "  ✗ Error updating plan for $doctorName : $_" -ForegroundColor Red
        $errorCount++
    }
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan
Write-Host "Updated: $updatedCount" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "="*50 -ForegroundColor Cyan

if ($updatedCount -gt 0) {
    Write-Host "`n✓ Coverage plans recalculated successfully!" -ForegroundColor Green
    Write-Host "Coverage now reflects actual visits from the database." -ForegroundColor Cyan
}
