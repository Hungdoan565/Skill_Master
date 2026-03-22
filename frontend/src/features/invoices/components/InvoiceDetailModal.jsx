/**
 * InvoiceDetailModal Component
 * 
 * Modal hiển thị chi tiết hóa đơn.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {Object} invoice - Data hóa đơn chi tiết
 * @param {boolean} loading - Đang tải data
 * @param {function} onClose - Handler đóng modal
 * @param {Array} payments - Danh sách payments từ API
 * @param {boolean} loadingPayments - Loading payments
 * @param {function} onVerifyPayment - Handler verify bank transfer
 * @param {function} onRejectPayment - Handler reject bank transfer
 * @param {function} onRefreshPayments - Refresh payments list
 */

import { useState } from 'react';
import { X, FileText, Users, Building2, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { PaymentHistorySection } from './PaymentHistorySection';
import { ReceiptModal } from './ReceiptModal';
import { InvoicePrintModal } from './InvoicePrintModal';
import { formatDate } from '../utils/formatters';

export function InvoiceDetailModal({
  isOpen,
  invoice,
  loading,
  onClose,
  payments = [],
  loadingPayments = false,
  onVerifyPayment,
  onRejectPayment,
  onRefreshPayments
}) {
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, payment: null });
  const [showPrintModal, setShowPrintModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop - SOLID dark overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal - SOLID background, no transparency */}
      <div className="relative bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800">

        {/* Header - Minimal Modern Style */}
        <div className="px-4 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Chi tiết hóa đơn</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : invoice ? (
            <div className="space-y-4">

              {/* Invoice Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-lg font-bold text-foreground">
                    {invoice.invoice_code}
                  </span>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ngày tạo</p>
                    <p className="font-medium text-foreground">{formatDate(invoice.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hạn thanh toán</p>
                    <p className="font-medium text-foreground">{formatDate(invoice.due_date) || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Student & Class Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  icon={Users}
                  label="Học viên"
                  variant="blue"
                  name={invoice.student?.full_name}
                  details={[
                    invoice.student?.email,
                    invoice.student?.phone
                  ]}
                />
                <InfoCard
                  icon={Building2}
                  label="Lớp học"
                  variant="purple"
                  name={invoice.class?.name}
                  details={[invoice.class?.course?.title]}
                />
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng tiền</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-foreground">
                      {(invoice.final_amount || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Đã thanh toán</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {(invoice.paid_amount || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-red-600 dark:text-red-400">Còn nợ</p>
                    <p className="text-lg font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
                      {((invoice.final_amount || 0) - (invoice.paid_amount || 0)).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History - Using new PaymentHistorySection */}
              <PaymentHistorySection
                invoiceId={invoice.id}
                payments={payments}
                loading={loadingPayments}
                onVerify={onVerifyPayment}
                onReject={onRejectPayment}
                onRefresh={onRefreshPayments}
                onPrintReceipt={(payment) => setReceiptModal({ isOpen: true, payment })}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              Không thể tải thông tin hóa đơn
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-t border-border flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowPrintModal(true)}>
            <Printer className="w-4 h-4 mr-2" />
            In hóa đơn
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        invoice={invoice}
        payment={receiptModal.payment}
        onClose={() => setReceiptModal({ isOpen: false, payment: null })}
      />

      {/* Invoice Print Modal */}
      <InvoicePrintModal
        isOpen={showPrintModal}
        invoice={invoice}
        payments={payments}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoCard({ icon: Icon, label, variant, name, details }) {
  const variants = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      iconBg: 'text-blue-600 dark:text-blue-400',
      labelColor: 'text-blue-600 dark:text-blue-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      iconBg: 'text-purple-600 dark:text-purple-400',
      labelColor: 'text-purple-600 dark:text-purple-400'
    }
  };

  const style = variants[variant] || variants.blue;

  return (
    <div className={`p-3 ${style.bg} rounded-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${style.iconBg}`} />
        <span className={`text-xs font-medium ${style.labelColor}`}>{label}</span>
      </div>
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{name || 'N/A'}</p>
      {details?.filter(Boolean).map((detail, i) => (
        <p key={i} className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
      ))}
    </div>
  );
}

function PaymentHistoryItem({ payment }) {
  const methodLabel = payment.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          +{(payment.amount || 0).toLocaleString()}đ
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatDate(payment.payment_date)} • {methodLabel}
        </p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Thu bởi: {payment.receiver?.full_name || 'N/A'}
      </p>
    </div>
  );
}

export default InvoiceDetailModal;
