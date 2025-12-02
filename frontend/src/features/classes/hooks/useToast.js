/**
 * useToast Hook
 * Simple toast notification management
 */

import { useState, useCallback } from 'react';
import { TOAST_DURATION } from '../utils';

export function useToast() {
  const [toast, setToast] = useState({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, TOAST_DURATION);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'success' });
  }, []);

  return {
    toast,
    showToast,
    hideToast
  };
}
