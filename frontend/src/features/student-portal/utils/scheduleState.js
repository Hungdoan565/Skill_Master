export function getScheduleRange(currentDate, viewType = 'week') {
  const start = new Date(currentDate);
  const end = new Date(currentDate);

  if (viewType === 'week') {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return { startDate: start, endDate: end };
}

export function getCalendarGridRange(currentDate, viewType = 'week') {
  const { startDate, endDate } = getScheduleRange(currentDate, viewType);

  if (viewType !== 'month') {
    return { startDate, endDate };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.getDay();
  const prevDays = startDay === 0 ? 6 : startDay - 1;
  start.setDate(start.getDate() - prevDays);

  const endDay = end.getDay();
  const nextDays = endDay === 0 ? 0 : 7 - endDay;
  end.setDate(end.getDate() + nextDays);

  return { startDate: start, endDate: end };
}

export function formatScheduleRange(currentDate, viewType = 'week') {
  if (viewType === 'week') {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  }

  return currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

export function getToolbarState({ sessions, loading, notificationSupported }) {
  const sessionCount = Array.isArray(sessions) ? sessions.length : 0;
  const canExport = !loading && sessionCount > 0;
  const canRefresh = !loading;
  const canToggleNotifications = !loading && notificationSupported;

  let exportDisabledReason = '';
  if (loading) exportDisabledReason = 'Đang tải dữ liệu lịch học';
  else if (sessionCount === 0) exportDisabledReason = 'Không có buổi học để xuất';

  let notificationDisabledReason = '';
  if (loading) notificationDisabledReason = 'Đang tải dữ liệu lịch học';
  else if (!notificationSupported) notificationDisabledReason = 'Trình duyệt không hỗ trợ thông báo';

  return {
    canExport,
    canRefresh,
    canToggleNotifications,
    exportDisabledReason,
    notificationDisabledReason,
  };
}

export function getEmptyScheduleMessage({ classFilter, selectedClassName }) {
  if (classFilter && classFilter !== 'all') {
    const classLabel = selectedClassName || 'lớp đã chọn';
    return `Không có buổi học trong khoảng thời gian hiện tại cho ${classLabel}.`;
  }

  return 'Không có buổi học trong khoảng thời gian hiện tại. Hãy thử đổi tuần/tháng hoặc bộ lọc lớp.';
}
