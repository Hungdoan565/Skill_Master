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

  // Xóa khóa học - không còn dùng window.confirm
  const deleteCourse = useCallback(async (courseId) => {
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
      throw err; // Re-throw để component xử lý
    } finally {
      setDeletingId(null);
    }
  }, [accessToken]);

  // Filter courses theo search term và status
  const filterCourses = useCallback((searchTerm, statusFilter = '') => {
    return courses.filter((course) => {
      // Filter by status
      const matchStatus = !statusFilter || course.status === statusFilter;
      
      // Filter by search term
      const term = searchTerm?.toLowerCase() || '';
      const matchSearch = !term || 
        course.title?.toLowerCase().includes(term) ||
        course.code?.toLowerCase().includes(term);
      
      return matchStatus && matchSearch;
    });
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
