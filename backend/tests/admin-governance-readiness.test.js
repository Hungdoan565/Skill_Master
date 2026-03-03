import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANOMALY_LIFECYCLE_STATES,
  STRATEGIC_KPI_DICTIONARY,
  buildGovernanceReadiness,
} from '../src/lib/admin-kpi-dictionary.js';

test('governance readiness returns healthy when all checks pass', () => {
  const readiness = buildGovernanceReadiness({
    roleBoundaryOk: true,
    auditPipelineHealthy: true,
    strategicFeedsFresh: true,
    failedChecks: [],
  });

  assert.equal(readiness.status, 'healthy');
  assert.equal(readiness.score, 100);
  assert.equal(readiness.checks.length, 3);
});

test('governance readiness returns warning when partial checks fail', () => {
  const readiness = buildGovernanceReadiness({
    roleBoundaryOk: true,
    auditPipelineHealthy: false,
    strategicFeedsFresh: true,
    failedChecks: ['AUDIT_SQL_RPC_FALLBACK'],
  });

  assert.equal(readiness.status, 'warning');
  assert.equal(readiness.score, 67);
  assert.deepEqual(readiness.failedChecks, ['AUDIT_SQL_RPC_FALLBACK']);
});

test('governance readiness returns degraded when all checks fail', () => {
  const readiness = buildGovernanceReadiness({
    roleBoundaryOk: false,
    auditPipelineHealthy: false,
    strategicFeedsFresh: false,
    failedChecks: ['role_boundary', 'audit_pipeline', 'strategic_feeds_fresh'],
  });

  assert.equal(readiness.status, 'degraded');
  assert.equal(readiness.score, 0);
});

test('kpi dictionary has formula intent for all configured metrics', () => {
  assert.ok(Array.isArray(STRATEGIC_KPI_DICTIONARY.metrics));
  assert.ok(STRATEGIC_KPI_DICTIONARY.metrics.length > 0);

  STRATEGIC_KPI_DICTIONARY.metrics.forEach((metric) => {
    assert.ok(metric.id);
    assert.ok(metric.ownerRole);
    assert.ok(metric.cadence);
    assert.ok(metric.formulaIntent);
  });
});

test('anomaly lifecycle states include required governance states', () => {
  assert.deepEqual(
    ANOMALY_LIFECYCLE_STATES,
    ['new', 'assigned', 'investigating', 'resolved', 'expired'],
  );
});
