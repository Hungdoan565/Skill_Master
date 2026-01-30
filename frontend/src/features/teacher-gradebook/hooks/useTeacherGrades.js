/**
 * useTeacherGrades Hook
 * Manages grade tracking for teachers
 */

import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const GRADE_TYPES = [
  { value: 'participation', label: 'Điểm chuyên cần', weight: 0.1 },
  { value: 'assignment', label: 'Bài tập', weight: 0.2 },
  { value: 'quiz', label: 'Kiểm tra', weight: 0.2 },
  { value: 'midterm', label: 'Giữa kỳ', weight: 0.2 },
  { value: 'final', label: 'Cuối kỳ', weight: 0.3 },
];

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
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [originalGrades, setOriginalGrades] = useState([]);
  const [gradeTypes, setGradeTypes] = useState(GRADE_TYPES);
  const [selectedGradeType, setSelectedGradeType] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lockStatus, setLockStatus] = useState({});

  const hasChanges = useMemo(() => {
    return JSON.stringify(grades) !== JSON.stringify(originalGrades);
  }, [grades, originalGrades]);

  const calculateFinalGrade = useCallback((studentGrades) => {
    let totalWeight = 0;
    let weightedSum = 0;

    studentGrades.forEach(g => {
      if (g.score !== null && g.score !== undefined) {
        const normalized = (g.score / g.max_score) * 10;
        weightedSum += normalized * g.weight;
        totalWeight += g.weight;
      }
    });

    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : null;
  }, []);

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
        setStudents(data.students || []);
        const gradesData = data.grades || [];
        setGrades(gradesData);
        setOriginalGrades(JSON.parse(JSON.stringify(gradesData)));
        if (data.grade_types) {
          setGradeTypes(data.grade_types);
        }
        if (data.lock_status) {
          setLockStatus(data.lock_status);
        }
      } else {
        throw new Error(response.data?.message || 'Không thể tải điểm');
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError(err.message || 'Lỗi khi tải điểm');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const selectGradeType = useCallback((gradeType) => {
    setSelectedGradeType(gradeType);
  }, []);

  const updateGrade = useCallback((studentId, gradeTypeValue, score, maxScore = 10) => {
    setGrades(prev => {
      const existingIndex = prev.findIndex(
        g => g.student_id === studentId && g.grade_type === gradeTypeValue
      );

      const gradeType = gradeTypes.find(t => t.value === gradeTypeValue);
      const weight = gradeType?.weight || 0;

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          score,
          max_score: maxScore,
          weight
        };
        return updated;
      }

      return [...prev, {
        student_id: studentId,
        grade_type: gradeTypeValue,
        score,
        max_score: maxScore,
        weight
      }];
    });
  }, [gradeTypes]);

  const saveGrades = useCallback(async () => {
    if (!classId) return { success: false, message: 'Không có lớp học' };

    setSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/teacher/classes/${classId}/grades`,
        { grades },
        { headers }
      );

      if (response.data?.success) {
        setOriginalGrades(JSON.parse(JSON.stringify(grades)));
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
  }, [classId, grades]);

  const addGradeType = useCallback((newGradeType) => {
    setGradeTypes(prev => {
      const exists = prev.some(t => t.value === newGradeType.value);
      if (exists) return prev;
      return [...prev, newGradeType];
    });
  }, []);

  const lockGrades = useCallback(async (gradeTypeValue) => {
    if (!classId) return { success: false, message: 'Không có lớp học' };

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/api/teacher/classes/${classId}/grades/lock`,
        { grade_type: gradeTypeValue },
        { headers }
      );

      if (response.data?.success) {
        setLockStatus(prev => ({
          ...prev,
          [gradeTypeValue]: true
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
  }, [classId]);

  const fetchSummary = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/teacher/classes/${classId}/grades/summary`,
        { headers }
      );

      if (response.data?.success) {
        setSummary(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Không thể tải thống kê điểm');
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err.message || 'Lỗi khi tải thống kê điểm');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const refetch = useCallback(async () => {
    await Promise.all([
      fetchGrades(),
      fetchSummary()
    ]);
  }, [fetchGrades, fetchSummary]);

  return {
    // Data
    students,
    grades,
    gradeTypes,
    selectedGradeType,
    summary,
    loading,
    saving,
    error,
    lockStatus,
    hasChanges,

    // Actions
    fetchGrades,
    selectGradeType,
    updateGrade,
    saveGrades,
    addGradeType,
    lockGrades,
    fetchSummary,
    refetch,

    // Utilities
    calculateFinalGrade,
  };
}

