/**
 * EditInvoiceModal Component
 * 
 * Modal sửa thông tin hóa đơn.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {Object} invoice - Hóa đơn cần sửa
 * @param {function} onClose - Handler đóng modal
 * @param {function} onSuccess - Callback khi sửa thành công
 */

import { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Loader2,
  Calendar,
  DollarSign,
  Percent,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';
import { formatCurrency, parseCurrency } from '../utils/formatters';

export function EditInvoiceModal({ isOpen, invoice, onClose, onSuccess }) {
  const { session } = useAuth();
  
  const [formData, setFormData] = useState({
    amount: '',
    discount_amount: '',
    due_date: '',
    description: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate form when invoice changes
  useEffect(() => {
    if (invoice && isOpen) {
      setFormData({
        amount: invoice.amount?.toString() || '',
        discount_amount: invoice.discount_amount?.toString() || '',
        due_date: invoice.due_date || '',
        description: invoice.description || ''
      });
      setError('');
    }
  }, [invoice, isOpen]);

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  // Calculate final amount
  const amount = parseCurrency(formData.amount) || 0;
  const discount = parseCurrency(formData.discount_amount) || 0;
  const finalAmount = Math.max(0, amount - discount);
  const paidAmount = invoice?.paid_amount || 0;
  const remaining = finalAmount - paidAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      setError('Số tiền phải lớn hơn 0');
      return;
    }

    if (finalAmount < paidAmount) {
      setError(`Số tiền thành tiền không thể nhỏ hơn đã thanh toán (${paidAmount.toLocaleString()}đ)`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount: amount,
          discount_amount: discount,
          due_date: formData.due_date,
          description: formData.description
        })
      });

      const result = await res.json();

      if (result.success) {
        onSuccess?.('Cập nhật hóa đơn thành công');
        onClose();
      } else {
        setError(result.message || 'Không thể cập nhật hóa đơn');
      }
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !invoice) return null;

  const canEdit = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !submitting && onClose()} 
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-linear-to-r from-amber-500 to-orange-500 px-4 py-3 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Sửa hóa đơn</h3>
                <p className="text-xs text-amber-100">{invoice.invoice_code}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={submitting}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!canEdit ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <p className="text-slate-700 font-medium">Không thể sửa hóa đơn này</p>
            <p className="text-sm text-slate-500 mt-1">
              Hóa đơn đã {invoice.status === 'paid' ? 'thanh toán đủ' : 'bị hủy'}.
            </p>
            <Button variant="outline" className="mt-4" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              
              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Invoice Info */}
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><span className="text-slate-500">Học viên:</span> <span className="font-medium">{invoice.student?.full_name}</span></p>
                <p><span className="text-slate-500">Lớp:</span> <span className="font-medium">{invoice.class?.name || 'N/A'}</span></p>
                <p><span className="text-slate-500">Đã thanh toán:</span> <span className="font-medium text-emerald-600">{paidAmount.toLocaleString()}đ</span></p>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Số tiền gốc
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formatCurrency(formData.amount)}
                      onChange={(e) => updateField('amount', e.target.value)}
                      className="w-full h-10 pl-9 pr-12 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">VNĐ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Giảm giá
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formatCurrency(formData.discount_amount)}
                      onChange={(e) => updateField('discount_amount', e.target.value)}
                      className="w-full h-10 pl-9 pr-12 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">VNĐ</span>
                  </div>
                </div>
              </div>

              {/* Final Amount Preview */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-700">Thành tiền:</span>
                  <span className="text-lg font-bold text-amber-700">
                    {finalAmount.toLocaleString()}đ
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-amber-600">Còn nợ:</span>
                  <span className={`text-sm font-semibold ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {remaining.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Hạn thanh toán
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => updateField('due_date', e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Mô tả
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditInvoiceModal;
