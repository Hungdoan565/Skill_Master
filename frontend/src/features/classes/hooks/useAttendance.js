/**
 * useAttendance Hook
 * Manages session list and attendance tracking
 */

import { useState, useCallback } from 'react';
import { API_URL } from '../utils';

export function useAttendance(classId, getHeaders) {
  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsInfo, setSessionsInfo] = useState({ total: 0, completed: 0 });

  // Attendance modal state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Fetch sessions list from database (using admin API)
  const fetchSessions = useCallback(async () => {
    if (!classId) return;

    setLoadingSessions(true);
    try {
      // Use admin API to get sessions from database
      const res = await fetch(
        `${API_URL}/api/admin/classes/${classId}/sessions`,
        { headers: getHeaders() }
      );
      const json = await res.json();

      if (json.success) {
        // Process sessions to add day_name and status
        const processedSessions = (json.data || []).map(session => {
          // Parse session_date as local time to avoid timezone issues
          const [year, month, day] = session.session_date.split('-').map(Number);
          const sessionDate = new Date(year, month - 1, day);
          const dayOfWeek = sessionDate.getDay(); // 0=Sunday, 1=Monday, ...

          // Day names mapping (JS getDay)
          const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

          // Determine status
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          sessionDate.setHours(0, 0, 0, 0);

          let displayStatus = session.status;
          if (sessionDate.getTime() === today.getTime()) {
            displayStatus = 'today';
          } else if (sessionDate < today && session.status === 'upcoming') {
            displayStatus = 'completed';
          }

          return {
            ...session,
            date: session.session_date,
            day_of_week: dayOfWeek,
            day_name: dayNames[dayOfWeek],
            status: displayStatus,
            teacher: session.users || null
          };
        });

        setSessions(processedSessions);
        setSessionsInfo({
          total: processedSessions.length,
          completed: processedSessions.filter(s => s.status === 'completed').length
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, [classId, getHeaders]);

  // Fetch attendance for a specific session
  const fetchAttendance = useCallback(async (date) => {
    if (!classId) return;

    setLoadingAttendance(true);
    try {
      const res = await fetch(
        `${API_URL}/api/classes/${classId}/attendance?date=${date}`,
        { headers: getHeaders() }
      );
      const json = await res.json();

      if (json.success) {
        // Default all to "present" if not marked yet
        const listWithDefaults = json.data.students.map(s => ({
          ...s,
          status: s.attendance?.status || 'present',
          notes: s.attendance?.notes || ''
        }));
        setAttendanceList(listWithDefaults);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoadingAttendance(false);
    }
  }, [classId, getHeaders]);

  // Open attendance modal for a session
  const openAttendanceModal = useCallback((session) => {
    setSelectedSession(session);
    setShowAttendanceModal(true);
    setAttendanceSearch('');
    fetchAttendance(session.date);
  }, [fetchAttendance]);

  // Close attendance modal
  const closeAttendanceModal = useCallback(() => {
    setShowAttendanceModal(false);
    setSelectedSession(null);
    setAttendanceList([]);
    setAttendanceSearch('');
  }, []);

  // Update attendance status for a student
  const updateAttendanceStatus = useCallback((enrollmentId, status) => {
    setAttendanceList(prev => prev.map(s =>
      s.enrollment_id === enrollmentId ? { ...s, status } : s
    ));
  }, []);

  // Update attendance notes
  const updateAttendanceNotes = useCallback((enrollmentId, notes) => {
    setAttendanceList(prev => prev.map(s =>
      s.enrollment_id === enrollmentId ? { ...s, notes } : s
    ));
  }, []);

  // Save attendance
  const saveAttendance = useCallback(async () => {
    if (!selectedSession || !classId) return { success: false };

    setSavingAttendance(true);
    try {
      const res = await fetch(`${API_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          class_id: classId,
          date: selectedSession.date,
          session_id: selectedSession.id || null,
          attendances: attendanceList.map(s => ({
            enrollment_id: s.enrollment_id,
            status: s.status,
            notes: s.notes || null
          }))
        })
      });

      const json = await res.json();

      if (json.success) {
        closeAttendanceModal();
        fetchSessions(); // Refresh sessions list
        return {
          success: true,
          summary: json.data.summary
        };
      } else {
        return {
          success: false,
          message: json.message || 'Lỗi khi lưu điểm danh'
        };
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      return { success: false, message: 'Lỗi khi lưu điểm danh' };
    } finally {
      setSavingAttendance(false);
    }
  }, [classId, selectedSession, attendanceList, getHeaders, closeAttendanceModal, fetchSessions]);

  // Get filtered attendance list
  const getFilteredAttendanceList = useCallback(() => {
    return attendanceList.filter(s =>
      s.full_name?.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(attendanceSearch.toLowerCase())
    );
  }, [attendanceList, attendanceSearch]);

  // Get attendance summary counts
  const getAttendanceSummary = useCallback(() => {
    return {
      present: attendanceList.filter(s => s.status === 'present').length,
      late: attendanceList.filter(s => s.status === 'late').length,
      absent: attendanceList.filter(s => s.status === 'absent').length,
      total: attendanceList.length
    };
  }, [attendanceList]);

  return {
    // Sessions
    sessions,
    loadingSessions,
    sessionsInfo,
    fetchSessions,

    // Attendance Modal
    showAttendanceModal,
    selectedSession,
    attendanceList,
    loadingAttendance,
    savingAttendance,
    attendanceSearch,
    setAttendanceSearch,

    // Actions
    openAttendanceModal,
    closeAttendanceModal,
    updateAttendanceStatus,
    updateAttendanceNotes,
    saveAttendance,

    // Computed
    getFilteredAttendanceList,
    getAttendanceSummary
  };
}
