import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeFollowUpPriority,
  buildFollowUpMetadata,
  enrichStudentSupportTickets,
  buildSupportReplyNotificationEvents
} from '../src/services/consultation-followup.service.js';

test('advisor handoff -> linked follow-up -> student inbox enrichment scenario', () => {
  const priority = normalizeFollowUpPriority('hot');
  assert.equal(priority, 'urgent');

  const metadata = buildFollowUpMetadata({
    existingMetadata: { source: 'chatbot' },
    ticketId: 'ticket-001',
    ticketNumber: 'SP-2026-0001',
    actorId: 'advisor-001',
    linkedAt: '2026-03-13T10:00:00.000Z'
  });

  assert.equal(metadata.follow_up_ticket_id, 'ticket-001');
  assert.equal(metadata.follow_up_ticket_number, 'SP-2026-0001');
  assert.equal(metadata.follow_up_linked_by, 'advisor-001');

  const enrichedTickets = enrichStudentSupportTickets({
    tickets: [{ id: 'ticket-001', subject: 'Follow-up tư vấn' }],
    messageCounts: { 'ticket-001': 4 },
    consultationRows: [{ id: 'consult-001', status: 'contacted', metadata }]
  });

  assert.equal(enrichedTickets.length, 1);
  assert.equal(enrichedTickets[0].is_consultation_follow_up, true);
  assert.equal(enrichedTickets[0].consultation_request_id, 'consult-001');
  assert.equal(enrichedTickets[0].consultation_status, 'contacted');
  assert.equal(enrichedTickets[0].message_count, 4);
});

test('student/admin reply notifications scenario keeps internal notes hidden from notifications', () => {
  const ticket = {
    id: 'ticket-002',
    ticket_number: 'SP-2026-0002',
    center_id: 'center-001',
    created_by: 'student-001',
    assigned_to: 'advisor-001'
  };

  const advisorReplyEvents = buildSupportReplyNotificationEvents({
    ticket,
    actorId: 'advisor-001',
    actorIsAdmin: true,
    actorIsCreator: false,
    isInternal: false,
    message: 'Trung tâm đã xem và phản hồi chi tiết lộ trình.',
    fallbackCenterId: 'center-001'
  });

  assert.equal(advisorReplyEvents.length, 1);
  assert.equal(advisorReplyEvents[0].userId, 'student-001');
  assert.equal(advisorReplyEvents[0].referenceType, 'support_ticket');

  const studentReplyEvents = buildSupportReplyNotificationEvents({
    ticket,
    actorId: 'student-001',
    actorIsAdmin: false,
    actorIsCreator: true,
    isInternal: false,
    message: 'Em cần tư vấn thêm về thời gian học cuối tuần.',
    fallbackCenterId: 'center-001'
  });

  assert.equal(studentReplyEvents.length, 1);
  assert.equal(studentReplyEvents[0].userId, 'advisor-001');
  assert.equal(studentReplyEvents[0].type, 'support_ticket_student_reply');

  const internalNoteEvents = buildSupportReplyNotificationEvents({
    ticket,
    actorId: 'advisor-001',
    actorIsAdmin: true,
    actorIsCreator: false,
    isInternal: true,
    message: 'Ghi chú nội bộ cho advisor.',
    fallbackCenterId: 'center-001'
  });

  assert.equal(internalNoteEvents.length, 0);
});
