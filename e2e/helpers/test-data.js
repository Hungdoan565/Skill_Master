/**
 * Shared test data constants for Skill Master E2E tests.
 * Credentials default to env vars or fallback test values.
 */

// ============================================
// TEST USER CREDENTIALS
// ============================================
export const TEST_USERS = {
  ADMIN: {
    email: process.env.ADMIN_EMAIL || 'admin@skillmaster.test',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'SUPER_ADMIN',
    dashboardPath: '/admin/dashboard',
  },
  TEACHER: {
    email: process.env.TEACHER_EMAIL || 'teacher@skillmaster.test',
    password: process.env.TEACHER_PASSWORD || 'Teacher@123456',
    role: 'TEACHER',
    dashboardPath: '/teacher/dashboard',
  },
  STUDENT: {
    email: process.env.STUDENT_EMAIL || 'student@skillmaster.test',
    password: process.env.STUDENT_PASSWORD || 'Student@123456',
    role: 'STUDENT',
    dashboardPath: '/student/dashboard',
  },
  PARENT: {
    email: process.env.PARENT_EMAIL || 'parent@skillmaster.test',
    password: process.env.PARENT_PASSWORD || 'Parent@123456',
    role: 'PARENT',
    dashboardPath: '/parent/dashboard',
  },
};

// ============================================
// API ENDPOINTS
// ============================================
export const API = {
  BASE_URL: process.env.API_URL || 'http://localhost:3000',
  AUTH_LOGIN: '/auth/v1/token?grant_type=password',
  USERS: '/api/users',
  STUDENTS: '/api/students',
  ENROLLMENTS: '/api/enrollments',
  CLASSES: '/api/classes',
  COURSES: '/api/courses',
};

// ============================================
// ROUTES
// ============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_ENROLLMENTS: '/admin/enrollments',
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_SCHEDULE: '/admin/schedule',
  ADMIN_INVOICES: '/admin/invoices',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_REPORTS: '/admin/reports',

  // Teacher
  TEACHER_DASHBOARD: '/teacher/dashboard',
  TEACHER_SCHEDULE: '/teacher/schedule',
  TEACHER_CLASSES: '/teacher/classes',

  // Student
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_GRADES: '/student/grades',
  STUDENT_ATTENDANCE: '/student/attendance',
  STUDENT_SCHEDULE: '/student/schedule',

  // Parent
  PARENT_DASHBOARD: '/parent/dashboard',
  PARENT_GRADES: '/parent/grades',
  PARENT_ATTENDANCE: '/parent/attendance',
  PARENT_INVOICES: '/parent/invoices',
};

// ============================================
// TIMEOUTS
// ============================================
export const TIMEOUTS = {
  SHORT: 3_000,
  MEDIUM: 5_000,
  LONG: 10_000,
  NAVIGATION: 15_000,
};
