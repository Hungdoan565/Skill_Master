/**
 * BulkActionBar Component - Thanh thao tác hàng loạt
 */

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkActionBar({ selectedCount, onClearSelection, onBulkDelete }) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-medium">
          {selectedCount}
        </div>
        <span className="text-sm font-medium text-indigo-900">
          Đã chọn {selectedCount} lớp học
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="text-slate-600"
        >
          Bỏ chọn
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa {selectedCount} lớp
        </Button>
      </div>
    </div>
  );
}

export default BulkActionBar;
