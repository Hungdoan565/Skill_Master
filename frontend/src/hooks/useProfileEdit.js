import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function useProfileEdit(onUpdateSuccess) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const updateProfile = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lỗi cập nhật profile');
      }
      
      setIsEditing(false);
      if (onUpdateSuccess) onUpdateSuccess(result.data);
      return { success: true, data: result.data };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Lỗi upload avatar');
      }
      
      if (onUpdateSuccess) onUpdateSuccess({ avatar_url: result.data.avatar_url });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { isEditing, setIsEditing, updateProfile, uploadAvatar, isLoading };
}