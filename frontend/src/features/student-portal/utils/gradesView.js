const DEFAULT_SEARCH_KEYS = ['className', 'courseTitle', 'gradeTypeLabel'];

export function flattenClassSummaries(classSummaries) {
  return (classSummaries || []).flatMap((summary) =>
    (summary.grades || []).map((grade) => ({
      ...grade,
      className: summary.className,
      classId: summary.classId,
      courseTitle: summary.courseTitle,
    }))
  );
}

export function filterGrades(grades, searchTerm, keys = DEFAULT_SEARCH_KEYS) {
  const normalizedTerm = String(searchTerm || '').trim().toLowerCase();
  if (!normalizedTerm) return grades || [];

  return (grades || []).filter((grade) =>
    keys.some((key) => String(grade?.[key] || '').toLowerCase().includes(normalizedTerm))
  );
}

function getDateValue(grade) {
  const source = grade?.graded_at || grade?.created_at || 0;
  return new Date(source).getTime() || 0;
}

function getSortValue(grade, sortKey) {
  if (sortKey === 'class') return String(grade.className || '');
  if (sortKey === 'type') return String(grade.gradeTypeLabel || grade.grade_type_name || '');
  if (sortKey === 'score') return Number(grade.score ?? -1);
  if (sortKey === 'weight') return Number(grade.weight ?? 0);
  return getDateValue(grade);
}

export function sortGrades(grades, sortConfig) {
  const normalizedSort = sortConfig || { key: 'date', order: 'desc' };
  const rows = [...(grades || [])];

  rows.sort((left, right) => {
    const leftValue = getSortValue(left, normalizedSort.key);
    const rightValue = getSortValue(right, normalizedSort.key);

    if (leftValue < rightValue) return normalizedSort.order === 'asc' ? -1 : 1;
    if (leftValue > rightValue) return normalizedSort.order === 'asc' ? 1 : -1;
    return 0;
  });

  return rows;
}

export function nextSortConfig(previousSort, sortKey) {
  const base = previousSort || { key: 'date', order: 'desc' };
  return {
    key: sortKey,
    order: base.key === sortKey && base.order === 'desc' ? 'asc' : 'desc',
  };
}

export function toggleExpandedGroupState(previousState, groupId) {
  return {
    ...(previousState || {}),
    [groupId]: !(previousState || {})[groupId],
  };
}

export function paginateRecords(rows, page, pageSize) {
  const totalItems = rows.length;
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  const endIndexExclusive = startIndex + safePageSize;
  const pageItems = rows.slice(startIndex, endIndexExclusive);

  return {
    pageItems,
    currentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: totalItems === 0 ? 0 : Math.min(endIndexExclusive, totalItems),
  };
}

export function getTranscriptPeriod(dateValue) {
  const date = new Date(dateValue || 0);
  if (Number.isNaN(date.getTime())) return 'Khong xac dinh';

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  if (month >= 8) {
    return `Hoc ky 1 ${year}-${year + 1}`;
  }

  if (month <= 5) {
    return `Hoc ky 2 ${year - 1}-${year}`;
  }

  return `He ${year}`;
}

export function groupByClass(rows) {
  const groups = new Map();

  (rows || []).forEach((row) => {
    const key = String(row.classId || row.className || 'unknown');
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        classId: row.classId || null,
        className: row.className || 'Lop khong xac dinh',
        courseTitle: row.courseTitle || '',
        grades: [],
      });
    }
    groups.get(key).grades.push(row);
  });

  return Array.from(groups.values())
    .map((group) => {
      const scores = group.grades.map((grade) => Number(grade.score)).filter((value) => Number.isFinite(value));
      const average = scores.length
        ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2))
        : null;

      return {
        ...group,
        totalGrades: group.grades.length,
        average,
      };
    })
    .sort((left, right) => left.className.localeCompare(right.className));
}

export function groupByTranscriptPeriod(rows) {
  const groups = new Map();

  (rows || []).forEach((row) => {
    const period = getTranscriptPeriod(row.graded_at || row.created_at);
    if (!groups.has(period)) {
      groups.set(period, []);
    }
    groups.get(period).push(row);
  });

  return Array.from(groups.entries())
    .map(([period, periodRows]) => {
      const sortedRows = [...periodRows].sort(
        (left, right) => new Date(right.graded_at || right.created_at || 0).getTime() - new Date(left.graded_at || left.created_at || 0).getTime()
      );
      const scores = sortedRows.map((grade) => Number(grade.score)).filter((value) => Number.isFinite(value));
      const average = scores.length
        ? Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2))
        : null;

      return {
        period,
        grades: sortedRows,
        totalGrades: sortedRows.length,
        average,
      };
    })
    .sort((left, right) => right.period.localeCompare(left.period));
}
