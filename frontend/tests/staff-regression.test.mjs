import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('default staff list only targets teacher and center manager roles', () => {
  const backendIndex = readRepoFile('backend/src/index.js');
  const staffListRoute = backendIndex.match(
    /app\.get\('\/api\/admin\/staff',[\s\S]*?\/\/ ====== CENTER FILTER ======/,
  )?.[0] ?? '';

  assert.match(
    staffListRoute,
    /\.in\('code',\s*\['TEACHER',\s*'CENTER_MANAGER'\]\)/,
    'Staff list should resolve only TEACHER and CENTER_MANAGER roles by default',
  );
});

test('edit staff modal does not feed an empty-string option into SimpleSelect', () => {
  const editStaffModal = readRepoFile('frontend/src/features/staff/components/EditStaffModal.jsx');

  assert.doesNotMatch(
    editStaffModal,
    /value:\s*''\s*,\s*label:\s*'-- Không gán --'/,
    'Edit staff modal should rely on placeholder/empty state instead of an empty Select item value',
  );
});
