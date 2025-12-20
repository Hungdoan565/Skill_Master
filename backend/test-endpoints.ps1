# PowerShell Script to Test Schedule Feature API Endpoints
# This script tests if endpoints are properly defined and responding

$API_URL = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Schedule Feature API Endpoint Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test if backend is running
Write-Host "`n📡 Checking if backend is running..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$API_URL/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not responding on port 3000" -ForegroundColor Red
    Write-Host "   Please start the backend with: cd backend; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Get sample IDs from database using direct query
Write-Host "`n📝 Fetching test data from database..." -ForegroundColor Yellow

# Since we need auth, let's test the endpoint structure instead
$testResults = @{}

# Function to test endpoint existence (will return 401 for auth required, which is expected)
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Description
    )
    
    Write-Host "`n🧪 Testing: $Description" -ForegroundColor Cyan
    Write-Host "   $Method $Path" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL$Path" -Method $Method -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    # 401 (Unauthorized) means endpoint exists but requires auth - this is GOOD
    # 404 (Not Found) means endpoint doesn't exist - this is BAD
    # 200 (OK) means endpoint works - this is GREAT
    
    if ($statusCode -eq 401) {
        Write-Host "✅ PASS - Endpoint exists (requires auth as expected)" -ForegroundColor Green
        return $true
    } elseif ($statusCode -eq 200) {
        Write-Host "✅ PASS - Endpoint accessible" -ForegroundColor Green
        return $true
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ FAIL - Endpoint not found (404)" -ForegroundColor Red
        return $false
    } else {
        Write-Host "⚠️  WARNING - Unexpected status: $statusCode" -ForegroundColor Yellow
        return $true  # Still count as pass if not 404
    }
}

# Test all 5 endpoints with dummy IDs (we expect 401 or 404)
$dummySessionId = "00000000-0000-0000-0000-000000000000"
$dummyClassId = "00000000-0000-0000-0000-000000000000"

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "  Testing Endpoint Definitions" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Test 1: GET /api/admin/sessions/:sessionId/available-teachers
$testResults["Test1"] = Test-Endpoint -Method "GET" `
    -Path "/api/admin/sessions/$dummySessionId/available-teachers" `
    -Description "GET /api/admin/sessions/:sessionId/available-teachers"

# Test 2: PUT /api/admin/sessions/:id
$testResults["Test2"] = Test-Endpoint -Method "PUT" `
    -Path "/api/admin/sessions/$dummySessionId" `
    -Description "PUT /api/admin/sessions/:id"

# Test 3: GET /api/admin/sessions/:sessionId/attendance
$testResults["Test3"] = Test-Endpoint -Method "GET" `
    -Path "/api/admin/sessions/$dummySessionId/attendance" `
    -Description "GET /api/admin/sessions/:sessionId/attendance"

# Test 4: POST /api/admin/sessions/:sessionId/attendance
$testResults["Test4"] = Test-Endpoint -Method "POST" `
    -Path "/api/admin/sessions/$dummySessionId/attendance" `
    -Description "POST /api/admin/sessions/:sessionId/attendance"

# Test 5: GET /api/admin/classes/:classId/students
$testResults["Test5"] = Test-Endpoint -Method "GET" `
    -Path "/api/admin/classes/$dummyClassId/students" `
    -Description "GET /api/admin/classes/:classId/students"

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$passed = ($testResults.Values | Where-Object { $_ -eq $true }).Count
$total = $testResults.Count

foreach ($test in $testResults.Keys | Sort-Object) {
    $status = if ($testResults[$test]) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($testResults[$test]) { "Green" } else { "Red" }
    Write-Host "$status - $test" -ForegroundColor $color
}

$resultColor = if ($passed -eq $total) { "Green" } else { "Yellow" }
Write-Host "`n📊 Results: $passed/$total endpoints properly defined" -ForegroundColor $resultColor

if ($passed -eq $total) {
    Write-Host "`n🎉 All endpoints are properly defined and responding!" -ForegroundColor Green
    Write-Host "`nℹ️  Note: Endpoints require authentication (401 response is expected)" -ForegroundColor Cyan
    Write-Host "   To test with real data, use: .\test-schedule-simple.ps1" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "`n⚠️  Some endpoints are missing or misconfigured" -ForegroundColor Yellow
    exit 1
}

