import { supabase } from '../lib/db.js';

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  LOGIN: 'LOGIN',
};

export const AUDIT_ENTITY_TYPES = {
  USER: 'user',
  ENROLLMENT: 'enrollment',
  GRADE: 'grade',
  INVOICE: 'invoice',
  LEAVE_REQUEST: 'leave_request',
  SETTINGS: 'settings',
  COURSE: 'course',
  CLASS: 'class',
};

function tryParseJson(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function resolveEntityId(req, responsePayload) {
  if (req.params?.id) {
    return req.params.id;
  }

  if (req.params?.linkId) {
    return req.params.linkId;
  }

  if (req.params?.classId) {
    return req.params.classId;
  }

  const candidates = [
    responsePayload?.data?.id,
    responsePayload?.data?.enrollment_id,
    responsePayload?.data?.invoice_id,
    responsePayload?.data?.student_id,
    responsePayload?.id,
    req.body?.id,
    req.body?.enrollment_id,
    req.body?.invoice_id,
    req.body?.student_id,
  ];

  return candidates.find((item) => item !== undefined && item !== null) || null;
}

export function auditLog(action, entityType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let responsePayload = null;

    res.json = (body) => {
      responsePayload = body;
      return originalJson(body);
    };

    res.send = (body) => {
      if (!responsePayload && (typeof body === 'object' || Array.isArray(body))) {
        responsePayload = body;
      }
      if (!responsePayload && typeof body === 'string') {
        responsePayload = tryParseJson(body);
      }
      return originalSend(body);
    };

    res.on('finish', () => {
      if (!req.user?.id) {
        return;
      }

      if (res.statusCode < 200 || res.statusCode >= 400) {
        return;
      }

      const resolvedAction = typeof action === 'function' ? action(req, res, responsePayload) : action;
      const resolvedEntityType = typeof entityType === 'function' ? entityType(req, res, responsePayload) : entityType;
      const entityId = resolveEntityId(req, responsePayload);
      const payload = {
        user_id: req.user.id,
        action: resolvedAction,
        entity_type: resolvedEntityType,
        entity_id: entityId,
        old_values: resolvedAction === AUDIT_ACTIONS.CREATE ? null : (req.auditOldValues || null),
        new_values: req.body && Object.keys(req.body).length > 0 ? req.body : null,
        ip_address: req.ip || null,
        user_agent: req.headers['user-agent'] || null,
        center_id: req.user.centerId || req.user.center_id || req.body?.center_id || null,
        created_at: new Date().toISOString(),
        metadata: {
          method: req.method,
          path: req.originalUrl,
          status_code: res.statusCode,
        },
      };

      Promise.resolve(
        supabase
          .from('audit_logs')
          .insert(payload)
      ).catch((error) => {
        console.error('Audit log insert failed:', error?.message || error);
      });
    });

    next();
  };
}
