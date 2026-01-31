/**
 * Jobs Index
 * Central export for all background jobs
 */
export {
  getPaymentReminderQueue,
  getOverdueCheckQueue,
  getEmailQueue,
  getRedisConnectionInstance,
  scheduleRecurringJobs,
  triggerPaymentReminder,
  triggerOverdueCheck,
  getQueueStats,
  isRedisAvailable,
  tryConnectRedis
} from './scheduler.js';

export { paymentReminderWorker, processReminders, REMINDER_TYPES } from './paymentReminder.job.js';
export { overdueCheckWorker, processOverdueInvoices } from './overdueCheck.job.js';
export { emailWorker, sendEmail } from './email.job.js';
export {
  ENROLLMENT_EVENTS,
  queueEnrollmentNotification,
  sendEnrollmentWelcome,
  sendTrialConvertedNotification,
  sendEnrollmentCancelledNotification
} from './enrollmentNotification.job.js';

import { scheduleRecurringJobs, getRedisConnectionInstance, tryConnectRedis, isRedisAvailable } from './scheduler.js';

let workersStarted = false;

export async function startJobScheduler() {
  console.log('🚀 Starting job scheduler...');

  // Try to connect to Redis first
  const connected = await tryConnectRedis();

  if (!connected) {
    console.warn('⚠️ Job scheduler not started (Redis not available)');
    console.warn('   Backend will continue without background jobs.');
    return { success: false, error: 'Redis not available' };
  }

  // Dynamically import workers only when Redis is available
  // This prevents workers from trying to connect on module load
  try {
    const [
      { paymentReminderWorker },
      { overdueCheckWorker },
      { emailWorker }
    ] = await Promise.all([
      import('./paymentReminder.job.js'),
      import('./overdueCheck.job.js'),
      import('./email.job.js')
    ]);

    workersStarted = true;

    const result = await scheduleRecurringJobs();

    if (result.success) {
      console.log('✅ Job scheduler started successfully');
      console.log('   Workers active:');
      console.log('   - Payment Reminder Worker');
      console.log('   - Overdue Check Worker');
      console.log('   - Email Worker');
    } else {
      console.error('❌ Failed to schedule recurring jobs:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Failed to start job scheduler:', error.message);
    return { success: false, error: error.message };
  }
}

export async function stopJobScheduler() {
  console.log('🛑 Stopping job scheduler...');

  if (!workersStarted) {
    console.log('   No workers to stop (Redis was not available)');
    return;
  }

  try {
    // Dynamically import workers to close them
    const [
      { paymentReminderWorker },
      { overdueCheckWorker },
      { emailWorker }
    ] = await Promise.all([
      import('./paymentReminder.job.js'),
      import('./overdueCheck.job.js'),
      import('./email.job.js')
    ]);

    await Promise.all([
      paymentReminderWorker.close(),
      overdueCheckWorker.close(),
      emailWorker.close()
    ]);

    // Close Redis connection
    const conn = getRedisConnectionInstance();
    if (conn && conn.status === 'ready') {
      await conn.quit();
      console.log('   Redis connection closed');
    }

    console.log('✅ Job scheduler stopped');
  } catch (error) {
    console.error('❌ Error stopping job scheduler:', error.message);
  }
}
