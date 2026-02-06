# Script to create coverage plans for MRs
# Usage: .\create-coverage-plans.ps1

$baseUrl = "http://localhost:3000/api"
$adminEmail = "admin@inolife.com"
$adminPassword = "admin123"

Write-Host "Creating Coverage Plans for MRs..." -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "`n[1/4] Logging in as admin..." -ForegroundColor Yellow
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

# Step 2: Get all MRs
Write-Host "`n[2/4] Fetching MRs..." -ForegroundColor Yellow
try {
    $mrsResponse = Invoke-RestMethod -Uri "$baseUrl/users?role=MR" -Method Get -Headers $headers
    $mrs = $mrsResponse.data.users
    Write-Host "✓ Found $($mrs.Count) MR(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to fetch MRs: $_" -ForegroundColor Red
    exit 1
}

if ($mrs.Count -eq 0) {
    Write-Host "No MRs found. Please create MRs first." -ForegroundColor Red
    exit 1
}

# Step 3: Get all doctors assigned to MRs
Write-Host "`n[3/4] Fetching doctors..." -ForegroundColor Yellow
try {
    $doctorsResponse = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method Get -Headers $headers
    $doctors = $doctorsResponse.data.doctors
    Write-Host "✓ Found $($doctors.Count) doctor(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to fetch doctors: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Create coverage plans for current month
Write-Host "`n[4/4] Creating coverage plans..." -ForegroundColor Yellow
$currentDate = Get-Date
$currentMonth = $currentDate.ToString("yyyy-MM")
$plannedVisits = 4  # Default: 4 visits per doctor per month

$createdCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($mr in $mrs) {
    $mrId = $mr._id
    $mrName = $mr.name
    
    # Find doctors assigned to this MR
    $assignedDoctors = $doctors | Where-Object { $_.assignedMR -eq $mrId }
    
    if ($assignedDoctors.Count -eq 0) {
        Write-Host "  ⚠ No doctors assigned to MR: $mrName" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "`n  Processing MR: $mrName ($($assignedDoctors.Count) doctors)..." -ForegroundColor Cyan
    
    foreach ($doctor in $assignedDoctors) {
        $doctorId = $doctor._id
        $doctorName = $doctor.name
        
        # Check if plan already exists
        try {
            $checkResponse = Invoke-RestMethod -Uri "$baseUrl/coverage/plans?doctorId=$doctorId&month=$currentMonth" -Method Get -Headers $headers
            if ($checkResponse.data.plans.Count -gt 0) {
                Write-Host "    ⊘ Skipped: $doctorName (plan already exists)" -ForegroundColor Gray
                $skippedCount++
                continue
            }
        } catch {
            # If check fails, continue anyway
        }
        
        # Create coverage plan
        $planBody = @{
            doctorId = $doctorId
            month = $currentMonth
            plannedVisits = $plannedVisits
        } | ConvertTo-Json
        
        try {
            $createResponse = Invoke-RestMethod -Uri "$baseUrl/coverage/admin/create" -Method Post -Body $planBody -Headers $headers
            Write-Host "    ✓ Created: $doctorName (Planned: $plannedVisits visits)" -ForegroundColor Green
            $createdCount++
        } catch {
            $errorMsg = $_.ErrorDetails.Message
            if ($errorMsg -match "already exists") {
                Write-Host "    ⊘ Skipped: $doctorName (plan already exists)" -ForegroundColor Gray
                $skippedCount++
            } else {
                Write-Host "    ✗ Error: $doctorName - $errorMsg" -ForegroundColor Red
                $errorCount++
            }
        }
    }
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "="*50 -ForegroundColor Cyan
Write-Host "Month: $currentMonth" -ForegroundColor White
Write-Host "Created: $createdCount" -ForegroundColor Green
Write-Host "Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "="*50 -ForegroundColor Cyan

if ($createdCount -gt 0) {
    Write-Host "`n✓ Coverage plans created successfully!" -ForegroundColor Green
    Write-Host "MRs can now see their coverage in the mobile app." -ForegroundColor Cyan
} else {
    Write-Host "`n⚠ No new coverage plans were created." -ForegroundColor Yellow
    Write-Host "This might be because plans already exist or no doctors are assigned to MRs." -ForegroundColor Yellow
}
