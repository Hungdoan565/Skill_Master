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
  Smartphone, Copy, Check, Loader2, CheckCircle2, Upload
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
                  bankProofUrl={formData.bankProofUrl}
                  onUploadProof={(url) => onFormChange('bankProofUrl', url)}
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

function VietQRSection({ invoice, amount, copied, onCopy, bankProofUrl, onUploadProof }) {
  const parsedAmount = parseInt(amount.toString().replace(/[^0-9]/g, '')) || 0;
  const studentName = invoice.student?.full_name?.split(' ').pop() || '';
  const transferContent = `HP ${studentName} ${invoice.invoice_code || ''}`;
  const [copiedField, setCopiedField] = useState(null);

  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${parsedAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  const handleCopyField = (field, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadProof) {
      // Convert to base64 for demo (in production: upload to Supabase Storage)
      const reader = new FileReader();
      reader.onload = () => {
        onUploadProof(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* QR Code - LARGE 300x300 */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-xl shadow-md border border-blue-100">
          <img
            src={qrUrl}
            alt="VietQR Code"
            className="w-72 h-72 object-contain"
          />
        </div>
      </div>

      {/* Bank Info với Copy Buttons */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-1 justify-center mb-2">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-700">VietQR - Quét mã để thanh toán</span>
        </div>

        {/* Bank Name */}
        <BankInfoRow
          label="Ngân hàng"
          value={BANK_CONFIG.bankId}
          onCopy={() => handleCopyField('bank', BANK_CONFIG.bankId)}
          copied={copiedField === 'bank'}
        />

        {/* Account Number */}
        <BankInfoRow
          label="Số tài khoản"
          value={BANK_CONFIG.accountNo}
          onCopy={() => handleCopyField('stk', BANK_CONFIG.accountNo)}
          copied={copiedField === 'stk'}
        />

        {/* Account Name */}
        <BankInfoRow
          label="Chủ tài khoản"
          value={BANK_CONFIG.accountName}
          onCopy={() => handleCopyField('name', BANK_CONFIG.accountName)}
          copied={copiedField === 'name'}
        />

        {/* Transfer Content */}
        <BankInfoRow
          label="Nội dung CK"
          value={transferContent}
          onCopy={() => handleCopyField('content', transferContent)}
          copied={copiedField === 'content'}
          highlight
        />

        {/* Amount */}
        <div className="mt-3 px-4 py-2 bg-emerald-100 rounded-lg text-center">
          <p className="text-lg font-bold text-emerald-700">
            {parsedAmount.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* Upload Screenshot Section */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <label className="block text-xs font-medium text-slate-700 mb-2">
          📤 Upload ảnh xác nhận chuyển khoản <span className="text-red-500">*</span>
        </label>

        {bankProofUrl ? (
          <div className="relative">
            <img
              src={bankProofUrl}
              alt="Bank proof"
              className="w-full max-h-48 object-contain rounded-lg border border-blue-200"
            />
            <button
              onClick={() => onUploadProof?.(null)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-2">
              <Upload className="w-6 h-6 text-blue-400 mb-1" />
              <p className="text-xs text-slate-500">Kéo thả hoặc click để chọn ảnh</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </div>
    </div>
  );
}

// Helper component for bank info rows with copy button
function BankInfoRow({ label, value, onCopy, copied, highlight = false }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${highlight ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'}`}>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-500">{label}:</span>
        <p className={`font-semibold truncate ${highlight ? 'text-blue-700 font-mono' : 'text-slate-800'}`}>
          {value}
        </p>
      </div>
      <button
        onClick={onCopy}
        className={`ml-2 p-2 rounded-lg transition-colors ${copied
          ? 'bg-emerald-100 text-emerald-600'
          : 'hover:bg-blue-100 text-blue-600'
          }`}
        title={copied ? 'Đã copy!' : 'Click để copy'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default PaymentModal;
