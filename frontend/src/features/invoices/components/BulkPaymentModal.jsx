/**
 * BulkPaymentModal Component
 * 
 * Modal thanh toán hàng loạt cho nhiều hóa đơn cùng lúc.
 * 
 * ADMIN CONTEXT: This is for admin to RECORD payments, NOT to pay.
 * Admin does NOT need to see QR code - they just record the payment method.
 * QR codes are for students/parents in their self-payment portal.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {function} onClose - Handler đóng modal
 * @param {Array} selectedInvoices - Danh sách hóa đơn đã chọn
 * @param {function} onSuccess - Callback khi thanh toán thành công
 */

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Receipt,
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { API_URL } from '../utils/constants';
import { formatCurrency, formatMoney } from '../utils/formatters';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt', icon: Banknote },
  { value: 'bank_transfer', label: 'Chuyển khoản', icon: CreditCard },
  { value: 'card', label: 'Thẻ', icon: CreditCard },
  { value: 'momo', label: 'MoMo', icon: Smartphone },
  { value: 'vnpay', label: 'VNPay', icon: CreditCard }
];

export function BulkPaymentModal({ isOpen, onClose, selectedInvoices = [], onSuccess }) {
  const { session } = useAuth();

  const [includedIds, setIncludedIds] = useState(new Set());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceCode, setReferenceCode] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showInvoiceList, setShowInvoiceList] = useState(true);

  useEffect(() => {
    if (isOpen && selectedInvoices.length > 0) {
      setIncludedIds(new Set(selectedInvoices.map(inv => inv.id)));
      setPaymentMethod('cash');
      setReferenceCode('');
      setTransferDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError('');
      setResult(null);
    }
  }, [isOpen, selectedInvoices]);

  const includedInvoices = useMemo(() => {
    return selectedInvoices.filter(inv => includedIds.has(inv.id));
  }, [selectedInvoices, includedIds]);

  const totalAmount = useMemo(() => {
    return includedInvoices.reduce((sum, inv) => {
      const remaining = (inv.final_amount || 0) - (inv.paid_amount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
  }, [includedInvoices]);

  const toggleInvoice = (invoiceId) => {
    setIncludedIds(prev => {
      const next = new Set(prev);
      if (next.has(invoiceId)) {
        next.delete(invoiceId);
      } else {
        next.add(invoiceId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (includedIds.size === selectedInvoices.length) {
      setIncludedIds(new Set());
    } else {
      setIncludedIds(new Set(selectedInvoices.map(inv => inv.id)));
    }
  };

  const handleSubmit = async () => {
    if (includedInvoices.length === 0) {
      setError('Vui lòng chọn ít nhất một hóa đơn');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const payload = {
        invoice_ids: includedInvoices.map(inv => inv.id),
        payment_method: paymentMethod,
        reference_code: referenceCode.trim() || undefined,
        notes: notes.trim() || undefined
      };

      const res = await fetch(`${API_URL}/api/admin/invoices/bulk-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        const message = `Thanh toán thành công ${data.data?.processed || 0} hóa đơn`;
        onSuccess?.(message, data.data);
      } else {
        setError(data.message || 'Có lỗi xảy ra khi thanh toán');
      }
    } catch (err) {
      console.error('Bulk payment error:', err);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Thanh toán hoàn tất</h3>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <span className="text-muted-foreground">Đã xử lý:</span>
                <span className="font-semibold text-emerald-600">{result.processed || 0} hóa đơn</span>
              </div>
              {result.skipped > 0 && (
                <div className="flex justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <span className="text-muted-foreground">Bỏ qua:</span>
                  <span className="font-semibold text-amber-600">{result.skipped} hóa đơn</span>
                </div>
              )}
              {result.failed > 0 && (
                <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-muted-foreground">Thất bại:</span>
                  <span className="font-semibold text-red-600">{result.failed} hóa đơn</span>
                </div>
              )}
              <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-muted-foreground">Tổng tiền:</span>
                <span className="font-semibold text-foreground">{formatMoney(result.total_amount || totalAmount)}</span>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Thanh toán hàng loạt</h3>
                <p className="text-xs text-emerald-100">{selectedInvoices.length} hóa đơn được chọn</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processing}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Invoice List */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowInvoiceList(!showInvoiceList)}
              className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includedIds.size === selectedInvoices.length && selectedInvoices.length > 0}
                  onChange={toggleAll}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-foreground">
                  Danh sách hóa đơn ({includedIds.size}/{selectedInvoices.length})
                </span>
              </div>
              {showInvoiceList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showInvoiceList && (
              <div className="max-h-48 overflow-y-auto divide-y divide-border">
                {selectedInvoices.map((invoice) => {
                  const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
                  return (
                    <label
                      key={invoice.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={includedIds.has(invoice.id)}
                        onChange={() => toggleInvoice(invoice.id)}
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {invoice.student?.full_name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">{invoice.invoice_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatMoney(remaining)}</p>
                        <p className="text-xs text-muted-foreground">còn nợ</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng tiền thanh toán:</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs ${
                      paymentMethod === method.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bank Transfer Info - Only for Bank Transfer */}
          {paymentMethod === 'bank_transfer' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <CreditCard className="w-4 h-4" />
                Thông tin chuyển khoản
              </div>
              
              {/* Reference Number */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Mã giao dịch / Số tham chiếu
                </label>
                <Input
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder="VD: FT24012345678..."
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nhập mã giao dịch từ sao kê ngân hàng (không bắt buộc)
                </p>
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Ngày chuyển khoản
                </label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>

              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                💡 Ghi chú: QR thanh toán chỉ hiển thị cho học viên/phụ huynh khi họ tự thanh toán online.
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú cho đợt thanh toán này..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 bg-muted/30 border-t border-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={processing || includedIds.size === 0}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Thanh toán {includedIds.size} hóa đơn
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BulkPaymentModal;
