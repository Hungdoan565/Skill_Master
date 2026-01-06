/**
 * BulkActionBar Component - Thanh thao tác hàng loạt
 * Enhanced with Bulk Status Change feature
 */

import { useState } from 'react';
import { Trash2, Mail, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Sắp khai giảng', icon: '📅' },
  { value: 'ongoing', label: 'Đang diễn ra', icon: '🟢' },
  { value: 'completed', label: 'Đã hoàn thành', icon: '✅' },
  { value: 'cancelled', label: 'Đã hủy', icon: '❌' },
];

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onBulkNotify,
  onBulkStatusChange,
  bulkStatusLoading = false
}) {
  const [selectedStatus, setSelectedStatus] = useState('');

  if (selectedCount === 0) return null;

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    if (onBulkStatusChange && newStatus) {
      onBulkStatusChange(newStatus);
      setSelectedStatus(''); // Reset after action
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white text-sm font-medium">
          {selectedCount}
        </div>
        <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
          Đã chọn {selectedCount} lớp học
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Bulk Status Change */}
        {onBulkStatusChange && (
          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onValueChange={handleStatusChange}
              disabled={bulkStatusLoading}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Đổi trạng thái..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bulkStatusLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-orange-600" />
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="text-slate-600 dark:text-slate-400"
        >
          Bỏ chọn
        </Button>
        {onBulkNotify && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkNotify}
            className="text-orange-600 dark:text-orange-400"
          >
            <Mail className="mr-2 h-4 w-4" />
            Gửi thông báo
          </Button>
        )}
        {onBulkExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkExport}
            className="text-orange-600 dark:text-orange-400"
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        )}
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
