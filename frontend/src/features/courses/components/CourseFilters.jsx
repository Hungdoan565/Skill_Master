/**
 * CourseFilters Component - Thanh tìm kiếm và lọc
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function CourseFilters({ searchTerm, onSearchChange, totalCount }) {
  return (
    <div className="flex items-center justify-between">
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
      <p className="text-sm text-muted-foreground">
        Tổng: <strong>{totalCount}</strong> khóa học
      </p>
    </div>
  );
}

export default CourseFilters;
