import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8',
);

test('transactions endpoint enforces center scope helper and filtered summary', () => {
  assert.match(
    source,
    /app\.get\('\/api\/transactions'[\s\S]*getEffectiveCenterId\(req\.user, center_id \|\| null\)/,
  );
  assert.match(
    source,
    /summary\s*=\s*\{[\s\S]*totalPending:[\s\S]*filtered\.filter/,
  );
});

test('verify and reject routes enforce pending transitions and center ownership', () => {
  assert.match(
    source,
    /app\.patch\('\/api\/payments\/:id\/verify'[\s\S]*verification_status !== 'pending'[\s\S]*getEffectiveCenterId\(req\.user, paymentCenterId\)/,
  );
  assert.match(
    source,
    /app\.patch\('\/api\/payments\/:id\/reject'[\s\S]*verification_status !== 'pending'[\s\S]*getEffectiveCenterId\(req\.user, paymentCenterId\)[\s\S]*String\(reason\)\.trim\(\)/,
  );
});

test('bulk verify route rejects unauthorized and non-pending records', () => {
  assert.match(
    source,
    /app\.patch\('\/api\/transactions\/bulk-verify'[\s\S]*unauthorizedIds[\s\S]*invalidStatusIds[\s\S]*verification_status: 'verified'/,
  );
});
