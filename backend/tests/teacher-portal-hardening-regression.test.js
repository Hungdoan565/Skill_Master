import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const backendSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', 'src', 'index.js'),
    'utf8'
);

const leaveHookSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-leave', 'hooks', 'useLeaveRequests.js'),
    'utf8'
);

const profileHookSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-profile', 'hooks', 'useTeacherProfile.js'),
    'utf8'
);

const profilePageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-profile', 'pages', 'TeacherProfilePage.jsx'),
    'utf8'
);

const dashboardHookSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-dashboard', 'hooks', 'useTeacherDashboard.js'),
    'utf8'
);

const teacherSchedulePageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-schedule', 'pages', 'TeacherSchedulePage.jsx'),
    'utf8'
);

const teacherScheduleHookSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-schedule', 'hooks', 'useTeacherSchedule.js'),
    'utf8'
);

const quickAttendanceSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-attendance', 'pages', 'TeacherQuickAttendancePage.jsx'),
    'utf8'
);

const upcomingSessionsSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-dashboard', 'components', 'UpcomingSessions.jsx'),
    'utf8'
);

const teacherClassesHookSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-classes', 'hooks', 'useTeacherClasses.js'),
    'utf8'
);

const teacherClassesPageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-classes', 'pages', 'TeacherClassesPage.jsx'),
    'utf8'
);

const smartAlertsSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-dashboard', 'components', 'SmartAlerts.jsx'),
    'utf8'
);

const quickActionsSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-dashboard', 'components', 'QuickActions.jsx'),
    'utf8'
);

const studentProgressPageSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '..', '..', 'frontend', 'src', 'features', 'teacher-classes', 'pages', 'StudentProgressPage.jsx'),
    'utf8'
);

test('teacher leave backend supports schema-compatible teacher column lookup', () => {
    assert.match(backendSource, /LEAVE_TEACHER_COLUMN_CANDIDATES\s*=\s*\['staff_id',\s*'teacher_id'\]/);
    assert.match(backendSource, /runLeaveQueryWithTeacherColumn/);
    assert.match(backendSource, /\[teacherColumn\]:\s*teacherId/);
    assert.match(backendSource, /mapLeaveMutationError/);
});

test('teacher leave frontend normalizes payload and parses API response safely', () => {
    assert.match(leaveHookSource, /normalizeLeavePayload/);
    assert.match(leaveHookSource, /ALLOWED_LEAVE_TYPES/);
    assert.match(leaveHookSource, /parseJsonSafe/);
    assert.match(leaveHookSource, /body:\s*JSON\.stringify\(payload\)/);
});

test('teacher profile hook exposes avatar upload API integration', () => {
    assert.match(profileHookSource, /const uploadAvatar = useCallback\(async \(base64Image\)/);
    assert.match(profileHookSource, /\/api\/users\/me\/avatar/);
    assert.match(profileHookSource, /return \{ profile, loading, saving, error, refetch: fetchProfile, updateProfile, uploadAvatar \}/);
});

test('teacher profile page includes avatar picker and validation UX', () => {
    assert.match(profilePageSource, /MAX_AVATAR_SIZE/);
    assert.match(profilePageSource, /ALLOWED_AVATAR_TYPES/);
    assert.match(profilePageSource, /type="file"/);
    assert.match(profilePageSource, /handleAvatarChange/);
});

test('teacher dashboard hook isolates endpoint failures with allSettled', () => {
    assert.match(dashboardHookSource, /Promise\.allSettled/);
    assert.match(dashboardHookSource, /safeJson/);
    assert.match(dashboardHookSource, /normalizeDateOnly/);
});

test('teacher schedule backend exposes operational metadata contract and local date helpers', () => {
    assert.match(backendSource, /function formatDateOnlyLocal\(/);
    assert.match(backendSource, /function parseDateOnlyLocal\(/);
    assert.match(backendSource, /function isSessionTimeOverlap\(/);
    assert.match(backendSource, /operationalMeta:\s*\{/);
    assert.match(backendSource, /hasTeacherConflict/);
    assert.match(backendSource, /hasRoomConflict/);
    assert.match(backendSource, /isHoliday/);
    assert.match(backendSource, /exceptionType/);
    assert.match(backendSource, /isLinkedToPayroll/);
});

test('teacher schedule frontend consumes and renders operational metadata', () => {
    assert.match(teacherScheduleHookSource, /normalizeOperationalMeta/);
    assert.match(teacherScheduleHookSource, /normalizeScheduleDays/);
    assert.match(teacherSchedulePageSource, /getOperationalBadges/);
    assert.match(teacherSchedulePageSource, /stats\.conflictSessions/);
    assert.match(teacherSchedulePageSource, /stats\.substitutedSessions/);
    assert.match(teacherSchedulePageSource, /stats\.holidaySessions/);
    assert.match(teacherSchedulePageSource, /formatDateOnlyLocal/);
});

test('teacher date handling avoids UTC split in upgraded teacher pages/widgets', () => {
    assert.match(quickAttendanceSource, /formatDateOnlyLocal/);
    assert.doesNotMatch(quickAttendanceSource, /toISOString\(\)\.split\('T'\)\[0\]/);

    assert.match(upcomingSessionsSource, /formatDateOnlyLocal/);
    assert.doesNotMatch(upcomingSessionsSource, /today\.toISOString\(\)\.split\('T'\)\[0\]/);
    assert.doesNotMatch(upcomingSessionsSource, /tomorrow\.toISOString\(\)\.split\('T'\)\[0\]/);

    assert.match(teacherSchedulePageSource, /formatDateOnlyLocal/);
    assert.doesNotMatch(teacherSchedulePageSource, /new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/);
});

test('teacher classes backend returns normalized status and operational summary contract', () => {
    assert.match(backendSource, /function normalizeClassStatus\(/);
    assert.match(backendSource, /function getClassOperationalRiskLevel\(/);
    assert.match(backendSource, /statusNormalized:/);
    assert.match(backendSource, /const operationalSummary\s*=\s*\{/);
    assert.match(backendSource, /operationalSummary,/);
    assert.match(backendSource, /scope:\s*'all_course'/);
    assert.match(backendSource, /conflictSessions:/);
    assert.match(backendSource, /substitutedSessions:/);
    assert.match(backendSource, /holidaySessions:/);
    assert.match(backendSource, /payrollLockedSessions:/);
});

test('teacher schedule backend includes selected-range scope metadata for weekly stats', () => {
    assert.match(backendSource, /stats:\s*\{/);
    assert.match(backendSource, /scope:\s*'selected_range'/);
    assert.match(backendSource, /range:\s*\{\s*startDate,\s*endDate\s*\}/);
});

test('teacher classes frontend normalizes classes payload and renders operational indicators', () => {
    assert.match(teacherClassesHookSource, /normalizeClassPayload/);
    assert.match(teacherClassesHookSource, /normalizeOperationalSummary/);
    assert.match(teacherClassesHookSource, /statusNormalized/);
    assert.match(teacherClassesHookSource, /operationalSummary/);
    assert.match(teacherClassesHookSource, /scope:\s*scope === 'all_course' \? 'all_course' : 'all_course'/);

    assert.match(teacherClassesPageSource, /getOperationalRiskConfig/);
    assert.match(teacherClassesPageSource, /getOperationalSignals/);
    assert.match(teacherClassesPageSource, /statusFilter === 'ongoing'/);
    assert.match(teacherClassesPageSource, /cls\.statusNormalized/);
    assert.match(teacherClassesPageSource, /parseDateOnlyLocal/);
    assert.match(teacherClassesPageSource, /toàn khóa/);
});

test('teacher schedule frontend labels stats as selected-week scope', () => {
    assert.match(teacherSchedulePageSource, /Phạm vi thống kê: tuần đang chọn/);
    assert.match(teacherSchedulePageSource, /stats\.range\?\.startDate/);
    assert.match(teacherSchedulePageSource, /stats\.range\?\.endDate/);
});

test('student progress surfaces hardened attendance denominator and safe local date rendering', () => {
    assert.match(backendSource, /attendance_marked_sessions:/);
    assert.match(backendSource, /const denominator = Math\.max\(totalSessions, attendanceMarkedCount\)/);

    assert.match(studentProgressPageSource, /attendance\.attendance_marked_sessions/);
    assert.match(studentProgressPageSource, /formatDateOnlyLocal/);
    assert.match(studentProgressPageSource, /formatDateTimeLocal/);
});

test('teacher alerts and quick actions use center-manager escalation semantics', () => {
    assert.match(smartAlertsSource, /Quản lý trung tâm đang xem xét bảng lương của bạn\./);
    assert.match(smartAlertsSource, /Quản lý trung tâm chưa xử lý đơn nghỉ của bạn\./);
    assert.doesNotMatch(smartAlertsSource, /Admin đang xem xét bảng lương của bạn\./);
    assert.doesNotMatch(smartAlertsSource, /Admin chưa xử lý đơn nghỉ của bạn\./);

    assert.match(quickActionsSource, /badge: pendingLeaveCount > 0 \? pendingLeaveCount : null/);
    assert.match(quickActionsSource, /label: 'Đơn xin nghỉ'/);
});

test('teacher leave request backend still escalates to center managers', () => {
    assert.match(backendSource, /app\.post\('\/api\/teacher\/leave-requests'[^]*from\('user_roles'\)/);
    assert.match(backendSource, /app\.post\('\/api\/teacher\/leave-requests'[^]*\.eq\('role', 'CENTER_MANAGER'\)/);
    assert.match(backendSource, /app\.post\('\/api\/teacher\/leave-requests'[^]*type: 'leave_request'/);
});

