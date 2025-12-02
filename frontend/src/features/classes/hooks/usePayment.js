/**
 * usePayment Hook
 * Manages payment processing for students
 */

import { useState, useCallback } from 'react';
import { API_URL, parseCurrency } from '../utils';

export function usePayment(classId, getHeaders) {
  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentToPay, setStudentToPay] = useState(null);
  
  // Form state
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    notes: ''
  });
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Open payment modal
  const openPaymentModal = useCallback((student) => {
    setStudentToPay(student);
    setPaymentData({
      amount: student.remaining > 0 ? student.remaining.toString() : '',
      method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
    setCopied(false);
  }, []);

  // Close payment modal
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setStudentToPay(null);
    setPaymentData({ amount: '', method: 'cash', notes: '' });
    setCopied(false);
  }, []);

  // Update payment data
  const updatePaymentData = useCallback((field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    if (field === 'method') {
      setCopied(false);
    }
  }, []);

  // Submit payment
  const submitPayment = useCallback(async () => {
    if (!studentToPay || !paymentData.amount) {
      return { success: false, message: 'Vui lòng nhập số tiền thanh toán' };
    }

    const amount = parseCurrency(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: 'Số tiền không hợp lệ' };
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          enrollment_id: studentToPay.enrollment_id,
          student_id: studentToPay.student_id,
          class_id: classId,
          amount: amount,
          payment_method: paymentData.method,
          notes: paymentData.notes
        })
      });

      const json = await res.json();
      
      if (json.success) {
        closePaymentModal();
        return { 
          success: true, 
          amount, 
          student: studentToPay 
        };
      } else {
        return { 
          success: false, 
          message: json.message || 'Có lỗi xảy ra' 
        };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, message: 'Có lỗi xảy ra khi xử lý thanh toán' };
    } finally {
      setProcessing(false);
    }
  }, [classId, studentToPay, paymentData, getHeaders, closePaymentModal]);

  // Copy transfer content to clipboard
  const copyTransferContent = useCallback((content) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Get quick amounts (filtered by remaining)
  const getQuickAmounts = useCallback((remaining, quickAmounts = [1000000, 2000000, 5000000]) => {
    return quickAmounts.filter(amount => amount <= remaining);
  }, []);

  return {
    // Modal state
    showPaymentModal,
    studentToPay,
    
    // Form state
    paymentData,
    processing,
    copied,
    
    // Actions
    openPaymentModal,
    closePaymentModal,
    updatePaymentData,
    submitPayment,
    copyTransferContent,
    getQuickAmounts
  };
}
