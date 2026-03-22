import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'src');

function read(relativePath) {
    return readFileSync(path.join(root, relativePath), 'utf8');
}

test('shared staff modal uses theme-aware dark mode tokens', () => {
    const source = read('features/staff/components/SimpleModal.jsx');

    assert.match(source, /bg-card/);
    assert.match(source, /border border-border/);
    assert.match(source, /text-foreground/);
    assert.match(source, /hover:bg-muted/);
});

test('staff table uses dark-mode hover and readable text tokens', () => {
    const source = read('features/staff/components/StaffTable.jsx');

    assert.match(source, /hover:bg-muted\/50/);
    assert.match(source, /text-foreground/);
    assert.match(source, /text-muted-foreground/);
    assert.match(source, /dark:text-emerald-400/);
});

test('payroll table uses popover tokens and muted row hover', () => {
    const source = read('features/payroll/components/PayrollTable.jsx');

    assert.match(source, /hover:bg-muted\/50/);
    assert.match(source, /bg-popover/);
    assert.match(source, /text-popover-foreground/);
    assert.match(source, /dark:text-green-400/);
});

test('payroll modals use dark-safe card and helper surfaces', () => {
    const generateModalSource = read('features/payroll/components/GeneratePayrollModal.jsx');
    const bulkGenerateModalSource = read('features/payroll/components/BulkGeneratePayrollModal.jsx');
    const disputeModalSource = read('features/payroll/components/DisputeModal.jsx');
    const paymentProofSource = read('features/payroll/components/PaymentProofModal.jsx');

    assert.match(generateModalSource, /bg-card/);
    assert.match(generateModalSource, /dark:bg-zinc-950/);
    assert.match(generateModalSource, /dark:bg-black\/80/);
    assert.match(generateModalSource, /bg-muted\/50/);
    assert.match(generateModalSource, /text-foreground/);

    const detailModalSource = read('features/payroll/components/PayrollDetailModal.jsx');
    assert.match(detailModalSource, /dark:bg-zinc-950/);
    assert.match(detailModalSource, /dark:bg-black\/80/);
    assert.match(detailModalSource, /sticky top-0 z-20/);

    assert.match(bulkGenerateModalSource, /dark:bg-zinc-950/);
    assert.match(bulkGenerateModalSource, /dark:bg-black\/80/);
    assert.match(bulkGenerateModalSource, /dark:text-yellow-300/);

    assert.match(disputeModalSource, /dark:bg-zinc-950/);
    assert.match(disputeModalSource, /dark:bg-black\/80/);
    assert.match(disputeModalSource, /dark:text-yellow-300/);

    assert.match(paymentProofSource, /bg-card/);
    assert.match(paymentProofSource, /bg-background/);
    assert.match(paymentProofSource, /hover:bg-muted\/50/);
});
