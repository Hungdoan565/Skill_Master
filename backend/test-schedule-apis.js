/**
 * Test Script for Schedule Feature APIs
 * Tests 5 admin session endpoints
 */

import { supabase } from './src/lib/db.js';

const API_URL = 'http://localhost:3000';
let authToken = null;
let testSessionId = null;
let testClassId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make API requests
async function apiRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

// Step 1: Get authentication token
async function authenticate() {
  log('\n📝 Step 1: Authenticating...', 'cyan');
  
  // Get a SUPER_ADMIN or CENTER_MANAGER user
  const { data: adminUser, error } = await supabase
    .from('users')
    .select('id, email, roles(code)')
    .in('roles.code', ['SUPER_ADMIN', 'CENTER_MANAGER'])
    .limit(1)
    .single();

  if (error || !adminUser) {
    log('❌ No admin user found in database', 'red');
    process.exit(1);
  }

  log(`✅ Found admin user: ${adminUser.email} (${adminUser.roles.code})`, 'green');

  // Create a session token for testing
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminUser.email,
    email_confirm: true
  });

  if (authError) {
    // Try to sign in instead
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminUser.email,
      password: 'test123456' // Default password
    });

    if (signInError) {
      log('❌ Cannot authenticate. Please ensure test user exists with password.', 'red');
      log('   You may need to manually get a token from the frontend.', 'yellow');
      process.exit(1);
    }

    authToken = signInData.session.access_token;
  } else {
    authToken = authData.session?.access_token;
  }

  log(`✅ Authentication successful`, 'green');
}

// Step 2: Get test data (session and class IDs)
async function getTestData() {
  log('\n📝 Step 2: Getting test data...', 'cyan');

  // Get a session with a class
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, class_id, session_date, start_time, end_time')
    .not('class_id', 'is', null)
    .limit(1)
    .single();

  if (sessionError || !session) {
    log('❌ No sessions found in database', 'red');
    process.exit(1);
  }

  testSessionId = session.id;
  testClassId = session.class_id;

  log(`✅ Test Session ID: ${testSessionId}`, 'green');
  log(`✅ Test Class ID: ${testClassId}`, 'green');
  log(`   Session Date: ${session.session_date} ${session.start_time}-${session.end_time}`, 'blue');
}

// Test 1: GET /api/admin/sessions/:sessionId/available-teachers
async function test1_AvailableTeachers() {
  log('\n🧪 Test 1: GET /api/admin/sessions/:sessionId/available-teachers', 'cyan');
  
  const { status, data } = await apiRequest('GET', `/api/admin/sessions/${testSessionId}/available-teachers`);
  
  if (status === 200 && data.success) {
    log(`✅ PASS - Status: ${status}`, 'green');
    log(`   Found ${data.data?.length || 0} available teachers`, 'blue');
    if (data.data?.length > 0) {
      log(`   Sample: ${data.data[0].full_name} (${data.data[0].email})`, 'blue');
    }
  } else {
    log(`❌ FAIL - Status: ${status}`, 'red');
    log(`   Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
  }
  
  return status === 200 && data.success;
}

// Test 2: PUT /api/admin/sessions/:id
async function test2_UpdateSession() {
  log('\n🧪 Test 2: PUT /api/admin/sessions/:id', 'cyan');
  
  const updateData = {
    notes: `Test update at ${new Date().toISOString()}`
  };
  
  const { status, data } = await apiRequest('PUT', `/api/admin/sessions/${testSessionId}`, updateData);
  
  if (status === 200 && data.success) {
    log(`✅ PASS - Status: ${status}`, 'green');
    log(`   Session updated successfully`, 'blue');
  } else {
    log(`❌ FAIL - Status: ${status}`, 'red');
    log(`   Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
  }
  
  return status === 200 && data.success;
}

// Test 3: GET /api/admin/sessions/:sessionId/attendance
async function test3_GetAttendance() {
  log('\n🧪 Test 3: GET /api/admin/sessions/:sessionId/attendance', 'cyan');

  const { status, data } = await apiRequest('GET', `/api/admin/sessions/${testSessionId}/attendance`);

  if (status === 200 && data.success) {
    log(`✅ PASS - Status: ${status}`, 'green');
    log(`   Found ${data.data?.length || 0} attendance records`, 'blue');
  } else {
    log(`❌ FAIL - Status: ${status}`, 'red');
    log(`   Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
  }

  return status === 200 && data.success;
}

// Test 4: POST /api/admin/sessions/:sessionId/attendance
async function test4_PostAttendance() {
  log('\n🧪 Test 4: POST /api/admin/sessions/:sessionId/attendance', 'cyan');

  // First get students from the class
  const { data: students } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('class_id', testClassId)
    .eq('status', 'active')
    .limit(2);

  if (!students || students.length === 0) {
    log('⚠️  SKIP - No students enrolled in class', 'yellow');
    return true; // Skip but don't fail
  }

  const attendanceData = {
    attendances: students.map(s => ({
      student_id: s.student_id,
      status: 'present',
      notes: 'Test attendance'
    }))
  };

  const { status, data } = await apiRequest('POST', `/api/admin/sessions/${testSessionId}/attendance`, attendanceData);

  if (status === 200 && data.success) {
    log(`✅ PASS - Status: ${status}`, 'green');
    log(`   Marked ${students.length} students as present`, 'blue');
  } else {
    log(`❌ FAIL - Status: ${status}`, 'red');
    log(`   Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
  }

  return status === 200 && data.success;
}

// Test 5: GET /api/admin/classes/:classId/students
async function test5_GetClassStudents() {
  log('\n🧪 Test 5: GET /api/admin/classes/:classId/students', 'cyan');

  const { status, data } = await apiRequest('GET', `/api/admin/classes/${testClassId}/students`);

  if (status === 200 && data.success) {
    log(`✅ PASS - Status: ${status}`, 'green');
    log(`   Found ${data.data?.length || 0} students in class`, 'blue');
    if (data.data?.length > 0) {
      log(`   Sample: ${data.data[0].full_name} (${data.data[0].email})`, 'blue');
    }
  } else {
    log(`❌ FAIL - Status: ${status}`, 'red');
    log(`   Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
  }

  return status === 200 && data.success;
}

// Main test runner
async function runTests() {
  log('═══════════════════════════════════════════════════════', 'cyan');
  log('  Schedule Feature API Tests', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');

  try {
    await authenticate();
    await getTestData();

    const results = {
      test1: await test1_AvailableTeachers(),
      test2: await test2_UpdateSession(),
      test3: await test3_GetAttendance(),
      test4: await test4_PostAttendance(),
      test5: await test5_GetClassStudents()
    };

    // Summary
    log('\n═══════════════════════════════════════════════════════', 'cyan');
    log('  Test Summary', 'cyan');
    log('═══════════════════════════════════════════════════════', 'cyan');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      log(`${icon} ${test}: ${passed ? 'PASS' : 'FAIL'}`, color);
    });

    log(`\n📊 Results: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

    if (passed === total) {
      log('\n🎉 All tests passed!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Test execution error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

