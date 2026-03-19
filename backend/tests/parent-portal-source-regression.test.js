import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'src', 'index.js'), 'utf8');

test('parent dashboard query pins the users->centers foreign key to avoid ambiguous embed errors', () => {
    assert.match(
        source,
        /app\.get\('\/api\/parent\/dashboard'[\s\S]*student:users!parent_student_links_student_id_fkey\([\s\S]*center:centers!users_center_id_fkey\(id, name\)/,
    );
});

test('parent children query pins the users->centers foreign key to avoid ambiguous embed errors', () => {
    assert.match(
        source,
        /app\.get\('\/api\/parent\/children'[\s\S]*student:users!parent_student_links_student_id_fkey\([\s\S]*center:centers!users_center_id_fkey\(id, name\)/,
    );
});

test('parent child schedule route queries sessions instead of legacy class schedule shape', () => {
    assert.match(
        source,
        /app\.get\('\/api\/parent\/child\/:studentId\/schedule'[\s\S]*\.from\('sessions'\)[\s\S]*course:courses\(id, title\)/,
    );
});

test('parent child grades route uses grade structures plus enrollments like the student contract', () => {
    assert.match(
        source,
        /app\.get\('\/api\/parent\/child\/:studentId\/grades'[\s\S]*grade_structure:grade_structures\(id, name, weight, max_score\)[\s\S]*enrollment:enrollments!inner\(/,
    );
});

test('parent child invoices route uses invoice_code and description fields from the current invoice schema', () => {
    assert.match(
        source,
        /app\.get\('\/api\/parent\/child\/:studentId\/invoices'[\s\S]*invoice_code, amount, discount_amount, final_amount,[\s\S]*description, created_at/,
    );
});

test('POST /api/invoices/:id/payments allows PARENT role', () => {
    assert.match(
        source,
        /app\.post\('\/api\/invoices\/:id\/payments'.*requireRole\(\[.*'PARENT'.*\]\)/,
    );
});

test('PARENT payment branch checks parent_student_links for can_pay permission', () => {
    assert.match(
        source,
        /userRole === 'PARENT'[\s\S]*parent_student_links[\s\S]*can_pay/,
    );
});

