/**
 * ClassFilters Component - Thanh tìm kiếm và lọc
 * Enhanced with advanced filters support
 */

import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from './Select';
import { STATUS_CONFIG } from '../utils';

export function ClassFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  smartFilter,
  onSmartFilterChange,
  totalCount,
  activeFilterCount = 0,
  onOpenAdvancedFilters
}) {
  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
    value,
    label
  }));

  const smartFilterOptions = [
    { value: '', label: 'Tất cả lớp' },
    { value: 'nearly-full', label: '🔴 Sắp đầy (>80%)' },
    { value: 'has-unpaid', label: '💰 Có nợ học phí' },
    { value: 'has-conflict', label: '⚠️ Có xung đột lịch' },
    { value: 'low-attendance', label: '📉 Điểm danh thấp (<70%)' },
    { value: 'ending-soon', label: '⏰ Sắp kết thúc (2 tuần)' }
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm theo tên lớp, mã lớp..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter & Count */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onChange={onStatusChange}
          placeholder="Tất cả trạng thái"
          options={statusOptions}
        />

        {/* Smart Filter */}
        <Select
          value={smartFilter || ''}
          onChange={onSmartFilterChange}
          placeholder="Lọc thông minh"
          options={smartFilterOptions}
        />

        {/* Advanced Filters Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAdvancedFilters}
          className="relative hover:border-orange-200 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-all duration-300"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Lọc nâng cao
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-red-500 to-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border border-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Tổng: <strong>{totalCount}</strong> lớp
        </p>
      </div>
    </div>
  );
}

export default ClassFilters;
