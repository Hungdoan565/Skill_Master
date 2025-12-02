/**
 * useClassDetail Hook
 * Manages class detail data fetching
 */

import { useState, useCallback } from 'react';
import { API_URL } from '../utils';

export function useClassDetail(classId, getHeaders) {
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClassDetail = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/classes/${classId}`, { 
        headers: getHeaders() 
      });
      const json = await res.json();
      if (json.success) {
        setClassData(json.data);
      }
    } catch (error) {
      console.error('Error fetching class detail:', error);
    }
  }, [classId, getHeaders]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchClassDetail();
    setLoading(false);
  }, [fetchClassDetail]);

  return {
    classData,
    loading,
    setLoading,
    fetchClassDetail,
    refresh
  };
}
