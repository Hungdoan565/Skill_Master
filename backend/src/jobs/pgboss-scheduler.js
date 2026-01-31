/**
 * Job Scheduler using pg-boss (PostgreSQL-based)
 * Replaces BullMQ/Redis with Supabase's PostgreSQL
 *
 * pg-boss uses PostgreSQL for job queuing - perfect since we already have Supabase
 */
import PgBoss from 'pg-boss';
import dotenv from 'dotenv';

dotenv.config();

// Get DATABASE_URL from env (Supabase direct connection)
const DATABASE_URL = process.env.DATABASE_URL;

let boss = null;
let bossAvailable = false;
let bossErrorLogged = false;

/**
 * Initialize pg-boss connection
 */
export async function initPgBoss() {
  if (!DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not set. Job scheduler disabled.');
    console.warn('   Backend will continue without background jobs.');
    return false;
  }

  try {
    boss = new PgBoss({
      connectionString: DATABASE_URL,
      // Schema for pg-boss tables (will be auto-created)
      schema: 'pgboss',
      // Retry configuration
      retryLimit: 3,
      retryDelay: 1000,
      retryBackoff: true,
      // Archive completed jobs for 7 days
      archiveCompletedAfterSeconds: 60 * 60 * 24 * 7,
      // Delete archived jobs after 14 days
      deleteAfterSeconds: 60 * 60 * 24 * 14,
      // Maintenance interval
      maintenanceIntervalSeconds: 300,
      // Don't block on start
      noScheduling: false
    });

    boss.on('error', (error) => {
      if (!bossErrorLogged) {
        console.error('❌ pg-boss error:', error.message);
        bossErrorLogged = true;
      }
    });

    await boss.start();
    bossAvailable = true;
    console.log('📡 pg-boss connected (PostgreSQL job queue)');
    return true;
  } catch (error) {
    if (!bossErrorLogged) {
      console.warn('⚠️ pg-boss initialization failed:', error.message);
      console.warn('   Job scheduler disabled. Backend continues normally.');
      bossErrorLogged = true;
    }
    return false;
  }
}

/**
 * Check if pg-boss is available
 */
export function isPgBossAvailable() {
  return bossAvailable && boss !== null;
}

/**
 * Get pg-boss instance
 */
export function getBoss() {
  return boss;
}

/**
 * Queue names
 */
export const QUEUES = {
  PAYMENT_REMINDER: 'payment-reminder',
  OVERDUE_CHECK: 'overdue-check',
  EMAIL: 'email',
  ENROLLMENT_NOTIFICATION: 'enrollment-notification'
};

/**
 * Add a job to queue
 */
export async function addJob(queueName, data, options = {}) {
  if (!isPgBossAvailable()) {
    console.warn(`⚠️ pg-boss not available. Job not queued: ${queueName}`);
    return null;
  }

  try {
    const jobId = await boss.send(queueName, data, {
      retryLimit: options.retryLimit || 3,
      retryDelay: options.retryDelay || 1000,
      retryBackoff: true,
      expireInSeconds: options.expireInSeconds || 3600,
      ...options
    });
    return jobId;
  } catch (error) {
    console.error(`❌ Failed to queue job ${queueName}:`, error.message);
    return null;
  }
}

/**
 * Schedule a recurring job (cron-style)
 */
export async function scheduleJob(name, cron, data = {}, options = {}) {
  if (!isPgBossAvailable()) {
    console.warn(`⚠️ pg-boss not available. Schedule not created: ${name}`);
    return null;
  }

  try {
    await boss.schedule(name, cron, data, options);
    console.log(`✅ Scheduled job: ${name} (${cron})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to schedule ${name}:`, error.message);
    return false;
  }
}

/**
 * Register a worker for a queue
 */
export async function registerWorker(queueName, handler, options = {}) {
  if (!isPgBossAvailable()) {
    console.warn(`⚠️ pg-boss not available. Worker not registered: ${queueName}`);
    return null;
  }

  try {
    await boss.work(queueName, {
      teamSize: options.concurrency || 1,
      teamConcurrency: options.teamConcurrency || 1,
      ...options
    }, async (job) => {
      try {
        const result = await handler(job);
        return result;
      } catch (error) {
        console.error(`❌ Job ${queueName} failed:`, error.message);
        throw error; // Re-throw to trigger retry
      }
    });
    console.log(`👷 Worker registered: ${queueName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to register worker ${queueName}:`, error.message);
    return false;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  if (!isPgBossAvailable()) {
    return {
      available: false,
      message: 'pg-boss not available'
    };
  }

  try {
    const stats = {};
    for (const queue of Object.values(QUEUES)) {
      const count = await boss.getQueueSize(queue);
      stats[queue] = { pending: count };
    }
    return {
      available: true,
      queues: stats
    };
  } catch (error) {
    return {
      available: false,
      message: error.message
    };
  }
}

/**
 * Stop pg-boss gracefully
 */
export async function stopPgBoss() {
  if (boss) {
    try {
      await boss.stop({ graceful: true, timeout: 10000 });
      console.log('✅ pg-boss stopped gracefully');
    } catch (error) {
      console.error('❌ Error stopping pg-boss:', error.message);
    }
    boss = null;
    bossAvailable = false;
  }
}

// ============================================================
// CONVENIENCE FUNCTIONS (backward compatible with old API)
// ============================================================

/**
 * Trigger payment reminder job manually
 */
export async function triggerPaymentReminder() {
  return addJob(QUEUES.PAYMENT_REMINDER, {
    triggeredAt: new Date().toISOString(),
    manual: true
  });
}

/**
 * Trigger overdue check job manually
 */
export async function triggerOverdueCheck() {
  return addJob(QUEUES.OVERDUE_CHECK, {
    triggeredAt: new Date().toISOString(),
    manual: true
  });
}

/**
 * Queue an email to be sent
 */
export async function queueEmail(to, subject, template, data) {
  return addJob(QUEUES.EMAIL, { to, subject, template, data });
}

/**
 * Queue enrollment notification
 */
export async function queueEnrollmentEmail(eventType, emailData) {
  return addJob(QUEUES.ENROLLMENT_NOTIFICATION, { eventType, ...emailData });
}

/**
 * Schedule recurring jobs (called on startup)
 */
export async function scheduleRecurringJobs() {
  if (!isPgBossAvailable()) {
    console.warn('⚠️ pg-boss not available. Skipping job scheduling.');
    return { success: false, error: 'pg-boss not available' };
  }

  try {
    // Daily payment reminder at 9:00 AM
    await scheduleJob(
      QUEUES.PAYMENT_REMINDER,
      '0 9 * * *',
      { scheduled: true }
    );

    // Daily overdue check at 10:00 AM
    await scheduleJob(
      QUEUES.OVERDUE_CHECK,
      '0 10 * * *',
      { scheduled: true }
    );

    console.log('✅ Recurring jobs scheduled');
    return { success: true };
  } catch (error) {
    console.error('❌ Error scheduling jobs:', error.message);
    return { success: false, error: error.message };
  }
}
