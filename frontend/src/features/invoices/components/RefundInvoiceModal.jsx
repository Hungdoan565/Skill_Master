/**
 * RefundInvoiceModal Component
 * 
 * Modal hoàn tiền hóa đơn với nhập số tiền, phương thức và ghi chú.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {Object} invoice - Hóa đơn cần hoàn tiền
 * @param {function} onClose - Handler đóng modal
 * @param {function} onSuccess - Callback khi hoàn tiền thành công
 */

import { useState, useEffect } from 'react';
import {
  X,
  RefreshCcw,
  Loader2,
  DollarSign,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';
import { formatCurrency, parseCurrency } from '../utils/formatters';

const REFUND_METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'credit', label: 'Ghi nợ (credit)' }
];

export function RefundInvoiceModal({ isOpen, invoice, onClose, onSuccess }) {
  const { session } = useAuth();

  const [formData, setFormData] = useState({
    amount: '',
    method: 'cash',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when invoice changes
  useEffect(() => {
    if (invoice && isOpen) {
      setFormData({
        amount: invoice.paid_amount?.toString() || '',
        method: 'cash',
        notes: ''
      });
      setError('');
    }
  }, [invoice, isOpen]);

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const refundAmount = parseCurrency(formData.amount) || 0;
  const paidAmount = invoice?.paid_amount || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!refundAmount || refundAmount <= 0) {
      setError('Số tiền hoàn phải lớn hơn 0');
      return;
    }

    if (refundAmount > paidAmount) {
      setError(`Số tiền hoàn không thể lớn hơn đã thanh toán (${paidAmount.toLocaleString()}đ)`);
      return;
    }

    if (!formData.notes.trim()) {
      setError('Vui lòng nhập lý do hoàn tiền');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/invoices/${invoice.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          refund_amount: refundAmount,
          refund_method: formData.method,
          reason: formData.notes.trim()
        })
      });

      const result = await res.json();

      if (result.success) {
        onSuccess?.('Hoàn tiền thành công');
        onClose();
      } else {
        setError(result.message || 'Không thể hoàn tiền');
      }
    } catch (err) {
      console.error('Error refunding invoice:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({ amount: '', method: 'cash', notes: '' });
      setError('');
      onClose();
    }
  };

  if (!isOpen || !invoice) return null;

  const canRefund = invoice.status !== 'cancelled' &&
    invoice.status !== 'refunded' &&
    paidAmount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-purple-500 to-violet-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <RefreshCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Hoàn tiền</h3>
                <p className="text-xs text-purple-100">{invoice.invoice_code}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!canRefund ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <p className="text-slate-700 font-medium">Không thể hoàn tiền</p>
            <p className="text-sm text-slate-500 mt-1">
              {paidAmount === 0
                ? 'Hóa đơn chưa có khoản thanh toán nào.'
                : invoice.status === 'cancelled'
                  ? 'Hóa đơn đã bị hủy.'
                  : 'Hóa đơn đã được hoàn tiền.'}
            </p>
            <Button variant="outline" className="mt-4" onClick={handleClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Invoice Info */}
              <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
                <p><span className="text-slate-500">Học viên:</span> <span className="font-medium">{invoice.student?.full_name}</span></p>
                <p><span className="text-slate-500">Tổng hóa đơn:</span> <span className="font-medium">{invoice.final_amount?.toLocaleString()}đ</span></p>
                <p><span className="text-slate-500">Đã thanh toán:</span> <span className="font-bold text-emerald-600">{paidAmount.toLocaleString()}đ</span></p>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Số tiền hoàn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formatCurrency(formData.amount)}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="Nhập số tiền"
                    className="w-full h-10 pl-10 pr-14 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">VNĐ</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tối đa: {paidAmount.toLocaleString()}đ
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('amount', paidAmount.toString())}
                  className="flex-1 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Hoàn toàn bộ
                </button>
                <button
                  type="button"
                  onClick={() => updateField('amount', Math.floor(paidAmount / 2).toString())}
                  className="flex-1 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Hoàn 50%
                </button>
              </div>

              {/* Refund Method */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phương thức hoàn tiền
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={formData.method}
                    onChange={(e) => updateField('method', e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {REFUND_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Lý do hoàn tiền <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Nhập lý do hoàn tiền..."
                    rows={3}
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>

              {/* Refund Preview */}
              {refundAmount > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700">Hoàn tiền:</span>
                    <span className="text-lg font-bold text-purple-700">
                      {refundAmount.toLocaleString()}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-purple-600">Còn giữ lại:</span>
                    <span className="text-sm font-medium text-purple-600">
                      {(paidAmount - refundAmount).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hoàn tiền'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default RefundInvoiceModal;
