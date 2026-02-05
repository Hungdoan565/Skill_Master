/**
 * pg-boss Workers
 * Processes background jobs using PostgreSQL queue
 */
import { supabase } from '../lib/db.js';
import { 
  registerWorker, 
  queueEmail, 
  QUEUES, 
  isPgBossAvailable 
} from './pgboss-scheduler.js';
import { processSessionAutoComplete } from './sessionAutoComplete.job.js';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@skillmaster.edu.vn';

// Template cache
const templateCache = new Map();

/**
 * Load and compile email template
 */
function loadTemplate(templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️ Template not found: ${templateName}`);
    return null;
  }

  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const compiled = Handlebars.compile(templateSource);
  templateCache.set(templateName, compiled);
  return compiled;
}

/**
 * Email Worker - processes email queue
 */
async function processEmailJob(job) {
  const { to, subject, template, data } = job.data;

  if (!to || !subject) {
    throw new Error('Missing required email fields: to, subject');
  }

  let html;
  if (template) {
    const compiledTemplate = loadTemplate(template);
    if (compiledTemplate) {
      html = compiledTemplate(data || {});
    } else {
      html = `<p>${JSON.stringify(data)}</p>`;
    }
  } else {
    html = data?.body || '<p>No content</p>';
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent: ${to} - ${subject} (${info.messageId})`);
  return { messageId: info.messageId };
}

/**
 * Payment Reminder Worker
 */
async function processPaymentReminder(job) {
  console.log('🔔 Processing payment reminders...');
  
  const today = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Find invoices due in 3 days
  const { data: upcomingInvoices } = await supabase
    .from('invoices')
    .select(`
      id, invoice_code, final_amount, paid_amount, due_date,
      student:users!invoices_student_id_fkey(id, email, full_name)
    `)
    .in('status', ['unpaid', 'partial'])
    .eq('due_date', threeDaysLater);

  let sentCount = 0;
  for (const invoice of upcomingInvoices || []) {
    if (invoice.student?.email) {
      await queueEmail(
        invoice.student.email,
        `[Skill Master] Nhắc nhở thanh toán - ${invoice.invoice_code}`,
        'payment_reminder',
        {
          studentName: invoice.student.full_name,
          invoiceCode: invoice.invoice_code,
          amount: invoice.final_amount - invoice.paid_amount,
          dueDate: invoice.due_date
        }
      );
      sentCount++;
    }
  }

  // Find overdue invoices (1 day past due)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select(`
      id, invoice_code, final_amount, paid_amount, due_date,
      student:users!invoices_student_id_fkey(id, email, full_name)
    `)
    .in('status', ['unpaid', 'partial'])
    .eq('due_date', oneDayAgo);

  for (const invoice of overdueInvoices || []) {
    if (invoice.student?.email) {
      await queueEmail(
        invoice.student.email,
        `[Skill Master] Thông báo quá hạn - ${invoice.invoice_code}`,
        'payment_overdue',
        {
          studentName: invoice.student.full_name,
          invoiceCode: invoice.invoice_code,
          amount: invoice.final_amount - invoice.paid_amount,
          dueDate: invoice.due_date
        }
      );
      sentCount++;
    }
  }

  console.log(`✅ Payment reminders sent: ${sentCount} emails queued`);
  return { sentCount };
}

/**
 * Overdue Check Worker
 */
async function processOverdueCheck(job) {
  console.log('🔍 Processing overdue check...');
  
  const today = new Date().toISOString().split('T')[0];

  // Update invoice status to overdue
  const { data: updated, error } = await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .in('status', ['unpaid', 'partial'])
    .lt('due_date', today)
    .select('id');

  if (error) {
    console.error('❌ Error updating overdue invoices:', error.message);
    throw error;
  }

  const updatedCount = updated?.length || 0;
  console.log(`✅ Overdue check complete: ${updatedCount} invoices marked overdue`);
  return { updatedCount };
}

/**
 * Enrollment Notification Worker
 */
async function processEnrollmentNotification(job) {
  const { eventType, studentEmail, studentName, className, courseName, invoiceCode, amount, dueDate } = job.data;

  const templateMap = {
    enrollment_created: 'enrollment_welcome',
    trial_converted: 'trial_converted',
    enrollment_cancelled: 'enrollment_cancelled'
  };

  const subjectMap = {
    enrollment_created: `[Skill Master] Chào mừng bạn đến với lớp ${className}`,
    trial_converted: `[Skill Master] Xác nhận đăng ký chính thức - ${className}`,
    enrollment_cancelled: `[Skill Master] Thông báo hủy đăng ký - ${className}`
  };

  const template = templateMap[eventType];
  const subject = subjectMap[eventType];

  if (!template || !subject) {
    console.warn(`⚠️ Unknown enrollment event type: ${eventType}`);
    return { skipped: true };
  }

  await queueEmail(studentEmail, subject, template, {
    studentName,
    className,
    courseName,
    invoiceCode,
    amount,
    dueDate,
    enrolledAt: new Date().toISOString()
  });

  console.log(`📧 Enrollment notification queued: ${eventType} for ${studentEmail}`);
  return { eventType, email: studentEmail };
}

/**
 * Start all workers
 */
export async function startWorkers() {
  if (!isPgBossAvailable()) {
    console.warn('⚠️ pg-boss not available. Workers not started.');
    return false;
  }

  try {
    await registerWorker(QUEUES.EMAIL, processEmailJob, { concurrency: 5 });
    await registerWorker(QUEUES.PAYMENT_REMINDER, processPaymentReminder);
    await registerWorker(QUEUES.OVERDUE_CHECK, processOverdueCheck);
    await registerWorker(QUEUES.ENROLLMENT_NOTIFICATION, processEnrollmentNotification);
    await registerWorker(QUEUES.SESSION_AUTO_COMPLETE, processSessionAutoComplete);

    console.log('✅ All workers started');
    return true;
  } catch (error) {
    console.error('❌ Failed to start workers:', error.message);
    return false;
  }
}

// Export for direct use
export {
  processEmailJob,
  processPaymentReminder,
  processOverdueCheck,
  processEnrollmentNotification
};
