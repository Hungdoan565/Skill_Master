/**
 * usePayment Hook
 * 
 * Custom hook quản lý logic thanh toán hóa đơn.
 * Bao gồm:
 * - State của form thanh toán
 * - Validation
 * - Submit payment
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';
import { parseCurrency } from '../utils/formatters';

export function usePayment({ onSuccess, onError }) {
  const { session } = useAuth();
  
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    method: 'cash',
    notes: ''
  });

  /**
   * Mở modal thanh toán
   */
  const openPayment = useCallback((invoice) => {
    const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
    
    setSelectedInvoice(invoice);
    setFormData({
      amount: remaining > 0 ? remaining.toString() : '',
      method: 'cash',
      notes: ''
    });
    setIsOpen(true);
  }, []);

  /**
   * Đóng modal thanh toán
   */
  const closePayment = useCallback(() => {
    setIsOpen(false);
    setSelectedInvoice(null);
    setFormData({ amount: '', method: 'cash', notes: '' });
  }, []);

  /**
   * Cập nhật form data
   */
  const updateFormData = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Submit thanh toán
   */
  const submitPayment = useCallback(async () => {
    if (!selectedInvoice || !formData.amount || !session?.access_token) {
      return { success: false, message: 'Thiếu thông tin thanh toán' };
    }

    const amount = parseCurrency(formData.amount);
    
    // Validation
    if (amount <= 0) {
      onError?.('Số tiền phải lớn hơn 0');
      return { success: false, message: 'Số tiền không hợp lệ' };
    }

    const remaining = (selectedInvoice.final_amount || 0) - (selectedInvoice.paid_amount || 0);
    if (amount > remaining) {
      onError?.(`Số tiền thanh toán vượt quá số nợ (${remaining.toLocaleString()}đ)`);
      return { success: false, message: 'Số tiền vượt quá số nợ' };
    }

    setProcessing(true);
    
    try {
      const res = await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          payment_method: formData.method,
          notes: formData.notes
        })
      });

      const result = await res.json();
      
      if (result.success) {
        onSuccess?.(`Đã thu ${amount.toLocaleString()}đ thành công!`);
        closePayment();
        return { success: true };
      } else {
        onError?.(result.message || 'Lỗi khi thanh toán');
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      onError?.('Lỗi khi xử lý thanh toán');
      return { success: false, message: err.message };
    } finally {
      setProcessing(false);
    }
  }, [selectedInvoice, formData, session?.access_token, onSuccess, onError, closePayment]);

  /**
   * Tính toán số tiền còn lại
   */
  const remainingAmount = selectedInvoice 
    ? (selectedInvoice.final_amount || 0) - (selectedInvoice.paid_amount || 0)
    : 0;

  return {
    // State
    selectedInvoice,
    isOpen,
    processing,
    formData,
    remainingAmount,
    
    // Actions
    openPayment,
    closePayment,
    updateFormData,
    submitPayment
  };
}

export default usePayment;
