/**
 * useCourses Hook - Quản lý danh sách khóa học
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../utils';

/**
 * Hook quản lý CRUD courses
 * @param {string} accessToken - Token xác thực
 */
export function useCourses(accessToken) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  // Fetch danh sách courses
  const fetchCourses = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.data?.success) {
        setCourses(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Xóa khóa học
  const deleteCourse = useCallback(async (courseId, courseName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khóa học "${courseName}"?`)) {
      return false;
    }

    setDeletingId(courseId);
    try {
      const response = await axios.delete(`${API_URL}/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.data.success) {
        // Optimistic update
        setCourses(prev => prev.filter(c => c.id !== courseId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting course:', err);
      alert(err.response?.data?.message || 'Không thể xóa khóa học');
      return false;
    } finally {
      setDeletingId(null);
    }
  }, [accessToken]);

  // Filter courses theo search term
  const filterCourses = useCallback((searchTerm) => {
    if (!searchTerm) return courses;
    
    const term = searchTerm.toLowerCase();
    return courses.filter(
      (course) =>
        course.title?.toLowerCase().includes(term) ||
        course.code?.toLowerCase().includes(term)
    );
  }, [courses]);

  return {
    courses,
    loading,
    deletingId,
    error,
    fetchCourses,
    deleteCourse,
    filterCourses,
    refetch: fetchCourses
  };
}

export default useCourses;
