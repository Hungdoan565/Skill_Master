/**
 * PaymentModal Component
 * Modal for collecting tuition payment with VietQR support
 */

import { 
  X, 
  Loader2, 
  DollarSign, 
  Banknote, 
  QrCode,
  Smartphone,
  Copy,
  Check,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from './Avatar';
import { 
  BANK_CONFIG, 
  QUICK_PAYMENT_AMOUNTS,
  formatCurrency, 
  parseCurrency,
  generateVietQRUrl,
  generateTransferContent
} from '../utils';

export function PaymentModal({
  show,
  student,
  classData,
  paymentData,
  processing,
  copied,
  onClose,
  onUpdatePaymentData,
  onSubmit,
  onCopyTransferContent
}) {
  if (!show || !student) return null;

  const amount = parseCurrency(paymentData.amount);
  const transferContent = generateTransferContent(student.full_name, classData?.code);
  const qrUrl = generateVietQRUrl(BANK_CONFIG, amount, transferContent);
  const quickAmounts = QUICK_PAYMENT_AMOUNTS.filter(a => a <= student.remaining);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !processing && onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white flex-shrink-0">
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
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Avatar name={student.full_name} url={student.avatar_url} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate">{student.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{student.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="px-4 py-2 flex gap-2 border-b border-slate-100">
            <SummaryBox label="Tổng" value={student.amount_due || 0} />
            <SummaryBox label="Đã đóng" value={student.paid_amount || 0} variant="success" />
            <SummaryBox label="Còn nợ" value={student.remaining || 0} variant="error" />
          </div>

          {/* Form */}
          <div className="px-4 py-3 space-y-3">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Số tiền thực đóng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formatCurrency(paymentData.amount)}
                  onChange={(e) => onUpdatePaymentData('amount', e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="w-full h-10 pl-8 pr-10 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">VNĐ</span>
              </div>
              
              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {student.remaining > 0 && (
                  <button
                    onClick={() => onUpdatePaymentData('amount', student.remaining.toString())}
                    className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                  >
                    Đóng đủ
                  </button>
                )}
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => onUpdatePaymentData('amount', amt.toString())}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                  >
                    {(amt / 1000000).toFixed(0)}tr
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
                  icon={QrCode}
                  label="Chuyển khoản"
                />
              </div>

              {/* VietQR Section */}
              {paymentData.method === 'bank_transfer' && paymentData.amount && (
                <VietQRSection
                  qrUrl={qrUrl}
                  bankConfig={BANK_CONFIG}
                  amount={amount}
                  transferContent={transferContent}
                  copied={copied}
                  onCopy={() => onCopyTransferContent(transferContent)}
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => onUpdatePaymentData('notes', e.target.value)}
                placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
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
    default: 'bg-slate-50 text-slate-900',
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-600'
  };
  
  const labelVariants = {
    default: 'text-slate-500',
    success: 'text-emerald-600',
    error: 'text-red-600'
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
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 hover:border-slate-300 text-slate-600'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function VietQRSection({ qrUrl, bankConfig, amount, transferContent, copied, onCopy }) {
  return (
    <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-3">
        {/* QR Code */}
        <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-blue-100">
          <img 
            src={qrUrl}
            alt="VietQR Code"
            className="w-28 h-28 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-28 h-28 items-center justify-center text-slate-400 text-xs text-center">
            <div>
              <QrCode className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p>Lỗi QR</p>
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="flex-1 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Smartphone className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-blue-700">VietQR</span>
            </div>
            <p className="text-slate-500">NH: <span className="font-semibold text-slate-700">{bankConfig.bankId}</span></p>
            <p className="text-slate-500">STK: <span className="font-semibold text-slate-700">{bankConfig.accountNo}</span></p>
            <p className="text-slate-500 truncate">CTK: <span className="font-semibold text-slate-700">{bankConfig.accountName}</span></p>
          </div>
          
          {/* Transfer Content */}
          <div className="mt-2">
            <p className="text-slate-500 mb-0.5">Nội dung CK:</p>
            <div className="flex items-center gap-1 bg-white rounded border border-blue-200 p-1">
              <code className="flex-1 text-xs font-mono text-blue-700 truncate">
                {transferContent}
              </code>
              <button
                onClick={onCopy}
                className={`p-1 rounded transition-colors ${
                  copied 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'hover:bg-blue-100 text-blue-600'
                }`}
                title="Copy"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          {/* Amount */}
          <div className="mt-2 px-2 py-1 bg-emerald-100 rounded text-center">
            <p className="text-xs font-bold text-emerald-700">
              {amount.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
