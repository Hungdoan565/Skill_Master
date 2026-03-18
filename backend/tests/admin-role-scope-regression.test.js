import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8',
);

const centersHookSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'centers', 'hooks', 'useCenters.js'),
  'utf8',
);

const userManagementSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'user-management', 'pages', 'UserManagementPage.jsx'),
  'utf8',
);

const adminSidebarSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'components', 'layout', 'admin-sidebar.jsx'),
  'utf8',
);

const dashboardPageSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'dashboard', 'pages', 'DashboardPage.jsx'),
  'utf8',
);

const adminDashboardSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'admin-dashboard', 'pages', 'AdminDashboardPage.jsx'),
  'utf8',
);

const managerDashboardSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'dashboard', 'pages', 'ManagerDashboardPage.jsx'),
  'utf8',
);

test('strategic and center admin routes use canonical roleCode field', () => {
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/centers'[\s\S]*const userRole = req\.user\.roleCode/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/centers\/:id'[\s\S]*const userRole = req\.user\.roleCode/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/centers\/:id\/stats'[\s\S]*const userRole = req\.user\.roleCode/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/audit-logs'[\s\S]*const userRole = req\.user\?\.roleCode/,
  );
});

test('center responses are normalized for top-level count contract', () => {
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/centers'[\s\S]*normalizeCenterCounts\(/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/centers\/:id'[\s\S]*normalizeCenterCounts\(/,
  );
  assert.match(
    centersHookSource,
    /rooms_count:\s*center\.rooms_count\s*\?\?\s*stats\.roomCount\s*\?\?\s*0/,
  );
  assert.match(
    centersHookSource,
    /teachers_count:\s*center\.teachers_count\s*\?\?\s*stats\.staffCount\s*\?\?\s*0/,
  );
  assert.match(
    centersHookSource,
    /students_count:\s*center\.students_count\s*\?\?\s*stats\.studentCount\s*\?\?\s*0/,
  );
});

test('user management page uses API_URL base and explicit network error surfacing', () => {
  assert.match(
    userManagementSource,
    /const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000';/,
  );
  assert.match(
    userManagementSource,
    /fetch\(`\$\{API_URL\}\/api\/admin\/users\?/,
  );
  assert.match(
    userManagementSource,
    /setNetworkError\('/,
  );
});

test('student detail and admin attendance routes do not rely on admin shell assumptions', () => {
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/students\/:id',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN', 'CENTER_MANAGER'\]\)/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/sessions\/:sessionId\/attendance',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN', 'CENTER_MANAGER'\]\)/,
  );
  assert.match(
    backendSource,
    /app\.post\('\/api\/admin\/sessions\/:sessionId\/attendance',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN', 'CENTER_MANAGER'\]\)/,
  );
});

test('cross-center strategic report routes stay super-admin only', () => {
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/reports\/revenue',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN'\]\)/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/reports\/enrollment',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN'\]\)/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/reports\/attendance',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN'\]\)/,
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/admin\/reports\/staff',\s*requireAuth,\s*requireRole\(\['SUPER_ADMIN'\]\)/,
  );
});

test('dashboard routing and sidebar semantics separate governance from center operations', () => {
  assert.match(
    dashboardPageSource,
    /if \(isSuperAdmin\?\.\(\)\) \{\s*return <AdminDashboardPage \/>;\s*\}/,
  );
  assert.match(
    dashboardPageSource,
    /if \(isManager\?\.\(\)\) \{\s*return <ManagerDashboardPage \/>;\s*\}/,
  );
  assert.match(
    adminDashboardSource,
    /Bảng điều hành chiến lược/,
  );
  assert.match(
    managerDashboardSource,
    /Tổng quan vận hành trung tâm/,
  );
});

test('super-admin sidebar avoids center-manager operational clutter', () => {
  const startIndex = adminSidebarSource.indexOf('const superAdminMenuGroups = [');
  const endIndex = adminSidebarSource.indexOf('// CENTER_MANAGER: Operational menu');
  const superAdminSection = startIndex >= 0 && endIndex > startIndex
    ? adminSidebarSource.slice(startIndex, endIndex)
    : '';

  assert.ok(superAdminSection.length > 0);
  assert.doesNotMatch(superAdminSection, /path: '\/admin\/staff'/);
  assert.doesNotMatch(superAdminSection, /path: '\/admin\/leave-requests'/);
  assert.doesNotMatch(superAdminSection, /path: '\/admin\/payroll'/);
  assert.doesNotMatch(superAdminSection, /path: '\/admin\/payroll-disputes'/);
});

test('manager sidebar keeps center-operations items that support daily execution', () => {
  const startIndex = adminSidebarSource.indexOf('const managerMenuGroups = [');
  const endIndex = adminSidebarSource.indexOf('const VISITED_STORAGE_KEY');
  const managerSection = startIndex >= 0 && endIndex > startIndex
    ? adminSidebarSource.slice(startIndex, endIndex)
    : '';

  assert.ok(managerSection.length > 0);
  assert.match(managerSection, /path: '\/admin\/staff'/);
  assert.match(managerSection, /path: '\/admin\/support'/);
  assert.match(managerSection, /path: '\/admin\/overdue-invoices'/);
  assert.match(managerSection, /title: 'VẬN HÀNH TRUNG TÂM'/);
});
