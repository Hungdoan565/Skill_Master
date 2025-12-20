# Simple PowerShell script to test Schedule APIs
# Run this after logging in to the frontend to get a valid token

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Schedule Feature API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Configuration
$API_URL = "http://localhost:3000"

# You need to get this token from the frontend after logging in
# Open browser DevTools > Application > Local Storage > look for 'sb-*-auth-token'
Write-Host "`n📝 Please provide authentication token:" -ForegroundColor Yellow
Write-Host "   (Get it from frontend: DevTools > Application > Local Storage > sb-*-auth-token > access_token)" -ForegroundColor Gray
$TOKEN = Read-Host "Enter token"

if ([string]::IsNullOrWhiteSpace($TOKEN)) {
    Write-Host "❌ Token is required!" -ForegroundColor Red
    exit 1
}

# Get test data
Write-Host "`n📝 Getting test session and class IDs..." -ForegroundColor Cyan

# Test 1: Get sessions list to find a test session
Write-Host "`n🔍 Fetching sessions..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

try {
    $sessionsResponse = Invoke-RestMethod -Uri "$API_URL/api/admin/sessions?limit=1" -Headers $headers -Method Get
    
    if ($sessionsResponse.success -and $sessionsResponse.data.Count -gt 0) {
        $testSession = $sessionsResponse.data[0]
        $sessionId = $testSession.id
        $classId = $testSession.class_id
        
        Write-Host "✅ Found test session: $sessionId" -ForegroundColor Green
        Write-Host "   Class ID: $classId" -ForegroundColor Gray
        Write-Host "   Date: $($testSession.session_date) $($testSession.start_time)-$($testSession.end_time)" -ForegroundColor Gray
    } else {
        Write-Host "❌ No sessions found in database" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to fetch sessions: $_" -ForegroundColor Red
    exit 1
}

# Test results
$results = @{}

# Test 1: GET /api/admin/sessions/:sessionId/available-teachers
Write-Host "`n🧪 Test 1: GET /api/admin/sessions/:sessionId/available-teachers" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/admin/sessions/$sessionId/available-teachers" -Headers $headers -Method Get
    if ($response.success) {
        Write-Host "✅ PASS - Found $($response.data.Count) available teachers" -ForegroundColor Green
        $results["Test1"] = $true
    } else {
        Write-Host "❌ FAIL - $($response.message)" -ForegroundColor Red
        $results["Test1"] = $false
    }
} catch {
    Write-Host "❌ FAIL - Error: $_" -ForegroundColor Red
    $results["Test1"] = $false
}

# Test 2: PUT /api/admin/sessions/:id
Write-Host "`n🧪 Test 2: PUT /api/admin/sessions/:id" -ForegroundColor Cyan
try {
    $updateBody = @{
        notes = "Test update at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/admin/sessions/$sessionId" -Headers $headers -Method Put -Body $updateBody
    if ($response.success) {
        Write-Host "✅ PASS - Session updated successfully" -ForegroundColor Green
        $results["Test2"] = $true
    } else {
        Write-Host "❌ FAIL - $($response.message)" -ForegroundColor Red
        $results["Test2"] = $false
    }
} catch {
    Write-Host "❌ FAIL - Error: $_" -ForegroundColor Red
    $results["Test2"] = $false
}

# Test 3: GET /api/admin/sessions/:sessionId/attendance
Write-Host "`n🧪 Test 3: GET /api/admin/sessions/:sessionId/attendance" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/admin/sessions/$sessionId/attendance" -Headers $headers -Method Get
    if ($response.success) {
        Write-Host "✅ PASS - Found $($response.data.Count) attendance records" -ForegroundColor Green
        $results["Test3"] = $true
    } else {
        Write-Host "❌ FAIL - $($response.message)" -ForegroundColor Red
        $results["Test3"] = $false
    }
} catch {
    Write-Host "❌ FAIL - Error: $_" -ForegroundColor Red
    $results["Test3"] = $false
}

# Test 4: POST /api/admin/sessions/:sessionId/attendance
Write-Host "`n🧪 Test 4: POST /api/admin/sessions/:sessionId/attendance" -ForegroundColor Cyan
try {
    # Get students first
    $studentsResponse = Invoke-RestMethod -Uri "$API_URL/api/admin/classes/$classId/students" -Headers $headers -Method Get
    
    if ($studentsResponse.success -and $studentsResponse.data.Count -gt 0) {
        $attendances = @()
        foreach ($student in $studentsResponse.data | Select-Object -First 2) {
            $attendances += @{
                student_id = $student.student_id
                status = "present"
                notes = "Test attendance"
            }
        }
        
        $attendanceBody = @{
            attendances = $attendances
        } | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri "$API_URL/api/admin/sessions/$sessionId/attendance" -Headers $headers -Method Post -Body $attendanceBody
        if ($response.success) {
            Write-Host "✅ PASS - Marked $($attendances.Count) students as present" -ForegroundColor Green
            $results["Test4"] = $true
        } else {
            Write-Host "❌ FAIL - $($response.message)" -ForegroundColor Red
            $results["Test4"] = $false
        }
    } else {
        Write-Host "⚠️  SKIP - No students in class" -ForegroundColor Yellow
        $results["Test4"] = $true
    }
} catch {
    Write-Host "❌ FAIL - Error: $_" -ForegroundColor Red
    $results["Test4"] = $false
}

# Test 5: GET /api/admin/classes/:classId/students
Write-Host "`n🧪 Test 5: GET /api/admin/classes/:classId/students" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/admin/classes/$classId/students" -Headers $headers -Method Get
    if ($response.success) {
        Write-Host "✅ PASS - Found $($response.data.Count) students in class" -ForegroundColor Green
        if ($response.data.Count -gt 0) {
            Write-Host "   Sample: $($response.data[0].full_name) ($($response.data[0].email))" -ForegroundColor Gray
        }
        $results["Test5"] = $true
    } else {
        Write-Host "❌ FAIL - $($response.message)" -ForegroundColor Red
        $results["Test5"] = $false
    }
} catch {
    Write-Host "❌ FAIL - Error: $_" -ForegroundColor Red
    $results["Test5"] = $false
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($results.Values | Where-Object { $_ -eq $true }).Count
$total = $results.Count

foreach ($test in $results.Keys) {
    if ($results[$test]) {
        Write-Host "✅ $test`: PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ $test`: FAIL" -ForegroundColor Red
    }
}

Write-Host "`n📊 Results: $passed/$total tests passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($passed -eq $total) {
    Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed" -ForegroundColor Yellow
}

