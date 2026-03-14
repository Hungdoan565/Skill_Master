export function normalizeFollowUpPriority(urgencyLevel) {
  if (urgencyLevel === 'hot') return 'urgent';
  if (urgencyLevel === 'warm') return 'high';
  return 'normal';
}

export function buildFollowUpMetadata({
  existingMetadata,
  ticketId,
  ticketNumber,
  actorId,
  linkedAt
}) {
  const safeMetadata = existingMetadata && typeof existingMetadata === 'object' ? existingMetadata : {};

  return {
    ...safeMetadata,
    follow_up_ticket_id: ticketId,
    follow_up_ticket_number: ticketNumber,
    follow_up_linked_at: safeMetadata.follow_up_linked_at || linkedAt,
    follow_up_linked_by: safeMetadata.follow_up_linked_by || actorId
  };
}

export function buildConsultationLinkMap(consultationRows = []) {
  const consultationByTicketId = new Map();

  for (const row of consultationRows) {
    if (!row || typeof row !== 'object') continue;
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    const followUpTicketId = metadata.follow_up_ticket_id;

    if (!followUpTicketId) continue;

    consultationByTicketId.set(followUpTicketId, {
      consultation_request_id: row.id,
      consultation_status: row.status,
      follow_up_ticket_number: metadata.follow_up_ticket_number || null
    });
  }

  return consultationByTicketId;
}

export function enrichStudentSupportTickets({ tickets = [], messageCounts = {}, consultationRows = [] }) {
  const consultationByTicketId = buildConsultationLinkMap(consultationRows);

  return tickets.map(ticket => {
    const linkedConsultation = consultationByTicketId.get(ticket.id);

    return {
      ...ticket,
      message_count: messageCounts[ticket.id] || 0,
      is_consultation_follow_up: Boolean(linkedConsultation),
      consultation_request_id: linkedConsultation?.consultation_request_id || null,
      consultation_status: linkedConsultation?.consultation_status || null,
      follow_up_ticket_number: linkedConsultation?.follow_up_ticket_number || null
    };
  });
}

export function buildSupportReplyNotificationEvents({
  ticket,
  actorId,
  actorIsAdmin,
  actorIsCreator,
  isInternal,
  message,
  fallbackCenterId
}) {
  const safeMessage = String(message || '').trim();
  const notificationEvents = [];

  if (!ticket || !safeMessage || isInternal) {
    return notificationEvents;
  }

  if (actorIsAdmin && ticket.created_by && ticket.created_by !== actorId) {
    notificationEvents.push({
      userId: ticket.created_by,
      centerId: ticket.center_id || fallbackCenterId,
      type: 'support_ticket_reply',
      title: 'Trung tâm đã phản hồi yêu cầu hỗ trợ',
      message: `#${ticket.ticket_number}: ${safeMessage.slice(0, 120)}`,
      referenceId: ticket.id,
      referenceType: 'support_ticket'
    });
  }

  if (actorIsCreator && ticket.assigned_to && ticket.assigned_to !== actorId) {
    notificationEvents.push({
      userId: ticket.assigned_to,
      centerId: ticket.center_id || fallbackCenterId,
      type: 'support_ticket_student_reply',
      title: `Học viên đã phản hồi ticket #${ticket.ticket_number}`,
      message: safeMessage.slice(0, 120),
      referenceId: ticket.id,
      referenceType: 'support_ticket'
    });
  }

  return notificationEvents;
}
