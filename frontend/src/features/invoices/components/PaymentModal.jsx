/**
 * PaymentDrawer Component (formerly PaymentModal)
 * 
 * REDESIGNED: Drawer/Sheet that slides from right side.
 * Allows admin to see invoice table in background while processing payment.
 * 
 * ADMIN CONTEXT ONLY:
 * - This modal is for ADMIN to RECORD payments collected from students
 * - Admin does NOT pay - admin COLLECTS payment
 * - NO QR code shown (QR is for student/parent self-payment)
 * - Admin can record payment method (cash/transfer) and reference number
 * 
 * Features:
 * - Sheet/Drawer pattern (not modal)
 * - Payment method selection (cash/bank transfer)
 * - Reference number field for bank transfers
 * - Auto-format currency input
 * - Dark mode compatible
 */

import { useState, useEffect } from 'react';
import {
  Receipt, DollarSign, Banknote, CreditCard,
  Loader2, CheckCircle2
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

  // Quick amount buttons
  const quickAmounts = [
    { label: 'Đóng đủ', value: remaining },
    { label: '1tr', value: 1000000 },
    { label: '2tr', value: 2000000 },
  ].filter(item => item.value <= remaining && item.value > 0);

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
                  bg-white border border-input text-base font-semibold font-mono
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
                icon={CreditCard}
                label="Chuyển khoản"
                selected={formData.method === 'bank_transfer'}
                onClick={() => onFormChange('method', 'bank_transfer')}
              />
            </div>
          </div>

          {/* Bank Transfer Reference - Only for Bank Transfer */}
          {formData.method === 'bank_transfer' && (
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
                <input
                  type="text"
                  value={formData.referenceNumber || ''}
                  onChange={(e) => onFormChange('referenceNumber', e.target.value)}
                  placeholder="VD: FT24012345678..."
                  className="
                    w-full h-10 px-3 rounded-lg 
                    bg-white border border-input text-sm font-mono
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    placeholder:text-muted-foreground
                  "
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
                <input
                  type="date"
                  value={formData.transferDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => onFormChange('transferDate', e.target.value)}
                  className="
                    w-full h-10 px-3 rounded-lg 
                    bg-white border border-input text-sm
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  "
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
              value={formData.notes}
              onChange={(e) => onFormChange('notes', e.target.value)}
              placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
              rows={2}
              className="
                w-full px-3 py-2 rounded-lg 
                bg-white border border-input text-sm
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

export default PaymentModal;
