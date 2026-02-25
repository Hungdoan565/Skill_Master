import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  createParentStudentLink,
  updateParentStudentLink,
  deactivateParentStudentLink,
} from '../src/services/parentStudentLinkService.js';

function buildSupabase({ usersById, existingLinkById } = {}) {
  const calls = {
    inserted: null,
    updated: null,
  };

  const supabase = {
    calls,
    from(table) {
      if (table === 'users') {
        return {
          select() {
            return this;
          },
          eq(_col, userId) {
            this._userId = userId;
            return this;
          },
          single() {
            const data = usersById?.[this._userId] ?? null;
            if (!data) {
              return Promise.resolve({ data: null, error: { message: 'not found' } });
            }
            return Promise.resolve({ data, error: null });
          },
        };
      }

      if (table === 'parent_student_links') {
        return {
          insert(payload) {
            calls.inserted = payload;
            return this;
          },
          update(payload) {
            calls.updated = payload;
            return this;
          },
          select() {
            return this;
          },
          eq(_col, id) {
            this._linkId = id;
            return this;
          },
          single() {
            // Used by: insert().select().single(), update().select().single(), and select().eq().single()
            if (calls.inserted) {
              return Promise.resolve({ data: { id: 'link-1', ...calls.inserted }, error: null });
            }

            if (calls.updated) {
              return Promise.resolve({ data: { id: this._linkId || 'link-1', ...calls.updated }, error: null });
            }

            const existing = existingLinkById?.[this._linkId] ?? null;
            if (!existing) {
              return Promise.resolve({ data: null, error: { message: 'not found' } });
            }
            return Promise.resolve({ data: existing, error: null });
          },
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  };

  return supabase;
}

test('create allows SUPER_ADMIN and persists audit fields', async () => {
  const supabase = buildSupabase({
    usersById: {
      'parent-1': { id: 'parent-1', center_id: 'center-a', roles: { code: 'PARENT' } },
      'student-1': { id: 'student-1', center_id: 'center-a', roles: { code: 'STUDENT' } },
    },
  });

  const actor = { id: 'admin-1', roleCode: 'SUPER_ADMIN', centerId: null };

  const result = await createParentStudentLink({
    supabase,
    actor,
    payload: {
      parent_id: 'parent-1',
      student_id: 'student-1',
      relationship: 'father',
      is_primary: true,
      can_pay: true,
      can_view_academics: false,
    },
  });

  assert.equal(result.success, true);
  assert.equal(supabase.calls.inserted.created_by, 'admin-1');
  assert.equal(supabase.calls.inserted.status, 'active');
  assert.equal(typeof supabase.calls.inserted.updated_at, 'string');
});

test('create allows CENTER_MANAGER when student center matches', async () => {
  const supabase = buildSupabase({
    usersById: {
      'parent-1': { id: 'parent-1', center_id: 'center-a', roles: { code: 'PARENT' } },
      'student-1': { id: 'student-1', center_id: 'center-a', roles: { code: 'STUDENT' } },
    },
  });

  const actor = { id: 'mgr-1', roleCode: 'CENTER_MANAGER', centerId: 'center-a' };
  const result = await createParentStudentLink({
    supabase,
    actor,
    payload: { parent_id: 'parent-1', student_id: 'student-1', relationship: 'guardian' },
  });

  assert.equal(result.success, true);
  assert.equal(supabase.calls.inserted.created_by, 'mgr-1');
});

test('create denies CENTER_MANAGER for cross-center student targets', async () => {
  const supabase = buildSupabase({
    usersById: {
      'parent-1': { id: 'parent-1', center_id: 'center-a', roles: { code: 'PARENT' } },
      'student-1': { id: 'student-1', center_id: 'center-b', roles: { code: 'STUDENT' } },
    },
  });

  const actor = { id: 'mgr-1', roleCode: 'CENTER_MANAGER', centerId: 'center-a' };
  const result = await createParentStudentLink({
    supabase,
    actor,
    payload: { parent_id: 'parent-1', student_id: 'student-1', relationship: 'mother' },
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 403);
  assert.equal(supabase.calls.inserted, null);
});

test('update enforces center scope and persists updated_at', async () => {
  const supabase = buildSupabase({
    existingLinkById: {
      'link-1': { id: 'link-1', status: 'active', student: { id: 'student-1', center_id: 'center-a' } },
    },
  });

  const actor = { id: 'mgr-1', roleCode: 'CENTER_MANAGER', centerId: 'center-a' };
  const result = await updateParentStudentLink({
    supabase,
    actor,
    linkId: 'link-1',
    payload: { can_pay: false },
  });

  assert.equal(result.success, true);
  assert.equal(supabase.calls.updated.can_pay, false);
  assert.equal(typeof supabase.calls.updated.updated_at, 'string');
});

test('deactivate denies CENTER_MANAGER for cross-center links', async () => {
  const supabase = buildSupabase({
    existingLinkById: {
      'link-1': { id: 'link-1', status: 'active', student: { id: 'student-1', center_id: 'center-b' } },
    },
  });

  const actor = { id: 'mgr-1', roleCode: 'CENTER_MANAGER', centerId: 'center-a' };
  const result = await deactivateParentStudentLink({ supabase, actor, linkId: 'link-1' });

  assert.equal(result.success, false);
  assert.equal(result.status, 403);
  assert.equal(supabase.calls.updated, null);
});

test('routes exist with requireAuth/requireRole and canonical envelopes', () => {
  const source = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'src', 'index.js'), 'utf8');

  assert.match(
    source,
    /app\.post\('\/api\/admin\/parent-student-links'[\s\S]*requireAuth[\s\S]*requireRole\(\['SUPER_ADMIN', 'CENTER_MANAGER'\]\)[\s\S]*res\.status\(201\)\.json\([\s\S]*success: true[\s\S]*data:/,
  );

  assert.match(
    source,
    /app\.patch\('\/api\/admin\/parent-student-links\/:linkId'[\s\S]*requireAuth[\s\S]*requireRole\(\['SUPER_ADMIN', 'CENTER_MANAGER'\]\)/,
  );

  assert.match(
    source,
    /app\.post\('\/api\/admin\/parent-student-links\/:linkId\/deactivate'[\s\S]*requireAuth[\s\S]*requireRole\(\['SUPER_ADMIN', 'CENTER_MANAGER'\]\)/,
  );
});
