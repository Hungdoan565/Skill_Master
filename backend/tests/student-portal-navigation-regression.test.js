import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const studentSidebarSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'components', 'layout', 'student-sidebar.jsx'),
    'utf8',
);

const appSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'App.jsx'),
    'utf8',
);

const backendSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
    'utf8',
);

const studentAssessmentPageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'assessment', 'pages', 'StudentAssessmentPage.jsx'),
    'utf8',
);

const assignmentsWorkspacePageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'assignments', 'pages', 'AssignmentsWorkspacePage.jsx'),
    'utf8',
);

test('student sidebar exposes assessment and assignments navigation', () => {
    assert.match(studentSidebarSource, /label: 'Bài kiểm tra'/);
    assert.match(studentSidebarSource, /path: '\/student\/assessment'/);
    assert.match(studentSidebarSource, /label: 'Bài tập'/);
    assert.match(studentSidebarSource, /path: '\/student\/assignments'/);
});

test('student routes keep assessment and assignments pages mounted under student layout', () => {
    assert.match(appSource, /<Route path="assessment" element=\{<Suspense fallback=\{<PageLoader \/>\}><StudentAssessmentPage \/><\/Suspense>\} \/>/);
    assert.match(appSource, /<Route path="assignments" element=\{<Suspense fallback=\{<PageLoader \/>\}><AssignmentsWorkspacePage \/><\/Suspense>\} \/>/);
});

test('student assessment page is localized and does not require manual center input for students', () => {
    assert.match(studentAssessmentPageSource, /Bài kiểm tra đánh giá/);
    assert.doesNotMatch(studentAssessmentPageSource, /Center ID/);
    assert.doesNotMatch(studentAssessmentPageSource, /body: JSON\.stringify\(\{ centerId \}\)/);
    assert.match(studentAssessmentPageSource, /profile\?\.centerId\s*\|\|\s*profile\?\.center_id/);
    assert.match(studentAssessmentPageSource, /Trung tâm/);
});

test('student assignments page is localized and does not require manual center input for students', () => {
    assert.match(assignmentsWorkspacePageSource, /Bài tập/);
    assert.doesNotMatch(assignmentsWorkspacePageSource, /Structured Assignments/);
    assert.doesNotMatch(assignmentsWorkspacePageSource, /Center ID/);
    assert.match(assignmentsWorkspacePageSource, /const scopeParam = isStudent \? '' :/);
    assert.match(assignmentsWorkspacePageSource, /body: JSON\.stringify\(\{[\s\S]*content: \{ text: contentText \}[\s\S]*\}\)/);
});

test('backend enables student assessment and assignments flows without rollout denial and uses service-role backed queries', () => {
    assert.match(backendSource, /flagKey === CORE_GAP_FLAGS\.ONLINE_ASSESSMENT/);
    assert.match(backendSource, /flagKey === CORE_GAP_FLAGS\.STRUCTURED_ASSIGNMENTS/);
    assert.match(backendSource, /app\.get\('\/api\/assignments'[\s\S]*const supabaseClient = supabaseAdmin/);
    assert.match(backendSource, /app\.post\('\/api\/assignments\/:id\/submit'[\s\S]*const supabaseClient = supabaseAdmin/);
    assert.doesNotMatch(backendSource, /Tính năng assignments chưa được bật/);
});
