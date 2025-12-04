/**
 * CancelInvoiceModal Component
 * 
 * Modal xác nhận hủy hóa đơn.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {Object} invoice - Hóa đơn cần hủy
 * @param {function} onClose - Handler đóng modal
 * @param {function} onSuccess - Callback khi hủy thành công
 */

import { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Loader2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';

export function CancelInvoiceModal({ isOpen, invoice, onClose, onSuccess }) {
  const { session } = useAuth();
  
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!notes.trim()) {
      setError('Vui lòng nhập lý do hủy hóa đơn');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/invoices/${invoice.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ notes: notes.trim() })
      });

      const result = await res.json();

      if (result.success) {
        onSuccess?.('Hủy hóa đơn thành công');
        setNotes('');
        onClose();
      } else {
        setError(result.message || 'Không thể hủy hóa đơn');
      }
    } catch (err) {
      console.error('Error cancelling invoice:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setNotes('');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !invoice) return null;

  const canCancel = invoice.status !== 'cancelled' && invoice.status !== 'refunded';
  const hasPaid = invoice.paid_amount > 0;

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
        <div className="bg-linear-to-r from-red-500 to-rose-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Hủy hóa đơn</h3>
                <p className="text-xs text-red-100">{invoice.invoice_code}</p>
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
        {!canCancel ? (
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-700 font-medium">Không thể hủy hóa đơn này</p>
            <p className="text-sm text-slate-500 mt-1">
              Hóa đơn đã {invoice.status === 'cancelled' ? 'bị hủy' : 'được hoàn tiền'}.
            </p>
            <Button variant="outline" className="mt-4" onClick={handleClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              
              {/* Warning */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Lưu ý quan trọng!</p>
                    <p className="mt-1">Hành động này không thể hoàn tác. Hóa đơn sẽ chuyển sang trạng thái đã hủy.</p>
                    {hasPaid && (
                      <p className="mt-1 font-medium">
                        Hóa đơn này đã có thanh toán {invoice.paid_amount?.toLocaleString()}đ. 
                        Hãy cân nhắc sử dụng chức năng Hoàn tiền thay vì hủy.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Invoice Info */}
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><span className="text-slate-500">Học viên:</span> <span className="font-medium">{invoice.student?.full_name}</span></p>
                <p><span className="text-slate-500">Số tiền:</span> <span className="font-medium">{invoice.final_amount?.toLocaleString()}đ</span></p>
                <p><span className="text-slate-500">Đã thanh toán:</span> <span className="font-medium text-emerald-600">{invoice.paid_amount?.toLocaleString()}đ</span></p>
                <p><span className="text-slate-500">Trạng thái:</span> <span className="font-medium">{invoice.status}</span></p>
              </div>

              {/* Cancel Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setError('');
                    }}
                    placeholder="Nhập lý do hủy hóa đơn..."
                    rows={3}
                    required
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
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
                onClick={handleClose}
                disabled={submitting}
              >
                Không hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CancelInvoiceModal;
