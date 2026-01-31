/**
 * Enrollment Notification Job
 * Sends email notifications for enrollment events
 *
 * Events:
 * - enrollment_created: Welcome email when student enrolls
 * - trial_converted: Confirmation when trial converts to regular
 * - enrollment_cancelled: Notification when enrollment is cancelled
 *
 * NOTE: Requires Redis to be available for email queuing
 */
import { supabase } from '../lib/db.js';
import { getEmailQueue, isRedisAvailable } from './scheduler.js';

export const ENROLLMENT_EVENTS = {
  CREATED: 'enrollment_created',
  TRIAL_CONVERTED: 'trial_converted',
  CANCELLED: 'enrollment_cancelled'
};

const EMAIL_TEMPLATES = {
  [ENROLLMENT_EVENTS.CREATED]: {
    subject: '[Skill Master] Chào mừng bạn đến với lớp {className}',
    template: 'enrollment_welcome'
  },
  [ENROLLMENT_EVENTS.TRIAL_CONVERTED]: {
    subject: '[Skill Master] Xác nhận đăng ký chính thức - {className}',
    template: 'trial_converted'
  },
  [ENROLLMENT_EVENTS.CANCELLED]: {
    subject: '[Skill Master] Thông báo hủy đăng ký - {className}',
    template: 'enrollment_cancelled'
  }
};

/**
 * Queue enrollment notification email
 */
export async function queueEnrollmentNotification(eventType, data) {
  // Check Redis availability first
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available. Enrollment notification not queued.');
    return null;
  }

  const { studentEmail, studentName, className, courseName, invoiceCode, amount, dueDate } = data;

  if (!studentEmail) {
    console.warn('⚠️ Cannot send enrollment notification: No student email');
    return null;
  }

  const templateConfig = EMAIL_TEMPLATES[eventType];
  if (!templateConfig) {
    console.warn(`⚠️ Unknown enrollment event type: ${eventType}`);
    return null;
  }

  const subject = templateConfig.subject
    .replace('{className}', className || 'N/A')
    .replace('{courseName}', courseName || 'N/A');

  const queue = getEmailQueue();
  if (!queue) {
    console.warn('⚠️ Email queue not available for enrollment notification');
    return null;
  }

  const job = await queue.add('send-enrollment-notification', {
    to: studentEmail,
    subject,
    template: templateConfig.template,
    eventType,
    data: {
      studentName: studentName || 'Học viên',
      className: className || 'N/A',
      courseName: courseName || 'N/A',
      invoiceCode: invoiceCode || null,
      amount: amount || 0,
      dueDate: dueDate || null,
      enrolledAt: new Date().toISOString()
    }
  });

  console.log(`📧 Queued ${eventType} notification for ${studentEmail}`);
  return job;
}

/**
 * Send welcome email for new enrollment
 */
export async function sendEnrollmentWelcome(enrollment) {
  return queueEnrollmentNotification(ENROLLMENT_EVENTS.CREATED, {
    studentEmail: enrollment.student?.email,
    studentName: enrollment.student?.full_name,
    className: enrollment.class?.name,
    courseName: enrollment.class?.course?.title
  });
}

/**
 * Send confirmation email when trial is converted
 */
export async function sendTrialConvertedNotification(enrollment, invoice) {
  return queueEnrollmentNotification(ENROLLMENT_EVENTS.TRIAL_CONVERTED, {
    studentEmail: enrollment.student?.email,
    studentName: enrollment.student?.full_name,
    className: enrollment.class?.name,
    courseName: enrollment.class?.course?.title,
    invoiceCode: invoice?.invoice_code,
    amount: invoice?.final_amount,
    dueDate: invoice?.due_date
  });
}

/**
 * Send notification when enrollment is cancelled
 */
export async function sendEnrollmentCancelledNotification(enrollment, reason) {
  return queueEnrollmentNotification(ENROLLMENT_EVENTS.CANCELLED, {
    studentEmail: enrollment.student?.email,
    studentName: enrollment.student?.full_name,
    className: enrollment.class?.name,
    courseName: enrollment.class?.course?.title,
    reason
  });
}

export default {
  ENROLLMENT_EVENTS,
  queueEnrollmentNotification,
  sendEnrollmentWelcome,
  sendTrialConvertedNotification,
  sendEnrollmentCancelledNotification
};

