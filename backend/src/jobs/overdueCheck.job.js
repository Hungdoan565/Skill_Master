/**
 * Overdue Check Job
 * Automatically marks invoices as overdue
 *
 * Schedule: Daily at 10:00 AM
 *
 * Logic:
 * - Find invoices where due_date < today AND status IN ('unpaid', 'partial')
 * - Update status to 'overdue'
 * - Log the changes
 *
 * NOTE: Worker is lazily initialized only when Redis is available
 */
import { Worker } from 'bullmq';
import { supabase } from '../lib/db.js';
import { getRedisConnectionInstance, isRedisAvailable } from './scheduler.js';

// Lazy-initialized worker
let _overdueCheckWorker = null;

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function logOverdueChange(invoiceId, previousStatus, newStatus, daysOverdue) {
  const { error } = await supabase
    .from('invoice_status_logs')
    .insert({
      invoice_id: invoiceId,
      old_status: previousStatus,
      new_status: newStatus,
      reason: 'auto_overdue_check',
      metadata: { days_overdue: daysOverdue },
      changed_at: new Date().toISOString(),
      changed_by: null
    });

  if (error) {
    console.error('Error logging overdue change:', error);
  }
}

async function calculateDaysOverdue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

async function processOverdueInvoices() {
  const today = new Date();
  const todayStr = formatDate(today);

  const results = {
    totalFound: 0,
    updated: 0,
    failed: 0,
    details: []
  };

  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select(`
      id, 
      invoice_code, 
      status, 
      due_date, 
      final_amount, 
      paid_amount,
      student:student_id(id, full_name, email)
    `)
    .lt('due_date', todayStr)
    .in('status', ['unpaid', 'partial']);

  if (error) {
    console.error('Error fetching overdue invoices:', error);
    throw error;
  }

  if (!overdueInvoices || overdueInvoices.length === 0) {
    console.log('📋 No invoices to mark as overdue');
    return results;
  }

  results.totalFound = overdueInvoices.length;
  console.log(`📋 Found ${overdueInvoices.length} invoices to mark as overdue`);

  for (const invoice of overdueInvoices) {
    try {
      const daysOverdue = await calculateDaysOverdue(invoice.due_date);
      const previousStatus = invoice.status;

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'overdue',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error(`Failed to update invoice ${invoice.invoice_code}:`, updateError);
        results.failed++;
        results.details.push({
          invoiceCode: invoice.invoice_code,
          status: 'failed',
          error: updateError.message
        });
        continue;
      }

      await logOverdueChange(invoice.id, previousStatus, 'overdue', daysOverdue);

      results.updated++;
      results.details.push({
        invoiceCode: invoice.invoice_code,
        studentName: invoice.student?.full_name,
        previousStatus,
        daysOverdue,
        amountDue: invoice.final_amount - invoice.paid_amount,
        status: 'updated'
      });

      console.log(`  ✓ ${invoice.invoice_code}: ${previousStatus} → overdue (${daysOverdue} days)`);
    } catch (err) {
      console.error(`Error processing invoice ${invoice.invoice_code}:`, err);
      results.failed++;
      results.details.push({
        invoiceCode: invoice.invoice_code,
        status: 'failed',
        error: err.message
      });
    }
  }

  return results;
}

// Lazy initialization of worker - only creates when Redis is available
function getOverdueCheckWorker() {
  if (_overdueCheckWorker) {
    return _overdueCheckWorker;
  }

  if (!isRedisAvailable()) {
    return null;
  }

  _overdueCheckWorker = new Worker(
    'overdue-check',
    async (job) => {
      console.log(`🔍 Processing overdue check job: ${job.id}`);
      const startTime = Date.now();

      try {
        const results = await processOverdueInvoices();
        const duration = Date.now() - startTime;

        console.log(`✅ Overdue check job completed in ${duration}ms`);
        console.log(`   - Total found: ${results.totalFound}`);
        console.log(`   - Updated: ${results.updated}`);
        console.log(`   - Failed: ${results.failed}`);

        return { success: true, results, duration };
      } catch (error) {
        console.error('❌ Overdue check job failed:', error);
        throw error;
      }
    },
    {
      connection: getRedisConnectionInstance(),
      concurrency: 1
    }
  );

  _overdueCheckWorker.on('completed', (job, result) => {
    console.log(`✅ Overdue check job ${job.id} completed successfully`);
  });

  _overdueCheckWorker.on('failed', (job, error) => {
    console.error(`❌ Overdue check job ${job?.id} failed:`, error.message);
  });

  return _overdueCheckWorker;
}

// Getter that returns the worker (creates if needed and Redis available)
const overdueCheckWorker = {
  get instance() {
    return getOverdueCheckWorker();
  },
  async close() {
    if (_overdueCheckWorker) {
      await _overdueCheckWorker.close();
      _overdueCheckWorker = null;
    }
  }
};

export { overdueCheckWorker, processOverdueInvoices };

