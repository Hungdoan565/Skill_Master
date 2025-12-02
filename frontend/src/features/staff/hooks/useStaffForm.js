/**
 * useStaffForm Hook - Quản lý form thêm nhân viên
 */

import { useState, useCallback } from 'react';
import { DEFAULT_STAFF_FORM } from '../utils';

export function useStaffForm(onSuccess) {
  const [formData, setFormData] = useState(DEFAULT_STAFF_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_STAFF_FORM);
    setSuccessMessage(null);
    setCopiedPassword(false);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (createFn) => {
    setSubmitting(true);
    
    try {
      const result = await createFn(formData);
      
      setSuccessMessage({
        email: formData.email,
        password: result.defaultPassword,
      });
      
      // Reset form for next entry
      setFormData(DEFAULT_STAFF_FORM);
      
      // Callback for parent to refresh list
      if (onSuccess) onSuccess();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Có lỗi xảy ra' 
      };
    } finally {
      setSubmitting(false);
    }
  }, [formData, onSuccess]);

  // Copy password to clipboard
  const copyPassword = useCallback(() => {
    if (successMessage?.password) {
      navigator.clipboard.writeText(successMessage.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  }, [successMessage]);

  // Clear success message to add another
  const addAnother = useCallback(() => {
    setSuccessMessage(null);
    setCopiedPassword(false);
  }, []);

  return {
    formData,
    updateField,
    resetForm,
    submitting,
    handleSubmit,
    successMessage,
    copiedPassword,
    copyPassword,
    addAnother,
  };
}

export default useStaffForm;
