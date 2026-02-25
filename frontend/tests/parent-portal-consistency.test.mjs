import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

test('Parent route uses studentId parameter', () => {
  const app = read('frontend/src/App.jsx');
  assert.match(app, /path="child\/:studentId"/, 'App.jsx should use :studentId parameter');
});

test('ParentChildDetail extracts studentId from params', () => {
  const detail = read('frontend/src/features/parent-portal/pages/ParentChildDetail.jsx');
  assert.match(detail, /const \{ studentId \} = useParams\(\);/, 'ParentChildDetail should extract studentId');
  assert.match(detail, /studentId=\{studentId\}/, 'ParentChildDetail should pass studentId to tabs');
});

test('ParentSidebar links resolve to defined routes', () => {
  const sidebar = read('frontend/src/components/layout/parent-sidebar.jsx');
  const app = read('frontend/src/App.jsx');
  
  // Extract paths from sidebar
  const paths = [...sidebar.matchAll(/path: '(\/parent\/[^']+)'/g)].map(m => m[1]);
  
  // Check each path
  paths.forEach(p => {
    const subPath = p.replace('/parent/', '');
    const regex = new RegExp(`path="${subPath}"`);
    assert.match(app, regex, `App.jsx should have route for ${subPath}`);
  });
});

test('Hooks consume canonical data structures', () => {
  const useSchedule = read('frontend/src/features/parent-portal/hooks/useParentChildSchedule.js');
  const useGrades = read('frontend/src/features/parent-portal/hooks/useParentChildGrades.js');
  const useAttendance = read('frontend/src/features/parent-portal/hooks/useParentChildAttendance.js');
  const useInvoices = read('frontend/src/features/parent-portal/hooks/useParentChildInvoices.js');
  const useChildren = read('frontend/src/features/parent-portal/hooks/useParentChildren.js');

  assert.match(useSchedule, /result\.data\?\.events/, 'useParentChildSchedule should use events');
  assert.match(useGrades, /result\.data\?\.gradesByClass/, 'useParentChildGrades should use gradesByClass');
  assert.match(useAttendance, /result\.data\?\.attendance/, 'useParentChildAttendance should use attendance');
  assert.match(useInvoices, /result\.data\?\.invoices/, 'useParentChildInvoices should use invoices');
  assert.match(useChildren, /result\.data\?\.children/, 'useParentChildren should use children');
});

test('ParentChildDetail uses canonical field names', () => {
  const detail = read('frontend/src/features/parent-portal/pages/ParentChildDetail.jsx');
  
  // Schedule
  assert.match(detail, /cls\.className/, 'Should use className');
  assert.match(detail, /cls\.courseTitle/, 'Should use courseTitle');
  assert.match(detail, /cls\.dayOfWeek/, 'Should use dayOfWeek');
  assert.match(detail, /cls\.startTime/, 'Should use startTime');
  
  // Grades
  assert.match(detail, /grade\.className/, 'Should use className for grades');
  assert.match(detail, /grade\.gradeType/, 'Should use gradeType');
  assert.match(detail, /grade\.assessmentDate/, 'Should use assessmentDate');
  
  // Attendance
  assert.match(detail, /att\.sessionDate/, 'Should use sessionDate');
  assert.match(detail, /att\.status === 'present'/, 'Should use status');
  
  // Invoices
  assert.match(detail, /inv\.issue_date/, 'Should use issue_date');
  assert.match(detail, /inv\.final_amount/, 'Should use final_amount');
});
