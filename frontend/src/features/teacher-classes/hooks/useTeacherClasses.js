import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

            const response = await fetch('/api/teacher/dashboard/classes-summary', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Lỗi khi tải danh sách lớp');

            const result = await response.json();
            setClasses(result.classes || []);

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
