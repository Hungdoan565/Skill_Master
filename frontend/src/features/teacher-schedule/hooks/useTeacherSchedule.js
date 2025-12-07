import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook để fetch lịch dạy theo tuần của giáo viên
 */
export function useTeacherSchedule(startDate, endDate) {
    const [schedule, setSchedule] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSchedule = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`/api/teacher/schedule?${params}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải lịch dạy');

            const result = await response.json();
            setSchedule(result.data?.schedule || []);
            setStats(result.data?.stats || null);

        } catch (err) {
            console.error('Schedule fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    return {
        schedule,
        stats,
        loading,
        error,
        refetch: fetchSchedule
    };
}

/**
 * Hook để fetch lịch dạy theo tháng (calendar view)
 */
export function useTeacherMonthlySchedule(month, year) {
    const [sessionsByDate, setSessionsByDate] = useState({});
    const [totalSessions, setTotalSessions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMonthlySchedule = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);

            const response = await fetch(`/api/teacher/schedule/month?${params}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải lịch tháng');

            const result = await response.json();
            setSessionsByDate(result.data?.sessionsByDate || {});
            setTotalSessions(result.data?.totalSessions || 0);

        } catch (err) {
            console.error('Monthly schedule fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchMonthlySchedule();
    }, [fetchMonthlySchedule]);

    return {
        sessionsByDate,
        totalSessions,
        loading,
        error,
        refetch: fetchMonthlySchedule
    };
}

export default useTeacherSchedule;
