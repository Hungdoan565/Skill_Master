/**
 * useTeacherAttendance Hook
 * Manages attendance tracking for teachers
 */

import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Chưa đăng nhập');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
};

const normalizeClassId = (classId) => {
  if (classId === null || classId === undefined) return null;

  const normalized = String(classId).trim();
  if (!normalized || normalized.toLowerCase() === 'undefined' || normalized.toLowerCase() === 'null') {
    return null;
  }

  return normalized;
};

export function useTeacherAttendance(classId) {
  const normalizedClassId = normalizeClassId(classId);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [originalAttendance, setOriginalAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editStatus, setEditStatus] = useState(null);

  const hasChanges = useMemo(() => {
    return JSON.stringify(attendance) !== JSON.stringify(originalAttendance);
  }, [attendance, originalAttendance]);

  const summary = useMemo(() => ({
    total: students.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
  }), [attendance, students]);

  const fetchSessions = useCallback(async () => {
    if (!normalizedClassId) {
      setSessions([]);
      setError('Không tìm thấy lớp học để tải điểm danh');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/teacher/classes/${normalizedClassId}`,
        { headers }
      );

      if (response.data?.success) {
        const classData = response.data.data;
        // Map session_date to date for frontend compatibility
        const mappedSessions = (classData?.sessions || []).map(s => ({
          ...s,
          date: s.session_date || s.date,
          class_name: classData?.name || ''
        }));
        setSessions(mappedSessions);
      } else {
        throw new Error(response.data?.message || 'Không thể tải danh sách buổi học');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Lỗi khi tải danh sách buổi học');
    } finally {
      setLoading(false);
    }
  }, [normalizedClassId]);

  const fetchStudents = useCallback(async () => {
    if (!normalizedClassId) {
      setStudents([]);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/teacher/classes/${normalizedClassId}/students`,
        { headers }
      );

      if (response.data?.success) {
        setStudents(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [normalizedClassId]);

  const fetchAttendance = useCallback(async (sessionId) => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/teacher/sessions/${sessionId}/attendance`,
        { headers }
      );

      if (response.data?.success) {
        const attendanceData = response.data.data || [];
        setAttendance(attendanceData);
        setOriginalAttendance(JSON.parse(JSON.stringify(attendanceData)));
      } else {
        throw new Error(response.data?.message || 'Không thể tải điểm danh');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Lỗi khi tải điểm danh');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkEditStatus = useCallback(async (sessionId) => {
    if (!sessionId) return;

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/teacher/sessions/${sessionId}/edit-status`,
        { headers }
      );

      if (response.data?.success) {
        setEditStatus(response.data.data);
      }
    } catch (err) {
      console.error('Error checking edit status:', err);
      setEditStatus({ canEdit: false, reason: 'Không thể kiểm tra quyền chỉnh sửa' });
    }
  }, []);

  const selectSession = useCallback(async (session) => {
    setSelectedSession(session);
    if (session?.id) {
      await Promise.all([
        fetchAttendance(session.id),
        checkEditStatus(session.id)
      ]);
    } else {
      setAttendance([]);
      setOriginalAttendance([]);
      setEditStatus(null);
    }
  }, [fetchAttendance, checkEditStatus]);

  const updateAttendance = useCallback((studentId, status, notes = null) => {
    setAttendance(prev => prev.map(a =>
      a.student_id === studentId
        ? { ...a, status, ...(notes !== null && { notes }) }
        : a
    ));
  }, []);

  const saveAttendance = useCallback(async () => {
    if (!selectedSession?.id) return { success: false, message: 'Chưa chọn buổi học' };

    setSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/teacher/sessions/${selectedSession.id}/attendance`,
        { attendances: attendance },
        { headers }
      );

      if (response.data?.success) {
        setOriginalAttendance(JSON.parse(JSON.stringify(attendance)));
        return { success: true, message: 'Lưu điểm danh thành công' };
      } else {
        throw new Error(response.data?.message || 'Không thể lưu điểm danh');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi lưu điểm danh';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [selectedSession, attendance]);

  const markAllPresent = useCallback(() => {
    setAttendance(prev => prev.map(a => ({ ...a, status: 'present' })));
  }, []);

  const markAllAbsent = useCallback(() => {
    setAttendance(prev => prev.map(a => ({ ...a, status: 'absent' })));
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([
      fetchSessions(),
      fetchStudents()
    ]);
    if (selectedSession?.id) {
      await fetchAttendance(selectedSession.id);
    }
  }, [fetchSessions, fetchStudents, fetchAttendance, selectedSession]);

  return {
    sessions,
    selectedSession,
    attendance,
    students,
    loading,
    saving,
    error,
    editStatus,
    hasChanges,
    summary,

    fetchSessions,
    selectSession,
    fetchAttendance,
    updateAttendance,
    saveAttendance,
    markAllPresent,
    markAllAbsent,
    checkEditStatus,
    refetch,
  };
}
