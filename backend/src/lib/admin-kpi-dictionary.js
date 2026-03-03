export const STRATEGIC_DEFINITION_VERSION = '2026.03.01';

export const STRATEGIC_DOMAINS = Object.freeze({
  NORTH_STAR: 'center_health_index',
  GROWTH: 'growth',
  ACADEMIC_QUALITY: 'academic_quality',
  FINANCIAL: 'financial',
  CAPACITY: 'capacity',
  GOVERNANCE_RISK: 'governance_risk',
});

export const STRATEGIC_METRIC_IDS = Object.freeze({
  CENTER_HEALTH_INDEX: 'north_star.center_health_index',
  REVENUE_TOTAL: 'financial.revenue_total',
  COLLECTION_RATE: 'financial.collection_rate',
  OVERDUE_DEBT: 'financial.overdue_debt',
  REVENUE_GROWTH_MOM: 'financial.revenue_growth_mom',
  ACTIVE_STUDENTS: 'growth.active_students',
  ENROLLMENT_GROWTH_MOM: 'growth.enrollment_growth_mom',
  CLASS_COUNT: 'capacity.active_classes',
  STAFF_COUNT: 'capacity.active_staff',
  CLASS_FILL_RATE: 'capacity.class_fill_rate',
  ATTENDANCE_RATE: 'academic_quality.attendance_rate',
  AUDIT_COVERAGE: 'governance_risk.audit_coverage',
  GOVERNANCE_READINESS: 'governance_risk.governance_readiness',
});

export const STRATEGIC_KPI_DICTIONARY = Object.freeze({
  version: STRATEGIC_DEFINITION_VERSION,
  northStar: {
    id: STRATEGIC_METRIC_IDS.CENTER_HEALTH_INDEX,
    name: 'Center Health Index',
    domain: STRATEGIC_DOMAINS.NORTH_STAR,
    ownerRole: 'SUPER_ADMIN',
    cadence: 'weekly',
    grains: ['system', 'center'],
  },
  metrics: Object.freeze([
    {
      id: STRATEGIC_METRIC_IDS.REVENUE_TOTAL,
      domain: STRATEGIC_DOMAINS.FINANCIAL,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'daily',
      grains: ['system', 'center'],
      formulaIntent: {
        numerator: 'SUM(payments.amount)',
        denominator: null,
        exclusions: ['payments not verified'],
      },
      rag: { green: '>= target', amber: '>= 85% target', red: '< 85% target' },
    },
    {
      id: STRATEGIC_METRIC_IDS.COLLECTION_RATE,
      domain: STRATEGIC_DOMAINS.FINANCIAL,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'daily',
      grains: ['center'],
      formulaIntent: {
        numerator: 'SUM(invoices.paid_amount)',
        denominator: 'SUM(invoices.final_amount)',
        exclusions: ['cancelled invoices'],
      },
      rag: { green: '>= 80%', amber: '60-79%', red: '< 60%' },
    },
    {
      id: STRATEGIC_METRIC_IDS.OVERDUE_DEBT,
      domain: STRATEGIC_DOMAINS.FINANCIAL,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'daily',
      grains: ['system', 'center'],
      formulaIntent: {
        numerator: 'SUM(invoices.final_amount - invoices.paid_amount)',
        denominator: null,
        exclusions: ['fully paid invoices'],
      },
      rag: { green: '<= target', amber: '<= 120% target', red: '> 120% target' },
    },
    {
      id: STRATEGIC_METRIC_IDS.ACTIVE_STUDENTS,
      domain: STRATEGIC_DOMAINS.GROWTH,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'daily',
      grains: ['system', 'center', 'class'],
      formulaIntent: {
        numerator: 'COUNT(users where role=STUDENT and status=active)',
        denominator: null,
        exclusions: ['inactive students'],
      },
      rag: { green: '>= target', amber: '>= 90% target', red: '< 90% target' },
    },
    {
      id: STRATEGIC_METRIC_IDS.ENROLLMENT_GROWTH_MOM,
      domain: STRATEGIC_DOMAINS.GROWTH,
      ownerRole: 'SUPER_ADMIN',
      cadence: 'weekly',
      grains: ['system', 'center'],
      formulaIntent: {
        numerator: 'Current period enrollments - previous period enrollments',
        denominator: 'previous period enrollments',
        exclusions: ['trial enrollments if excluded by policy'],
      },
      rag: { green: '>= 5%', amber: '0-4.9%', red: '< 0%' },
    },
    {
      id: STRATEGIC_METRIC_IDS.ATTENDANCE_RATE,
      domain: STRATEGIC_DOMAINS.ACADEMIC_QUALITY,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'daily',
      grains: ['system', 'center', 'class'],
      formulaIntent: {
        numerator: 'COUNT(attendance status in present, late)',
        denominator: 'COUNT(all attendance records)',
        exclusions: ['sessions outside selected window'],
      },
      rag: { green: '>= 85%', amber: '70-84%', red: '< 70%' },
    },
    {
      id: STRATEGIC_METRIC_IDS.CLASS_COUNT,
      domain: STRATEGIC_DOMAINS.CAPACITY,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'weekly',
      grains: ['system', 'center'],
      formulaIntent: {
        numerator: 'COUNT(classes where status=active)',
        denominator: 'planned classes capacity',
        exclusions: ['archived classes'],
      },
      rag: { green: 'within capacity plan', amber: 'slightly over/under plan', red: 'critical over/under plan' },
    },
    {
      id: STRATEGIC_METRIC_IDS.STAFF_COUNT,
      domain: STRATEGIC_DOMAINS.CAPACITY,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'weekly',
      grains: ['system', 'center'],
      formulaIntent: {
        numerator: 'COUNT(users role in CENTER_MANAGER, TEACHER with active status)',
        denominator: 'staffing plan baseline',
        exclusions: ['inactive users'],
      },
      rag: { green: 'meets staffing plan', amber: 'minor staffing gap', red: 'critical staffing gap' },
    },
    {
      id: STRATEGIC_METRIC_IDS.CLASS_FILL_RATE,
      domain: STRATEGIC_DOMAINS.CAPACITY,
      ownerRole: 'CENTER_MANAGER',
      cadence: 'weekly',
      grains: ['center', 'class'],
      formulaIntent: {
        numerator: 'SUM(active enrollments)',
        denominator: 'SUM(class.max_students)',
        exclusions: ['classes without capacity metadata'],
      },
      rag: { green: '>= 80%', amber: '60-79%', red: '< 60%' },
    },
    {
      id: STRATEGIC_METRIC_IDS.GOVERNANCE_READINESS,
      domain: STRATEGIC_DOMAINS.GOVERNANCE_RISK,
      ownerRole: 'SUPER_ADMIN',
      cadence: 'daily',
      grains: ['system'],
      formulaIntent: {
        numerator: 'count of passed governance checks',
        denominator: 'total governance checks',
        exclusions: [],
      },
      rag: { green: 'all checks pass', amber: 'non-critical checks fail', red: 'critical checks fail' },
    },
  ]),
});

export const ANOMALY_LIFECYCLE_STATES = Object.freeze(['new', 'assigned', 'investigating', 'resolved', 'expired']);

function buildWindow(startDate, endDate) {
  if (startDate && endDate) {
    return { type: 'custom', startDate, endDate };
  }

  return { type: 'default' };
}

export function createDataWarning(code, message, details = {}) {
  return {
    code,
    message,
    details,
  };
}

export function buildStrategicMeta({ startDate = null, endDate = null, dataFreshness = 'fresh', warnings = [] } = {}) {
  return {
    generatedAt: new Date().toISOString(),
    window: buildWindow(startDate, endDate),
    dataFreshness,
    definitionVersion: STRATEGIC_DEFINITION_VERSION,
    warnings,
  };
}

export function withStrategicMeta(payload, options = {}) {
  return {
    ...payload,
    ...buildStrategicMeta(options),
  };
}

export function unavailableMetric(metricId, reason, details = {}) {
  return {
    metricId,
    unavailable: true,
    reason,
    details,
  };
}

export function normalizeCenterCounts(center, stats = {}) {
  const roomCount = Number.isFinite(stats.roomCount) ? stats.roomCount : Number(center.rooms_count || 0);
  const studentCount = Number.isFinite(stats.studentCount) ? stats.studentCount : Number(center.students_count || 0);
  const teacherCount = Number.isFinite(stats.staffCount) ? stats.staffCount : Number(center.teachers_count || 0);

  return {
    ...center,
    rooms_count: roomCount,
    students_count: studentCount,
    teachers_count: teacherCount,
  };
}

export function buildGovernanceReadiness({ roleBoundaryOk, auditPipelineHealthy, strategicFeedsFresh, failedChecks = [] }) {
  const checks = [
    { key: 'role_boundary', pass: Boolean(roleBoundaryOk) },
    { key: 'audit_pipeline', pass: Boolean(auditPipelineHealthy) },
    { key: 'strategic_feeds_fresh', pass: Boolean(strategicFeedsFresh) },
  ];

  const passedCount = checks.filter((c) => c.pass).length;
  const total = checks.length;

  let status = 'healthy';
  if (passedCount < total) {
    status = passedCount === 0 ? 'degraded' : 'warning';
  }

  return {
    status,
    score: Math.round((passedCount / total) * 100),
    checks,
    failedChecks,
  };
}
