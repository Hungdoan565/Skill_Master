import nodemailer from 'nodemailer';
import { supabase } from '../lib/db.js';
import { addJob, registerWorker } from '../jobs/pgboss-scheduler.js';

const EMAIL_QUEUE_NAME = 'send-email';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;

const smtpMissingKeys = [];

if (!SMTP_HOST) smtpMissingKeys.push('SMTP_HOST');
if (!SMTP_PORT) smtpMissingKeys.push('SMTP_PORT');
if (!SMTP_USER) smtpMissingKeys.push('SMTP_USER');
if (!SMTP_PASS) smtpMissingKeys.push('SMTP_PASS');
if (!SMTP_FROM) smtpMissingKeys.push('SMTP_FROM');

const smtpConfigured = smtpMissingKeys.length === 0;
let smtpWarningLogged = false;

function logSmtpWarningOnce() {
  if (!smtpWarningLogged) {
    console.warn(
      `⚠️ SMTP chưa cấu hình đầy đủ (${smtpMissingKeys.join(', ')}). Email service chuyển sang no-op mode.`
    );
    smtpWarningLogged = true;
  }
}

if (!smtpConfigured) {
  logSmtpWarningOnce();
}

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number.parseInt(SMTP_PORT, 10),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    })
  : null;

async function insertEmailLog({ recipient, subject, body, status, errorMessage, metadata, sentAt }) {
  const payload = {
    recipient,
    subject,
    body,
    status,
    error_message: errorMessage || null,
    metadata: metadata || {},
    sent_at: sentAt || null
  };

  const { data, error } = await supabase
    .from('email_logs')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    console.error('❌ Không thể ghi email_logs:', error.message);
    return null;
  }

  return data?.id || null;
}

async function updateEmailLog(logId, patch) {
  if (!logId) {
    return;
  }

  const { error } = await supabase
    .from('email_logs')
    .update(patch)
    .eq('id', logId);

  if (error) {
    console.error(`❌ Không thể cập nhật email_logs #${logId}:`, error.message);
  }
}

export function isEmailServiceEnabled() {
  return smtpConfigured;
}

export async function sendEmail(to, subject, html) {
  if (!smtpConfigured || !transporter) {
    logSmtpWarningOnce();
    return { skipped: true, reason: 'smtp_not_configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html
    });

    return {
      skipped: false,
      messageId: info.messageId
    };
  } catch (error) {
    throw new Error(error.message || 'SMTP send failed');
  }
}

export async function queueEmail(to, subject, html, metadata = {}) {
  const logId = await insertEmailLog({
    recipient: to,
    subject,
    body: html,
    status: 'queued',
    metadata,
    sentAt: null
  });

  if (!smtpConfigured) {
    logSmtpWarningOnce();
    await updateEmailLog(logId, {
      status: 'failed',
      error_message: 'SMTP chưa cấu hình',
      sent_at: null
    });
    return {
      queued: false,
      skipped: true,
      reason: 'smtp_not_configured',
      logId
    };
  }

  const jobId = await addJob(EMAIL_QUEUE_NAME, {
    to,
    subject,
    html,
    metadata,
    logId
  }, {
    retryLimit: 3,
    retryDelay: 1500,
    expireInSeconds: 3600
  });

  if (!jobId) {
    await updateEmailLog(logId, {
      status: 'failed',
      error_message: 'Không thể queue job send-email'
    });

    return {
      queued: false,
      skipped: true,
      reason: 'queue_unavailable',
      logId
    };
  }

  await updateEmailLog(logId, {
    metadata: {
      ...(metadata || {}),
      job_id: jobId,
      queue: EMAIL_QUEUE_NAME
    }
  });

  return {
    queued: true,
    jobId,
    logId
  };
}

export async function processEmailQueue() {
  if (!smtpConfigured) {
    logSmtpWarningOnce();
    return false;
  }

  return registerWorker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { to, subject, html, metadata, logId } = job.data || {};

      if (!to || !subject || !html) {
        const errMsg = 'Thiếu dữ liệu email trong job send-email';
        await updateEmailLog(logId, {
          status: 'failed',
          error_message: errMsg,
          sent_at: null
        });
        throw new Error(errMsg);
      }

      try {
        const result = await sendEmail(to, subject, html);
        if (result.skipped) {
          await updateEmailLog(logId, {
            status: 'failed',
            error_message: 'SMTP chưa cấu hình',
            sent_at: null
          });
          return { skipped: true };
        }

        await updateEmailLog(logId, {
          status: 'sent',
          error_message: null,
          sent_at: new Date().toISOString(),
          metadata: {
            ...(metadata || {}),
            message_id: result.messageId,
            queue: EMAIL_QUEUE_NAME
          }
        });

        return { sent: true, messageId: result.messageId };
      } catch (error) {
        await updateEmailLog(logId, {
          status: 'failed',
          error_message: error.message || 'Gửi email thất bại',
          sent_at: null
        });
        throw error;
      }
    },
    {
      concurrency: 5
    }
  );
}
