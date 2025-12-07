import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook để fetch dữ liệu Teacher Dashboard
 */
export function useTeacherDashboard() {
    const [overview, setOverview] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [classesSummary, setClassesSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            // Fetch all dashboard data in parallel
            const [overviewRes, sessionsRes, attendanceRes, classesRes] = await Promise.all([
                fetch('/api/teacher/dashboard/overview', { headers }),
                fetch('/api/teacher/dashboard/today-sessions', { headers }),
                fetch('/api/teacher/dashboard/attendance-stats', { headers }),
                fetch('/api/teacher/dashboard/classes-summary', { headers })
            ]);

            // Check for errors
            if (!overviewRes.ok) throw new Error('Lỗi khi tải thống kê tổng quan');
            if (!sessionsRes.ok) throw new Error('Lỗi khi tải lịch hôm nay');
            if (!attendanceRes.ok) throw new Error('Lỗi khi tải thống kê điểm danh');
            if (!classesRes.ok) throw new Error('Lỗi khi tải thông tin lớp học');

            // Parse responses
            const [overviewData, sessionsData, attendanceData, classesData] = await Promise.all([
                overviewRes.json(),
                sessionsRes.json(),
                attendanceRes.json(),
                classesRes.json()
            ]);

            setOverview(overviewData);
            setTodaySessions(sessionsData.sessions || []);
            setAttendanceStats(attendanceData);
            setClassesSummary(classesData.classes || []);

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
        attendanceStats,
        classesSummary,
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
