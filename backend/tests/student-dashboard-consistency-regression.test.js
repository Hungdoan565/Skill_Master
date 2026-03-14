import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8'
);

const dashboardSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'student-portal', 'pages', 'StudentDashboard.jsx'),
  'utf8'
);

test('student dashboard API exposes enrollment count and session-based today classes', () => {
  assert.match(backendSource, /app\.get\('\/api\/student\/dashboard'/);
  assert.match(backendSource, /activeEnrollmentCount:\s*enrollments\?\.length\s*\|\|\s*0/);
  assert.match(backendSource, /todayDateInVN/);
  assert.match(backendSource, /formatToParts\(new Date\(\)\)/);
  assert.match(backendSource, /\.from\('sessions'\)/);
  assert.match(backendSource, /\.eq\('session_date',\s*todayDateInVN\)/);
  assert.match(backendSource, /nextClass/);
});

test('student dashboard onboarding depends on active enrollment count, not missing classes field', () => {
  assert.match(dashboardSource, /const activeEnrollmentCount = data\?\.activeEnrollmentCount \?\? stats\.totalClasses \?\? 0;/);
  assert.match(dashboardSource, /\{activeEnrollmentCount === 0 && \(/);
  assert.doesNotMatch(dashboardSource, /!data\?\.classes \|\| data\.classes\.length === 0/);
});

test('student dashboard empty state distinguishes enrolled students with no class today', () => {
  assert.match(dashboardSource, /Hôm nay bạn không có lớp\./);
  assert.match(dashboardSource, /Buổi gần nhất:/);
});
