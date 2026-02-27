/**
 * Jobs Index
 * Central export for all background jobs
 * 
 * Uses pg-boss (PostgreSQL-based) instead of BullMQ/Redis
 */

// pg-boss exports
export {
  initPgBoss,
  isPgBossAvailable,
  getBoss,
  QUEUES,
  addJob,
  scheduleJob,
  registerWorker,
  getQueueStats,
  stopPgBoss,
  triggerPaymentReminder,
  triggerOverdueCheck,
  triggerSessionAutoComplete,
  triggerCertificateEligibilityCheck,
  queueEmail,
  queueEnrollmentEmail,
  scheduleRecurringJobs
} from './pgboss-scheduler.js';

// Workers
export { startWorkers } from './pgboss-workers.js';

// Session auto-complete
export { autoCompleteSessionsManual } from './sessionAutoComplete.job.js';

// Enrollment notification helpers
export const ENROLLMENT_EVENTS = {
  CREATED: 'enrollment_created',
  TRIAL_CONVERTED: 'trial_converted',
  CANCELLED: 'enrollment_cancelled'
};

import { initPgBoss, scheduleRecurringJobs, stopPgBoss, isPgBossAvailable, queueEmail, queueEnrollmentEmail, triggerPaymentReminder, triggerOverdueCheck, triggerSessionAutoComplete, triggerCertificateEligibilityCheck } from './pgboss-scheduler.js';
import { startWorkers } from './pgboss-workers.js';
import { autoCompleteSessionsManual } from './sessionAutoComplete.job.js';

/**
 * Start job scheduler (called from main server)
 */
export async function startJobScheduler() {
  console.log('🚀 Starting job scheduler (pg-boss)...');

  const connected = await initPgBoss();
  if (!connected) {
    console.warn('⚠️ Job scheduler not started (DATABASE_URL not available)');
    console.warn('   Backend will continue without background jobs.');
    return { success: false, error: 'pg-boss not available' };
  }

  // Start workers
  await startWorkers();

  // Schedule recurring jobs
  const result = await scheduleRecurringJobs();

  if (result.success) {
    console.log('✅ Job scheduler started successfully (pg-boss)');
    console.log('   Workers active:');
    console.log('   - Email Worker');
    console.log('   - Payment Reminder Worker');
    console.log('   - Overdue Check Worker');
    console.log('   - Enrollment Notification Worker');
    console.log('   - Session Auto-Complete Worker (every 15 min)');
    console.log('   - Certificate Eligibility Worker');
  }

  return result;
}

/**
 * Stop job scheduler gracefully
 */
export async function stopJobScheduler() {
  console.log('🛑 Stopping job scheduler...');
  await stopPgBoss();
  console.log('✅ Job scheduler stopped');
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// These maintain API compatibility with old BullMQ-based code
// ============================================================

// Legacy: isRedisAvailable -> isPgBossAvailable
export function isRedisAvailable() {
  return isPgBossAvailable();
}

// Legacy: tryConnectRedis -> initPgBoss
export async function tryConnectRedis() {
  return initPgBoss();
}

// Legacy queue references (null - use functions instead)
export const paymentReminderQueue = null;
export const overdueCheckQueue = null;
export const emailQueue = null;
export const redisConnection = null;

// Legacy worker references
export const paymentReminderWorker = { close: async () => {} };
export const overdueCheckWorker = { close: async () => {} };
export const emailWorker = { close: async () => {} };

// Legacy functions
export const REMINDER_TYPES = {
  UPCOMING_3_DAYS: 'upcoming_3_days',
  DUE_TODAY: 'due_today',
  OVERDUE_1_DAY: 'overdue_1_day',
  OVERDUE_7_DAYS: 'overdue_7_days'
};

export async function processReminders() {
  return triggerPaymentReminder();
}

export async function processOverdueInvoices() {
  return triggerOverdueCheck();
}

export async function queueEnrollmentNotification(eventType, data) {
  return queueEnrollmentEmail(eventType, data);
}

export async function sendEnrollmentWelcome(data) {
  return queueEnrollmentEmail(ENROLLMENT_EVENTS.CREATED, data);
}

export async function sendTrialConvertedNotification(data) {
  return queueEnrollmentEmail(ENROLLMENT_EVENTS.TRIAL_CONVERTED, data);
}

export async function sendEnrollmentCancelledNotification(data) {
  return queueEnrollmentEmail(ENROLLMENT_EVENTS.CANCELLED, data);
}

export async function sendEmail(to, subject, template, data) {
  return queueEmail(to, subject, template, data);
}

// Legacy getter functions (for compatibility)
export function getPaymentReminderQueue() { return null; }
export function getOverdueCheckQueue() { return null; }
export function getEmailQueue() { return null; }
export function getRedisConnectionInstance() { return null; }
