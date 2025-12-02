/**
 * InvoiceFilters Component
 * 
 * Pure Component cho thanh lọc hóa đơn.
 * Bao gồm: Search, Status filter, Date range, Clear button
 * 
 * @param {Object} filters - { search, status, dateStart, dateEnd }
 * @param {function} onFilterChange - Handler thay đổi filter
 * @param {function} onReset - Handler reset filters
 * @param {boolean} hasActiveFilters - Có filter đang active không
 */

import { Search, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_OPTIONS } from '../utils/constants';

export function InvoiceFilters({ 
  filters, 
  onFilterChange, 
  onReset, 
  hasActiveFilters 
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200/60 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        
        {/* Search Input */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, tên học viên, SĐT..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="
                w-full h-10 pl-10 pr-4 rounded-lg 
                border border-zinc-200 text-sm 
                focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                placeholder:text-zinc-400
              "
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="
            h-10 px-3 rounded-lg 
            border border-zinc-200 text-sm text-zinc-700 
            focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
            bg-white cursor-pointer
          "
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => onFilterChange('dateStart', e.target.value)}
            className="
              h-10 px-3 rounded-lg 
              border border-zinc-200 text-sm 
              focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
            "
          />
          <span className="text-zinc-400">—</span>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange('dateEnd', e.target.value)}
            className="
              h-10 px-3 rounded-lg 
              border border-zinc-200 text-sm 
              focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
            "
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-zinc-500 hover:text-zinc-700"
          >
            <X className="w-4 h-4 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>
    </div>
  );
}

export default InvoiceFilters;
