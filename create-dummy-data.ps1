# Create Dummy Data for Testing - INOLIFE Healthcare
# This script creates dummy doctors and visits for the MR account

Write-Host "Creating Dummy Data for Testing..." -ForegroundColor Yellow
Write-Host ""

# First, get the MR user ID
Write-Host "Step 1: Getting MR user ID..." -ForegroundColor Cyan
try {
    $loginBody = @{
        email = "mr@inolife.com"
        password = "mr123456"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $mrId = $loginResponse.data.user.id
    $token = $loginResponse.token
    
    Write-Host "✅ MR ID: $mrId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error: Could not login as MR. Make sure MR account exists." -ForegroundColor Red
    Write-Host "Run: .\create-admin.ps1 (or create MR account manually)" -ForegroundColor Yellow
    exit 1
}

# Create dummy doctors
Write-Host "Step 2: Creating dummy doctors..." -ForegroundColor Cyan

$doctors = @(
    @{
        name = "Dr. Rajesh Kumar"
        specialization = "Cardiologist"
        qualification = "MBBS, MD"
        phone = "9876543210"
        email = "rajesh.kumar@hospital.com"
        clinicName = "City Heart Clinic"
        address = "123 Medical Street"
        city = "Delhi"
        state = "Delhi"
        pincode = "110001"
        location = @{
            type = "Point"
            coordinates = @(77.2090, 28.6139)  # Delhi coordinates
        }
        assignedMR = $mrId
        category = "A"
        preferredVisitDay = "Monday"
        preferredVisitTime = "10:00 AM - 12:00 PM"
    },
    @{
        name = "Dr. Priya Sharma"
        specialization = "Pediatrician"
        qualification = "MBBS, MD Pediatrics"
        phone = "9876543211"
        email = "priya.sharma@clinic.com"
        clinicName = "Kids Care Clinic"
        address = "456 Health Avenue"
        city = "Mumbai"
        state = "Maharashtra"
        pincode = "400001"
        location = @{
            type = "Point"
            coordinates = @(72.8777, 19.0760)  # Mumbai coordinates
        }
        assignedMR = $mrId
        category = "A"
        preferredVisitDay = "Tuesday"
        preferredVisitTime = "2:00 PM - 4:00 PM"
    },
    @{
        name = "Dr. Amit Patel"
        specialization = "General Physician"
        qualification = "MBBS"
        phone = "9876543212"
        email = "amit.patel@clinic.com"
        clinicName = "Family Health Center"
        address = "789 Wellness Road"
        city = "Bangalore"
        state = "Karnataka"
        pincode = "560001"
        location = @{
            type = "Point"
            coordinates = @(77.5946, 12.9716)  # Bangalore coordinates
        }
        assignedMR = $mrId
        category = "B"
        preferredVisitDay = "Wednesday"
        preferredVisitTime = "11:00 AM - 1:00 PM"
    },
    @{
        name = "Dr. Sunita Reddy"
        specialization = "Gynecologist"
        qualification = "MBBS, MD Gynecology"
        phone = "9876543213"
        email = "sunita.reddy@hospital.com"
        clinicName = "Women's Health Clinic"
        address = "321 Care Boulevard"
        city = "Hyderabad"
        state = "Telangana"
        pincode = "500001"
        location = @{
            type = "Point"
            coordinates = @(78.4867, 17.3850)  # Hyderabad coordinates
        }
        assignedMR = $mrId
        category = "A"
        preferredVisitDay = "Thursday"
        preferredVisitTime = "3:00 PM - 5:00 PM"
    },
    @{
        name = "Dr. Vikram Singh"
        specialization = "Orthopedic Surgeon"
        qualification = "MBBS, MS Orthopedics"
        phone = "9876543214"
        email = "vikram.singh@hospital.com"
        clinicName = "Bone & Joint Clinic"
        address = "654 Medical Plaza"
        city = "Pune"
        state = "Maharashtra"
        pincode = "411001"
        location = @{
            type = "Point"
            coordinates = @(73.8567, 18.5204)  # Pune coordinates
        }
        assignedMR = $mrId
        category = "B"
        preferredVisitDay = "Friday"
        preferredVisitTime = "10:00 AM - 12:00 PM"
    }
)

$createdDoctors = @()
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

foreach ($doctor in $doctors) {
    try {
        $doctorBody = $doctor | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/doctors" -Method POST -Headers $headers -Body $doctorBody
        $createdDoctors += $response.data.doctor._id
        Write-Host "  ✅ Created: $($doctor.name)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Error creating $($doctor.name): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Created $($createdDoctors.Count) doctors" -ForegroundColor Green
Write-Host ""

# Get or create products for visits (need admin token)
Write-Host "Step 3: Getting/Creating products for visits..." -ForegroundColor Cyan

# Try to get admin token for product creation
$adminToken = $null
try {
    $adminLoginBody = @{
        email = "admin@inolife.com"
        password = "admin123"
    } | ConvertTo-Json
    $adminLoginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $adminLoginBody
    $adminToken = $adminLoginResponse.token
    Write-Host "  ✅ Got admin token for product creation" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Could not get admin token. Products will be skipped." -ForegroundColor Yellow
}

try {
    $productsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method GET -Headers $headers
    $products = $productsResponse.data.products
    
    if ($products.Count -eq 0 -and $adminToken) {
        Write-Host "  ⚠️  No products found. Creating sample products..." -ForegroundColor Yellow
        
        $adminHeaders = @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        }
        
        $sampleProducts = @(
            @{
                name = "CardioPlus 10mg"
                code = "CAR001"
                category = "Tablet"
                type = "Prescription"
                mrp = 150
                sku = "SKU-CAR001"
                hsn = "30049099"
                description = "Cardiovascular medicine for hypertension"
            },
            @{
                name = "Pediatric Syrup"
                code = "PED001"
                category = "Syrup"
                type = "Prescription"
                mrp = 120
                sku = "SKU-PED001"
                hsn = "30049099"
                description = "Children's cough and cold syrup"
            },
            @{
                name = "Pain Relief Gel"
                code = "GEL001"
                category = "Topical"
                type = "OTC"
                mrp = 80
                sku = "SKU-GEL001"
                hsn = "30049099"
                description = "Topical pain relief gel"
            },
            @{
                name = "Vitamin D3 60K"
                code = "VIT001"
                category = "Capsule"
                type = "Prescription"
                mrp = 200
                sku = "SKU-VIT001"
                hsn = "30049099"
                description = "Vitamin D3 supplement"
            },
            @{
                name = "Antibiotic 500mg"
                code = "ANT001"
                category = "Tablet"
                type = "Prescription"
                mrp = 180
                sku = "SKU-ANT001"
                hsn = "30049099"
                description = "Broad spectrum antibiotic"
            }
        )
        
        $products = @()
        foreach ($product in $sampleProducts) {
            try {
                $productBody = $product | ConvertTo-Json
                $productResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method POST -Headers $adminHeaders -Body $productBody
                $products += $productResponse.data.product
                Write-Host "    ✅ Created: $($product.name)" -ForegroundColor Green
            } catch {
                Write-Host "    ⚠️  Error creating $($product.name): $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    Write-Host "  ✅ Found/Created $($products.Count) products" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Could not get/create products. Visits will be created without products." -ForegroundColor Yellow
    $products = @()
}

Write-Host ""

# Create dummy visits (last 7 days)
Write-Host "Step 4: Creating dummy visits (last 7 days)..." -ForegroundColor Cyan

$visitPurposes = @("Product Presentation", "Sample Distribution", "Follow-up", "Order Collection", "Relationship Building")
$visitStatuses = @("Completed", "Completed", "Completed", "Completed", "Rescheduled")  # Mostly completed

for ($i = 0; $i -lt $createdDoctors.Count; $i++) {
    $doctorId = $createdDoctors[$i]
    
    # Create 2-3 visits per doctor in the last 7 days
    $numVisits = Get-Random -Minimum 2 -Maximum 4
    
    for ($j = 0; $j -lt $numVisits; $j++) {
        $daysAgo = Get-Random -Minimum 0 -Maximum 7
        $visitDate = (Get-Date).AddDays(-$daysAgo)
        $randomHour = Get-Random -Minimum 9 -Maximum 17
        $visitDate = $visitDate.Date.AddHours($randomHour)
        
        $checkInTime = $visitDate
        $randomMinutes = Get-Random -Minimum 15 -Maximum 60
        $checkOutTime = $visitDate.AddMinutes($randomMinutes)
        
        # Get random purpose and status
        $randomPurpose = $visitPurposes | Get-Random
        $randomStatus = $visitStatuses | Get-Random
        
        # Random coordinates
        $randomLng = (Get-Random -Minimum -10 -Maximum 10) / 100.0
        $randomLat = (Get-Random -Minimum -10 -Maximum 10) / 100.0
        $lng = 77.2090 + $randomLng
        $lat = 28.6139 + $randomLat
        
        $visitBody = @{
            doctorId = $doctorId
            visitDate = $visitDate.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            checkInTime = $checkInTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            checkOutTime = $checkOutTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            purpose = $randomPurpose
            status = $randomStatus
            notes = "Sample visit for testing purposes"
            location = @{
                type = "Point"
                coordinates = @($lng, $lat)
            }
        }
        
        # Add products if available
        if ($products.Count -gt 0) {
            $numProducts = Get-Random -Minimum 1 -Maximum ([Math]::Min(3, $products.Count + 1))
            $selectedProducts = $products | Get-Random -Count $numProducts
            
            $visitBody.productsDiscussed = @()
            foreach ($product in $selectedProducts) {
                $visitBody.productsDiscussed += @{
                    productId = $product._id
                    quantity = Get-Random -Minimum 1 -Maximum 5
                    notes = "Discussed product benefits"
                }
            }
        }
        
        try {
            $visitBodyJson = $visitBody | ConvertTo-Json -Depth 10
            $visitResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/visits" -Method POST -Headers $headers -Body $visitBodyJson
            Write-Host "  ✅ Created visit for doctor $($i + 1) on $($visitDate.ToString('MMM dd, yyyy'))" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Error creating visit: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Dummy data creation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Doctors created: $($createdDoctors.Count)" -ForegroundColor White
Write-Host "  - All doctors assigned to MR: mr@inolife.com" -ForegroundColor White
Write-Host "  - Visits created: Multiple visits per doctor (last 7 days)" -ForegroundColor White
Write-Host ""
Write-Host "You can now test the mobile app with this data!" -ForegroundColor Green
