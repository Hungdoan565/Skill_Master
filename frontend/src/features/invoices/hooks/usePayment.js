/**
 * usePayment Hook
 * 
 * Custom hook quản lý logic thanh toán hóa đơn.
 * Bao gồm:
 * - State của form thanh toán
 * - Validation
 * - Submit payment với bank proof upload
 * - Verify/Reject bank transfers
 * - Payment history
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
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    method: 'cash',
    notes: '',
    bankProofUrl: null, // For bank transfer screenshot
    referenceNumber: '', // Bank transaction reference code
    transferDate: new Date().toISOString().split('T')[0] // Date of bank transfer
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
      notes: '',
      bankProofUrl: null,
      referenceNumber: '',
      transferDate: new Date().toISOString().split('T')[0]
    });
    setIsOpen(true);
  }, []);

  /**
   * Đóng modal thanh toán
   */
  const closePayment = useCallback(() => {
    setIsOpen(false);
    setSelectedInvoice(null);
    setFormData({ 
      amount: '', 
      method: 'cash', 
      notes: '', 
      bankProofUrl: null,
      referenceNumber: '',
      transferDate: new Date().toISOString().split('T')[0]
    });
  }, []);

  /**
   * Cập nhật form data
   */
  const updateFormData = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Fetch payment history for invoice
   */
  const fetchPayments = useCallback(async (invoiceId) => {
    if (!session?.access_token || !invoiceId) return;

    setLoadingPayments(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices/${invoiceId}/payments`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const result = await res.json();
      if (result.success) {
        setPayments(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  }, [session?.access_token]);

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

    // Bank transfer: proof is optional for admin (they just record, not pay)
    // Removed: bank_proof_url requirement check for admin
    // Students would use a different flow with proof upload

    setProcessing(true);

    try {
      // Build payload with audit fields
      const payload = {
        amount,
        payment_method: formData.method,
        notes: formData.notes || undefined,
        bank_proof_url: formData.bankProofUrl || undefined
      };

      // Include reference_code and transfer_date for bank transfers
      if (formData.method === 'bank_transfer') {
        if (formData.referenceNumber?.trim()) {
          payload.reference_code = formData.referenceNumber.trim();
        }
        if (formData.transferDate) {
          payload.transfer_date = formData.transferDate;
        }
      }

      const res = await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        const message = result.requires_verification
          ? 'Đã ghi nhận chuyển khoản. Chờ Admin xác nhận.'
          : `Đã thu ${amount.toLocaleString()}đ thành công!`;
        onSuccess?.(message);
        closePayment();
        return { success: true, data: result.data };
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
   * Verify bank transfer payment (Admin only)
   */
  const verifyPayment = useCallback(async (paymentId) => {
    if (!session?.access_token) return { success: false };

    try {
      const res = await fetch(`${API_URL}/api/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const result = await res.json();
      if (result.success) {
        onSuccess?.('Đã xác nhận thanh toán');
        return { success: true, data: result.data };
      }
      onError?.(result.message);
      return { success: false, message: result.message };
    } catch (err) {
      onError?.('Lỗi khi xác nhận');
      return { success: false };
    }
  }, [session?.access_token, onSuccess, onError]);

  /**
   * Reject bank transfer payment (Admin only)
   */
  const rejectPayment = useCallback(async (paymentId, reason) => {
    if (!session?.access_token || !reason) return { success: false };

    try {
      const res = await fetch(`${API_URL}/api/payments/${paymentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reason })
      });
      const result = await res.json();
      if (result.success) {
        onSuccess?.('Đã từ chối thanh toán');
        return { success: true };
      }
      onError?.(result.message);
      return { success: false, message: result.message };
    } catch (err) {
      onError?.('Lỗi khi từ chối');
      return { success: false };
    }
  }, [session?.access_token, onSuccess, onError]);

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
    payments,
    loadingPayments,

    // Actions
    openPayment,
    closePayment,
    updateFormData,
    submitPayment,
    fetchPayments,
    verifyPayment,
    rejectPayment
  };
}

export default usePayment;

