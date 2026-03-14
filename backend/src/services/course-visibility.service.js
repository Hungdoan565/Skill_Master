const ENROLLABLE_CLASS_STATUSES = new Set(['upcoming', 'ongoing']);

const REASON_LABELS = {
  course_status_blocking: 'Trạng thái khóa học chưa mở tuyển sinh',
  no_class_defined: 'Khóa học chưa có lớp nào',
  center_mismatch: 'Chưa có lớp thuộc trung tâm đang chọn',
  class_lifecycle_mismatch: 'Lớp chưa ở trạng thái mở đăng ký'
};

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getStudentVisibilityDiagnostics({ courseStatus, classRows, effectiveCenterId }) {
  const rows = toArray(classRows);
  const scopedRows = effectiveCenterId
    ? rows.filter(row => row.center_id === effectiveCenterId)
    : rows;

  const eligibleRows = scopedRows.filter(row => ENROLLABLE_CLASS_STATUSES.has(row.status));
  const reasons = [];
  const isCourseActive = courseStatus === 'active';

  if (!isCourseActive) {
    reasons.push('course_status_blocking');
  }

  if (rows.length === 0) {
    reasons.push('no_class_defined');
  } else if (effectiveCenterId && scopedRows.length === 0) {
    reasons.push('center_mismatch');
  } else if (eligibleRows.length === 0) {
    reasons.push('class_lifecycle_mismatch');
  }

  const visibleNow = isCourseActive && eligibleRows.length > 0;
  const reasonCodes = visibleNow ? [] : Array.from(new Set(reasons));

  return {
    visible_now: visibleNow,
    reason_codes: reasonCodes,
    reason_labels: reasonCodes.map(code => REASON_LABELS[code] || code),
    eligible_class_count: eligibleRows.length,
    scoped_class_count: scopedRows.length,
    total_class_count: rows.length,
    effective_center_id: effectiveCenterId || null
  };
}

export function buildCoursesWithStudentVisibility({ courses, classRows, effectiveCenterId }) {
  const groupedClasses = new Map();

  for (const row of toArray(classRows)) {
    if (!row?.course_id) continue;
    const current = groupedClasses.get(row.course_id) || [];
    current.push(row);
    groupedClasses.set(row.course_id, current);
  }

  return toArray(courses).map(course => {
    const visibility = getStudentVisibilityDiagnostics({
      courseStatus: course.status,
      classRows: groupedClasses.get(course.id) || [],
      effectiveCenterId
    });

    return {
      ...course,
      student_visible_now: visibility.visible_now,
      student_visibility_reasons: visibility.reason_codes,
      student_visibility_reason_labels: visibility.reason_labels,
      student_visibility: visibility
    };
  });
}
