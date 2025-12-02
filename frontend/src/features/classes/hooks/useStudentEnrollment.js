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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resultType, setResultType] = useState('recent'); // 'recent' | 'search'
  
  // Operation state
  const [enrolling, setEnrolling] = useState(null); // student.id being enrolled
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?q=${encodeURIComponent(query)}&exclude_class_id=${classId}`,
        { headers: getHeaders() }
      );
      const json = await res.json();
      
      if (json.success) {
        setSearchResults(json.data || []);
        setResultType(json.type || 'search');
      }
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearching(false);
    }
  }, [classId, getHeaders, fetchRecentStudents]);

  // Enroll a student
  const enrollStudent = useCallback(async (student, tuitionFee = 0) => {
    if (!classId) return { success: false };
    
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
      
      if (json.success) {
        // Remove from search results
        setSearchResults(prev => prev.filter(s => s.id !== student.id));
        return { success: true, student };
      } else {
        return { success: false, message: json.message || 'Có lỗi xảy ra' };
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      return { success: false, message: 'Có lỗi xảy ra khi ghi danh' };
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
    if (!studentToDelete || !classId) return { success: false };
    
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
      
      if (json.success) {
        closeDeleteModal();
        return { success: true, student: studentToDelete };
      } else {
        return { success: false, message: json.message || 'Có lỗi xảy ra' };
      }
    } catch (error) {
      console.error('Error removing student:', error);
      return { success: false, message: 'Có lỗi xảy ra khi xóa học viên' };
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
    removeStudent
  };
}
