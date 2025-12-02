/**
 * StudentFilters Component
 * Thanh tìm kiếm và filter học viên
 */

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from './SimpleSelect';
import { STATUS_OPTIONS } from '../utils';

export function StudentFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  filteredCount,
  totalCount
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm theo tên, email hoặc SĐT..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <SimpleSelect
            value={statusFilter}
            onChange={onStatusChange}
            placeholder="Tất cả trạng thái"
            options={STATUS_OPTIONS}
          />
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Hiển thị: <strong>{filteredCount}</strong> / {totalCount}
        </p>
      </div>
    </div>
  );
}

export default StudentFilters;
