/**
 * Payment Reminder Job
 * Sends reminders for upcoming and overdue payments
 *
 * Schedule: Daily at 9:00 AM
 *
 * Reminder types:
 * - 3 days before due_date: Email reminder
 * - On due_date: Email + SMS reminder
 * - 1 day after due_date: Overdue notice
 * - 7 days after due_date: Final notice + add to call list
 *
 * NOTE: Worker is lazily initialized only when Redis is available
 */
import { Worker } from 'bullmq';
import { supabase } from '../lib/db.js';
import { emailQueue, redisConnection, isRedisAvailable } from './scheduler.js';

// Lazy-initialized worker
let _paymentReminderWorker = null;

const REMINDER_TYPES = {
  UPCOMING_3_DAYS: 'upcoming_3_days',
  DUE_TODAY: 'due_today',
  OVERDUE_1_DAY: 'overdue_1_day',
  OVERDUE_7_DAYS: 'overdue_7_days'
};

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function hasReminderBeenSent(invoiceId, reminderType) {
  const { data, error } = await supabase
    .from('payment_reminder_logs')
    .select('id')
    .eq('invoice_id', invoiceId)
    .eq('reminder_type', reminderType)
    .limit(1);

  if (error) {
    console.error('Error checking reminder history:', error);
    return false;
  }

  return data && data.length > 0;
}

async function logReminder(invoiceId, reminderType, channel, status, errorMessage = null) {
  const { error } = await supabase
    .from('payment_reminder_logs')
    .insert({
      invoice_id: invoiceId,
      reminder_type: reminderType,
      channel,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error logging reminder:', error);
  }
}

async function queueEmailReminder(invoice, reminderType, student) {
  const templateMap = {
    [REMINDER_TYPES.UPCOMING_3_DAYS]: 'payment_reminder_upcoming',
    [REMINDER_TYPES.DUE_TODAY]: 'payment_due_today',
    [REMINDER_TYPES.OVERDUE_1_DAY]: 'payment_overdue_notice',
    [REMINDER_TYPES.OVERDUE_7_DAYS]: 'payment_final_notice'
  };

  const subjectMap = {
    [REMINDER_TYPES.UPCOMING_3_DAYS]: `[Skill Master] Nhắc nhở thanh toán - Hóa đơn ${invoice.invoice_code}`,
    [REMINDER_TYPES.DUE_TODAY]: `[Skill Master] Hóa đơn đến hạn hôm nay - ${invoice.invoice_code}`,
    [REMINDER_TYPES.OVERDUE_1_DAY]: `[Skill Master] Thông báo quá hạn - Hóa đơn ${invoice.invoice_code}`,
    [REMINDER_TYPES.OVERDUE_7_DAYS]: `[Skill Master] THÔNG BÁO CUỐI - Hóa đơn ${invoice.invoice_code} quá hạn 7 ngày`
  };

  await emailQueue.add('send-payment-reminder', {
    to: student.email,
    subject: subjectMap[reminderType],
    template: templateMap[reminderType],
    data: {
      studentName: student.full_name,
      invoiceCode: invoice.invoice_code,
      amount: invoice.final_amount - invoice.paid_amount,
      dueDate: invoice.due_date,
      description: invoice.description
    }
  });
}

async function addToCallList(invoice, student) {
  const { error } = await supabase
    .from('payment_call_list')
    .upsert({
      invoice_id: invoice.id,
      student_id: student.id,
      amount_due: invoice.final_amount - invoice.paid_amount,
      days_overdue: 7,
      priority: 'normal',
      status: 'pending',
      added_at: new Date().toISOString(),
      metadata: {
        student_name: student.full_name,
        student_phone: student.phone,
        invoice_code: invoice.invoice_code,
        due_date: invoice.due_date
      }
    }, {
      onConflict: 'invoice_id'
    });

  if (error) {
    console.error('Error adding to call list:', error);
  }
}

async function processReminders() {
  const today = new Date();
  const todayStr = formatDate(today);
  const threeDaysLater = formatDate(addDays(today, 3));
  const oneDayAgo = formatDate(addDays(today, -1));
  const sevenDaysAgo = formatDate(addDays(today, -7));

  const results = {
    upcoming3Days: { processed: 0, sent: 0, skipped: 0 },
    dueToday: { processed: 0, sent: 0, skipped: 0 },
    overdue1Day: { processed: 0, sent: 0, skipped: 0 },
    overdue7Days: { processed: 0, sent: 0, skipped: 0 }
  };

  const { data: upcoming3DaysInvoices, error: err1 } = await supabase
    .from('invoices')
    .select(`
      id, invoice_code, final_amount, paid_amount, due_date, description,
      student:student_id(id, full_name, email, phone)
    `)
    .eq('due_date', threeDaysLater)
    .in('status', ['unpaid', 'partial']);

  if (!err1 && upcoming3DaysInvoices) {
    for (const invoice of upcoming3DaysInvoices) {
      results.upcoming3Days.processed++;
      if (await hasReminderBeenSent(invoice.id, REMINDER_TYPES.UPCOMING_3_DAYS)) {
        results.upcoming3Days.skipped++;
        continue;
      }
      if (invoice.student?.email) {
        await queueEmailReminder(invoice, REMINDER_TYPES.UPCOMING_3_DAYS, invoice.student);
        await logReminder(invoice.id, REMINDER_TYPES.UPCOMING_3_DAYS, 'email', 'queued');
        results.upcoming3Days.sent++;
      }
    }
  }

  const { data: dueTodayInvoices, error: err2 } = await supabase
    .from('invoices')
    .select(`
      id, invoice_code, final_amount, paid_amount, due_date, description,
      student:student_id(id, full_name, email, phone)
    `)
    .eq('due_date', todayStr)
    .in('status', ['unpaid', 'partial']);

  if (!err2 && dueTodayInvoices) {
    for (const invoice of dueTodayInvoices) {
      results.dueToday.processed++;
      if (await hasReminderBeenSent(invoice.id, REMINDER_TYPES.DUE_TODAY)) {
        results.dueToday.skipped++;
        continue;
      }
      if (invoice.student?.email) {
        await queueEmailReminder(invoice, REMINDER_TYPES.DUE_TODAY, invoice.student);
        await logReminder(invoice.id, REMINDER_TYPES.DUE_TODAY, 'email', 'queued');
        results.dueToday.sent++;
      }
    }
  }

  const { data: overdue1DayInvoices, error: err3 } = await supabase
    .from('invoices')
    .select(`
      id, invoice_code, final_amount, paid_amount, due_date, description,
      student:student_id(id, full_name, email, phone)
    `)
    .eq('due_date', oneDayAgo)
    .in('status', ['unpaid', 'partial', 'overdue']);

  if (!err3 && overdue1DayInvoices) {
    for (const invoice of overdue1DayInvoices) {
      results.overdue1Day.processed++;
      if (await hasReminderBeenSent(invoice.id, REMINDER_TYPES.OVERDUE_1_DAY)) {
        results.overdue1Day.skipped++;
        continue;
      }
      if (invoice.student?.email) {
        await queueEmailReminder(invoice, REMINDER_TYPES.OVERDUE_1_DAY, invoice.student);
        await logReminder(invoice.id, REMINDER_TYPES.OVERDUE_1_DAY, 'email', 'queued');
        results.overdue1Day.sent++;
      }
    }
  }

  const { data: overdue7DaysInvoices, error: err4 } = await supabase
    .from('invoices')
    .select(`
      id, invoice_code, final_amount, paid_amount, due_date, description,
      student:student_id(id, full_name, email, phone)
    `)
    .eq('due_date', sevenDaysAgo)
    .in('status', ['unpaid', 'partial', 'overdue']);

  if (!err4 && overdue7DaysInvoices) {
    for (const invoice of overdue7DaysInvoices) {
      results.overdue7Days.processed++;
      if (await hasReminderBeenSent(invoice.id, REMINDER_TYPES.OVERDUE_7_DAYS)) {
        results.overdue7Days.skipped++;
        continue;
      }
      if (invoice.student?.email) {
        await queueEmailReminder(invoice, REMINDER_TYPES.OVERDUE_7_DAYS, invoice.student);
        await logReminder(invoice.id, REMINDER_TYPES.OVERDUE_7_DAYS, 'email', 'queued');
        await addToCallList(invoice, invoice.student);
        results.overdue7Days.sent++;
      }
    }
  }

  return results;
}

// Lazy initialization of worker - only creates when Redis is available
function getPaymentReminderWorker() {
  if (_paymentReminderWorker) {
    return _paymentReminderWorker;
  }

  if (!isRedisAvailable()) {
    return null;
  }

  _paymentReminderWorker = new Worker(
    'payment-reminder',
    async (job) => {
      console.log(`📧 Processing payment reminder job: ${job.id}`);
      const startTime = Date.now();

      try {
        const results = await processReminders();
        const duration = Date.now() - startTime;

        console.log(`✅ Payment reminder job completed in ${duration}ms`);
        console.log(`   - Upcoming 3 days: ${results.upcoming3Days.sent} sent, ${results.upcoming3Days.skipped} skipped`);
        console.log(`   - Due today: ${results.dueToday.sent} sent, ${results.dueToday.skipped} skipped`);
        console.log(`   - Overdue 1 day: ${results.overdue1Day.sent} sent, ${results.overdue1Day.skipped} skipped`);
        console.log(`   - Overdue 7 days: ${results.overdue7Days.sent} sent, ${results.overdue7Days.skipped} skipped`);

        return { success: true, results, duration };
      } catch (error) {
        console.error('❌ Payment reminder job failed:', error);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1
    }
  );

  _paymentReminderWorker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  _paymentReminderWorker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error.message);
  });

  return _paymentReminderWorker;
}

// Getter that returns the worker (creates if needed and Redis available)
const paymentReminderWorker = {
  get instance() {
    return getPaymentReminderWorker();
  },
  async close() {
    if (_paymentReminderWorker) {
      await _paymentReminderWorker.close();
      _paymentReminderWorker = null;
    }
  }
};

export { paymentReminderWorker, processReminders, REMINDER_TYPES };

