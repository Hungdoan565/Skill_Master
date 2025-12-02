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

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    setFormData({
      ...DEFAULT_ROOM_FORM,
      center_id: defaultCenterId,
    });
    setIsModalOpen(true);
  }, []);

  // Open edit modal
  const openEditModal = useCallback((room) => {
    setEditingRoom(room);
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
      alert(validation.error);
      return;
    }

    try {
      setSaving(true);
      
      if (editingRoom) {
        await updateFn(editingRoom.id, formData);
      } else {
        await createFn(formData);
      }

      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving room:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  }, [formData, editingRoom, validateForm, closeModal]);

  return {
    formData,
    updateField,
    toggleEquipment,
    editingRoom,
    isModalOpen,
    saving,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
  };
}

export default useRoomForm;
