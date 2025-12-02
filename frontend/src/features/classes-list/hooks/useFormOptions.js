/**
 * useFormOptions Hook - Quản lý dropdown options
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

// Helper: Lấy auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

/**
 * Hook quản lý các options cho form (courses, teachers, centers, rooms)
 */
export function useFormOptions() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all options
  const fetchAllOptions = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const [coursesRes, teachersRes, centersRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses`),
        axios.get(`${API_URL}/api/teachers`, { headers }),
        axios.get(`${API_URL}/api/centers`),
        axios.get(`${API_URL}/api/rooms`, { headers }),
      ]);

      if (coursesRes.data?.success) setCourses(coursesRes.data.data);
      if (teachersRes.data?.success) setTeachers(teachersRes.data.data);
      if (centersRes.data?.success) setCenters(centersRes.data.data);
      if (roomsRes.data?.success) setRooms(roomsRes.data.data);
    } catch (error) {
      console.error('Error fetching form options:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get rooms filtered by center
  const getRoomsByCenter = useCallback((centerId) => {
    if (!centerId) return rooms;
    return rooms.filter(r => r.center_id === centerId);
  }, [rooms]);

  // Get room by ID
  const getRoomById = useCallback((roomId) => {
    return rooms.find(r => r.id === roomId);
  }, [rooms]);

  // Get course by ID
  const getCourseById = useCallback((courseId) => {
    return courses.find(c => c.id === courseId);
  }, [courses]);

  return {
    courses,
    teachers,
    centers,
    rooms,
    loading,
    fetchAllOptions,
    getRoomsByCenter,
    getRoomById,
    getCourseById
  };
}

export default useFormOptions;
