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
  Banknote
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
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  partial: { label: 'Thanh toán một phần', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
};

function StatCard({ icon: Icon, label, value, color = 'default' }) {
  const colorStyles = {
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
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
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge variant="secondary" className={cn('font-medium', config.color)}>
      {config.label}
    </Badge>
  );
}

function InvoiceItem({ invoice, onClick }) {
  const statusIcon = {
    paid: CheckCircle,
    pending: Clock,
    overdue: AlertTriangle,
    partial: CreditCard
  };
  const Icon = statusIcon[invoice.status] || Clock;

  return (
    <div
      onClick={() => onClick(invoice)}
      className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          'p-2 rounded-lg',
          invoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
          invoice.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' :
          'bg-amber-100 dark:bg-amber-900/30'
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết hóa đơn
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mã hóa đơn</span>
            <span className="font-medium">{invoice.invoice_code || `HD-${invoice.id}`}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Mô tả</span>
            <span className="font-medium text-right max-w-[200px] truncate">
              {invoice.description || invoice.class_name || 'Học phí'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Số tiền</span>
            <span className="font-semibold text-lg">{formatCurrency(invoice.final_amount || invoice.amount)}</span>
          </div>
          {invoice.paid_amount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Đã thanh toán</span>
              <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</span>
            </div>
          )}
          {invoice.status !== 'paid' && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Còn lại</span>
              <span className="font-medium text-red-600">
                {formatCurrency((invoice.final_amount || invoice.amount) - (invoice.paid_amount || 0))}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Hạn thanh toán</span>
            <span className="font-medium">{formatDate(invoice.due_date)}</span>
          </div>
          {invoice.paid_at && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ngày thanh toán</span>
              <span className="font-medium text-green-600">{formatDate(invoice.paid_at)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Trạng thái</span>
            <StatusBadge status={invoice.status} />
          </div>
          {invoice.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">Ghi chú</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}
          {invoice.status !== 'paid' && (
            <div className="pt-3 border-t">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onPay?.(invoice)}
              >
                Thanh toan ngay
              </Button>
            </div>
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
          <p className="text-muted-foreground">Quản lý hóa đơn và thanh toán</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ thanh toán</SelectItem>
              <SelectItem value="paid">Đã thanh toán</SelectItem>
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
      <Card>
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
