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
  totalCount,
  activeFilterCount = 0,
  onOpenAdvancedFilters
}) {
  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
    value,
    label
  }));

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
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={statusFilter}
          onChange={onStatusChange}
          placeholder="Tất cả trạng thái"
          options={statusOptions}
        />

        {/* Advanced Filters Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAdvancedFilters}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Lọc nâng cao
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
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
