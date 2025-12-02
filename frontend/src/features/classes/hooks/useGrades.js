/**
 * useGrades Hook
 * Manages grade matrix with inline editing
 */

import { useState, useCallback } from 'react';
import { API_URL, GRADE_PASS_THRESHOLD, validateGradeScore } from '../utils';

export function useGrades(classId, getHeaders) {
  // Grade data
  const [gradeStructures, setGradeStructures] = useState([]);
  const [gradeMatrix, setGradeMatrix] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  
  // Editing state
  const [editingCell, setEditingCell] = useState(null); // { enrollment_id, structure_id }
  const [pendingGrades, setPendingGrades] = useState({}); // { "enrollment_structure": { score } }
  
  // Summary
  const [gradesSummary, setGradesSummary] = useState({ 
    total_students: 0, 
    graded_count: 0 
  });

  // Fetch grades
  const fetchGrades = useCallback(async () => {
    if (!classId) return;
    
    setLoadingGrades(true);
    try {
      const res = await fetch(
        `${API_URL}/api/classes/${classId}/grades`, 
        { headers: getHeaders() }
      );
      const json = await res.json();
      
      if (json.success) {
        setGradeStructures(json.data.grade_structures || []);
        setGradeMatrix(json.data.students || []);
        setGradesSummary({
          total_students: json.data.summary?.total_students || 0,
          graded_count: json.data.summary?.graded_count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  }, [classId, getHeaders]);

  // Update pending grade (not saved yet)
  const updatePendingGrade = useCallback((enrollmentId, structureId, score) => {
    const key = `${enrollmentId}_${structureId}`;
    setPendingGrades(prev => ({
      ...prev,
      [key]: { 
        enrollment_id: enrollmentId, 
        grade_structure_id: structureId, 
        score 
      }
    }));
  }, []);

  // Get display score (pending takes priority over saved)
  const getDisplayScore = useCallback((enrollmentId, structureId) => {
    const key = `${enrollmentId}_${structureId}`;
    
    if (pendingGrades[key] !== undefined) {
      return pendingGrades[key].score;
    }
    
    const student = gradeMatrix.find(s => s.enrollment_id === enrollmentId);
    return student?.grades?.[structureId]?.score ?? '';
  }, [pendingGrades, gradeMatrix]);

  // Calculate weighted average for a student
  const calculateWeightedAverage = useCallback((enrollmentId) => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    gradeStructures.forEach(structure => {
      const score = getDisplayScore(enrollmentId, structure.id);
      if (score !== '' && score !== null && !isNaN(score)) {
        totalWeightedScore += parseFloat(score) * structure.weight;
        totalWeight += structure.weight;
      }
    });

    return totalWeight > 0 
      ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 
      : null;
  }, [gradeStructures, getDisplayScore]);

  // Check if student passes
  const isPassing = useCallback((enrollmentId) => {
    const avg = calculateWeightedAverage(enrollmentId);
    return avg !== null && avg >= GRADE_PASS_THRESHOLD;
  }, [calculateWeightedAverage]);

  // Save all pending grades
  const saveAllGrades = useCallback(async () => {
    const gradesToSave = Object.values(pendingGrades).filter(g => g.score !== '');
    
    if (gradesToSave.length === 0) {
      return { success: false, message: 'Không có điểm nào để lưu' };
    }

    setSavingGrades(true);
    try {
      const res = await fetch(`${API_URL}/api/grades/bulk-update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ grades: gradesToSave })
      });

      const json = await res.json();
      
      if (json.success) {
        setPendingGrades({});
        setEditingCell(null);
        fetchGrades(); // Refresh
        return { 
          success: true, 
          count: json.data?.length || gradesToSave.length 
        };
      } else {
        return { 
          success: false, 
          message: json.message || 'Lỗi khi lưu điểm' 
        };
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      return { success: false, message: 'Lỗi khi lưu điểm' };
    } finally {
      setSavingGrades(false);
    }
  }, [pendingGrades, getHeaders, fetchGrades]);

  // Process grade input
  const processGradeInput = useCallback((enrollmentId, structureId, inputValue, maxScore) => {
    const validation = validateGradeScore(inputValue, maxScore);
    
    if (validation.valid) {
      updatePendingGrade(enrollmentId, structureId, validation.value ?? '');
      setEditingCell(null);
      return { success: true, message: validation.message };
    }
    
    setEditingCell(null);
    return { success: false, message: validation.message };
  }, [updatePendingGrade]);

  // Check if a cell is pending
  const isCellPending = useCallback((enrollmentId, structureId) => {
    const key = `${enrollmentId}_${structureId}`;
    return pendingGrades[key] !== undefined;
  }, [pendingGrades]);

  // Check if has pending changes
  const hasPendingChanges = Object.keys(pendingGrades).length > 0;

  // Clear pending grades
  const clearPendingGrades = useCallback(() => {
    setPendingGrades({});
    setEditingCell(null);
  }, []);

  return {
    // Data
    gradeStructures,
    gradeMatrix,
    loadingGrades,
    savingGrades,
    gradesSummary,
    
    // Editing
    editingCell,
    setEditingCell,
    pendingGrades,
    hasPendingChanges,
    
    // Actions
    fetchGrades,
    updatePendingGrade,
    saveAllGrades,
    processGradeInput,
    clearPendingGrades,
    
    // Computed
    getDisplayScore,
    calculateWeightedAverage,
    isPassing,
    isCellPending
  };
}
