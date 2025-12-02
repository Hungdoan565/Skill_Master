/**
 * ClassFilters Component - Thanh tìm kiếm và lọc
 */

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from './Select';
import { STATUS_CONFIG } from '../utils';

export function ClassFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange, 
  totalCount 
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
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Tổng: <strong>{totalCount}</strong> lớp
        </p>
      </div>
    </div>
  );
}

export default ClassFilters;
