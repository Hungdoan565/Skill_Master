/**
 * StaffFilters Component
 * Thanh tìm kiếm và filter cho danh sách nhân viên
 */

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from './SimpleSelect';
import { ROLE_FILTER_OPTIONS } from '../utils';

export function StaffFilters({ 
  searchTerm, 
  onSearchChange, 
  roleFilter, 
  onRoleChange, 
  totalCount 
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm theo tên hoặc email..."
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
            value={roleFilter}
            onChange={onRoleChange}
            placeholder="Tất cả vai trò"
            options={ROLE_FILTER_OPTIONS}
          />
        </div>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Tổng: <strong>{totalCount}</strong> nhân viên
        </p>
      </div>
    </div>
  );
}

export default StaffFilters;
