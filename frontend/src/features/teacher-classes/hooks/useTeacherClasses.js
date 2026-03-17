import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_CLASS_STATUSES = new Set(['ongoing', 'upcoming', 'completed', 'cancelled', 'paused']);

const parseJsonSafe = (input, fallback) => {
    if (input == null) return fallback;
    if (typeof input !== 'string') return input;
    try {
        return JSON.parse(input);
    } catch {
        return fallback;
    }
};

const normalizeClassStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') return 'ongoing';
    if (ALLOWED_CLASS_STATUSES.has(normalized)) return normalized;
    return 'upcoming';
};

const normalizeOperationalSummary = (summary) => {
    const parsed = summary && typeof summary === 'object' ? summary : {};
    const riskLevel = String(parsed.riskLevel || '').toLowerCase();
    const scope = String(parsed.scope || '').toLowerCase();

    return {
        totalSessions: Number(parsed.totalSessions || 0),
        completedSessions: Number(parsed.completedSessions || 0),
        conflictSessions: Number(parsed.conflictSessions || 0),
        substitutedSessions: Number(parsed.substitutedSessions || 0),
        holidaySessions: Number(parsed.holidaySessions || 0),
        payrollLockedSessions: Number(parsed.payrollLockedSessions || 0),
        riskLevel: ['low', 'medium', 'high'].includes(riskLevel) ? riskLevel : 'low',
        scope: scope === 'all_course' ? 'all_course' : 'all_course'
    };
};

const normalizeClassPayload = (item) => {
    const cls = item && typeof item === 'object' ? item : {};
    const statusNormalized = normalizeClassStatus(cls.statusNormalized || cls.status);
    const totalSessions = Number(cls.totalSessions ?? cls.total_sessions ?? 0);
    const completedSessions = Number(cls.completedSessions ?? cls.completed_sessions ?? 0);
    const progressRaw = Number(cls.progress ?? 0);
    const progress = Number.isFinite(progressRaw)
        ? Math.min(100, Math.max(0, progressRaw))
        : 0;

    return {
        ...cls,
        statusNormalized,
        schedule: parseJsonSafe(cls.schedule, cls.schedule),
        studentCount: Number(cls.studentCount ?? cls.student_count ?? 0),
        totalSessions,
        completedSessions,
        progress,
        operationalSummary: normalizeOperationalSummary(cls.operationalSummary)
    };
};

/**
 * Hook để fetch danh sách lớp học của giáo viên
 */
export function useTeacherClasses() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const response = await fetch('/api/teacher/classes', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải danh sách lớp');

            const result = await response.json();
            const list = Array.isArray(result.data) ? result.data : [];
            setClasses(list.map(normalizeClassPayload));

        } catch (err) {
            console.error('Classes fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    return {
        classes,
        loading,
        error,
        refetch: fetchClasses
    };
}

/**
 * Hook để fetch chi tiết một lớp học
 */
export function useTeacherClassDetail(classId) {
    const [classDetail, setClassDetail] = useState(null);
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClassDetail = useCallback(async () => {
        if (!classId) return;

        try {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Chưa đăng nhập');
            }

            const response = await fetch(`/api/teacher/classes/${classId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải thông tin lớp');

            const result = await response.json();
            setClassDetail(result.data?.class || null);
            setStudents(result.data?.students || []);
            setSessions(result.data?.sessions || []);

        } catch (err) {
            console.error('Class detail fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchClassDetail();
    }, [fetchClassDetail]);

    return {
        classDetail,
        students,
        sessions,
        loading,
        error,
        refetch: fetchClassDetail
    };
}

export default useTeacherClasses;
