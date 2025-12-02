/**
 * PaymentModal Component
 * 
 * Modal thu tiền học phí với tích hợp VietQR.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {Object} invoice - Hóa đơn đang xử lý
 * @param {Object} formData - { amount, method, notes }
 * @param {boolean} processing - Đang xử lý thanh toán
 * @param {function} onClose - Handler đóng modal
 * @param {function} onFormChange - Handler cập nhật form
 * @param {function} onSubmit - Handler submit thanh toán
 */

import { useState } from 'react';
import { 
  X, Receipt, DollarSign, Banknote, QrCode, 
  Smartphone, Copy, Check, Loader2, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BANK_CONFIG } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

export function PaymentModal({
  isOpen,
  invoice,
  formData,
  processing,
  onClose,
  onFormChange,
  onSubmit
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);

  // Copy nội dung chuyển khoản
  const handleCopy = () => {
    const content = `HP ${invoice.student?.full_name?.split(' ').pop() || ''} ${invoice.invoice_code}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick amount buttons
  const quickAmounts = [1000000, 2000000, 5000000].filter(v => v <= remaining);

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
        <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  Thu học phí - {invoice.student?.full_name}
                </h3>
                <p className="text-xs text-emerald-100">{invoice.invoice_code}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Payment Summary */}
          <div className="px-4 py-2 flex gap-2 border-b border-slate-100">
            <SummaryBox label="Tổng" value={invoice.final_amount || 0} variant="default" />
            <SummaryBox label="Đã đóng" value={invoice.paid_amount || 0} variant="success" />
            <SummaryBox label="Còn nợ" value={remaining} variant="danger" />
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
                  value={formatCurrency(formData.amount)}
                  onChange={(e) => onFormChange('amount', e.target.value)}
                  placeholder="Nhập số tiền..."
                  className="
                    w-full h-10 pl-8 pr-10 rounded-lg 
                    border border-slate-300 text-sm font-semibold 
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                  "
                  autoFocus
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  VNĐ
                </span>
              </div>
              
              {/* Quick amount buttons */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {remaining > 0 && (
                  <button
                    onClick={() => onFormChange('amount', remaining.toString())}
                    className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                  >
                    Đóng đủ
                  </button>
                )}
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => onFormChange('amount', amount.toString())}
                    className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                  >
                    {(amount / 1000000).toFixed(0)}tr
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
                <PaymentMethodButton
                  icon={Banknote}
                  label="Tiền mặt"
                  selected={formData.method === 'cash'}
                  onClick={() => { onFormChange('method', 'cash'); setCopied(false); }}
                />
                <PaymentMethodButton
                  icon={QrCode}
                  label="Chuyển khoản"
                  selected={formData.method === 'bank_transfer'}
                  onClick={() => { onFormChange('method', 'bank_transfer'); setCopied(false); }}
                />
              </div>

              {/* VietQR Section */}
              {formData.method === 'bank_transfer' && formData.amount && (
                <VietQRSection
                  invoice={invoice}
                  amount={formData.amount}
                  copied={copied}
                  onCopy={handleCopy}
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
                rows={2}
                className="
                  w-full px-3 py-2 rounded-lg 
                  border border-slate-300 text-sm 
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                  resize-none
                "
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
            disabled={processing || !formData.amount}
          >
            {processing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Xác nhận thu
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SummaryBox({ label, value, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-50',
    success: 'bg-emerald-50 text-emerald-600',
    danger: 'bg-red-50 text-red-600'
  };

  const textColor = {
    default: 'text-slate-900',
    success: 'text-emerald-700',
    danger: 'text-red-600'
  };

  return (
    <div className={`flex-1 p-2 rounded-lg text-center ${variants[variant]}`}>
      <p className={`text-xs ${variant === 'default' ? 'text-slate-500' : textColor[variant]}`}>
        {label}
      </p>
      <p className={`text-sm font-bold ${textColor[variant]}`}>
        {(value || 0).toLocaleString()}đ
      </p>
    </div>
  );
}

function PaymentMethodButton({ icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-1.5 p-2 rounded-lg 
        border-2 transition-all text-sm
        ${selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 hover:border-slate-300 text-slate-600'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function VietQRSection({ invoice, amount, copied, onCopy }) {
  const parsedAmount = parseInt(amount.toString().replace(/[^0-9]/g, '')) || 0;
  const studentName = invoice.student?.full_name?.split(' ').pop() || '';
  const transferContent = `HP ${studentName} ${invoice.invoice_code || ''}`;
  
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${parsedAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  return (
    <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-3">
        {/* QR Code */}
        <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-blue-100">
          <img 
            src={qrUrl}
            alt="VietQR Code"
            className="w-28 h-28 object-contain"
          />
        </div>
        
        {/* Bank Info */}
        <div className="flex-1 flex flex-col justify-between text-xs">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Smartphone className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-blue-700">VietQR</span>
            </div>
            <p className="text-slate-500">
              NH: <span className="font-semibold text-slate-700">{BANK_CONFIG.bankId}</span>
            </p>
            <p className="text-slate-500">
              STK: <span className="font-semibold text-slate-700">{BANK_CONFIG.accountNo}</span>
            </p>
            <p className="text-slate-500 truncate">
              CTK: <span className="font-semibold text-slate-700">{BANK_CONFIG.accountName}</span>
            </p>
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
                className={`
                  p-1 rounded transition-colors
                  ${copied ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-blue-100 text-blue-600'}
                `}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          {/* Amount Display */}
          <div className="mt-2 px-2 py-1 bg-emerald-100 rounded text-center">
            <p className="text-xs font-bold text-emerald-700">
              {parsedAmount.toLocaleString('vi-VN')}đ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
