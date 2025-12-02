/**
 * InvoiceTable Component
 * 
 * Pure/Dumb Component - Chỉ nhận props và render.
 * KHÔNG được phép:
 * - Gọi API
 * - Quản lý state phức tạp
 * - Chứa business logic
 * 
 * @param {Array} invoices - Danh sách hóa đơn
 * @param {boolean} loading - Trạng thái loading
 * @param {Object} pagination - { page, limit, total, totalPages }
 * @param {function} onPageChange - Handler thay đổi trang
 * @param {function} onViewDetail - Handler xem chi tiết
 * @param {function} onPayment - Handler thanh toán
 */

import { 
  FileText, Eye, CreditCard, ChevronLeft, ChevronRight, 
  Loader2, Receipt 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/formatters';

export function InvoiceTable({ 
  invoices, 
  loading, 
  pagination, 
  onPageChange, 
  onViewDetail, 
  onPayment 
}) {
  
  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
          <Receipt className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Không có hóa đơn nào</p>
          <p className="text-sm text-zinc-400 mt-1">
            Thử thay đổi bộ lọc để xem thêm
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // TABLE RENDER
  // ============================================
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 overflow-hidden">
      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Mã hóa đơn
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Học viên
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Lớp học
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Đã thanh toán
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Còn nợ
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((invoice) => (
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}
                onViewDetail={onViewDetail}
                onPayment={onPayment}
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
// SUB-COMPONENTS (Private to this file)
// ============================================

/**
 * Table Row Component
 * Tách riêng để dễ maintain và tối ưu re-render
 */
function InvoiceTableRow({ invoice, onViewDetail, onPayment }) {
  const remaining = (invoice.final_amount || 0) - (invoice.paid_amount || 0);
  const canPay = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <tr className="hover:bg-zinc-50/50 transition-colors">
      {/* Mã hóa đơn */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span className="font-mono text-sm font-medium text-zinc-900">
            {invoice.invoice_code}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-0.5 ml-6">
          {formatDate(invoice.created_at)}
        </p>
      </td>

      {/* Học viên */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <StudentAvatar name={invoice.student?.full_name} />
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {invoice.student?.full_name || 'N/A'}
            </p>
            <p className="text-xs text-zinc-500">
              {invoice.student?.phone || invoice.student?.email || ''}
            </p>
          </div>
        </div>
      </td>

      {/* Lớp học */}
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">
          {invoice.class?.name || 'N/A'}
        </p>
        <p className="text-xs text-zinc-500">
          {invoice.class?.course?.title || ''}
        </p>
      </td>

      {/* Tổng tiền */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold text-zinc-900">
          {(invoice.final_amount || 0).toLocaleString()}đ
        </span>
      </td>

      {/* Đã thanh toán */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-medium text-emerald-600">
          {(invoice.paid_amount || 0).toLocaleString()}đ
        </span>
      </td>

      {/* Còn nợ */}
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold ${remaining > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
          {remaining > 0 ? `${remaining.toLocaleString()}đ` : '—'}
        </span>
      </td>

      {/* Trạng thái */}
      <td className="px-4 py-3 text-center">
        <StatusBadge status={invoice.status} />
      </td>

      {/* Thao tác */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onViewDetail(invoice)}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {canPay && (
            <button
              onClick={() => onPayment(invoice)}
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Thu tiền"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Student Avatar Component
 */
function StudentAvatar({ name }) {
  const initial = name?.charAt(0) || '?';
  
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
      {initial}
    </div>
  );
}

/**
 * Table Pagination Component
 */
function TablePagination({ pagination, onPageChange }) {
  const { page, limit, total, totalPages } = pagination;
  
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between">
      {/* Info */}
      <p className="text-sm text-zinc-600">
        Hiển thị{' '}
        <span className="font-medium">{startItem}</span> -{' '}
        <span className="font-medium">{endItem}</span> /{' '}
        <span className="font-medium">{total}</span> hóa đơn
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page Numbers */}
        <PageNumbers 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={onPageChange} 
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Page Numbers Component
 */
function PageNumbers({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return <span className="text-sm text-zinc-500 px-2">Trang 1</span>;
  }

  // Calculate visible page numbers
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
    <div className="flex items-center gap-1">
      {getVisiblePages().map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => onPageChange(pageNum)}
          className={`
            w-8 h-8 rounded-lg text-sm font-medium transition-colors
            ${pageNum === currentPage
              ? 'bg-red-500 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
            }
          `}
        >
          {pageNum}
        </button>
      ))}
    </div>
  );
}

export default InvoiceTable;
