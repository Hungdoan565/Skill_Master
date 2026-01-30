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

// Create Redis connection with lazy connect
const redisConnection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
  retryStrategy: (times) => {
    // Only retry 3 times, then give up
    if (times > 3) {
      if (!redisErrorLogged) {
        console.warn('⚠️ Redis not available. Job scheduler disabled. Backend will continue without background jobs.');
        redisErrorLogged = true;
      }
      return null; // Stop retrying
    }
    return Math.min(times * 200, 1000); // Retry with backoff
  }
});

redisConnection.on('connect', () => {
  redisAvailable = true;
  redisErrorLogged = false;
  console.log('📡 Redis connected for job scheduler');
});

redisConnection.on('error', (err) => {
  redisAvailable = false;
  // Only log error once to avoid spam
  if (!redisErrorLogged) {
    console.warn('⚠️ Redis connection error:', err.message);
    console.warn('   Job scheduler will be disabled. Backend continues normally.');
    redisErrorLogged = true;
  }
});

redisConnection.on('close', () => {
  redisAvailable = false;
});

// Helper to check if Redis is available
export function isRedisAvailable() {
  return redisAvailable;
}

// Try to connect to Redis (non-blocking)
export async function tryConnectRedis() {
  if (redisAvailable) return true;

  try {
    await redisConnection.connect();
    return true;
  } catch (err) {
    // Error already logged by event handler
    return false;
  }
}

export const paymentReminderQueue = new Queue('payment-reminder', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

export const overdueCheckQueue = new Queue('overdue-check', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

export const emailQueue = new Queue('email', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

export async function scheduleRecurringJobs() {
  // Check Redis availability first
  if (!redisAvailable) {
    console.warn('⚠️ Redis not available. Skipping job scheduling.');
    return { success: false, error: 'Redis not available' };
  }

  try {
    await paymentReminderQueue.upsertJobScheduler(
      'daily-payment-reminder',
      { pattern: '0 9 * * *' },
      {
        name: 'process-payment-reminders',
        data: { triggeredAt: new Date().toISOString() }
      }
    );
    console.log('✅ Payment reminder job scheduled: Daily at 9:00 AM');

    await overdueCheckQueue.upsertJobScheduler(
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
  if (!redisAvailable) {
    console.warn('⚠️ Redis not available. Cannot trigger payment reminder.');
    return null;
  }
  const job = await paymentReminderQueue.add('manual-payment-reminder', {
    triggeredAt: new Date().toISOString(),
    manual: true
  });
  return job;
}

export async function triggerOverdueCheck() {
  if (!redisAvailable) {
    console.warn('⚠️ Redis not available. Cannot trigger overdue check.');
    return null;
  }
  const job = await overdueCheckQueue.add('manual-overdue-check', {
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

  const [reminderStats, overdueStats, emailStats] = await Promise.all([
    paymentReminderQueue.getJobCounts(),
    overdueCheckQueue.getJobCounts(),
    emailQueue.getJobCounts()
  ]);

  return {
    available: true,
    paymentReminder: reminderStats,
    overdueCheck: overdueStats,
    email: emailStats
  };
}

export { redisConnection };

