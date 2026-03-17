/**
 * useTeacherGrades Hook
 * Manages grade tracking for teachers
 * Uses dynamic grade_structures from backend (per-course, UUID-based)
 */

import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

export function useTeacherGrades(classId) {
  // Backend data
  const [gradeStructures, setGradeStructures] = useState([]);
  const [studentsWithGrades, setStudentsWithGrades] = useState([]);
  const [classSummary, setClassSummary] = useState(null);
  const [lockStatus, setLockStatus] = useState({});

  // UI state
  const [selectedStructureId, setSelectedStructureId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Local edits tracking: Map<`${enrollmentId}`, { score, notes }>
  const [localEdits, setLocalEdits] = useState({});

  const hasChanges = useMemo(() => {
    return Object.keys(localEdits).length > 0;
  }, [localEdits]);

  // Selected grade structure object
  const selectedStructure = useMemo(() => {
    return gradeStructures.find(gs => gs.id === selectedStructureId) || null;
  }, [gradeStructures, selectedStructureId]);

  // Students list (flattened for UI)
  const students = useMemo(() => {
    return studentsWithGrades.map(s => ({
      id: s.student_id,
      enrollment_id: s.enrollment_id,
      full_name: s.student?.full_name || 'Học viên',
      email: s.student?.email || '',
      avatar_url: s.student?.avatar_url || null,
      student_code: s.student?.student_code || '',
      finalGrade: s.finalGrade
    }));
  }, [studentsWithGrades]);

  // Get grade for a specific student + current structure
  const getStudentGrade = useCallback((enrollmentId) => {
    const studentData = studentsWithGrades.find(s => s.enrollment_id === enrollmentId);
    if (!studentData || !selectedStructureId) return null;

    const grade = studentData.grades?.find(
      g => String(g.grade_structure_id) === String(selectedStructureId)
    );

    // Check for local edits
    const editKey = enrollmentId;
    const localEdit = localEdits[editKey];

    if (localEdit) {
      return {
        ...(grade || {}),
        score: localEdit.score !== undefined ? localEdit.score : (grade?.score ?? null),
        notes: localEdit.notes !== undefined ? localEdit.notes : (grade?.notes || ''),
        max_score: selectedStructure?.max_score || 10
      };
    }

    return grade ? {
      ...grade,
      max_score: selectedStructure?.max_score || 10
    } : null;
  }, [studentsWithGrades, selectedStructureId, selectedStructure, localEdits]);

  // Summary stats for selected structure
  const summaryStats = useMemo(() => {
    if (!selectedStructureId || !studentsWithGrades.length) {
      return { average: 0, highest: 0, lowest: 0, count: 0, total: studentsWithGrades.length || 0 };
    }

    const scores = [];
    studentsWithGrades.forEach(s => {
      const editKey = s.enrollment_id;
      const localEdit = localEdits[editKey];
      const grade = s.grades?.find(
        g => String(g.grade_structure_id) === String(selectedStructureId)
      );

      const score = localEdit?.score !== undefined ? localEdit.score : grade?.score;
      const numericScore = toNumberOrNull(score);
      if (numericScore !== null) {
        scores.push(numericScore);
      }
    });

    const classAverageFallback = toNumberOrNull(classSummary?.classAverage);
    const classHighestFallback = toNumberOrNull(classSummary?.highest);
    const classLowestFallback = toNumberOrNull(classSummary?.lowest);

    if (scores.length === 0) {
      return {
        average: classAverageFallback !== null ? classAverageFallback.toFixed(2) : 0,
        highest: classHighestFallback ?? 0,
        lowest: classLowestFallback ?? 0,
        count: classSummary?.gradedStudents || 0,
        total: classSummary?.totalStudents || studentsWithGrades.length
      };
    }

    return {
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      count: scores.length,
      total: studentsWithGrades.length
    };
  }, [studentsWithGrades, selectedStructureId, localEdits, classSummary]);

  // Fetch all data
  const fetchGrades = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/teacher/classes/${classId}/grades`,
        { headers }
      );

      if (response.data?.success) {
        const data = response.data.data || {};

        // Set grade structures (dynamic from backend)
        const structures = data.gradeStructures || [];
        setGradeStructures(structures);

        // Auto-select first structure if none selected
        if (structures.length > 0 && !selectedStructureId) {
          setSelectedStructureId(structures[0].id);
        }

        // Set students with grades
        setStudentsWithGrades(data.students || []);

        // Set summary
        setClassSummary(data.summary || null);

        // Set lock status (keyed by grade_structure_id)
        setLockStatus(data.lockStatus || {});

        // Clear local edits
        setLocalEdits({});
      } else {
        throw new Error(response.data?.message || 'Không thể tải điểm');
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải điểm');
    } finally {
      setLoading(false);
    }
  }, [classId, selectedStructureId]);

  // Select a grade structure tab
  const selectStructure = useCallback((structureId) => {
    setSelectedStructureId(structureId);
    setLocalEdits({}); // Clear edits when switching tabs
  }, []);

  // Update score locally
  const updateScore = useCallback((enrollmentId, score, maxScore) => {
    const numValue = score === '' || score === null ? null : parseFloat(score);
    if (numValue !== null && (numValue < 0 || numValue > maxScore)) return;

    setLocalEdits(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        score: numValue
      }
    }));
  }, []);

  // Update notes locally
  const updateNotes = useCallback((enrollmentId, notes) => {
    setLocalEdits(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        notes
      }
    }));
  }, []);

  // Save grades to backend
  const saveGrades = useCallback(async () => {
    if (!classId || !selectedStructureId) {
      return { success: false, message: 'Thiếu thông tin lớp hoặc loại điểm' };
    }

    if (Object.keys(localEdits).length === 0) {
      return { success: false, message: 'Không có thay đổi' };
    }

    setSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();

      // Build grades array from local edits
      const gradesPayload = Object.entries(localEdits).map(([enrollmentId, edit]) => {
        // Get original grade to merge
        const studentData = studentsWithGrades.find(s => s.enrollment_id === enrollmentId);
        const originalGrade = studentData?.grades?.find(g => g.grade_structure_id === selectedStructureId);

        return {
          enrollment_id: enrollmentId,
          score: edit.score !== undefined ? edit.score : (originalGrade?.score ?? null),
          notes: edit.notes !== undefined ? edit.notes : (originalGrade?.notes || null)
        };
      });

      const response = await axios.post(
        `${API_URL}/api/teacher/classes/${classId}/grades`,
        {
          gradeStructureId: selectedStructureId,
          grades: gradesPayload
        },
        { headers }
      );

      if (response.data?.success) {
        // Refresh data from server
        await fetchGrades();
        return { success: true, message: 'Lưu điểm thành công' };
      } else {
        throw new Error(response.data?.message || 'Không thể lưu điểm');
      }
    } catch (err) {
      console.error('Error saving grades:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi lưu điểm';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [classId, selectedStructureId, localEdits, studentsWithGrades, fetchGrades]);

  // Lock grades for a structure
  const lockGrades = useCallback(async (structureId) => {
    if (!classId) return { success: false, message: 'Không có lớp học' };

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/teacher/classes/${classId}/grades/lock`,
        { grade_structure_id: structureId || selectedStructureId },
        { headers }
      );

      if (response.data?.success) {
        setLockStatus(prev => ({
          ...prev,
          [structureId || selectedStructureId]: {
            isLocked: true,
            lockedAt: new Date().toISOString(),
            lockedBy: null
          }
        }));
        return { success: true, message: 'Khóa điểm thành công' };
      } else {
        throw new Error(response.data?.message || 'Không thể khóa điểm');
      }
    } catch (err) {
      console.error('Error locking grades:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi khóa điểm';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [classId, selectedStructureId]);

  // Refetch all data
  const refetch = useCallback(async () => {
    await fetchGrades();
  }, [fetchGrades]);

  return {
    // Data
    students,
    gradeStructures,
    selectedStructureId,
    selectedStructure,
    summaryStats,
    classSummary,
    loading,
    saving,
    error,
    lockStatus,
    hasChanges,

    // Actions
    fetchGrades,
    selectStructure,
    updateScore,
    updateNotes,
    saveGrades,
    lockGrades,
    refetch,

    // Utilities
    getStudentGrade,
  };
}
