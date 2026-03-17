import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const formatDateOnlyLocal = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Hook để fetch dữ liệu Teacher Dashboard
 */
export function useTeacherDashboard() {
    const [overview, setOverview] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [classesSummary, setClassesSummary] = useState([]);
    const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const safeJson = async (response, fallback = null) => {
        try {
            return await response.json();
        } catch {
            return fallback;
        }
    };

    const normalizeDateOnly = (input) => {
        if (!input) return null;
        if (typeof input === 'string') {
            const dateOnly = input.split('T')[0];
            return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null;
        }
        if (input instanceof Date && !Number.isNaN(input.getTime())) {
            return formatDateOnlyLocal(input);
        }
        return null;
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const headers = {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            };

            // Prepare date range for upcoming sessions (today + 7 days)
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 7);
            const startDateStr = formatDateOnlyLocal(today);
            const endDateStr = formatDateOnlyLocal(endDate);

            // Fetch all dashboard data in parallel (including upcoming sessions & leave requests)
            const [overviewRs, sessionsRs, upcomingRs, attendanceRs, classesRs, leaveRs] = await Promise.allSettled([
                fetch('/api/teacher/dashboard/overview', { headers }),
                fetch('/api/teacher/dashboard/today-sessions', { headers }),
                fetch(`/api/teacher/schedule?start_date=${startDateStr}&end_date=${endDateStr}`, { headers }),
                fetch('/api/teacher/dashboard/attendance-stats', { headers }),
                fetch('/api/teacher/dashboard/classes-summary', { headers }),
                fetch('/api/teacher/leave-requests?status=pending', { headers })
            ]);

            const overviewRes = overviewRs.status === 'fulfilled' ? overviewRs.value : null;
            const sessionsRes = sessionsRs.status === 'fulfilled' ? sessionsRs.value : null;
            const upcomingRes = upcomingRs.status === 'fulfilled' ? upcomingRs.value : null;
            const attendanceRes = attendanceRs.status === 'fulfilled' ? attendanceRs.value : null;
            const classesRes = classesRs.status === 'fulfilled' ? classesRs.value : null;
            const leaveRes = leaveRs.status === 'fulfilled' ? leaveRs.value : null;

            // Critical API validation
            if (!overviewRes?.ok) throw new Error('Lỗi khi tải thống kê tổng quan');
            if (!sessionsRes?.ok) throw new Error('Lỗi khi tải lịch hôm nay');
            if (!attendanceRes?.ok) throw new Error('Lỗi khi tải thống kê điểm danh');
            if (!classesRes?.ok) throw new Error('Lỗi khi tải thông tin lớp học');

            // Parse responses safely
            const [overviewData, sessionsData, upcomingData, attendanceData, classesData] = await Promise.all([
                safeJson(overviewRes, {}),
                safeJson(sessionsRes, {}),
                upcomingRes?.ok ? safeJson(upcomingRes, { data: { schedule: [] } }) : Promise.resolve({ data: { schedule: [] } }),
                safeJson(attendanceRes, {}),
                safeJson(classesRes, {})
            ]);

            if (overviewData.success && overviewData.data) {
                // Map API response to the format expected by TeacherDashboardPage
                const apiOverview = overviewData.data;
                setOverview({
                    today_sessions: apiOverview.today?.total || 0,
                    today_completed: apiOverview.today?.completed || 0,
                    next_session: null,
                    monthly_hours: apiOverview.month?.completedHours || 0,
                    monthly_sessions: apiOverview.month?.completedSessions || 0,
                    estimated_income: apiOverview.month?.estimatedIncome || 0,
                    pending_attendance: apiOverview.pendingAttendance || 0,
                    active_classes: apiOverview.activeClasses || 0,
                    payroll_status: apiOverview.month?.payrollStatus || null,
                    payroll_amount: apiOverview.month?.payrollAmount || null
                });
            } else {
                setOverview(null);
            }

            setTodaySessions(sessionsData.data || []);

            // Map schedule API response to flat session array for UpcomingSessions widget
            // API returns: { data: { schedule: [{date, dayOfWeek, sessions:[...]}] } }
            const scheduleGroups = Array.isArray(upcomingData?.data?.schedule) ? upcomingData.data.schedule : [];
            const flatUpcoming = scheduleGroups.flatMap(group =>
                (group.sessions || []).map(s => ({
                    ...s,
                    session_date: normalizeDateOnly(s.session_date || group.date),
                    classes: s.classes || {
                        name: s.class_name,
                        rooms: s.room_name ? { name: s.room_name } : null
                    }
                }))
            ).filter(s => s.session_date && s.session_date > startDateStr); // exclude today, only future
            setUpcomingSessions(flatUpcoming);

            // Map attendance API response to the shape AttendanceStats component expects
            if (attendanceData.success && attendanceData.data) {
                const raw = attendanceData.data;
                setAttendanceStats({
                    completion_rate: raw.summary?.attendanceRate || 0,
                    monthly_trend: null, // not provided by API
                    by_class: (raw.byClass || []).map(c => ({
                        class_name: c.className,
                        rate: c.totalSessions > 0
                            ? Math.round((c.markedSessions / c.totalSessions) * 100)
                            : 0
                    }))
                });
            } else {
                setAttendanceStats(null);
            }

            setClassesSummary(classesData.data || []);

            // Parse pending leave count (non-critical, graceful fallback)
            if (leaveRes?.ok) {
                try {
                    const leaveData = await safeJson(leaveRes, {});
                    const leaves = leaveData.data || leaveData.leaveRequests || [];
                    setPendingLeaveCount(Array.isArray(leaves) ? leaves.length : 0);
                } catch {
                    setPendingLeaveCount(0);
                }
            } else {
                setPendingLeaveCount(0);
            }

        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        overview,
        todaySessions,
        upcomingSessions,
        attendanceStats,
        classesSummary,
        pendingLeaveCount,
        loading,
        error,
        refetch: fetchDashboardData
    };
}

/**
 * Hook để quản lý availability của giáo viên
 */
export function useTeacherAvailability() {
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchAvailability = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const response = await fetch('/api/teacher/availability', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải lịch trống');

            const data = await response.json();
            setAvailability(data.availability || []);

        } catch (err) {
            console.error('Availability fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateAvailability = async (slots) => {
        try {
            setSaving(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const response = await fetch('/api/teacher/availability', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ slots })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi cập nhật lịch trống');
            }

            const data = await response.json();
            setAvailability(data.availability || []);
            return { success: true };

        } catch (err) {
            console.error('Availability update error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    return {
        availability,
        loading,
        saving,
        error,
        updateAvailability,
        refetch: fetchAvailability
    };
}

export default useTeacherDashboard;
