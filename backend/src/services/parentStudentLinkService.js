import { getEffectiveCenterId } from '../lib/center-scope.js';

const ALLOWED_RELATIONSHIPS = new Set(['father', 'mother', 'guardian', 'other']);

async function fetchUserWithRole(supabase, userId) {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
        id,
        center_id,
        roles (
          code
        )
      `,
    )
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

function deny(message) {
  return { success: false, status: 403, message };
}

function badRequest(message) {
  return { success: false, status: 400, message };
}

function notFound(message) {
  return { success: false, status: 404, message };
}

function conflict(message) {
  return { success: false, status: 409, message };
}

/**
 * Create a parent-student link with center-scope enforcement.
 */
export async function createParentStudentLink({ supabase, actor, payload }) {
  const {
    parent_id,
    student_id,
    relationship,
    is_primary = false,
    can_pay = true,
    can_view_academics = true,
    notes,
  } = payload || {};

  if (!parent_id || !student_id) {
    return badRequest('parent_id và student_id là bắt buộc');
  }

  if (!relationship || !ALLOWED_RELATIONSHIPS.has(String(relationship))) {
    return badRequest('relationship không hợp lệ');
  }

  const [{ data: parent, error: parentError }, { data: student, error: studentError }] = await Promise.all([
    fetchUserWithRole(supabase, parent_id),
    fetchUserWithRole(supabase, student_id),
  ]);

  if (parentError || !parent) {
    return notFound('Không tìm thấy phụ huynh');
  }

  if (studentError || !student) {
    return notFound('Không tìm thấy học viên');
  }

  if (parent.roles?.code !== 'PARENT') {
    return badRequest('User parent_id không phải role PARENT');
  }

  if (student.roles?.code !== 'STUDENT') {
    return badRequest('User student_id không phải role STUDENT');
  }

  const { error: scopeError } = getEffectiveCenterId(actor, student.center_id);
  if (scopeError) {
    return deny(scopeError);
  }

  const now = new Date().toISOString();

  const insertPayload = {
    parent_id,
    student_id,
    relationship: String(relationship),
    is_primary: !!is_primary,
    can_pay: !!can_pay,
    can_view_academics: !!can_view_academics,
    status: 'active',
    notes: notes ?? null,
    created_by: actor.id,
    updated_at: now,
  };

  const { data: created, error: createError } = await supabase
    .from('parent_student_links')
    .insert(insertPayload)
    .select('*')
    .single();

  if (createError) {
    if (createError.code === '23505') {
      return conflict('Liên kết phụ huynh - học viên đã tồn tại');
    }
    return { success: false, status: 500, message: 'Không thể tạo liên kết', error: createError.message };
  }

  return { success: true, data: created, message: 'Tạo liên kết thành công' };
}

/**
 * Update permissions/metadata of a parent-student link.
 */
export async function updateParentStudentLink({ supabase, actor, linkId, payload }) {
  if (!linkId) {
    return badRequest('linkId là bắt buộc');
  }

  const allowedFields = ['can_pay', 'can_view_academics', 'is_primary', 'relationship', 'notes'];
  const updatePayload = {};

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload || {}, key)) {
      updatePayload[key] = payload[key];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return badRequest('Không có dữ liệu cập nhật');
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, 'relationship')) {
    if (!ALLOWED_RELATIONSHIPS.has(String(updatePayload.relationship))) {
      return badRequest('relationship không hợp lệ');
    }
    updatePayload.relationship = String(updatePayload.relationship);
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, 'can_pay')) {
    updatePayload.can_pay = !!updatePayload.can_pay;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, 'can_view_academics')) {
    updatePayload.can_view_academics = !!updatePayload.can_view_academics;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, 'is_primary')) {
    updatePayload.is_primary = !!updatePayload.is_primary;
  }

  updatePayload.updated_at = new Date().toISOString();

  // Load link + student center for scope enforcement
  const { data: existing, error: existingError } = await supabase
    .from('parent_student_links')
    .select(
      `
        id,
        status,
        student:users!parent_student_links_student_id_fkey(
          id,
          center_id
        )
      `,
    )
    .eq('id', linkId)
    .single();

  if (existingError || !existing) {
    return notFound('Không tìm thấy liên kết');
  }

  const { error: scopeError } = getEffectiveCenterId(actor, existing.student?.center_id || null);
  if (scopeError) {
    return deny(scopeError);
  }

  const { data: updated, error: updateError } = await supabase
    .from('parent_student_links')
    .update(updatePayload)
    .eq('id', linkId)
    .select('*')
    .single();

  if (updateError) {
    return { success: false, status: 500, message: 'Không thể cập nhật liên kết', error: updateError.message };
  }

  return { success: true, data: updated, message: 'Cập nhật liên kết thành công' };
}

/**
 * Deactivate (soft-disable) a parent-student link.
 */
export async function deactivateParentStudentLink({ supabase, actor, linkId }) {
  if (!linkId) {
    return badRequest('linkId là bắt buộc');
  }

  const { data: existing, error: existingError } = await supabase
    .from('parent_student_links')
    .select(
      `
        id,
        status,
        student:users!parent_student_links_student_id_fkey(
          id,
          center_id
        )
      `,
    )
    .eq('id', linkId)
    .single();

  if (existingError || !existing) {
    return notFound('Không tìm thấy liên kết');
  }

  const { error: scopeError } = getEffectiveCenterId(actor, existing.student?.center_id || null);
  if (scopeError) {
    return deny(scopeError);
  }

  const { data: updated, error: updateError } = await supabase
    .from('parent_student_links')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId)
    .select('*')
    .single();

  if (updateError) {
    return { success: false, status: 500, message: 'Không thể vô hiệu hóa liên kết', error: updateError.message };
  }

  return { success: true, data: updated, message: 'Vô hiệu hóa liên kết thành công' };
}
