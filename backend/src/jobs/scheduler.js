/**
 * Job Scheduler
 * Initializes and schedules all background jobs
 *
 * NOTE: Redis is optional. If Redis is not running, the job scheduler
 * will be disabled but the backend will continue to work normally.
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Track Redis availability
let redisAvailable = false;
let redisErrorLogged = false;
let redisConnection = null;

// Lazy-initialized queues
let _paymentReminderQueue = null;
let _overdueCheckQueue = null;
let _emailQueue = null;

// Helper to check if Redis is available
export function isRedisAvailable() {
  return redisAvailable;
}

// Create Redis connection lazily
function getRedisConnection() {
  if (redisConnection) return redisConnection;

  redisConnection = new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) {
        if (!redisErrorLogged) {
          console.warn('⚠️ Redis not available. Job scheduler disabled. Backend will continue without background jobs.');
          redisErrorLogged = true;
        }
        return null;
      }
      return Math.min(times * 200, 1000);
    }
  });

  redisConnection.on('connect', () => {
    redisAvailable = true;
    redisErrorLogged = false;
    console.log('📡 Redis connected for job scheduler');
  });

  redisConnection.on('error', (err) => {
    redisAvailable = false;
    if (!redisErrorLogged) {
      console.warn('⚠️ Redis connection error:', err.message);
      console.warn('   Job scheduler will be disabled. Backend continues normally.');
      redisErrorLogged = true;
    }
  });

  redisConnection.on('close', () => {
    redisAvailable = false;
  });

  return redisConnection;
}

// Try to connect to Redis (non-blocking)
export async function tryConnectRedis() {
  if (redisAvailable) return true;

  try {
    const conn = getRedisConnection();
    await conn.connect();
    return true;
  } catch (err) {
    // Error already logged by event handler
    return false;
  }
}

// Lazy queue getters - only create when Redis is available
function getQueue(name, queueRef, setQueue) {
  if (queueRef) return queueRef;
  if (!redisAvailable) return null;

  const queue = new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: name === 'email' ? 2000 : 1000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  });

  return queue;
}

// Queue getters
export function getPaymentReminderQueue() {
  if (!_paymentReminderQueue && redisAvailable) {
    _paymentReminderQueue = getQueue('payment-reminder', _paymentReminderQueue);
  }
  return _paymentReminderQueue;
}

export function getOverdueCheckQueue() {
  if (!_overdueCheckQueue && redisAvailable) {
    _overdueCheckQueue = getQueue('overdue-check', _overdueCheckQueue);
  }
  return _overdueCheckQueue;
}

export function getEmailQueue() {
  if (!_emailQueue && redisAvailable) {
    _emailQueue = getQueue('email', _emailQueue);
  }
  return _emailQueue;
}

// Legacy exports for backward compatibility (will be null until Redis connects)
export { redisConnection };
export const paymentReminderQueue = null; // Use getPaymentReminderQueue() instead
export const overdueCheckQueue = null;    // Use getOverdueCheckQueue() instead
export const emailQueue = null;           // Use getEmailQueue() instead

export async function scheduleRecurringJobs() {
  if (!redisAvailable) {
    console.warn('⚠️ Redis not available. Skipping job scheduling.');
    return { success: false, error: 'Redis not available' };
  }

  try {
    const reminderQueue = getPaymentReminderQueue();
    const overdueQueue = getOverdueCheckQueue();

    if (!reminderQueue || !overdueQueue) {
      return { success: false, error: 'Queues not available' };
    }

    await reminderQueue.upsertJobScheduler(
      'daily-payment-reminder',
      { pattern: '0 9 * * *' },
      {
        name: 'process-payment-reminders',
        data: { triggeredAt: new Date().toISOString() }
      }
    );
    console.log('✅ Payment reminder job scheduled: Daily at 9:00 AM');

    await overdueQueue.upsertJobScheduler(
      'daily-overdue-check',
      { pattern: '0 10 * * *' },
      {
        name: 'process-overdue-check',
        data: { triggeredAt: new Date().toISOString() }
      }
    );
    console.log('✅ Overdue check job scheduled: Daily at 10:00 AM');

    return { success: true };
  } catch (error) {
    console.error('❌ Error scheduling jobs:', error.message);
    return { success: false, error: error.message };
  }
}

export async function triggerPaymentReminder() {
  const queue = getPaymentReminderQueue();
  if (!queue) {
    console.warn('⚠️ Redis not available. Cannot trigger payment reminder.');
    return null;
  }
  const job = await queue.add('manual-payment-reminder', {
    triggeredAt: new Date().toISOString(),
    manual: true
  });
  return job;
}

export async function triggerOverdueCheck() {
  const queue = getOverdueCheckQueue();
  if (!queue) {
    console.warn('⚠️ Redis not available. Cannot trigger overdue check.');
    return null;
  }
  const job = await queue.add('manual-overdue-check', {
    triggeredAt: new Date().toISOString(),
    manual: true
  });
  return job;
}

export async function getQueueStats() {
  if (!redisAvailable) {
    return {
      available: false,
      message: 'Redis not available',
      paymentReminder: null,
      overdueCheck: null,
      email: null
    };
  }

  const reminderQueue = getPaymentReminderQueue();
  const overdueQueue = getOverdueCheckQueue();
  const mailQueue = getEmailQueue();

  if (!reminderQueue || !overdueQueue || !mailQueue) {
    return {
      available: false,
      message: 'Queues not initialized',
      paymentReminder: null,
      overdueCheck: null,
      email: null
    };
  }

  const [reminderStats, overdueStats, emailStats] = await Promise.all([
    reminderQueue.getJobCounts(),
    overdueQueue.getJobCounts(),
    mailQueue.getJobCounts()
  ]);

  return {
    available: true,
    paymentReminder: reminderStats,
    overdueCheck: overdueStats,
    email: emailStats
  };
}

// Export getter for redis connection
export function getRedisConnectionInstance() {
  return redisConnection;
}
