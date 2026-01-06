/**
 * RefundInvoiceModal Component - REDESIGNED
 * 
 * Drawer/Sheet for refund processing.
 * Slides from right, consistent with PaymentModal drawer pattern.
 * 
 * @param {boolean} isOpen - Open state
 * @param {Object} invoice - Invoice to refund
 * @param {function} onClose - Close handler
 * @param {function} onSuccess - Success callback
 */

import { useState, useEffect } from 'react';
import {
  RefreshCcw,
  Loader2,
  DollarSign,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { cn } from '@/lib/utils';

const REFUND_METHODS = [
  { value: 'cash', label: 'Tiền mặt', icon: '💵' },
  { value: 'bank_transfer', label: 'Chuyển khoản', icon: '🏦' },
  { value: 'credit', label: 'Ghi nợ (credit)', icon: '📝' }
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
    <Sheet open={isOpen} onOpenChange={(open) => !submitting && !open && handleClose()}>
      <SheetContent
        side="right"
        onClose={handleClose}
        className="w-full sm:w-[420px] md:w-[460px] flex flex-col"
      >
        {/* Header - Minimal Modern Style */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <RefreshCcw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-foreground">
                Hoàn tiền
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {invoice.student?.full_name} • {invoice.invoice_code}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {!canRefund ? (
          /* Cannot Refund State */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-foreground font-medium">Không thể hoàn tiền</p>
            <p className="text-sm text-muted-foreground mt-1">
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
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <SheetBody className="flex-1 overflow-y-auto -mx-6 px-6 py-6 space-y-6">

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Invoice Info */}
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Học viên:</span>{' '}
                  <span className="font-medium">{invoice.student?.full_name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Tổng hóa đơn:</span>{' '}
                  <span className="font-medium font-mono tabular-nums">
                    {invoice.final_amount?.toLocaleString('vi-VN')}đ
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Đã thanh toán:</span>{' '}
                  <span className="font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {paidAmount.toLocaleString('vi-VN')}đ
                  </span>
                </p>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Số tiền hoàn <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={formatCurrency(formData.amount)}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="Nhập số tiền"
                    className="w-full h-11 pl-9 pr-14 rounded-lg bg-background border border-input text-base font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    VNĐ
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tối đa: {paidAmount.toLocaleString('vi-VN')}đ
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateField('amount', paidAmount.toString())}
                  className="flex-1 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium"
                >
                  Hoàn toàn bộ
                </button>
                <button
                  type="button"
                  onClick={() => updateField('amount', Math.floor(paidAmount / 2).toString())}
                  className="flex-1 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  Hoàn 50%
                </button>
              </div>

              {/* Refund Method */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Phương thức hoàn tiền
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {REFUND_METHODS.map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => updateField('method', method.value)}
                      className={cn(
                        'p-2 rounded-lg border-2 transition-all text-center',
                        formData.method === method.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                    >
                      <span className="text-lg">{method.icon}</span>
                      <p className="text-xs mt-0.5 text-muted-foreground">{method.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Lý do hoàn tiền <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Nhập lý do hoàn tiền..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Refund Preview */}
              {refundAmount > 0 && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-700 dark:text-purple-300">Hoàn tiền:</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-purple-700 dark:text-purple-300">
                      {refundAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-purple-600 dark:text-purple-400">Còn giữ lại:</span>
                    <span className="text-sm font-medium font-mono tabular-nums text-purple-600 dark:text-purple-400">
                      {(paidAmount - refundAmount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              )}
            </SheetBody>

            {/* Footer */}
            <SheetFooter className="mt-auto pt-4 border-t border-border -mx-6 px-6 pb-6 bg-muted/30">
              <div className="flex gap-2 w-full">
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Xác nhận hoàn tiền
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        )
        }
      </SheetContent >
    </Sheet >
  );
}

export default RefundInvoiceModal;
