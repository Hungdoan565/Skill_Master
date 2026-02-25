import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

test('teacher route is teacher-only in App and TeacherRoute', () => {
  const app = read('src/App.jsx');
  const protectedRoute = read('src/components/auth/protected-route.jsx');

  assert.match(app, /<ProtectedRoute allowedRoles=\{\['TEACHER'\]\}>/);
  assert.match(protectedRoute, /allowedRoles=\{\['TEACHER'\]\}/);
});

test('email-pattern role inference is removed from auth-sensitive paths', () => {
  const app = read('src/App.jsx');
  const authContext = read('src/contexts/auth-context.jsx');
  const protectedRoute = read('src/components/auth/protected-route.jsx');

  assert.doesNotMatch(app, /includes\('admin'\)|endsWith\('@skillmaster\.edu\.vn'\)/);
  assert.doesNotMatch(authContext, /includes\('admin'\)|endsWith\('@skillmaster\.edu\.vn'\)/);
  assert.doesNotMatch(protectedRoute, /endsWith\('@skillmaster\.edu\.vn'\)/);
});

test('student payment wording reflects submit-proof then verify lifecycle', () => {
  const tuition = read('src/features/student-portal/pages/StudentTuition.jsx');
  const dashboard = read('src/features/student-portal/pages/StudentDashboard.jsx');
  const payment = read('src/features/student-portal/pages/StudentPayment.jsx');

  assert.match(tuition, /Chờ xác minh/);
  assert.match(tuition, /Gửi minh chứng thanh toán/);
  assert.match(dashboard, /Cần gửi minh chứng học phí/);
  assert.match(dashboard, /Gửi minh chứng/);
  assert.match(payment, /Đã gửi minh chứng cho/);
});
