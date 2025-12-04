/**
 * CourseFilters Component - Thanh tìm kiếm và lọc
 */

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Status options for dropdown
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang tuyển sinh' },
  { value: 'inactive', label: 'Tạm ngưng' },
  { value: 'draft', label: 'Nháp' },
];

export function CourseFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter = '',
  onStatusChange,
  totalCount 
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm theo tên hoặc mã khóa học..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Hiển thị: <strong>{totalCount}</strong> khóa học
      </p>
    </div>
  );
}

export default CourseFilters;
