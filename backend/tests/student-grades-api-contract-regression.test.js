import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8'
);

test('student grades route keeps backward-compatible default contract', () => {
  assert.match(backendSource, /app\.get\('\/api\/student\/grades'/);
  assert.match(backendSource, /const\s*\{\s*classId\s*\}\s*=\s*req\.query/);
  assert.match(backendSource, /classSummaries/);
  assert.match(backendSource, /statistics:/);
});

test('student grades default route still responds with success wrapper', () => {
  assert.match(backendSource, /res\.json\(\{\s*success: true,\s*data:/);
  assert.match(backendSource, /grades:/);
});
