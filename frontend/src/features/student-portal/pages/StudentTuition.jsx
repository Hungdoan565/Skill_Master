/**
 * StudentTuition Page - Trang xem học phí cho học viên
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentInvoices } from '../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  Banknote,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const STATUS_CONFIG = {
  paid: { label: 'Đã thanh toán', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  unpaid: { label: 'Chưa thanh toán', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  pending: { label: 'Chờ xác minh', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  overdue: { label: 'Quá hạn', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  partial: { label: 'Thanh toán một phần', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  draft: { label: 'Bản nháp', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  cancelled: { label: 'Đã hủy', color: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400' }
};

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-muted text-muted-foreground',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  };

  return (
    <Card className="hover:shadow-md transition-shadow rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', colorStyles[color])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;
  return (
    <Badge variant="secondary" className={cn('font-medium', config.color)}>
      {config.label}
    </Badge>
  );
}

function InvoiceItem({ invoice, onClick }) {
  const statusIcon = {
    paid: CheckCircle,
    unpaid: Clock,
    pending: Clock,
    overdue: AlertTriangle,
    partial: CreditCard,
    draft: FileText,
    cancelled: XCircle
  };
  const Icon = statusIcon[invoice.status] || Clock;

  return (
    <div
      onClick={() => onClick(invoice)}
      className="flex items-center justify-between p-4 rounded-lg bg-white hover:bg-slate-50 transition-colors border border-border cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          'p-2 rounded-lg',
          invoice.status === 'paid' ? 'bg-green-500/10' :
          invoice.status === 'overdue' ? 'bg-red-500/10' :
          'bg-amber-500/10'
        )}>
          <Icon className={cn(
            'h-4 w-4',
            invoice.status === 'paid' ? 'text-green-600 dark:text-green-400' :
            invoice.status === 'overdue' ? 'text-red-600 dark:text-red-400' :
            'text-amber-600 dark:text-amber-400'
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{invoice.invoice_code || `HD-${invoice.id}`}</p>
          <p className="text-sm text-muted-foreground truncate">
            {invoice.description || invoice.class_name || 'Học phí'}
          </p>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className="font-semibold">{formatCurrency(invoice.final_amount || invoice.amount)}</p>
        <div className="flex items-center gap-2 justify-end mt-1">
          <StatusBadge status={invoice.status} />
        </div>
      </div>
    </div>
  );
}

function InvoiceDetailModal({ invoice, open, onClose, onPay }) {
  if (!invoice) return null;

  const remaining = (invoice.final_amount || invoice.amount) - (invoice.paid_amount || 0);
  const total = invoice.final_amount || invoice.amount || 1;
  const paidPercent = Math.min(100, Math.round(((invoice.paid_amount || 0) / total) * 100));
  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.unpaid;

  const statusBannerStyles = {
    paid: 'from-emerald-500 to-emerald-600',
    unpaid: 'from-amber-500 to-amber-600',
    pending: 'from-yellow-500 to-yellow-600',
    overdue: 'from-rose-500 to-rose-600',
    partial: 'from-blue-500 to-blue-600',
    draft: 'from-slate-400 to-slate-500',
    cancelled: 'from-zinc-400 to-zinc-500',
  };

  const statusIcon = {
    paid: CheckCircle,
    unpaid: Clock,
    pending: Clock,
    overdue: AlertTriangle,
    partial: CreditCard,
    draft: FileText,
    cancelled: XCircle,
  };
  const StatusIcon = statusIcon[invoice.status] || Clock;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Status Banner */}
        <div className={cn('bg-gradient-to-r text-white px-6 py-5', statusBannerStyles[invoice.status] || statusBannerStyles.pending)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Hóa đơn</p>
              <p className="text-lg font-bold mt-0.5">{invoice.invoice_code || `HD-${invoice.id}`}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Mô tả</p>
            <p className="font-medium text-sm">{invoice.description || invoice.class_name || 'Học phí'}</p>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Tổng tiền</span>
              <span className="font-semibold text-lg">{formatCurrency(total)}</span>
            </div>
            {(invoice.paid_amount > 0 || invoice.status === 'partial') && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Đã thanh toán</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(invoice.paid_amount || 0)}</span>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1.5">
                    <span>Tiến độ thanh toán</span>
                    <span className="font-medium">{paidPercent}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {invoice.status !== 'paid' && remaining > 0 && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                <span className="text-muted-foreground font-medium">Còn lại</span>
                <span className="font-bold text-rose-600">{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>

          {/* Date Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Hạn thanh toán</p>
              <p className="text-sm font-medium">{formatDate(invoice.due_date)}</p>
            </div>
            {invoice.paid_at ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Ngày thanh toán</p>
                <p className="text-sm font-medium text-emerald-600">{formatDate(invoice.paid_at)}</p>
              </div>
            ) : null}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Ghi chú</p>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </div>
          )}

          {/* CTA Button */}
          {invoice.status !== 'paid' && (
            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm"
              onClick={() => onPay?.(invoice)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Gửi minh chứng thanh toán
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Receipt className="h-16 w-16 mb-4 opacity-30" />
      <h3 className="text-lg font-medium mb-2">Chưa có hóa đơn nào</h3>
      <p className="text-sm">Hóa đơn học phí sẽ hiển thị tại đây</p>
    </div>
  );
}

export function StudentTuition() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const { invoices, summary, loading, error, refresh } = useStudentInvoices(statusFilter);

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePayInvoice = (invoice) => {
    if (!invoice?.id) return;
    navigate(`/student/payment?invoice_id=${invoice.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-6 bg-destructive/10 rounded-xl max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-destructive mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-destructive/80 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const filteredInvoices = invoices || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Học phí</h1>
          <p className="text-muted-foreground">Theo dõi hóa đơn và trạng thái xác minh thanh toán</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
              <SelectItem value="paid">Đã thanh toán</SelectItem>
              <SelectItem value="partial">Thanh toán một phần</SelectItem>
              <SelectItem value="overdue">Quá hạn</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Receipt}
          label="Tổng hóa đơn"
          value={summary.totalInvoices || 0}
        />
        <StatCard
          icon={CheckCircle}
          label="Đã thanh toán"
          value={formatCurrency(summary.paidAmount)}
          color="green"
        />
        <StatCard
          icon={Banknote}
          label="Chưa thanh toán"
          value={formatCurrency(summary.unpaidAmount)}
          color="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Quá hạn"
          value={summary.overdueCount || 0}
          color="red"
        />
      </div>

      {/* Invoice List */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Danh sách hóa đơn
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length > 0 ? (
            <div className="space-y-2">
              {filteredInvoices.map((invoice) => (
                <InvoiceItem
                  key={invoice.id}
                  invoice={invoice}
                  onClick={handleInvoiceClick}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={modalOpen}
        onClose={handleCloseModal}
        onPay={handlePayInvoice}
      />
    </div>
  );
}

export default StudentTuition;
