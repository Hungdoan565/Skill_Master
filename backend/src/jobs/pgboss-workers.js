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
import { createNotification } from '../services/notification.service.js';
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
 * Certificate Eligibility Worker
 * Auto-checks eligibility when enrollment is completed
 */
async function processCheckCertificateEligibility(job) {
  const { enrollmentId, studentId, classId, centerId } = job.data;
  console.log(`🏆 Checking certificate eligibility for enrollment ${enrollmentId}...`);

  try {
    // 1. Get enrollment + class + course info
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id, student_id, class_id, status,
        class:classes!enrollments_class_id_fkey(
          id, name, course_id,
          course:courses!classes_course_id_fkey(id, name, code)
        )
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollError || !enrollment) {
      console.warn(`⚠️ Enrollment not found: ${enrollmentId}`);
      return { skipped: true, reason: 'enrollment_not_found' };
    }

    if (enrollment.status !== 'completed') {
      console.log(`ℹ️ Enrollment ${enrollmentId} is not completed (status: ${enrollment.status}). Skipping.`);
      return { skipped: true, reason: 'not_completed' };
    }

    const courseId = enrollment.class?.course_id;
    if (!courseId) {
      console.warn(`⚠️ No course linked to class ${classId}`);
      return { skipped: true, reason: 'no_course' };
    }

    // 2. Find internal certificate types linked to this course
    const { data: certTypes, error: typeError } = await supabase
      .from('certificate_types')
      .select('*')
      .eq('is_internal', true)
      .eq('is_active', true)
      .contains('linked_course_ids', [courseId]);

    if (typeError) {
      console.error('❌ Error fetching certificate types:', typeError.message);
      throw typeError;
    }

    if (!certTypes || certTypes.length === 0) {
      console.log(`ℹ️ No internal certificate types linked to course ${courseId}. Skipping.`);
      return { skipped: true, reason: 'no_cert_types' };
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const certType of certTypes) {
      // 3. Check if certificate already exists for this combo
      const { data: existing } = await supabase
        .from('certificates')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('certificate_type_id', certType.id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`ℹ️ Certificate already exists for student ${studentId}, class ${classId}, type ${certType.id}. Skipping.`);
        skippedCount++;
        continue;
      }

      // 4. Check eligibility using DB function (3-param overload)
      const { data: eligibility, error: eligError } = await supabase
        .rpc('check_certificate_eligibility', {
          p_student_id: studentId,
          p_class_id: classId,
          p_certificate_type_id: certType.id
        });

      if (eligError) {
        console.error(`❌ Error checking eligibility:`, eligError.message);
        skippedCount++;
        continue;
      }

      const eligResult = eligibility?.[0] || eligibility;
      if (!eligResult?.eligible) {
        console.log(`ℹ️ Student ${studentId} not eligible for ${certType.name}: ${eligResult?.reason || 'unknown'}`);
        skippedCount++;
        continue;
      }

      // 5. Generate certificate number
      const { data: certNumber } = await supabase
        .rpc('generate_certificate_number_v2', {
          p_type_code: certType.code || 'INT',
          p_center_code: 'SM'
        });

      // 6. Get design for this category
      const { data: design } = await supabase
        .from('certificate_designs')
        .select('id')
        .eq('category', certType.category)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      // 7. Calculate expiry
      const completionDate = new Date();
      let expiresAt = null;
      if (certType.validity_months) {
        expiresAt = new Date(completionDate);
        expiresAt.setMonth(expiresAt.getMonth() + certType.validity_months);
      }

      // 8. Create certificate with pending_approval
      const { data: newCert, error: insertError } = await supabase
        .from('certificates')
        .insert({
          certificate_number: certNumber || `SM-${Date.now()}`,
          certificate_type_id: certType.id,
          student_id: studentId,
          student_name: '',
          class_id: classId,
          enrollment_id: enrollmentId,
          course_id: courseId,
          course_name: enrollment.class?.course?.name || '',
          completion_date: completionDate.toISOString().split('T')[0],
          grade: eligResult?.average_grade?.toString() || eligResult?.avg_score?.toString() || null,
          center_id: centerId,
          status: 'issued',
          approval_status: 'pending_approval',
          design_id: design?.id || null,
          expires_at: expiresAt ? expiresAt.toISOString().split('T')[0] : null,
          issued_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error(`❌ Error creating certificate:`, insertError.message);
        skippedCount++;
        continue;
      }

      // 9. Create approval record
      const { error: approvalError } = await supabase
        .from('certificate_approvals')
        .insert({
          certificate_ids: [newCert.id],
          requested_by: studentId,
          status: 'pending',
          certificate_type_id: certType.id,
          center_id: centerId,
          notes: 'Tự động tạo khi học viên hoàn thành khóa học'
        });

      if (approvalError) {
        console.error(`❌ Error creating approval record:`, approvalError.message);
        // Certificate created but approval failed - log but don't throw
      } else {
        createdCount++;
        console.log(`✅ Auto-created certificate ${newCert.id} for student ${studentId}, type ${certType.name}`);
      }
    }

    console.log(`🏆 Certificate eligibility check complete: ${createdCount} created, ${skippedCount} skipped`);
    return { createdCount, skippedCount };
  } catch (error) {
    console.error(`❌ Certificate eligibility check failed for enrollment ${enrollmentId}:`, error.message);
    throw error;
  }
}

function compareMetric(metricValue, operator, thresholdValue) {
  switch (operator) {
    case 'gt':
      return metricValue > thresholdValue;
    case 'lt':
      return metricValue < thresholdValue;
    case 'gte':
      return metricValue >= thresholdValue;
    case 'lte':
      return metricValue <= thresholdValue;
    default:
      return false;
  }
}

function normalizeChannels(channels) {
  if (Array.isArray(channels)) {
    return channels.map((value) => String(value).toLowerCase());
  }

  if (typeof channels === 'string') {
    try {
      const parsed = JSON.parse(channels);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value).toLowerCase());
      }
    } catch {
      return channels
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  if (channels && typeof channels === 'object') {
    return Object.entries(channels)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([channel]) => channel.toLowerCase());
  }

  return [];
}

function parseScheduleConfig(schedule) {
  if (!schedule) {
    return null;
  }

  if (typeof schedule === 'string') {
    try {
      return JSON.parse(schedule);
    } catch {
      return { frequency: schedule };
    }
  }

  if (typeof schedule === 'object') {
    return schedule;
  }

  return null;
}

function calculateNextRunAt(schedule, baseDate = new Date()) {
  const config = parseScheduleConfig(schedule) || {};
  const frequency = String(config.frequency || config.type || config.interval || 'daily').toLowerCase();
  const next = new Date(baseDate);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }

  if (Number.isInteger(config.hour)) {
    next.setHours(config.hour);
  }

  if (Number.isInteger(config.minute)) {
    next.setMinutes(config.minute);
  }

  next.setSeconds(0, 0);
  return next;
}

async function evaluateCustomMetric(rule, now) {
  const centerId = rule.center_id;

  if (rule.metric_type === 'revenue_drop') {
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 30);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);

    const { data: currentInvoices, error: currentError } = await supabase
      .from('invoices')
      .select('final_amount, paid_amount')
      .eq('center_id', centerId)
      .gte('created_at', currentStart.toISOString())
      .lt('created_at', now.toISOString());

    if (currentError) {
      throw currentError;
    }

    const { data: previousInvoices, error: previousError } = await supabase
      .from('invoices')
      .select('final_amount, paid_amount')
      .eq('center_id', centerId)
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', currentStart.toISOString());

    if (previousError) {
      throw previousError;
    }

    const currentRevenue = (currentInvoices || []).reduce(
      (total, invoice) => total + Number(invoice.paid_amount ?? invoice.final_amount ?? 0),
      0
    );
    const previousRevenue = (previousInvoices || []).reduce(
      (total, invoice) => total + Number(invoice.paid_amount ?? invoice.final_amount ?? 0),
      0
    );

    if (previousRevenue <= 0) {
      return 0;
    }

    return ((previousRevenue - currentRevenue) / previousRevenue) * 100;
  }

  if (rule.metric_type === 'low_attendance') {
    const recentStart = new Date(now);
    recentStart.setDate(recentStart.getDate() - 7);

    const { data: attendanceRows, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('center_id', centerId)
      .gte('created_at', recentStart.toISOString());

    if (attendanceError) {
      throw attendanceError;
    }

    const totalRows = attendanceRows?.length || 0;
    if (totalRows === 0) {
      return 100;
    }

    const presentRows = attendanceRows.filter((row) => ['present', 'late'].includes(row.status)).length;
    return (presentRows / totalRows) * 100;
  }

  if (rule.metric_type === 'high_debt') {
    const { data: debtInvoices, error: debtError } = await supabase
      .from('invoices')
      .select('final_amount, paid_amount')
      .eq('center_id', centerId)
      .in('status', ['pending', 'overdue']);

    if (debtError) {
      throw debtError;
    }

    return (debtInvoices || []).reduce((total, invoice) => {
      const dueAmount = Number(invoice.final_amount || 0) - Number(invoice.paid_amount || 0);
      return total + Math.max(dueAmount, 0);
    }, 0);
  }

  if (rule.metric_type === 'pending_approvals') {
    const [{ count: certificatePendingCount, error: certificateError }, { count: leavePendingCount, error: leaveError }] = await Promise.all([
      supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerId)
        .eq('approval_status', 'pending_approval'),
      supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerId)
        .eq('status', 'pending')
    ]);

    if (certificateError) {
      throw certificateError;
    }

    if (leaveError) {
      throw leaveError;
    }

    return Number(certificatePendingCount || 0) + Number(leavePendingCount || 0);
  }

  if (rule.metric_type === 'low_enrollment') {
    const recentStart = new Date(now);
    recentStart.setDate(recentStart.getDate() - 30);

    const { count, error } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('center_id', centerId)
      .gte('created_at', recentStart.toISOString());

    if (error) {
      throw error;
    }

    return Number(count || 0);
  }

  return null;
}

/**
 * Custom Alert Evaluator Worker
 */
async function processCustomAlertCheck(job) {
  console.log('🚨 Processing custom alert checks...');

  const now = new Date();
  const { data: rules, error } = await supabase
    .from('custom_alert_rules')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching custom alert rules:', error.message);
    throw error;
  }

  let triggeredCount = 0;
  let skippedCount = 0;

  for (const rule of rules || []) {
    const cooldownMinutes = Number(rule.cooldown_minutes || 0);
    const lastTriggeredAt = rule.last_triggered_at ? new Date(rule.last_triggered_at) : null;

    if (lastTriggeredAt && cooldownMinutes > 0) {
      const nextAllowedAt = new Date(lastTriggeredAt);
      nextAllowedAt.setMinutes(nextAllowedAt.getMinutes() + cooldownMinutes);
      if (nextAllowedAt > now) {
        skippedCount += 1;
        continue;
      }
    }

    const metricValue = await evaluateCustomMetric(rule, now);
    if (metricValue === null || Number.isNaN(metricValue)) {
      skippedCount += 1;
      continue;
    }

    const thresholdValue = Number(rule.threshold_value || 0);
    const isViolated = compareMetric(Number(metricValue), rule.condition_operator, thresholdValue);
    if (!isViolated) {
      continue;
    }

    const message = `Rule "${rule.name}" violated: ${rule.metric_type} = ${Number(metricValue).toFixed(2)} (${rule.condition_operator} ${thresholdValue})`;

    const { error: historyError } = await supabase
      .from('alert_history')
      .insert({
        rule_id: rule.id,
        center_id: rule.center_id,
        metric_value: Number(metricValue),
        message,
        severity: rule.severity
      });

    if (historyError) {
      console.error(`❌ Failed to write alert history for rule ${rule.id}:`, historyError.message);
      continue;
    }

    const { error: updateError } = await supabase
      .from('custom_alert_rules')
      .update({
        last_triggered_at: now.toISOString(),
        trigger_count: Number(rule.trigger_count || 0) + 1
      })
      .eq('id', rule.id);

    if (updateError) {
      console.error(`❌ Failed to update rule trigger metadata for ${rule.id}:`, updateError.message);
    }

    const channels = normalizeChannels(rule.notification_channels);

    if (channels.includes('in_app') && rule.created_by) {
      await createNotification(supabase, {
        userId: rule.created_by,
        centerId: rule.center_id,
        type: 'custom_alert_triggered',
        title: `Cảnh báo tự động: ${rule.name}`,
        message,
        referenceId: rule.id,
        referenceType: 'custom_alert_rule'
      });
    }

    if (channels.includes('email') && rule.created_by) {
      const { data: creator, error: creatorError } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', rule.created_by)
        .maybeSingle();

      if (creatorError) {
        console.warn(`⚠️ Failed to get rule creator for alert email (${rule.created_by}):`, creatorError.message);
      } else if (creator?.email) {
        await queueEmail(
          creator.email,
          `[Skill Master] Cảnh báo: ${rule.name}`,
          null,
          {
            body: `<p>Xin chào ${creator.full_name || ''},</p><p>${message}</p>`,
            ruleId: rule.id,
            centerId: rule.center_id,
            metricValue: Number(metricValue),
            thresholdValue
          }
        );
      }
    }

    triggeredCount += 1;
  }

  console.log(`✅ Custom alert checks complete: ${triggeredCount} triggered, ${skippedCount} skipped`);
  return { triggeredCount, skippedCount };
}

/**
 * Scheduled Report Runner Worker
 */
async function processScheduledReportRun(job) {
  console.log('📊 Processing scheduled reports...');

  const nowIso = new Date().toISOString();
  const { data: reports, error } = await supabase
    .from('saved_reports')
    .select('id, name, center_id, created_by, schedule, email_recipients, next_run_at')
    .not('schedule', 'is', null)
    .lte('next_run_at', nowIso);

  if (error) {
    console.error('❌ Error fetching scheduled reports:', error.message);
    throw error;
  }

  let processedCount = 0;

  for (const report of reports || []) {
    console.log(`📄 Generating scheduled report ${report.id} (${report.name || 'Untitled'})`);

    const nextRunAt = calculateNextRunAt(report.schedule, new Date());
    const { error: updateError } = await supabase
      .from('saved_reports')
      .update({ next_run_at: nextRunAt.toISOString() })
      .eq('id', report.id);

    if (updateError) {
      console.error(`❌ Failed updating next_run_at for report ${report.id}:`, updateError.message);
      continue;
    }

    const recipients = Array.isArray(report.email_recipients)
      ? report.email_recipients
      : typeof report.email_recipients === 'string'
        ? report.email_recipients
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [];

    if (recipients.length > 0) {
      await queueEmail(
        recipients.join(','),
        `[Skill Master] Scheduled report: ${report.name || 'Report'}`,
        null,
        {
          body: `<p>Report "${report.name || 'Untitled'}" was generated at ${new Date().toLocaleString('vi-VN')}.</p>`,
          reportId: report.id,
          centerId: report.center_id,
          nextRunAt: nextRunAt.toISOString()
        }
      );
    }

    processedCount += 1;
  }

  console.log(`✅ Scheduled report run complete: ${processedCount} reports processed`);
  return { processedCount };
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
    await registerWorker(QUEUES.CERTIFICATE_ELIGIBILITY, processCheckCertificateEligibility);
    await registerWorker(QUEUES.CUSTOM_ALERT_CHECK, processCustomAlertCheck);
    await registerWorker(QUEUES.SCHEDULED_REPORT_RUN, processScheduledReportRun);

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
  processEnrollmentNotification,
  processCheckCertificateEligibility,
  processCustomAlertCheck,
  processScheduledReportRun
};
