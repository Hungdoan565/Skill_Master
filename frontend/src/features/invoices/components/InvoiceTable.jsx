/**
 * InvoiceTable Component - REDESIGNED
 * 
 * High-Density Data Table for Admin Dashboard
 * 
 * Features:
 * - Sticky header for long lists
 * - Monospace typography for IDs and amounts (tabular-nums)
 * - Compact row height
 * - Click-to-copy invoice code with toast feedback
 * - Dark mode compatible
 * - Right-aligned numeric columns with matching headers
 */

import { useState, useRef, useEffect } from 'react';
import {
  FileText, Eye, CreditCard, ChevronLeft, ChevronRight,
  Loader2, Receipt, MoreVertical, Edit3, XCircle, RefreshCcw,
  AlertTriangle, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/formatters';
import { cn } from '@/lib/utils';

export function InvoiceTable({
  invoices,
  loading,
  pagination,
  onPageChange,
  onViewDetail,
  onPayment,
  onEdit,
  onCancel,
  onRefund,
  selectedIds = [],
  onToggleSelect,
  onSelectAll
}) {

  // Check if all unpaid invoices are selected
  const unpaidInvoices = invoices?.filter(inv => !['paid', 'cancelled', 'refunded'].includes(inv.status)) || [];
  const allSelected = unpaidInvoices.length > 0 && unpaidInvoices.every(inv => selectedIds.includes(inv.id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-white dark:bg-zinc-900">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-white dark:bg-zinc-900">
        <Receipt className="w-10 h-10 mb-2 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Không có hóa đơn nào</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Thử thay đổi bộ lọc để xem thêm
        </p>
      </div>
    );
  }

  // ============================================
  // TABLE RENDER
  // ============================================
  return (
    <div className="flex flex-col">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
        <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-800">
            <tr className="border-b border-border">
              {/* Checkbox column */}
              {onToggleSelect && (
                <th className="px-3 py-2.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    title="Chọn tất cả hóa đơn chưa thanh toán"
                  />
                </th>
              )}
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Mã hóa đơn
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Học viên
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Lớp học
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Tổng tiền
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Đã thanh toán
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Còn nợ
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap w-[100px]">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}
                onViewDetail={onViewDetail}
                onPayment={onPayment}
                onEdit={onEdit}
                onCancel={onCancel}
                onRefund={onRefund}
                isSelected={selectedIds.includes(invoice.id)}
                onToggleSelect={onToggleSelect}
                showCheckbox={!!onToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <TablePagination
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </div>
  );
}

// ============================================
// TABLE ROW - Compact, Dark Mode Compatible
// ============================================
function InvoiceTableRow({ invoice, onViewDetail, onPayment, onEdit, onCancel, onRefund, isSelected, onToggleSelect, showCheckbox }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
  const canPay = invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded';
  const canEdit = invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'refunded';
  const canCancel = invoice.status !== 'cancelled' && invoice.status !== 'refunded';
  const canRefund = invoice.status !== 'cancelled' && invoice.status !== 'refunded' && invoice.paid_amount > 0;
  const canSelect = canPay; // Only unpaid invoices can be selected for bulk payment

  // Check if overdue
  const isOverdue = invoice.due_date &&
    new Date(invoice.due_date) < new Date() &&
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    invoice.status !== 'refunded';

  // Copy invoice code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(invoice.invoice_code);
      setCopied(true);
      toast({
        title: "Đã copy!",
        description: invoice.invoice_code,
        variant: "success",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể copy mã hóa đơn",
        variant: "destructive",
      });
    }
  };

  return (
    <tr className={cn(
      'hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors',
      isOverdue && 'bg-red-50/50 dark:bg-red-950/20',
      isSelected && 'bg-primary/5 dark:bg-primary/10'
    )}>
      {/* Checkbox column */}
      {showCheckbox && (
        <td className="px-3 py-2 text-center">
          {canSelect ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(invoice.id)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}
        </td>
      )}
      {/* Invoice Code - Monospace, No Wrap, Click to Copy */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyCode}
            className={cn(
              'group flex items-center gap-1.5 px-1.5 py-0.5 -ml-1.5 rounded transition-colors',
              'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            title="Click để copy mã hóa đơn"
          >
            <span className="font-mono text-sm font-semibold text-foreground whitespace-nowrap tabular-nums">
              {invoice.invoice_code}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          {isOverdue && (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded">
              <AlertTriangle className="w-2.5 h-2.5" />
              Quá hạn
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono tabular-nums">
          {formatDate(invoice.created_at)}
          {invoice.due_date && (
            <span className={cn('ml-1.5', isOverdue && 'text-red-500')}>
              • Hạn: {formatDate(invoice.due_date)}
            </span>
          )}
        </p>
      </td>

      {/* Student - Compact Avatar + Name + Contact */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <StudentAvatar name={invoice.student?.full_name} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
              {invoice.student?.full_name || 'N/A'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[120px]">
              {invoice.student?.phone || invoice.student?.email || '—'}
            </p>
          </div>
        </div>
      </td>

      {/* Class */}
      <td className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate max-w-[140px]">
          {invoice.class?.name || 'N/A'}
        </p>
        <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
          {invoice.class?.course?.title || '—'}
        </p>
      </td>

      {/* Total Amount - Right aligned, Monospace */}
      <td className="px-3 py-2 text-right">
        <span className="text-sm font-semibold font-mono tabular-nums text-foreground">
          {(invoice.final_amount || 0).toLocaleString('vi-VN')}đ
        </span>
      </td>

      {/* Paid Amount - Right aligned, Monospace */}
      <td className="px-3 py-2 text-right">
        <span className="text-sm font-medium font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
          {(invoice.paid_amount || 0).toLocaleString('vi-VN')}đ
        </span>
      </td>

      {/* Remaining - Right aligned, Monospace */}
      <td className="px-3 py-2 text-right">
        <span className={cn(
          'text-sm font-semibold font-mono tabular-nums',
          remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
        )}>
          {remaining > 0 ? `${remaining.toLocaleString('vi-VN')}đ` : '—'}
        </span>
      </td>

      {/* Status - Compact Dot Badge */}
      <td className="px-3 py-2 text-center">
        <StatusBadge status={invoice.status} />
      </td>

      {/* Actions - Compact */}
      <td className="px-3 py-2">
        <div className="flex items-center justify-center gap-0.5">
          <button
            onClick={() => onViewDetail(invoice)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>

          {canPay && (
            <button
              onClick={() => onPayment(invoice)}
              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded transition-colors"
              title="Thu tiền"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}

          <ActionsDropdown
            invoice={invoice}
            canEdit={canEdit}
            canCancel={canCancel}
            canRefund={canRefund}
            onEdit={onEdit}
            onCancel={onCancel}
            onRefund={onRefund}
          />
        </div>
      </td>
    </tr>
  );
}

// ============================================
// STUDENT AVATAR - Compact
// ============================================
function StudentAvatar({ name }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
      {initial}
    </div>
  );
}

// ============================================
// ACTIONS DROPDOWN
// ============================================
function ActionsDropdown({ invoice, canEdit, canCancel, canRefund, onEdit, onCancel, onRefund }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAnyAction = canEdit || canCancel || canRefund;
  if (!hasAnyAction) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
        title="Thêm thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50">
          {canEdit && (
            <button
              onClick={() => {
                onEdit(invoice);
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              Sửa
            </button>
          )}

          {canRefund && (
            <button
              onClick={() => {
                onRefund(invoice);
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-muted flex items-center gap-2"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-purple-500" />
              Hoàn tiền
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => {
                onCancel(invoice);
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
            >
              <XCircle className="w-3.5 h-3.5" />
              Hủy
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// PAGINATION - Compact
// ============================================
function TablePagination({ pagination, onPageChange }) {
  const { page, limit, total, totalPages } = pagination;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="px-3 py-2.5 border-t border-border flex items-center justify-between bg-muted/30">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{startItem}</span>
        –<span className="font-medium text-foreground">{endItem}</span>
        {' '}/ {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <PageNumbers
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// PAGE NUMBERS
// ============================================
function PageNumbers({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return <span className="text-xs text-muted-foreground px-1">1/1</span>;
  }

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-0.5">
      {getVisiblePages().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={cn(
            'w-7 h-7 rounded text-xs font-medium transition-colors',
            pageNum === currentPage
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {pageNum}
        </button>
      ))}
    </div>
  );
}

export default InvoiceTable;
