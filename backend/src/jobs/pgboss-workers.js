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
  processCheckCertificateEligibility,
