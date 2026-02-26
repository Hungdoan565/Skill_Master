async function isPushNotificationEnabled(supabase, userId) {
  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('push_enabled, app_enabled, in_app_enabled, notifications_enabled, app_notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return true;
      }
      console.warn('⚠️ Không thể đọc user_notification_preferences cho push:', error.message);
      return true;
    }

    const candidates = [
      data?.push_enabled,
      data?.app_enabled,
      data?.in_app_enabled,
      data?.app_notifications_enabled,
      data?.notifications_enabled
    ];

    const firstDefined = candidates.find((value) => typeof value === 'boolean');
    return firstDefined !== false;
  } catch (error) {
    console.warn('⚠️ Lỗi khi kiểm tra user_notification_preferences cho push:', error.message);
    return true;
  }
}

export async function createNotification(
  supabase,
  { userId, centerId, type, title, message, referenceId = null, referenceType = null }
) {
  if (!supabase || !userId || !centerId || !type || !title) {
    return { success: false, skipped: true, reason: 'missing_required_fields' };
  }

  const isEnabled = await isPushNotificationEnabled(supabase, userId);
  if (!isEnabled) {
    return { success: false, skipped: true, reason: 'user_preference_disabled' };
  }

  const payload = {
    user_id: userId,
    center_id: centerId,
    type,
    title,
    message: message || null,
    reference_id: referenceId,
    reference_type: referenceType,
    read_at: null
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select('id, user_id, center_id, type, title, message, reference_id, reference_type, read_at, created_at')
    .single();

  if (error) {
    console.warn('⚠️ Không thể tạo notification:', error.message);
    return { success: false, skipped: true, reason: 'insert_failed', error };
  }

  return { success: true, data };
}
