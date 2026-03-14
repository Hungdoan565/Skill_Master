import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8'
);

const studentCatalogSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'student-portal', 'pages', 'StudentCourseCatalog.jsx'),
  'utf8'
);

const studentDetailSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'student-portal', 'pages', 'StudentCourseDetail.jsx'),
  'utf8'
);

const coursesHookSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'courses', 'hooks', 'useCourses.js'),
  'utf8'
);

const courseTableSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'courses', 'components', 'CourseTable.jsx'),
  'utf8'
);

test('student available-courses endpoints enforce active status for strict policy', () => {
  const activeStatusMatches = backendSource.match(/\.eq\('status', 'active'\)/g) || [];
  assert.ok(activeStatusMatches.length >= 2, 'Expected active status filter on list and detail endpoints');
  assert.match(backendSource, /app\.get\('\/api\/student\/available-courses'/);
  assert.match(backendSource, /app\.get\('\/api\/student\/available-courses\/:courseId'/);
});

test('admin courses endpoint exists for student visibility diagnostics', () => {
  assert.match(backendSource, /app\.get\('\/api\/admin\/courses'/);
  assert.match(backendSource, /buildCoursesWithStudentVisibility\(/);
});

test('student catalog and detail render cover image and formatted schedule', () => {
  assert.match(studentCatalogSource, /CourseCover/);
  assert.match(studentCatalogSource, /course\.cover_image/);
  assert.match(studentCatalogSource, /Khóa học có thể đăng ký ngay/);

  assert.match(studentDetailSource, /formatScheduleDisplay/);
  assert.match(studentDetailSource, /formatScheduleDisplay\(cls\.schedule\)/);
  assert.match(studentDetailSource, /formatScheduleDisplay\(selectedClass\.schedule\)/);
});

test('admin UI consumes diagnostics and uses protected admin courses API', () => {
  assert.match(coursesHookSource, /\/api\/admin\/courses/);
  assert.match(courseTableSource, /Hiển thị học viên/);
  assert.match(courseTableSource, /StudentVisibilityBadge/);
  assert.match(courseTableSource, /Visible now/);
  assert.match(courseTableSource, /Not visible/);
});
