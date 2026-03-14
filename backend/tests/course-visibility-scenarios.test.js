import test from 'node:test';
import assert from 'node:assert/strict';

import { getStudentVisibilityDiagnostics, buildCoursesWithStudentVisibility } from '../src/services/course-visibility.service.js';

test('strict policy: active course with eligible class in center is visible', () => {
  const diagnostics = getStudentVisibilityDiagnostics({
    courseStatus: 'active',
    classRows: [
      { course_id: 'course-1', center_id: 'center-a', status: 'upcoming' }
    ],
    effectiveCenterId: 'center-a'
  });

  assert.equal(diagnostics.visible_now, true);
  assert.equal(diagnostics.reason_codes.length, 0);
  assert.equal(diagnostics.eligible_class_count, 1);
});

test('strict policy: draft/inactive course remains hidden even if class is eligible', () => {
  const diagnostics = getStudentVisibilityDiagnostics({
    courseStatus: 'draft',
    classRows: [
      { course_id: 'course-2', center_id: 'center-a', status: 'ongoing' }
    ],
    effectiveCenterId: 'center-a'
  });

  assert.equal(diagnostics.visible_now, false);
  assert.ok(diagnostics.reason_codes.includes('course_status_blocking'));
});

test('strict policy: center mismatch and lifecycle mismatch produce diagnostic reasons', () => {
  const centerMismatch = getStudentVisibilityDiagnostics({
    courseStatus: 'active',
    classRows: [
      { course_id: 'course-3', center_id: 'center-b', status: 'upcoming' }
    ],
    effectiveCenterId: 'center-a'
  });

  assert.equal(centerMismatch.visible_now, false);
  assert.ok(centerMismatch.reason_codes.includes('center_mismatch'));

  const lifecycleMismatch = getStudentVisibilityDiagnostics({
    courseStatus: 'active',
    classRows: [
      { course_id: 'course-4', center_id: 'center-a', status: 'closed' }
    ],
    effectiveCenterId: 'center-a'
  });

  assert.equal(lifecycleMismatch.visible_now, false);
  assert.ok(lifecycleMismatch.reason_codes.includes('class_lifecycle_mismatch'));
});

test('course list builder enriches admin payload with visibility fields', () => {
  const courses = [
    { id: 'course-1', status: 'active', title: 'Python' },
    { id: 'course-2', status: 'inactive', title: 'Docker' }
  ];

  const classes = [
    { course_id: 'course-1', center_id: 'center-a', status: 'ongoing' },
    { course_id: 'course-2', center_id: 'center-a', status: 'ongoing' }
  ];

  const enriched = buildCoursesWithStudentVisibility({
    courses,
    classRows: classes,
    effectiveCenterId: 'center-a'
  });

  assert.equal(enriched.length, 2);
  assert.equal(enriched[0].student_visible_now, true);
  assert.equal(enriched[1].student_visible_now, false);
  assert.ok(Array.isArray(enriched[1].student_visibility_reason_labels));
});
