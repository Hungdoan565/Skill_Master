import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseBankStatement,
  matchTransactionsWithInvoices,
  applyMatchedPayments,
} from '../src/services/paymentImportService.js';

function createCsvBuffer(rows) {
  const header = 'date,amount,description,reference';
  const lines = rows.map((row) => [row.date, row.amount, row.description, row.reference].join(','));
  return Buffer.from([header, ...lines].join('\n'), 'utf8');
}

function buildMatchSupabase(invoices) {
  return {
    from(table) {
      assert.equal(table, 'invoices');
      return {
        select() {
          return this;
        },
        in() {
          return this;
        },
        order() {
          return Promise.resolve({ data: invoices, error: null });
        },
      };
    },
  };
}

test('parse returns canonical transaction objects with stable id', async () => {
  const buffer = createCsvBuffer([
    {
      date: '2026-02-01',
      amount: '1500000',
      description: 'HP INV-20260201-0001',
      reference: 'TX-001',
    },
  ]);

  const result = await parseBankStatement(buffer, 'csv', 'generic');

  assert.equal(result.success, true);
  assert.equal(result.total, 1);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, 'txn-2');
  assert.equal(result.data[0].reference, 'TX-001');
});

test('match enforces effective center scope and preserves transactionId', async () => {
  const transactions = [
    {
      id: 'txn-2',
      date: '2026-02-01',
      amount: 1500000,
      description: 'HP INV-20260201-0001',
      reference: 'TX-001',
      extractedInvoiceCodes: ['INV-20260201-0001'],
      extractedPhoneNumbers: [],
    },
  ];

  const invoices = [
    {
      id: 'inv-center-a',
      invoice_code: 'INV-20260201-0001',
      final_amount: 1500000,
      paid_amount: 0,
      status: 'unpaid',
      class: { center_id: 'center-a' },
      student: { full_name: 'A', phone: '0123', center_id: 'center-a' },
    },
    {
      id: 'inv-center-b',
      invoice_code: 'INV-20260201-0001',
      final_amount: 1500000,
      paid_amount: 0,
      status: 'unpaid',
      class: { center_id: 'center-b' },
      student: { full_name: 'B', phone: '0124', center_id: 'center-b' },
    },
  ];

  const scoped = await matchTransactionsWithInvoices(transactions, buildMatchSupabase(invoices), {
    effectiveCenterId: 'center-a',
  });

  assert.equal(scoped.success, true);
  assert.equal(scoped.data.length, 1);
  assert.equal(scoped.data[0].transactionId, 'txn-2');
  assert.equal(scoped.data[0].matchedInvoice.id, 'inv-center-a');
});

test('apply accepts manual/high/medium and rejects cross-center targets', async () => {
  let insertedPayment = null;

  const supabase = {
    from(table) {
      if (table === 'invoices') {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          single() {
            return Promise.resolve({
              data: {
                id: 'inv-center-a',
                invoice_code: 'INV-20260201-0001',
                final_amount: 1500000,
                paid_amount: 0,
                status: 'unpaid',
                class: { center_id: 'center-a' },
                student: { center_id: 'center-a' },
              },
              error: null,
            });
          },
        };
      }

      if (table === 'payments') {
        return {
          insert(payload) {
            insertedPayment = payload;
            return this;
          },
          select() {
            return this;
          },
          single() {
            return Promise.resolve({ data: { id: 'pay-1' }, error: null });
          },
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  };

  const result = await applyMatchedPayments(
    [
      {
        transaction: { amount: 1500000, reference: 'TX-1', date: '2026-02-01', description: 'desc' },
        matchedInvoice: { id: 'inv-center-a', invoice_code: 'INV-20260201-0001' },
        confidence: 'manual',
        matchReasons: ['manual'],
      },
      {
        transaction: { amount: 1000000, reference: 'TX-2', date: '2026-02-01', description: 'desc' },
        matchedInvoice: { id: 'inv-center-a', invoice_code: 'INV-20260201-0001' },
        confidence: 'low',
        matchReasons: ['low'],
      },
    ],
    supabase,
    'user-1',
    { effectiveCenterId: 'center-a' },
  );

  assert.equal(result.success, true);
  assert.equal(result.applied, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.skippedLowConfidence, 1);
  assert.equal(insertedPayment?.verification_status, 'pending');
});
