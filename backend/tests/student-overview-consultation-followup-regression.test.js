import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
  'utf8'
);

const studentDashboardSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'student-portal', 'pages', 'StudentDashboard.jsx'),
  'utf8'
);

const migration70Source = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', '..', 'database', '70_support_ticket_consultation_link.sql'),
  'utf8'
);

const followUpServiceSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '..', 'src', 'services', 'consultation-followup.service.js'),
  'utf8'
);

test('student dashboard contract exposes normalized time and room fields with UI fallback support', () => {
  assert.match(
    backendSource,
    /app\.get\('\/api\/student\/dashboard'[\s\S]*start_time:\s*session\.start_time[\s\S]*end_time:\s*session\.end_time[\s\S]*room_name:\s*session\.class\?\.room\s*\|\|\s*null/
  );

  assert.match(
    studentDashboardSource,
    /const startTime = classItem\.start_time \|\| classItem\.todaySchedule\?\.start \|\| null;/
  );
  assert.match(
    studentDashboardSource,
    /const endTime = classItem\.end_time \|\| classItem\.todaySchedule\?\.end \|\| null;/
  );
  assert.match(
    studentDashboardSource,
    /const roomName = classItem\.room_name \|\| classItem\.room \|\| classItem\.todaySchedule\?\.room_name \|\| 'Chưa xếp phòng';/
  );
});

test('consultation requests support follow-up thread linkage and idempotent endpoint', () => {
  assert.match(
    backendSource,
    /function extractConsultationFollowUp\(metadata\)/
  );
  assert.match(
    backendSource,
    /app\.post\('\/api\/admin\/consultation-requests\/:id\/follow-up-thread'/
  );
  assert.match(
    backendSource,
    /buildFollowUpMetadata\(\{[\s\S]*ticketId: newTicket\.id/
  );
  assert.match(
    backendSource,
    /withConsultationFollowUp\(/g
  );
  assert.match(
    backendSource,
    /\.eq\('consultation_request_id', id\)/
  );
  assert.match(
    backendSource,
    /createTicketError\?\.code === '23505'/
  );
});

test('consultation follow-up linkage migration enforces unique idempotent thread mapping', () => {
  assert.match(
    migration70Source,
    /ADD COLUMN consultation_request_id UUID REFERENCES public\.consultation_requests\(id\) ON DELETE SET NULL/
  );
  assert.match(
    migration70Source,
    /CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_consultation_request_unique/
  );
  assert.match(
    migration70Source,
    /WHERE consultation_request_id IS NOT NULL/
  );
});

test('support ticket route authority and student follow-up visibility are preserved', () => {
  assert.match(
    backendSource,
    /app\.get\('\/api\/legacy\/admin\/support-tickets'/
  );
  assert.match(
    backendSource,
    /app\.post\('\/api\/support-tickets', requireAuth/
  );
  assert.match(
    backendSource,
    /app\.get\('\/api\/my-support-tickets\/:id', requireAuth, requireRole\(\['STUDENT'\]\)/
  );
  assert.match(
    backendSource,
    /\.eq\('is_internal', false\)/
  );
});

test('advisor-student follow-up messaging emits support ticket notifications', () => {
  assert.match(
    backendSource,
    /buildSupportReplyNotificationEvents\(\{/
  );
  assert.match(
    followUpServiceSource,
    /type:\s*'support_ticket_reply'/
  );
  assert.match(
    followUpServiceSource,
    /type:\s*'support_ticket_student_reply'/
  );
  assert.match(
    followUpServiceSource,
    /referenceType:\s*'support_ticket'/
  );
});
