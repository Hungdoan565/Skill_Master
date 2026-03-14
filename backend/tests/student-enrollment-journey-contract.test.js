import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendSource = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
const catalogSource = fs.readFileSync(
  path.join(__dirname, '../../frontend/src/features/student-portal/pages/StudentCourseCatalog.jsx'),
  'utf8'
);
const detailSource = fs.readFileSync(
  path.join(__dirname, '../../frontend/src/features/student-portal/pages/StudentCourseDetail.jsx'),
  'utf8'
);

test('student enrollment journey endpoint exists with canonical helpers', () => {
  assert.match(backendSource, /const STUDENT_JOURNEY_STATUS_PRIORITY\s*=\s*\{/);
  assert.match(backendSource, /function getStudentJourneyStatus\(enrollmentStatus, requestStatus\)/);
  assert.match(backendSource, /app\.get\('\/api\/student\/enrollment-journey'/);
});

test('journey endpoint returns grouped payload', () => {
  assert.match(backendSource, /const\s+groups\s*=\s*\{\s*processing:/s);
  assert.match(backendSource, /groups,\s*summary:/s);
  assert.match(backendSource, /summary:\s*\{\s*total:/s);
  assert.match(backendSource, /status_group/);
});

test('student catalog uses enrollment journey hook and journey section naming', () => {
  assert.match(catalogSource, /useEnrollmentJourney/);
  assert.match(catalogSource, /Đăng ký & ghi danh của bạn/);
  assert.match(catalogSource, /splitJourneyGroups/);
});

test('student detail uses shared status resolver utilities', () => {
  assert.match(detailSource, /resolveJourneyStatus/);
  assert.match(detailSource, /getClassActionState/);
});
