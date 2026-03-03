import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8',
);

test('strategic feeds expose shared metadata contract', () => {
  assert.match(
    source,
    /app\.get\('\/api\/admin\/system-dashboard'[\s\S]*meta:\s*buildStrategicMeta\(/,
  );
  assert.match(
    source,
    /app\.get\('\/api\/admin\/center-health'[\s\S]*meta:\s*buildStrategicMeta\(/,
  );
  assert.match(
    source,
    /app\.get\('\/api\/admin\/revenue-trend'[\s\S]*meta:\s*buildStrategicMeta\(/,
  );
  assert.match(
    source,
    /app\.get\('\/api\/admin\/anomalies'[\s\S]*meta:\s*buildStrategicMeta\(/,
  );
  assert.match(
    source,
    /app\.get\('\/api\/admin\/audit-logs'[\s\S]*meta:\s*buildStrategicMeta\(/,
  );
});

test('revenue trend uses verified payment semantics with center join path', () => {
  assert.match(
    source,
    /app\.get\('\/api\/admin\/revenue-trend'[\s\S]*select\('amount, invoices!inner\(classes!inner\(center_id\)\)'\)[\s\S]*eq\('verification_status', 'verified'\)[\s\S]*eq\('invoices\.classes\.center_id', center\.id\)/,
  );
});

test('anomaly payload includes lifecycle and SLA fields', () => {
  assert.match(
    source,
    /app\.get\('\/api\/admin\/anomalies'[\s\S]*state:\s*ANOMALY_LIFECYCLE_STATES\[0\][\s\S]*due_at:\s*defaultDueAt[\s\S]*source_metric_id:[\s\S]*sla_breached:[\s\S]*lifecycle_states:\s*ANOMALY_LIFECYCLE_STATES/,
  );
});
