import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeParentChild, normalizeParentChildren, normalizeParentInvoice, getInvoiceUrgency } from './normalizers.js';

test('normalizes parent child payloads from backend route shape into UI-safe fields', () => {
    const normalized = normalizeParentChild({
        linkId: 'link-1',
        studentId: 'student-1',
        studentName: 'Hưng Đoàn',
        studentEmail: 'hungdoan1304@gmail.com',
        studentPhone: '0909000000',
        avatarUrl: 'https://example.com/avatar.png',
        dateOfBirth: '2010-05-01',
        relationship: 'father',
        isPrimary: true,
        canPay: true,
        canViewAcademics: true,
        centerName: 'Skill Master Main Center',
        stats: {
            activeClasses: 2,
            unpaidInvoices: 1,
            unpaidAmount: 1500000,
        },
    });

    assert.equal(normalized.id, 'student-1');
    assert.equal(normalized.link_id, 'link-1');
    assert.equal(normalized.full_name, 'Hưng Đoàn');
    assert.equal(normalized.email, 'hungdoan1304@gmail.com');
    assert.equal(normalized.phone, '0909000000');
    assert.equal(normalized.avatar_url, 'https://example.com/avatar.png');
    assert.equal(normalized.date_of_birth, '2010-05-01');
    assert.equal(normalized.relationship, 'father');
    assert.equal(normalized.is_primary, true);
    assert.equal(normalized.can_pay, true);
    assert.equal(normalized.can_view_academics, true);
    assert.equal(normalized.center_name, 'Skill Master Main Center');
    assert.equal(normalized.active_classes_count, 2);
    assert.equal(normalized.unpaid_invoices_count, 1);
    assert.equal(normalized.unpaid_amount, 1500000);
});

test('preserves already-normalized UI payloads and fills safe defaults', () => {
    const normalized = normalizeParentChild({
        id: 'student-2',
        full_name: 'Bé An',
        center_name: 'Skill Master Main Center',
    });

    assert.equal(normalized.id, 'student-2');
    assert.equal(normalized.full_name, 'Bé An');
    assert.equal(normalized.center_name, 'Skill Master Main Center');
    assert.equal(normalized.active_classes_count, 0);
    assert.equal(normalized.unpaid_amount, 0);
    assert.equal(normalized.unpaid_invoices_count, 0);
});

test('normalizes arrays safely', () => {
    assert.deepEqual(normalizeParentChildren(null), []);

    const normalized = normalizeParentChildren([{ studentId: 'student-3', studentName: 'Mai' }]);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].id, 'student-3');
    assert.equal(normalized[0].full_name, 'Mai');
});

test('normalizeParentInvoice preserves payments array from backend', () => {
    const invoice = normalizeParentInvoice({
        id: 'inv-1',
        invoice_code: 'INV-001',
        status: 'partial',
        final_amount: 2000000,
        paid_amount: 500000,
        due_date: '2026-03-25',
        discount_amount: 100000,
        description: 'Học phí IELTS tháng 3',
        payments: [
            { id: 'p-1', amount: 500000, payment_method: 'bank_transfer', verification_status: 'verified' },
        ],
    });

    assert.equal(invoice.invoice_number, 'INV-001');
    assert.equal(invoice.final_amount, 2000000);
    assert.equal(invoice.paid_amount, 500000);
    assert.equal(invoice.discount_amount, 100000);
    assert.equal(invoice.description, 'Học phí IELTS tháng 3');
    assert.equal(invoice.payments.length, 1);
    assert.equal(invoice.payments[0].verification_status, 'verified');
});

test('normalizeParentInvoice defaults payments to empty array', () => {
    const invoice = normalizeParentInvoice({ id: 'inv-2' });
    assert.deepEqual(invoice.payments, []);
    assert.equal(invoice.discount_amount, 0);
    assert.equal(invoice.description, null);
});

test('getInvoiceUrgency returns overdue for overdue status', () => {
    assert.equal(getInvoiceUrgency({ status: 'overdue' }), 'overdue');
});

test('getInvoiceUrgency returns overdue when due_date is in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    assert.equal(getInvoiceUrgency({ status: 'unpaid', due_date: yesterday.toISOString() }), 'overdue');
});

test('getInvoiceUrgency returns due-soon when due_date is within 3 days', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    assert.equal(getInvoiceUrgency({ status: 'unpaid', due_date: tomorrow.toISOString() }), 'due-soon');
});

test('getInvoiceUrgency returns unpaid for unpaid status with distant due_date', () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    assert.equal(getInvoiceUrgency({ status: 'unpaid', due_date: nextMonth.toISOString() }), 'unpaid');
});

test('getInvoiceUrgency handles paid and cancelled', () => {
    assert.equal(getInvoiceUrgency({ status: 'paid' }), 'paid');
    assert.equal(getInvoiceUrgency({ status: 'cancelled' }), 'cancelled');
});

test('getInvoiceUrgency returns pending for pending status', () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    assert.equal(getInvoiceUrgency({ status: 'pending', due_date: nextMonth.toISOString() }), 'pending');
});
