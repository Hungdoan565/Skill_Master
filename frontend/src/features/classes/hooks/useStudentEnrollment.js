/**
 * useStudentEnrollment Hook
 * Manages enrolling new students and removing existing ones
 */

import { useState, useCallback, useEffect } from 'react';
import { API_URL, MIN_SEARCH_LENGTH } from '../utils';

export function useStudentEnrollment(classId, getHeaders) {
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resultType, setResultType] = useState('recent'); // 'recent' | 'search'

  // Operation state
  const [enrolling, setEnrolling] = useState(null); // student.id being enrolled
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState(null);

  // Fetch recent students (when modal opens)
  const fetchRecentStudents = useCallback(async () => {
    if (!classId) return;

    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?exclude_class_id=${classId}`,
        { headers: getHeaders() }
      );
      const json = await res.json();

      if (json.success) {
        setSearchResults(json.data || []);
        setResultType('recent');
      }
    } catch (error) {
      console.error('Error fetching recent students:', error);
    } finally {
      setSearching(false);
    }
  }, [classId, getHeaders]);

  // Load recent students when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchRecentStudents();
    }
  }, [showAddModal, fetchRecentStudents]);

  // Search students
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);

    // If empty, load recent students
    if (!query || query.length === 0) {
      fetchRecentStudents();
      return;
    }

    // Wait for minimum characters
    if (query.length < MIN_SEARCH_LENGTH) {
      // Show hint but don't search yet
      setSearchResults([]);
      setResultType('hint');
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?q=${encodeURIComponent(query)}&exclude_class_id=${classId}`,
        { headers: getHeaders() }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Lỗi khi tìm kiếm');
      }

      const json = await res.json();

      if (json.success) {
        setSearchResults(json.data || []);
        setResultType(json.type || 'search');
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
      setResultType('error');
    } finally {
      setSearching(false);
    }
  }, [classId, getHeaders, fetchRecentStudents]);

  // Enroll a student
  const enrollStudent = useCallback(async (student, tuitionFee = 0) => {
    if (!classId) return { success: false, message: 'Thiếu ID lớp học' };

    // Validate tuition fee
    if (tuitionFee < 0 || isNaN(tuitionFee)) {
      return { success: false, message: 'Học phí không hợp lệ' };
    }

    setEnrolling(student.id);
    try {
      const res = await fetch(`${API_URL}/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          student_id: student.id,
          tuition_fee: tuitionFee
        })
      });

      const json = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: json.message || `Lỗi ${res.status}: ${res.statusText}`
        };
      }

      if (json.success) {
        // Remove from search results
        setSearchResults(prev => prev.filter(s => s.id !== student.id));
        return { success: true, student };
      } else {
        return { success: false, message: json.message || 'Có lỗi xảy ra' };
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      return { success: false, message: 'Không thể kết nối đến server' };
    } finally {
      setEnrolling(null);
    }
  }, [classId, getHeaders]);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  }, []);

  // Close delete modal
  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setStudentToDelete(null);
  }, []);

  // Remove student from class
  const removeStudent = useCallback(async () => {
    if (!studentToDelete || !classId) return { success: false, message: 'Thiếu thông tin học viên hoặc lớp học' };

    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/classes/${classId}/students/${studentToDelete.student_id}`,
        {
          method: 'DELETE',
          headers: getHeaders()
        }
      );

      const json = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: json.message || `Lỗi ${res.status}: ${res.statusText}`
        };
      }

      if (json.success) {
        closeDeleteModal();
        return { success: true, student: studentToDelete };
      } else {
        return { success: false, message: json.message || 'Có lỗi xảy ra' };
      }
    } catch (error) {
      console.error('Error removing student:', error);
      return { success: false, message: 'Không thể kết nối đến server' };
    } finally {
      setDeleting(false);
    }
  }, [classId, studentToDelete, getHeaders, closeDeleteModal]);

  // Close add modal
  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Selection handlers
  const toggleSelectStudent = useCallback((studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const toggleSelectAll = useCallback((students) => {
    const allIds = students.map(s => s.student_id);
    const allSelected = allIds.every(id => selectedStudentIds.includes(id));
    setSelectedStudentIds(allSelected ? [] : allIds);
  }, [selectedStudentIds]);

  const clearSelection = useCallback(() => {
    setSelectedStudentIds([]);
  }, []);

  // Bulk delete handlers
  const openBulkDeleteModal = useCallback(() => {
    setBulkDeleteError(null);
    setShowBulkDeleteModal(true);
  }, []);

  const closeBulkDeleteModal = useCallback(() => {
    setShowBulkDeleteModal(false);
    setBulkDeleteError(null);
  }, []);

  // Bulk remove students from class
  const bulkRemoveStudents = useCallback(async (studentsToRemove) => {
    if (!classId || studentsToRemove.length === 0) return { success: false };

    setBulkDeleting(true);
    setBulkDeleteError(null);

    try {
      // Remove students one by one (could be optimized with bulk API)
      const results = await Promise.allSettled(
        studentsToRemove.map(student =>
          fetch(
            `${API_URL}/api/classes/${classId}/students/${student.student_id}`,
            {
              method: 'DELETE',
              headers: getHeaders()
            }
          ).then(res => res.json())
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failed = studentsToRemove.length - successful;

      if (failed > 0) {
        setBulkDeleteError(`Đã xóa ${successful}/${studentsToRemove.length} học viên. ${failed} học viên không thể xóa.`);
        return { success: false, message: `${failed} học viên không thể xóa` };
      }

      closeBulkDeleteModal();
      clearSelection();
      return { success: true, count: successful };
    } catch (error) {
      console.error('Error bulk removing students:', error);
      setBulkDeleteError('Có lỗi xảy ra khi xóa học viên');
      return { success: false, message: 'Có lỗi xảy ra khi xóa học viên' };
    } finally {
      setBulkDeleting(false);
    }
  }, [classId, getHeaders, closeBulkDeleteModal, clearSelection]);

  return {
    // Add Student Modal
    showAddModal,
    setShowAddModal,
    closeAddModal,
    searchQuery,
    searchResults,
    searching,
    resultType,
    handleSearch,
    enrollStudent,
    enrolling,

    // Delete Student Modal
    showDeleteModal,
    studentToDelete,
    deleting,
    openDeleteModal,
    closeDeleteModal,
    removeStudent,

    // Bulk Delete
    selectedStudentIds,
    toggleSelectStudent,
    toggleSelectAll,
    clearSelection,
    showBulkDeleteModal,
    bulkDeleting,
    bulkDeleteError,
    openBulkDeleteModal,
    closeBulkDeleteModal,
    bulkRemoveStudents
  };
}
