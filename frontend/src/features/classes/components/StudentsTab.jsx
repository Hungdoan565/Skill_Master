/**
 * StudentsTab Component
 * Displays the students list with filters, pagination and actions
 */

import {
  Search,
  X,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Trash2,
  Banknote,
  CreditCard,
  CheckSquare,
  Square,
  MinusSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from './Avatar';
import { getPaymentStatus } from '../utils';
import { HighlightedText } from '../utils/highlightUtils.jsx';
import { StudentsTableSkeleton } from './Skeleton';

export function StudentsTab({
  students,
  pagination,
  summary,
  loading,
  filters,
  searchInputValue,
  onSearchChange,
  onPageChange,
  onLimitChange,
  onPaymentFilterChange,
  onClearFilters,
  onAddClick,
  onPaymentClick,
  onDeleteClick,
  // Bulk selection props
  selectedStudentIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  onBulkDelete
}) {
  const hasSelection = selectedStudentIds.length > 0;
  const allSelected = students.length > 0 && students.every(s => selectedStudentIds.includes(s.student_id));
  const someSelected = hasSelection && !allSelected;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Danh sách học viên</h3>
        <Button onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-2" /> Thêm học viên
        </Button>
      </div>

      {/* Bulk Action Bar */}
      {hasSelection && (
        <BulkActionBar
          selectedCount={selectedStudentIds.length}
          onClearSelection={onClearSelection}
          onBulkDelete={onBulkDelete}
        />
      )}

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchInputValue}
        onSearchChange={onSearchChange}
        paymentStatus={filters.paymentStatus}
        onPaymentStatusChange={onPaymentFilterChange}
        limit={filters.limit}
        onLimitChange={onLimitChange}
        hasActiveFilters={filters.search || filters.paymentStatus !== 'all'}
        onClearFilters={onClearFilters}
      />

      {/* Active Filters Summary */}
      {(filters.search || filters.paymentStatus !== 'all') && (
        <FilterSummary
          search={filters.search}
          paymentStatus={filters.paymentStatus}
          total={pagination.total}
        />
      )}

      {/* Table */}
      {loading ? (
        <StudentsTableSkeleton rows={filters.limit || 10} />
      ) : students.length === 0 ? (
        <EmptyState
          hasFilters={filters.search || filters.paymentStatus !== 'all'}
          onClearFilters={onClearFilters}
          onAddClick={onAddClick}
        />
      ) : (
        <StudentsTable
          students={students}
          searchTerm={filters.search}
          selectedStudentIds={selectedStudentIds}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={() => onToggleSelectAll(students)}
          onPaymentClick={onPaymentClick}
          onDeleteClick={onDeleteClick}
        />
      )}

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}

      {/* Summary Cards */}
      <SummaryCards summary={summary} />
    </div>
  );
}

// Sub-components
function FilterBar({
  searchValue,
  onSearchChange,
  paymentStatus,
  onPaymentStatusChange,
  limit,
  onLimitChange,
  hasActiveFilters,
  onClearFilters
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-muted/50 rounded-xl border border-border">
      {/* Search */}
      <div className="relative w-full lg:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm tên, email, SĐT..."
          className="pl-10 bg-background border-border focus:border-indigo-400"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Payment Status Filter */}
        <div className="relative">
          <select
            value={paymentStatus}
            onChange={(e) => onPaymentStatusChange(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none cursor-pointer transition-all hover:border-muted-foreground/30"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">● Đã đóng đủ</option>
            <option value="unpaid">● Còn nợ</option>
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-border" />

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Hiển thị</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(e.target.value)}
            className="h-9 px-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer transition-all hover:border-muted-foreground/30"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <>
            <div className="hidden sm:block h-6 w-px bg-border" />
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa lọc</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FilterSummary({ search, paymentStatus, total }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Bộ lọc:</span>
      {search && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
          <Search className="w-3 h-3" />
          "{search}"
        </span>
      )}
      {paymentStatus === 'paid' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Đã đóng đủ
        </span>
      )}
      {paymentStatus === 'unpaid' && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Còn nợ
        </span>
      )}
      <span className="text-border">|</span>
      <span className="text-foreground font-medium">{total} kết quả</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

function EmptyState({ hasFilters, onClearFilters, onAddClick }) {
  return (
    <div className="text-center py-12 bg-muted/50 rounded-xl">
      <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
      {hasFilters ? (
        <>
          <p className="text-foreground font-medium">Không tìm thấy học viên</p>
          <p className="text-sm text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          <Button variant="outline" className="mt-4" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-2" /> Xóa bộ lọc
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">Chưa có học viên nào trong lớp</p>
          <Button className="mt-4" onClick={onAddClick}>
            <Plus className="w-4 h-4 mr-2" /> Thêm học viên đầu tiên
          </Button>
        </>
      )}
    </div>
  );
}

function BulkActionBar({ selectedCount, onClearSelection, onBulkDelete }) {
  return (
    <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium text-indigo-900 dark:text-indigo-200">
            Đã chọn {selectedCount} học viên
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          Bỏ chọn tất cả
        </button>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onBulkDelete}
        className="bg-red-600 hover:bg-red-700"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Xóa {selectedCount} học viên
      </Button>
    </div>
  );
}

function StudentsTable({
  students,
  searchTerm,
  selectedStudentIds,
  allSelected,
  someSelected,
  onToggleSelect,
  onToggleSelectAll,
  onPaymentClick,
  onDeleteClick
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            <th className="w-12 py-3 px-4">
              <button
                onClick={onToggleSelectAll}
                className="flex items-center justify-center text-muted-foreground hover:text-indigo-600 transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                ) : someSelected ? (
                  <MinusSquare className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Học viên</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên hệ</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày vào lớp</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Học phí</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {students.map((student) => (
            <StudentRow
              key={student.enrollment_id}
              student={student}
              searchTerm={searchTerm}
              isSelected={selectedStudentIds.includes(student.student_id)}
              onToggleSelect={() => onToggleSelect(student.student_id)}
              onPaymentClick={onPaymentClick}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentRow({ student, searchTerm, isSelected, onToggleSelect, onPaymentClick, onDeleteClick }) {
  const paymentStatus = getPaymentStatus(student);

  return (
    <tr className={`hover:bg-muted/50 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
      <td className="py-3 px-4">
        <button
          onClick={onToggleSelect}
          className="flex items-center justify-center text-muted-foreground hover:text-indigo-600 transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={student.full_name} url={student.avatar_url} />
          <div>
            <p className="font-medium text-foreground">
              <HighlightedText text={student.full_name} searchTerm={searchTerm} />
            </p>
            <p className="text-xs text-muted-foreground">
              <HighlightedText text={student.email} searchTerm={searchTerm} />
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-muted-foreground">
          <HighlightedText text={student.phone || '-'} searchTerm={searchTerm} />
        </p>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-slate-600">
          {new Date(student.enrolled_at).toLocaleDateString('vi-VN')}
        </p>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm">
          <p className="text-foreground font-medium">
            {(student.amount_due || 0).toLocaleString()}đ
          </p>
          <p className="text-xs text-muted-foreground">
            Đã đóng: {(student.paid_amount || 0).toLocaleString()}đ
          </p>
        </div>
      </td>
      <td className="py-3 px-4">
        {student.remaining > 0 ? (
          <button
            onClick={() => onPaymentClick(student)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:ring-2 hover:ring-offset-1 ${paymentStatus.color} hover:ring-current`}
            title="Click để thu tiền"
          >
            <CreditCard className="w-3 h-3" />
            {paymentStatus.label}
          </button>
        ) : (
          <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {student.remaining > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPaymentClick(student)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              title="Thu học phí"
            >
              <Banknote className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteClick(student)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({ pagination, onPageChange }) {
  const { page, limit, total, totalPages, hasPrevPage, hasNextPage } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Đang xem <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span>
        {' '}-{' '}
        <span className="font-medium text-foreground">
          {Math.min(page * limit, total)}
        </span>
        {' '}trên tổng số{' '}
        <span className="font-medium text-foreground">{total}</span> học viên
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={!hasPrevPage} className="px-2">
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!hasPrevPage} className="px-2">
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          <PageNumbers current={page} total={totalPages} onPageChange={onPageChange} />
        </div>

        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!hasNextPage} className="px-2">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={!hasNextPage} className="px-2">
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PageNumbers({ current, total, onPageChange }) {
  const pages = [];

  if (current > 3) {
    pages.push(
      <button key={1} onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">1</button>
    );
    if (current > 4) {
      pages.push(<span key="dots1" className="px-1 text-muted-foreground">...</span>);
    }
  }

  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${i === current ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
      >
        {i}
      </button>
    );
  }

  if (current < total - 2) {
    if (current < total - 3) {
      pages.push(<span key="dots2" className="px-1 text-muted-foreground">...</span>);
    }
    pages.push(
      <button key={total} onClick={() => onPageChange(total)} className="w-8 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted">{total}</button>
    );
  }

  return pages;
}

function SummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Tổng học viên trong lớp</p>
        <p className="text-2xl font-bold text-foreground">{summary.totalInClass}</p>
      </div>
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-sm text-green-600 dark:text-green-400">Đã đóng đủ</p>
        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.paid}</p>
      </div>
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">Còn nợ</p>
        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.unpaid}</p>
      </div>
    </div>
  );
}
