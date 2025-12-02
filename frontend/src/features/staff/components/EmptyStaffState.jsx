/**
 * EmptyStaffState Component
 * Hiển thị khi không có nhân viên
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyStaffState({ hasFilters, onAddClick }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2">
      <p className="text-muted-foreground">
        {hasFilters
          ? 'Không tìm thấy nhân viên phù hợp'
          : 'Chưa có nhân viên nào'}
      </p>
      {!hasFilters && (
        <Button variant="outline" size="sm" onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhân viên đầu tiên
        </Button>
      )}
    </div>
  );
}

export default EmptyStaffState;
