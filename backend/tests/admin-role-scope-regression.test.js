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
