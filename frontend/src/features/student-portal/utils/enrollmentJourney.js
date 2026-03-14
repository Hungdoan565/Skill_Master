const STATUS_PRIORITY = {
  active: 1,
  enrolled: 1,
  completed: 2,
  dropped: 3,
  pending: 4,
  waitlisted: 5,
  approved: 6,
  rejected: 7,
  cancelled: 8,
};

export const JOURNEY_STATUS_UI = {
  pending: {
    label: 'Chờ duyệt',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-700 bg-yellow-50',
    group: 'processing',
  },
  waitlisted: {
    label: 'Chờ slot',
    variant: 'outline',
    className: 'border-orange-500 text-orange-700 bg-orange-50',
    group: 'processing',
  },
  approved: {
    label: 'Đã duyệt',
    variant: 'outline',
    className: 'border-blue-500 text-blue-700 bg-blue-50',
    group: 'processing',
  },
  enrolled: {
    label: 'Đã đăng ký',
    variant: 'outline',
    className: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    group: 'history',
  },
  completed: {
    label: 'Đã hoàn thành',
    variant: 'outline',
    className: 'border-violet-500 text-violet-700 bg-violet-50',
    group: 'history',
  },
  dropped: {
    label: 'Đã nghỉ',
    variant: 'outline',
    className: 'border-red-500 text-red-700 bg-red-50',
    group: 'history',
  },
  rejected: {
    label: 'Từ chối',
    variant: 'outline',
    className: 'border-rose-500 text-rose-700 bg-rose-50',
    group: 'history',
  },
  cancelled: {
    label: 'Đã hủy',
    variant: 'outline',
    className: 'border-slate-400 text-slate-600 bg-slate-50',
    group: 'history',
  },
};

export function resolveJourneyStatus({ journeyStatus, enrollmentStatus, requestStatus }) {
  if (journeyStatus && STATUS_PRIORITY[journeyStatus]) return journeyStatus;
  if (enrollmentStatus === 'active' || enrollmentStatus === 'enrolled') return 'enrolled';
  if (enrollmentStatus === 'completed') return 'completed';
  if (enrollmentStatus === 'dropped') return 'dropped';
  if (requestStatus === 'pending') return 'pending';
  if (requestStatus === 'waitlisted') return 'waitlisted';
  if (requestStatus === 'approved') return 'approved';
  if (requestStatus === 'rejected') return 'rejected';
  if (requestStatus === 'cancelled') return 'cancelled';
  return null;
}

export function getJourneyStatusMeta(status) {
  return JOURNEY_STATUS_UI[status] || {
    label: 'Chưa xác định',
    variant: 'outline',
    className: 'border-slate-300 text-slate-600 bg-slate-50',
    group: 'history',
  };
}

export function getClassActionState({ status, isFull }) {
  if (status === 'enrolled') {
    return { type: 'badge', label: 'Đã đăng ký', className: 'border-emerald-500 text-emerald-700 bg-emerald-50' };
  }

  if (status === 'pending') {
    return { type: 'badge', label: 'Đang chờ duyệt', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' };
  }

  if (status === 'waitlisted') {
    return { type: 'badge', label: 'Đang trong danh sách chờ', className: 'border-orange-500 text-orange-700 bg-orange-50' };
  }

  if (status === 'approved') {
    return { type: 'badge', label: 'Đã duyệt, chờ xếp lớp', className: 'border-blue-500 text-blue-700 bg-blue-50' };
  }

  if (status === 'rejected') {
    return { type: 'badge', label: 'Đã bị từ chối', className: 'border-red-500 text-red-700 bg-red-50' };
  }

  if (status === 'completed') {
    return { type: 'badge', label: 'Đã hoàn thành', className: 'border-violet-500 text-violet-700 bg-violet-50' };
  }

  if (status === 'dropped') {
    return { type: 'badge', label: 'Đã nghỉ', className: 'border-rose-500 text-rose-700 bg-rose-50' };
  }

  if (status === 'cancelled') {
    return { type: 'badge', label: 'Đã hủy yêu cầu', className: 'border-slate-400 text-slate-600 bg-slate-50' };
  }

  if (isFull) {
    return { type: 'button', mode: 'waitlist', label: 'Đăng ký chờ slot' };
  }

  return { type: 'button', mode: 'enroll', label: 'Đăng ký' };
}

export function splitJourneyGroups(items = []) {
  const processing = [];
  const history = [];

  for (const item of items) {
    const status = resolveJourneyStatus(item);
    const meta = getJourneyStatusMeta(status);
    const enriched = {
      ...item,
      status,
      statusMeta: meta,
    };

    if (meta.group === 'processing') processing.push(enriched);
    else history.push(enriched);
  }

  return { processing, history };
}
