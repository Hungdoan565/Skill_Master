/**
 * useCenters Hook - Fetch danh sách trung tâm
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../utils';

export function useCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/centers`);
      setCenters(res.data.data || []);
    } catch (err) {
      console.error('Error fetching centers:', err);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    centers,
    loading,
    fetchCenters,
  };
}

export default useCenters;
