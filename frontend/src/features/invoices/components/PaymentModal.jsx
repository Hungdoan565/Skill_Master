/**
 * PaymentDrawer Component (formerly PaymentModal)
 * 
 * REDESIGNED: Drawer/Sheet that slides from right side.
 * Allows admin to see invoice table in background while processing payment.
 * 
 * Features:
 * - Sheet/Drawer pattern (not modal)
 * - VietQR integration with large QR code
 * - Auto-format currency input
 * - Dark mode compatible
 */

import { useState, useEffect } from 'react';
import {
  Receipt, DollarSign, Banknote, QrCode,
  Smartphone, Copy, Check, Loader2, CheckCircle2, Upload, X
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
import { BANK_CONFIG } from '../utils/constants';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { cn } from '@/lib/utils';

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
  const [copiedField, setCopiedField] = useState(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
  const parsedAmount = parseCurrency(formData.amount?.toString() || '0');

  // Quick amount buttons
  const quickAmounts = [
    { label: 'Đóng đủ', value: remaining },
    { label: '1tr', value: 1000000 },
    { label: '2tr', value: 2000000 },
  ].filter(item => item.value <= remaining && item.value > 0);

  const handleCopyField = (field, value) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onFormChange('bankProofUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate VietQR URL
  const studentName = invoice.student?.full_name?.split(' ').pop() || '';
  const transferContent = `HP ${studentName} ${invoice.invoice_code || ''}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${parsedAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !processing && !open && onClose()}>
      <SheetContent
        side="right"
        onClose={onClose}
        className="w-full sm:w-[480px] md:w-[520px] flex flex-col"
      >
        {/* Header - Minimal Modern Style */}
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold text-foreground">
                Thu học phí
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {invoice.student?.full_name} • {invoice.invoice_code}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Summary Bar - with divider */}
        <div className="flex gap-3 py-4 border-b border-border">
          <SummaryBox label="Tổng" value={invoice.final_amount || 0} variant="default" />
          <SummaryBox label="Đã đóng" value={invoice.paid_amount || 0} variant="success" />
          <SummaryBox label="Còn nợ" value={remaining} variant="danger" />
        </div>

        {/* Form Content - Scrollable, space-y-6 for 24px gaps between sections */}
        <SheetBody className="flex-1 overflow-y-auto -mx-6 px-6 py-6 space-y-6">

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Số tiền thực đóng <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={formatCurrency(formData.amount)}
                onChange={(e) => onFormChange('amount', e.target.value)}
                placeholder="Nhập số tiền..."
                className="
                  w-full h-11 pl-9 pr-14 rounded-lg 
                  bg-background border border-input text-base font-semibold font-mono
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                "
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                VNĐ
              </span>
            </div>

            {/* Quick amount buttons - mt-3 for better separation */}
            <div className="flex flex-wrap gap-2 mt-3">
              {quickAmounts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onFormChange('amount', item.value.toString())}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                    item.label === 'Đóng đủ'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-3">
              <PaymentMethodButton
                icon={Banknote}
                label="Tiền mặt"
                selected={formData.method === 'cash'}
                onClick={() => onFormChange('method', 'cash')}
              />
              <PaymentMethodButton
                icon={QrCode}
                label="Chuyển khoản"
                selected={formData.method === 'bank_transfer'}
                onClick={() => onFormChange('method', 'bank_transfer')}
              />
            </div>
          </div>

          {/* VietQR Section - Only for Bank Transfer */}
          {formData.method === 'bank_transfer' && parsedAmount > 0 && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4">

              {/* QR Code - Large 280x280 */}
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl shadow-md">
                  <img
                    src={qrUrl}
                    alt="VietQR Code"
                    className="w-[280px] h-[280px] object-contain"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 text-sm">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  VietQR - Quét mã để thanh toán
                </span>
              </div>

              {/* Bank Info */}
              <div className="space-y-1.5">
                <BankInfoRow
                  label="Ngân hàng"
                  value={BANK_CONFIG.bankId}
                  onCopy={() => handleCopyField('bank', BANK_CONFIG.bankId)}
                  copied={copiedField === 'bank'}
                />
                <BankInfoRow
                  label="Số tài khoản"
                  value={BANK_CONFIG.accountNo}
                  onCopy={() => handleCopyField('stk', BANK_CONFIG.accountNo)}
                  copied={copiedField === 'stk'}
                />
                <BankInfoRow
                  label="Chủ tài khoản"
                  value={BANK_CONFIG.accountName}
                  onCopy={() => handleCopyField('name', BANK_CONFIG.accountName)}
                  copied={copiedField === 'name'}
                />
                <BankInfoRow
                  label="Nội dung CK"
                  value={transferContent}
                  onCopy={() => handleCopyField('content', transferContent)}
                  copied={copiedField === 'content'}
                  highlight
                />
              </div>

              {/* Amount Display */}
              <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-center">
                <p className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                  {parsedAmount.toLocaleString('vi-VN')}đ
                </p>
              </div>

              {/* Upload Proof */}
              <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                <label className="block text-xs font-medium text-foreground mb-2">
                  📤 Upload ảnh xác nhận chuyển khoản <span className="text-destructive">*</span>
                </label>

                {formData.bankProofUrl ? (
                  <div className="relative">
                    <img
                      src={formData.bankProofUrl}
                      alt="Bank proof"
                      className="w-full max-h-40 object-contain rounded-lg border"
                    />
                    <button
                      onClick={() => onFormChange('bankProofUrl', null)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg cursor-pointer bg-background hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                    <Upload className="w-5 h-5 text-blue-400 mb-1" />
                    <p className="text-xs text-muted-foreground">Kéo thả hoặc click để chọn</p>
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
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
              rows={2}
              className="
                w-full px-3 py-2 rounded-lg 
                bg-background border border-input text-sm
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
                resize-none
              "
            />
          </div>
        </SheetBody>

        {/* Footer - Fixed */}
        <SheetFooter className="mt-auto pt-4 border-t border-border -mx-6 px-6 pb-6 bg-muted/30">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onSubmit}
              disabled={processing || !formData.amount}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Xác nhận thu
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function SummaryBox({ label, value, variant = 'default' }) {
  const variants = {
    default: 'bg-muted',
    success: 'bg-emerald-50 dark:bg-emerald-950/30',
    danger: 'bg-red-50 dark:bg-red-950/30',
  };

  const textColors = {
    default: 'text-foreground',
    success: 'text-emerald-700 dark:text-emerald-300',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={cn('flex-1 p-2 rounded-lg text-center', variants[variant])}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold font-mono tabular-nums', textColors[variant])}>
        {(value || 0).toLocaleString('vi-VN')}đ
      </p>
    </div>
  );
}

function PaymentMethodButton({ icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 transition-all text-sm',
        selected
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
          : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function BankInfoRow({ label, value, onCopy, copied, highlight = false }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-1.5 rounded-lg',
      highlight
        ? 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800'
        : 'bg-background'
    )}>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] text-muted-foreground">{label}:</span>
        <p className={cn(
          'text-sm font-semibold truncate',
          highlight ? 'text-blue-700 dark:text-blue-300 font-mono' : 'text-foreground'
        )}>
          {value}
        </p>
      </div>
      <button
        onClick={onCopy}
        className={cn(
          'ml-2 p-1.5 rounded-md transition-colors',
          copied
            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'
            : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600'
        )}
        title={copied ? 'Đã copy!' : 'Click để copy'}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default PaymentModal;
