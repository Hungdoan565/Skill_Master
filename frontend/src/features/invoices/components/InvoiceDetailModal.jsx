/**
 * InvoiceDetailModal Component
 * 
 * Modal hiển thị chi tiết hóa đơn.
 * 
 * @param {boolean} isOpen - Trạng thái modal
 * @param {Object} invoice - Data hóa đơn chi tiết
 * @param {boolean} loading - Đang tải data
 * @param {function} onClose - Handler đóng modal
 */

import { X, FileText, Users, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/formatters';

export function InvoiceDetailModal({
  isOpen,
  invoice,
  loading,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-700 to-zinc-800 px-4 py-3 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold">Chi tiết hóa đơn</h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
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
              <div className="p-4 bg-zinc-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-lg font-bold text-zinc-900">
                    {invoice.invoice_code}
                  </span>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Ngày tạo</p>
                    <p className="font-medium">{formatDate(invoice.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Hạn thanh toán</p>
                    <p className="font-medium">{formatDate(invoice.due_date) || '—'}</p>
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
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Tổng tiền</p>
                    <p className="text-lg font-bold text-zinc-900">
                      {(invoice.final_amount || 0).toLocaleString()}đ
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">Đã thanh toán</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {(invoice.paid_amount || 0).toLocaleString()}đ
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-red-600">Còn nợ</p>
                    <p className="text-lg font-bold text-red-600">
                      {((invoice.final_amount || 0) - (invoice.paid_amount || 0)).toLocaleString()}đ
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-700 mb-2">
                    Lịch sử thanh toán
                  </h4>
                  <div className="space-y-2">
                    {invoice.payments.map((payment) => (
                      <PaymentHistoryItem key={payment.id} payment={payment} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              Không thể tải thông tin hóa đơn
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 bg-zinc-50 border-t border-zinc-200">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InfoCard({ icon: Icon, label, variant, name, details }) {
  const variants = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'text-blue-600',
      labelColor: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'text-purple-600',
      labelColor: 'text-purple-600'
    }
  };

  const style = variants[variant] || variants.blue;

  return (
    <div className={`p-3 ${style.bg} rounded-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${style.iconBg}`} />
        <span className={`text-xs font-medium ${style.labelColor}`}>{label}</span>
      </div>
      <p className="font-semibold text-zinc-900">{name || 'N/A'}</p>
      {details?.filter(Boolean).map((detail, i) => (
        <p key={i} className="text-xs text-zinc-500">{detail}</p>
      ))}
    </div>
  );
}

function PaymentHistoryItem({ payment }) {
  const methodLabel = payment.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-zinc-900">
          +{(payment.amount || 0).toLocaleString()}đ
        </p>
        <p className="text-xs text-zinc-500">
          {formatDate(payment.payment_date)} • {methodLabel}
        </p>
      </div>
      <p className="text-xs text-zinc-500">
        Thu bởi: {payment.receiver?.full_name || 'N/A'}
      </p>
    </div>
  );
}

export default InvoiceDetailModal;
