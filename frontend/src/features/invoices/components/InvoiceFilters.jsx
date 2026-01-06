/**
 * InvoiceFilters Component
 * 
 * Pure Component cho thanh lọc hóa đơn.
 * Bao gồm: Search, Status filter, Overdue filter, Date range, Clear button
 * 
 * @param {Object} filters - { search, status, dateStart, dateEnd, overdueOnly }
 * @param {function} onFilterChange - Handler thay đổi filter
 * @param {function} onReset - Handler reset filters
 * @param {boolean} hasActiveFilters - Có filter đang active không
 */

import { Search, Calendar, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_OPTIONS } from '../utils/constants';

export function InvoiceFilters({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters
}) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex flex-wrap items-center gap-3">

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, tên học viên..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="
                w-full h-9 pl-9 pr-3 rounded-lg 
                bg-muted/50 border border-border text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                placeholder:text-muted-foreground
              "
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="
            h-9 px-3 rounded-lg text-sm
            bg-muted/50 border border-border text-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            cursor-pointer
          "
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Overdue Filter */}
        <button
          onClick={() => onFilterChange('overdueOnly', !filters.overdueOnly)}
          className={`
            h-9 px-3 rounded-lg border text-sm font-medium 
            flex items-center gap-1.5 transition-colors
            ${filters.overdueOnly
              ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
              : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
            }
          `}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Quá hạn
        </button>

        {/* Date Range */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => onFilterChange('dateStart', e.target.value)}
            className="
              h-9 px-2 rounded-lg text-sm
              bg-muted/50 border border-border text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            "
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange('dateEnd', e.target.value)}
            className="
              h-9 px-2 rounded-lg text-sm
              bg-muted/50 border border-border text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            "
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>
    </div>
  );
}

export default InvoiceFilters;
