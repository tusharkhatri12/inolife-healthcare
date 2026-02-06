# Create 5 MRs, assign doctors to each, create beat plans for today
# Prerequisites: Admin account, backend running. Run: .\create-mrs-and-beats.ps1

$baseUrl = "http://localhost:3000/api"

# --- 1. Login as admin ---
Write-Host "`n[1/5] Logging in as admin..." -ForegroundColor Cyan
$adminLogin = @{ email = "admin@inolife.com"; password = "admin123" } | ConvertTo-Json
try {
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
    $adminToken = $adminRes.token
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type"  = "application/json"
    }
    Write-Host "  OK Admin logged in" -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Could not login as admin. Create admin first (create-admin.ps1)" -ForegroundColor Red
    exit 1
}

# --- 2. Register 5 MRs ---
Write-Host "`n[2/5] Creating 5 MRs..." -ForegroundColor Cyan
$mrs = @(
    @{ name = "MR Rahul Kumar";     email = "mr1@inolife.com";  password = "mr123456"; phone = "9000000001"; role = "MR"; employeeId = "MR001" },
    @{ name = "MR Priya Sharma";    email = "mr2@inolife.com";  password = "mr123456"; phone = "9000000002"; role = "MR"; employeeId = "MR002" },
    @{ name = "MR Amit Patel";      email = "mr3@inolife.com";  password = "mr123456"; phone = "9000000003"; role = "MR"; employeeId = "MR003" },
    @{ name = "MR Sneha Reddy";     email = "mr4@inolife.com";  password = "mr123456"; phone = "9000000004"; role = "MR"; employeeId = "MR004" },
    @{ name = "MR Vikram Singh";    email = "mr5@inolife.com";  password = "mr123456"; phone = "9000000005"; role = "MR"; employeeId = "MR005" }
)

$mrIds = @()
foreach ($mr in $mrs) {
    try {
        $body = $mr | ConvertTo-Json
        $reg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        $mrIds += $reg.data.user.id
        Write-Host "  OK $($mr.name) ($($mr.email))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -match "already exists") {
            $loginBody = @{ email = $mr.email; password = $mr.password } | ConvertTo-Json
            $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
            $mrIds += $loginRes.data.user.id
            Write-Host "  OK $($mr.name) (existing)" -ForegroundColor Yellow
        } else {
            Write-Host "  FAIL $($mr.email): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if ($mrIds.Count -lt 5) {
    Write-Host "  Need at least 5 MRs. Got $($mrIds.Count)." -ForegroundColor Red
    exit 1
}

# --- 3. Get or create doctors and assign to MRs ---
Write-Host "`n[3/5] Fetching doctors and assigning to MRs..." -ForegroundColor Cyan
$doctorsRes = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method Get -Headers $adminHeaders
$allDoctors = $doctorsRes.data.doctors

if (-not $allDoctors -or $allDoctors.Count -lt 10) {
    Write-Host "  Creating 15 doctors (5 MRs x 3 each)..." -ForegroundColor Yellow
    $cities = @("Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad")
    $specs = @("Cardiologist", "Pediatrician", "General Physician", "Gynecologist", "Orthopedic", "Dermatologist", "ENT", "Psychiatrist")
    $allDoctors = @()
    for ($k = 1; $k -le 15; $k++) {
        $cityIdx = ($k - 1) % $cities.Count
        $specIdx = ($k - 1) % $specs.Count
        $docBody = @{
            name = "Dr. Test $k"
            specialization = $specs[$specIdx]
            phone = "98765" + ("43210" + $k).Substring(0, 5)
            city = $cities[$cityIdx]
            address = "Address $k"
            state = "State"
            pincode = "110001"
            assignedMR = $mrIds[($k - 1) % 5]
        } | ConvertTo-Json
        try {
            $cr = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method Post -Headers $adminHeaders -Body $docBody
            $allDoctors += $cr.data.doctor
        } catch {
            Write-Host "    Error creating doctor $k" -ForegroundColor Yellow
        }
    }
}

# Assign doctors to MRs in groups (each MR gets 3 doctors)
$doctorsPerMr = @{}
for ($i = 0; $i -lt 5; $i++) {
    $doctorsPerMr[$mrIds[$i]] = @()
}
$idx = 0
foreach ($d in $allDoctors) {
    $mrIdx = $idx % 5
    $mid = $mrIds[$mrIdx]
    $doctorsPerMr[$mid] += $d._id
    $idx++
}

# Update doctor assignment via PUT
foreach ($mrId in $mrIds) {
    $docIds = $doctorsPerMr[$mrId]
    foreach ($did in $docIds) {
        try {
            $upd = @{ assignedMR = $mrId } | ConvertTo-Json
            Invoke-RestMethod -Uri "$baseUrl/doctors/$did" -Method Put -Headers $adminHeaders -Body $upd | Out-Null
        } catch { }
    }
}
Write-Host "  OK Doctors assigned to MRs" -ForegroundColor Green

# --- 4. Create beat plans for today (each MR, different planned doctors) ---
Write-Host "`n[4/5] Creating beat plans for today..." -ForegroundColor Cyan
$today = (Get-Date).ToString("yyyy-MM-ddT00:00:00.000Z")
foreach ($i in 0..4) {
    $mrId = $mrIds[$i]
    $plannedIds = $doctorsPerMr[$mrId]
    if ($plannedIds.Count -eq 0) { continue }
    $planBody = @{
        mrId = $mrId
        date = $today
        plannedDoctors = $plannedIds
        notes = "Beat plan for MR $($i + 1)"
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/beat-plans" -Method Post -Headers $adminHeaders -Body $planBody | Out-Null
        Write-Host "  OK Beat plan for MR $($i + 1) ($($plannedIds.Count) doctors)" -ForegroundColor Green
    } catch {
        if ($_.ErrorDetails.Message -match "already exists") {
            Write-Host "  OK Beat plan for MR $($i + 1) (already exists)" -ForegroundColor Yellow
        } else {
            Write-Host "  FAIL MR $($i + 1): $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

# --- 5. Summary ---
Write-Host "`n[5/5] Summary" -ForegroundColor Cyan
Write-Host "  MRs: mr1@inolife.com .. mr5@inolife.com (password: mr123456)" -ForegroundColor White
Write-Host "  Each MR has assigned doctors and a beat plan for today." -ForegroundColor White
Write-Host "  Login to the mobile app with any MR to test beats and visits." -ForegroundColor White
Write-Host "`nDone." -ForegroundColor Green
