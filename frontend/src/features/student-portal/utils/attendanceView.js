import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns';

export const PERIOD_PRESETS = {
  d7: '7 ngày',
  d30: '30 ngày',
  term: 'Học kỳ',
};

export function toDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}

export function buildPeriodRange(preset, referenceDate = new Date()) {
  const endDate = endOfDay(referenceDate);
  let startDate;

  if (preset === 'd7') {
    startDate = startOfDay(subDays(endDate, 6));
  } else if (preset === 'term') {
    startDate = startOfDay(subDays(endDate, 119));
  } else {
    startDate = startOfDay(subDays(endDate, 29));
  }

  return {
    startDate,
    endDate,
    startKey: toDateKey(startDate),
    endKey: toDateKey(endDate),
  };
}

export function buildCalendarGridDays(startDate, endDate) {
  const calendarStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function deriveDayStatus(records, date, today = startOfDay(new Date())) {
  const normalizedDate = startOfDay(date);
  if (isAfter(normalizedDate, today)) return 'future';

  const dayRecords = (records || []).filter((record) =>
    isSameDay(new Date(record.session_date), normalizedDate)
  );

  if (dayRecords.length === 0) return 'none';
  if (dayRecords.some((record) => record.status === 'absent')) return 'absent';
  if (dayRecords.some((record) => record.status === 'late')) return 'late';
  if (dayRecords.some((record) => record.status === 'excused')) return 'excused';
  return 'present';
}

export function filterByStatus(records, statusFilter) {
  if (!statusFilter || statusFilter === 'all') return records || [];
  return (records || []).filter((record) => record.status === statusFilter);
}

export function paginateRecords(rows, page, pageSize) {
  const totalItems = rows.length;
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  return {
    items: rows.slice(startIndex, endIndex),
    page: currentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: totalItems === 0 ? 0 : Math.min(endIndex, totalItems),
  };
}

export function aggregateWeeklyRates(records, startDate, endDate) {
  if (!records || records.length === 0) return [];

  const weeks = eachWeekOfInterval(
    { start: startOfDay(startDate), end: endOfDay(endDate) },
    { weekStartsOn: 1 }
  );

  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekRecords = records.filter((r) => {
      const d = new Date(r.session_date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    if (weekRecords.length === 0) return 0;
    const present = weekRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
    return (present / weekRecords.length) * 100;
  });
}
