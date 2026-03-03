/**
 * PaymentModal Component
 * Modal for ADMIN to RECORD tuition payments collected from students
 * 
 * ADMIN CONTEXT ONLY:
 * - This modal is for ADMIN to RECORD payments (not to pay)
 * - NO QR code shown (QR is for student/parent self-payment)
 * - Admin can record payment method (cash/bank transfer) and reference number
 */

import { 
  X, 
  Loader2, 
  DollarSign, 
  Banknote, 
  CreditCard,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from './Avatar';
import { 
  QUICK_PAYMENT_AMOUNTS,
  formatCurrency, 
  parseCurrency
} from '../utils';

export function PaymentModal({
  show,
  student,
  classData,
  paymentData,
  processing,
  onClose,
  onUpdatePaymentData,
  onSubmit
}) {
  if (!show || !student) return null;

  const amount = parseCurrency(paymentData.amount);
  const quickAmounts = QUICK_PAYMENT_AMOUNTS.filter(a => a <= student.remaining);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !processing && onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Thu học phí - {student.full_name}</h3>
                <p className="text-xs text-emerald-100">Lớp {classData?.code}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={processing}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Student Info */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Avatar name={student.full_name} url={student.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{student.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="px-4 py-2 flex gap-2 border-b border-slate-100 dark:border-slate-800">
            <SummaryBox label="Tổng" value={student.amount_due || 0} />
            <SummaryBox label="Đã đóng" value={student.paid_amount || 0} variant="success" />
            <SummaryBox label="Còn nợ" value={student.remaining || 0} variant="error" />
          </div>

          {/* Form */}
          <div className="px-4 py-3 space-y-3">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Số tiền thực đóng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formatCurrency(paymentData.amount)}
                  onChange={(e) => onUpdatePaymentData('amount', e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="w-full h-10 pl-8 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">VNĐ</span>
              </div>
              
              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {student.remaining > 0 && (
                  <button
                    onClick={() => onUpdatePaymentData('amount', student.remaining.toString())}
                    className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                  >
                    Đóng đủ
                  </button>
                )}
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => onUpdatePaymentData('amount', amt.toString())}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    {(amt / 1000000).toFixed(0)}tr
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-2 gap-2">
                <MethodButton
                  active={paymentData.method === 'cash'}
                  onClick={() => onUpdatePaymentData('method', 'cash')}
                  icon={Banknote}
                  label="Tiền mặt"
                />
                <MethodButton
                  active={paymentData.method === 'bank_transfer'}
                  onClick={() => onUpdatePaymentData('method', 'bank_transfer')}
                  icon={CreditCard}
                  label="Chuyển khoản"
                />
              </div>

              {/* Bank Transfer Reference - Only for Bank Transfer */}
              {paymentData.method === 'bank_transfer' && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                    <CreditCard className="w-3.5 h-3.5" />
                    Thông tin chuyển khoản
                  </div>
                  
                  {/* Reference Number */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mã giao dịch / Số tham chiếu
                    </label>
                    <input
                      type="text"
                      value={paymentData.referenceNumber || ''}
                      onChange={(e) => onUpdatePaymentData('referenceNumber', e.target.value)}
                      placeholder="VD: FT24012345678..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                    />
                  </div>

                  {/* Transfer Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Ngày chuyển khoản
                    </label>
                    <input
                      type="date"
                      value={paymentData.transferDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => onUpdatePaymentData('transferDate', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
                    💡 QR thanh toán chỉ hiển thị cho học viên/phụ huynh khi họ tự thanh toán online.
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => onUpdatePaymentData('notes', e.target.value)}
                placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onClose}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onSubmit}
            disabled={processing || !paymentData.amount}
          >
            {processing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Xác nhận thu <span className="font-bold ml-1">{amount.toLocaleString('vi-VN')}đ</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function SummaryBox({ label, value, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
    success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
    error: 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
  };
  
  const labelVariants = {
    default: 'text-slate-500 dark:text-slate-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400'
  };

  return (
    <div className={`flex-1 p-2 rounded-lg text-center ${variants[variant]}`}>
      <p className={`text-xs ${labelVariants[variant]}`}>{label}</p>
      <p className="text-sm font-bold">
        {(value || 0).toLocaleString()}đ
      </p>
    </div>
  );
}

function MethodButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-all text-sm ${
        active
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
