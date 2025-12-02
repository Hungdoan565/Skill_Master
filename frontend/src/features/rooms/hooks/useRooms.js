/**
 * useRooms Hook - Quản lý danh sách phòng học
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { API_URL } from '../utils';

/**
 * Get auth headers from Supabase session
 */
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    headers: {
      Authorization: `Bearer ${session?.access_token}`
    }
  };
};

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/rooms`, config);
      setRooms(res.data.data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create room
  const createRoom = useCallback(async (formData) => {
    const config = await getAuthHeaders();
    await axios.post(`${API_URL}/api/admin/rooms`, formData, config);
  }, []);

  // Update room
  const updateRoom = useCallback(async (id, formData) => {
    const config = await getAuthHeaders();
    await axios.put(`${API_URL}/api/admin/rooms/${id}`, formData, config);
  }, []);

  // Delete room
  const deleteRoom = useCallback(async (id) => {
    const config = await getAuthHeaders();
    await axios.delete(`${API_URL}/api/admin/rooms/${id}`, config);
  }, []);

  // Filter rooms by search and center
  const filterRooms = useCallback((searchTerm, centerId) => {
    return rooms.filter(room => {
      const matchSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCenter = !centerId || room.center_id === centerId;
      return matchSearch && matchCenter;
    });
  }, [rooms]);

  // Calculate stats
  const getStats = useCallback(() => ({
    totalRooms: rooms.length,
    totalCapacity: rooms.reduce((sum, r) => sum + (r.capacity || 0), 0),
    labCount: rooms.filter(r => r.room_type === 'lab').length,
    maintenanceCount: rooms.filter(r => r.status === 'maintenance').length,
  }), [rooms]);

  return {
    rooms,
    loading,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    filterRooms,
    getStats,
  };
}

export default useRooms;
