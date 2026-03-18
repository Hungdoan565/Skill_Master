// Seed script: Insert diverse mock audit log entries
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  // Get some real users and centers for references
  const { data: users } = await supabase.from('users').select('id, email, full_name, role_id, roles(code)').limit(10);
  const { data: centers } = await supabase.from('centers').select('id, name').limit(5);

  if (!users?.length || !centers?.length) {
    console.error('No users or centers found');
    return;
  }

  console.log(`Found ${users.length} users and ${centers.length} centers`);

  const center = centers[0];
  const admin = users.find(u => u.roles?.code === 'SUPER_ADMIN') || users[0];
  const teacher = users.find(u => u.roles?.code === 'TEACHER') || users[1];
  const manager = users.find(u => u.roles?.code === 'CENTER_MANAGER') || users[2];

  const now = new Date();
  const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

  const mockLogs = [
    // CREATE actions
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'CREATE',
      table_name: 'students',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      new_values: { full_name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com' },
      created_at: hoursAgo(1),
    },
    {
      user_id: manager?.id || admin.id,
      user_email: manager?.email || admin.email,
      action: 'CREATE',
      table_name: 'enrollments',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      new_values: { course: 'IELTS Intermediate', student: 'Trần Thị Bình' },
      created_at: hoursAgo(3),
    },
    // UPDATE actions
    {
      user_id: teacher?.id || admin.id,
      user_email: teacher?.email || admin.email,
      action: 'UPDATE',
      table_name: 'grades',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      old_values: { score: 7.5 },
      new_values: { score: 8.0 },
      created_at: hoursAgo(2),
    },
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'UPDATE',
      table_name: 'settings',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'WARNING',
      old_values: { payroll_rate: 150000 },
      new_values: { payroll_rate: 180000 },
      created_at: hoursAgo(5),
    },
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'UPDATE',
      table_name: 'user_profiles',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      new_values: { role: 'CENTER_MANAGER', full_name: 'Đoàn Vĩnh Hưng' },
      created_at: hoursAgo(4),
    },
    // DELETE action
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'DELETE',
      table_name: 'students',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'WARNING',
      old_values: { full_name: 'Phạm Văn Cường', reason: 'Yêu cầu hủy đăng ký' },
      created_at: daysAgo(1),
    },
    // EXPORT action
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'EXPORT',
      table_name: 'payments',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      new_values: { format: 'PDF', records_count: 45, report: 'Báo cáo thanh toán Q1/2026' },
      created_at: daysAgo(2),
    },
    // More CREATE
    {
      user_id: teacher?.id || admin.id,
      user_email: teacher?.email || admin.email,
      action: 'CREATE',
      table_name: 'attendance',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      new_values: { class: 'IELTS 6.5 - C1', date: '2026-03-18', total_present: 12 },
      created_at: hoursAgo(6),
    },
    // UPDATE with CRITICAL severity
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'UPDATE',
      table_name: 'payments',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'CRITICAL',
      old_values: { status: 'PENDING', amount: 5000000 },
      new_values: { status: 'VERIFIED', amount: 5000000 },
      created_at: hoursAgo(8),
    },
    // FAILED status
    {
      user_id: teacher?.id || admin.id,
      user_email: teacher?.email || admin.email,
      action: 'UPDATE',
      table_name: 'grades',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'FAILED',
      severity: 'WARNING',
      new_values: { error: 'Grades locked by admin' },
      created_at: daysAgo(3),
    },
    // CREATE course
    {
      user_id: admin.id,
      user_email: admin.email,
      action: 'CREATE',
      table_name: 'courses',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      new_values: { name: 'Toán Nâng Cao Lớp 10', price: 3500000 },
      created_at: daysAgo(4),
    },
    // DELETE enrollment
    {
      user_id: manager?.id || admin.id,
      user_email: manager?.email || admin.email,
      action: 'DELETE',
      table_name: 'enrollments',
      record_id: crypto.randomUUID(),
      center_id: center.id,
      status: 'SUCCESS',
      severity: 'INFO',
      old_values: { student: 'Lê Thị Dung', reason: 'Chuyển lớp' },
      created_at: daysAgo(5),
    },
  ];

  console.log(`Inserting ${mockLogs.length} mock audit logs...`);

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(mockLogs)
    .select('id');

  if (error) {
    console.error('Error inserting:', error);
    // Try one-by-one to find which one fails
    for (let i = 0; i < mockLogs.length; i++) {
      const { error: singleError } = await supabase.from('audit_logs').insert(mockLogs[i]);
      if (singleError) {
        console.error(`Failed log #${i}:`, singleError.message);
      } else {
        console.log(`Log #${i} inserted OK`);
      }
    }
  } else {
    console.log(`✅ Successfully inserted ${data.length} audit logs`);
  }
}

seed().catch(console.error);
