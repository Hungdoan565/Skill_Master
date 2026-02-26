/**
 * DataTable Component
 * 
 * Unified data table for Admin pages
 * Best Practices 2025:
 * - Sticky header
 * - Row selection
 * - Sorting
 * - Pagination
 * - Loading states
 * - Empty states
 * - Responsive design
 * - Keyboard navigation
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Check,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState, TableEmptyState } from '@/components/ui/empty-state';

// Sort direction icons
function SortIcon({ direction }) {
  if (!direction) {
    return <ChevronsUpDown className="h-4 w-4 text-zinc-300" />;
  }
  return direction === 'asc'
    ? <ChevronUp className="h-4 w-4 text-zinc-600" />
    : <ChevronDown className="h-4 w-4 text-zinc-600" />;
}

// Checkbox component
function Checkbox({ checked, indeterminate, onChange, disabled }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
      disabled={disabled}
      className={cn(
        'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all',
        checked || indeterminate
          ? 'border-red-500 bg-red-500 text-white'
          : 'border-border bg-card hover:border-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {indeterminate ? (
        <Minus className="h-3 w-3" />
      ) : checked ? (
        <Check className="h-3 w-3" />
      ) : null}
    </button>
  );
}

// Table header cell
function TableHeaderCell({
  column,
  sortColumn,
  sortDirection,
  onSort,
  selectable,
  allSelected,
  someSelected,
  onSelectAll,
}) {
  const isSorted = sortColumn === column.key;
  const direction = isSorted ? sortDirection : null;

  return (
    <th
      className={cn(
        'sticky top-0 z-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
        'bg-muted/95 backdrop-blur-sm border-b border-border',
        column.sortable && 'cursor-pointer select-none hover:bg-accent',
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right',
        column.width && `w-[${column.width}]`
      )}
      style={{ width: column.width }}
      onClick={() => column.sortable && onSort?.(column.key)}
    >
      {selectable && column.key === '__select' ? (
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onChange={onSelectAll}
        />
      ) : (
        <div className={cn(
          'flex items-center gap-1',
          column.align === 'center' && 'justify-center',
          column.align === 'right' && 'justify-end'
        )}>
          <span className="text-muted-foreground">{column.label}</span>
          {column.sortable && <SortIcon direction={direction} />}
        </div>
      )}
    </th>
  );
}

// Table body cell
function TableBodyCell({ column, row, selectable, isSelected, onSelect }) {
  const value = column.accessor ? column.accessor(row) : row[column.key];

  return (
    <td
      className={cn(
        'px-4 py-3 text-sm',
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right',
        column.className
      )}
    >
      {selectable && column.key === '__select' ? (
        <Checkbox
          checked={isSelected}
          onChange={() => onSelect?.(row)}
        />
      ) : column.render ? (
        column.render(value, row)
      ) : (
        <span className="text-foreground">{value ?? '-'}</span>
      )}
    </td>
  );
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Hiển thị <span className="font-medium text-foreground">{startItem}</span>
        {' - '}
        <span className="font-medium text-foreground">{endItem}</span>
        {' trên '}
        <span className="font-medium text-foreground">{totalItems}</span> kết quả
      </div>

      {/* Page size selector & Navigation */}
      <div className="flex items-center gap-4">
        {/* Page size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm 
                       focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange?.(1)}
            disabled={currentPage === 1}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === 1
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === 1
                ? 'text-zinc-300 cursor-not-allowed'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                    pageNum === currentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === totalPages
                ? 'text-zinc-300 cursor-not-allowed'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            )}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange?.(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              currentPage === totalPages
                ? 'text-zinc-300 cursor-not-allowed'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            )}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function TableSkeleton({ columns, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {columns.map((column) => (
            <td key={column.key} className="px-4 py-3">
              <div className="h-4 bg-muted rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Main DataTable component
export function DataTable({
  columns,
  data = [],
  loading = false,
  error = null,
  // Selection
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = 'id',
  // Sorting
  sortable = true,
  sortColumn: externalSortColumn,
  sortDirection: externalSortDirection,
  onSort: externalOnSort,
  // Pagination
  pagination = true,
  currentPage: externalCurrentPage,
  pageSize: externalPageSize,
  totalItems: externalTotalItems,
  onPageChange: externalOnPageChange,
  onPageSizeChange: externalOnPageSizeChange,
  pageSizeOptions,
  // Styling
  className,
  rowClassName,
  onRowClick,
  // Empty state
  emptyVariant = 'default',
  emptyTitle,
  emptyDescription,
  emptyAction,
  onEmptyAction,
}) {
  // Internal state for client-side sorting/pagination
  const [internalSortColumn, setInternalSortColumn] = useState(null);
  const [internalSortDirection, setInternalSortDirection] = useState(null);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(10);

  // Use external or internal state
  const sortColumn = externalSortColumn ?? internalSortColumn;
  const sortDirection = externalSortDirection ?? internalSortDirection;
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const pageSize = externalPageSize ?? internalPageSize;

  // Handle sort
  const handleSort = useCallback((column) => {
    if (externalOnSort) {
      externalOnSort(column);
    } else {
      if (sortColumn === column) {
        setInternalSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
        if (sortDirection === 'desc') setInternalSortColumn(null);
      } else {
        setInternalSortColumn(column);
        setInternalSortDirection('asc');
      }
    }
  }, [sortColumn, sortDirection, externalOnSort]);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    if (externalOnPageChange) {
      externalOnPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  }, [externalOnPageChange]);

  const handlePageSizeChange = useCallback((size) => {
    if (externalOnPageSizeChange) {
      externalOnPageSizeChange(size);
    } else {
      setInternalPageSize(size);
      setInternalCurrentPage(1);
    }
  }, [externalOnPageSizeChange]);

  // Process data (sort + paginate for client-side)
  const processedData = useMemo(() => {
    let result = [...data];

    // Client-side sorting
    if (!externalOnSort && sortColumn && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, sortColumn, sortDirection, externalOnSort]);

  // Client-side pagination
  const paginatedData = useMemo(() => {
    if (!pagination || externalOnPageChange) return processedData;

    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize, pagination, externalOnPageChange]);

  // Total items
  const totalItems = externalTotalItems ?? data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Selection helpers
  const selectedSet = useMemo(() => new Set(selectedRows), [selectedRows]);
  const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedSet.has(row[rowKey]));
  const someSelected = paginatedData.some(row => selectedSet.has(row[rowKey]));

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      const newSelection = [...new Set([...selectedRows, ...paginatedData.map(row => row[rowKey])])];
      onSelectionChange?.(newSelection);
    } else {
      const paginatedIds = new Set(paginatedData.map(row => row[rowKey]));
      const newSelection = selectedRows.filter(id => !paginatedIds.has(id));
      onSelectionChange?.(newSelection);
    }
  }, [selectedRows, paginatedData, rowKey, onSelectionChange]);

  const handleSelectRow = useCallback((row) => {
    const id = row[rowKey];
    if (selectedSet.has(id)) {
      onSelectionChange?.(selectedRows.filter(r => r !== id));
    } else {
      onSelectionChange?.([...selectedRows, id]);
    }
  }, [selectedRows, selectedSet, rowKey, onSelectionChange]);

  // Prepare columns with select column
  const finalColumns = useMemo(() => {
    if (!selectable) return columns;
    return [
      { key: '__select', label: '', width: '48px', sortable: false },
      ...columns,
    ];
  }, [columns, selectable]);

  return (
    <div className={cn('rounded-2xl border border-border bg-card overflow-hidden', className)}>
      {/* Table container with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse whitespace-nowrap md:whitespace-normal">
          <thead>
            <tr>
              {finalColumns.map((column) => (
                <TableHeaderCell
                  key={column.key}
                  column={column}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  selectable={selectable}
                  allSelected={allSelected}
                  someSelected={someSelected}
                  onSelectAll={handleSelectAll}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Loading state */}
            {loading && (
              <TableSkeleton columns={finalColumns} rows={pageSize} />
            )}

            {/* Error state */}
            {!loading && error && (
              <TableEmptyState
                colSpan={finalColumns.length}
                variant="error"
                title="Lỗi tải dữ liệu"
                description={error}
                actionLabel="Thử lại"
                onAction={onEmptyAction}
              />
            )}

            {/* Empty state */}
            {!loading && !error && paginatedData.length === 0 && (
              <TableEmptyState
                colSpan={finalColumns.length}
                variant={emptyVariant}
                title={emptyTitle}
                description={emptyDescription}
                actionLabel={emptyAction}
                onAction={onEmptyAction}
              />
            )}

            {/* Data rows */}
            {!loading && !error && paginatedData.map((row, index) => {
              const rowId = row[rowKey];
              const isSelected = selectedSet.has(rowId);

              return (
                <tr
                  key={rowId ?? index}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-accent/50',
                    isSelected && 'bg-primary/5',
                    typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
                  )}
                >
                  {finalColumns.map((column) => (
                    <TableBodyCell
                      key={column.key}
                      column={column}
                      row={row}
                      selectable={selectable}
                      isSelected={isSelected}
                      onSelect={handleSelectRow}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}

export default DataTable;
