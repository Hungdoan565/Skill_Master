/**
 * useRoomForm Hook - Quản lý form phòng học
 */

import { useState, useCallback } from 'react';
import { DEFAULT_ROOM_FORM } from '../utils';

export function useRoomForm() {
  const [formData, setFormData] = useState(DEFAULT_ROOM_FORM);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null); // Clear error when user types
  }, []);

  // Toggle equipment
  const toggleEquipment = useCallback((item) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }));
  }, []);

  // Open create modal
  const openCreateModal = useCallback((defaultCenterId = '') => {
    setEditingRoom(null);
    setFormError(null);
    setFormData({
      ...DEFAULT_ROOM_FORM,
      center_id: defaultCenterId,
    });
    setIsModalOpen(true);
  }, []);

  // Open edit modal
  const openEditModal = useCallback((room) => {
    setEditingRoom(room);
    setFormError(null);
    setFormData({
      name: room.name,
      code: room.code || '',
      capacity: room.capacity,
      room_type: room.room_type || 'standard',
      equipment: room.equipment || [],
      center_id: room.center_id,
      notes: room.notes || '',
      status: room.status
    });
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormError(null);
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    if (!formData.name || !formData.center_id) {
      return { valid: false, error: 'Vui lòng nhập tên phòng và chọn trung tâm' };
    }
    return { valid: true };
  }, [formData]);

  // Handle save
  const handleSave = useCallback(async (createFn, updateFn, onSuccess) => {
    const validation = validateForm();
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      
      if (editingRoom) {
        await updateFn(editingRoom.id, formData);
      } else {
        await createFn(formData);
      }

      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving room:', err);
      setFormError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu phòng học');
    } finally {
      setSaving(false);
    }
  }, [formData, editingRoom, validateForm, closeModal]);

  // Clear error
  const clearFormError = useCallback(() => {
    setFormError(null);
  }, []);

  return {
    formData,
    updateField,
    toggleEquipment,
    editingRoom,
    isModalOpen,
    saving,
    formError,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    clearFormError,
  };
}

export default useRoomForm;
