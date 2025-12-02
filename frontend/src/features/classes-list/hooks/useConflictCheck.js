/**
 * useConflictCheck Hook - Kiểm tra xung đột lịch học
 */

import { useState, useCallback, useEffect } from 'react';
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
 * Hook kiểm tra xung đột lịch học
 * @param {Object} params - Các tham số cần kiểm tra
 */
export function useConflictCheck({
  teacherId,
  roomId,
  startDate,
  endDate,
  schedule,
  excludeClassId
}) {
  const [status, setStatus] = useState('idle'); // idle | checking | ok | conflict | error
  const [messages, setMessages] = useState([]);

  // Check conflict
  const checkConflict = useCallback(async () => {
    // Kiểm tra dữ liệu đầu vào - Phải ĐỦ thông tin mới check
    const isValidInput = 
      teacherId && 
      roomId && 
      startDate && 
      endDate && 
      schedule && 
      schedule.length > 0;

    if (!isValidInput) {
      setStatus('idle');
      setMessages([]);
      return;
    }

    // Bắt đầu gọi API
    setStatus('checking');
    
    try {
      const headers = await getAuthHeaders();
      
      const res = await axios.post(`${API_URL}/api/classes/check-conflict`, {
        teacher_id: teacherId,
        room_id: roomId,
        start_date: startDate,
        end_date: endDate,
        schedule: schedule,
        exclude_class_id: excludeClassId || null
      }, { headers });

      const { hasConflict, conflicts = [] } = res.data;
      
      if (hasConflict && conflicts.length > 0) {
        setStatus('conflict');
        // Lấy message từ mỗi conflict object
        setMessages(conflicts.map(c => c.message || `Trùng lịch với lớp ${c.class_name}`));
      } else {
        setStatus('ok');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error checking conflict:', error);
      setStatus('error');
      setMessages([]);
    }
  }, [teacherId, roomId, startDate, endDate, schedule, excludeClassId]);

  // Debounced conflict check
  useEffect(() => {
    const timer = setTimeout(checkConflict, 500);
    return () => clearTimeout(timer);
  }, [checkConflict]);

  // Reset state
  const reset = useCallback(() => {
    setStatus('idle');
    setMessages([]);
  }, []);

  return {
    status,
    messages,
    isConflict: status === 'conflict',
    isValid: status === 'ok',
    isChecking: status === 'checking',
    reset
  };
}

export default useConflictCheck;
