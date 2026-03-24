import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
    'utf8',
);

const laborContractsPageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'staff', 'pages', 'LaborContractsPage.jsx'),
    'utf8',
);

const adminSidebarSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'components', 'layout', 'admin-sidebar.jsx'),
    'utf8',
);

const assessmentManagementPageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'assessment', 'pages', 'AssessmentManagementPage.jsx'),
    'utf8',
);

const assessmentCenterScopeMigrationSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'database', '103_assessment_center_scope.sql'),
    'utf8',
);
test('labor contract api responses keep Vietnamese messages in UTF-8 text', () => {
    assert.match(
        backendSource,
        /app\.post\('\/api\/admin\/hr\/contracts'[\s\S]*message: 'Thiếu thông tin hợp đồng bắt buộc'/,
    );
    assert.match(
        backendSource,
        /app\.post\('\/api\/admin\/hr\/contracts\/:id\/transition'[\s\S]*message: 'Không tìm thấy hợp đồng'/,
    );
    assert.doesNotMatch(
        backendSource,
        /app\.post\('\/api\/admin\/hr\/contracts'[\s\S]*message: 'Thiáº¿u thÃ´ng tin há»£p Ä‘á»“ng báº¯t buá»™c'/,
    );
    assert.doesNotMatch(
        backendSource,
        /app\.post\('\/api\/admin\/hr\/contracts\/:id\/transition'[\s\S]*message: 'KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng'/,
    );
});

test('labor contract routes are available without rollout-gate denial after menu exposure', () => {
    assert.doesNotMatch(
        backendSource,
        /app\.get\('\/api\/admin\/hr\/contracts'[\s\S]*Tính năng hợp đồng lao động chưa được bật/,
    );
    assert.doesNotMatch(
        backendSource,
        /app\.post\('\/api\/admin\/hr\/contracts'[\s\S]*Tính năng hợp đồng lao động chưa được bật/,
    );
});
test('labor contracts page uses localized labels and explicit empty states', () => {
    assert.match(laborContractsPageSource, /Hợp đồng lao động/);
    assert.match(laborContractsPageSource, /Mã hợp đồng/);
    assert.match(laborContractsPageSource, /Nhân sự/);
    assert.match(laborContractsPageSource, /Chưa có hợp đồng nào trong trung tâm hiện tại/);
});

test('labor contracts page prefers scoped center id and does not post conflicting manual center ids for managers', () => {
    assert.match(laborContractsPageSource, /const scopedCenterId = profile\?\.center_id\s*\|\|\s*profile\?\.centerId\s*\|\|\s*''/);
    assert.doesNotMatch(
        laborContractsPageSource,
        /authFetch\('\/api\/admin\/hr\/contracts',[\s\S]*body:\s*JSON\.stringify\([\s\S]*centerId,/,
    );
    assert.doesNotMatch(
        laborContractsPageSource,
        /authFetch\(`\/api\/admin\/hr\/contracts\/\$\{contractId\}\/transition`,[\s\S]*body:\s*JSON\.stringify\([\s\S]*centerId,/,
    );
    assert.match(laborContractsPageSource, /profile\?\.centers\?\.code\s*\|\|\s*profile\?\.centers\?\.name\s*\|\|\s*scopedCenterId/);
});

test('labor contracts page uses staff lookup instead of raw free-text id entry', () => {
    assert.match(laborContractsPageSource, /authFetch\(`\/api\/admin\/staff\$\{scopeParam\}`/);
    assert.match(laborContractsPageSource, /SelectValue placeholder="Chọn nhân sự"/);
    assert.match(laborContractsPageSource, /setError\('Vui lòng chọn nhân sự hợp lệ từ danh sách'\)/);
    assert.match(laborContractsPageSource, /setError\('Không thể tải danh sách nhân sự của trung tâm hiện tại' \+ \(err\?\.message \? `: \$\{err\.message\}` : ''\)\)/);
});

test('admin sidebar exposes assessment management navigation only for center manager', () => {
    assert.match(adminSidebarSource, /const superAdminMenuGroups = \[/);
    const superAdminSection = adminSidebarSource.split('const managerMenuGroups = [')[0];
    assert.doesNotMatch(superAdminSection, /Quản lý bài kiểm tra/);
    assert.match(
        adminSidebarSource,
        /const managerMenuGroups = \[[\s\S]*label: 'Quản lý bài kiểm tra', icon: ClipboardCheck, path: '\/admin\/assessment'/,
    );
});

test('assessment management page also prefers canonical scoped center id', () => {
    assert.match(assessmentManagementPageSource, /profile\?\.centerId\s*\|\|\s*profile\?\.center_id\s*\|\|\s*''/);
});

test('assessment management page does not read centerId before state initialization', () => {
    assert.doesNotMatch(
        assessmentManagementPageSource,
        /const centerDisplayValue = roleCode === 'SUPER_ADMIN'[\s\S]*\? centerId[\s\S]*const \[centerId, setCenterId\] = useState\(defaultCenterId\);/
    );
});

test('backend core-gap helpers default-enable assessment and labor-contract management after menu exposure', () => {
    assert.match(backendSource, /flagKey === CORE_GAP_FLAGS\.LABOR_CONTRACTS/);
    assert.match(backendSource, /flagKey === CORE_GAP_FLAGS\.ONLINE_ASSESSMENT/);
});

test('assessment and labor contract admin routes use service-role backed clients for admin management writes', () => {
    assert.match(
        backendSource,
        /app\.get\('\/api\/assessment\/tests'[\s\S]*const supabaseClient = supabaseAdmin/,
    );
    assert.match(
        backendSource,
        /app\.post\('\/api\/assessment\/tests'[\s\S]*const supabaseClient = supabaseAdmin/,
    );
    assert.match(
        backendSource,
        /app\.post\('\/api\/admin\/hr\/contracts'[\s\S]*const supabaseClient = supabaseAdmin/,
    );
    assert.match(
        backendSource,
        /app\.get\('\/api\/admin\/hr\/contracts'[\s\S]*const supabaseClient = supabaseAdmin/,
    );
});

test('assessment backend keeps legacy-schema compatibility probes for center-scoped management', () => {
    assert.match(backendSource, /async function getAssessmentSchemaCapabilities\(/);
    assert.match(backendSource, /testsHaveCenterId/);
    assert.match(backendSource, /questionsHaveCenterId/);
});

test('assessment creation normalizes unsupported legacy category values before insert', () => {
    assert.match(backendSource, /function normalizeAssessmentCategory\(/);
    assert.match(backendSource, /if \(normalized === 'placement'\) return 'general';/);
});

test('assessment schema migration adds center-aware columns required by management backend', () => {
    assert.match(assessmentCenterScopeMigrationSource, /ALTER TABLE public\.assessment_tests/);
    assert.match(assessmentCenterScopeMigrationSource, /ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public\.centers\(id\)/);
    assert.match(assessmentCenterScopeMigrationSource, /ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public\.users\(id\)/);
    assert.match(assessmentCenterScopeMigrationSource, /ALTER TABLE public\.assessment_questions/);
    assert.match(assessmentCenterScopeMigrationSource, /ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public\.centers\(id\)/);
});
