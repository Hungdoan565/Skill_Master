import { Archive, Download, Trash2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudentBulkActionsBar({
  selectedCount,
  onExport,
  onActivate,
  onDeactivate,
  onDelete,
  busy = false,
}) {
  if (!selectedCount) return null;

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Đã chọn {selectedCount} học viên</p>
        <p className="text-xs text-indigo-700 dark:text-indigo-400">Bạn có thể export, khôi phục, vô hiệu hóa hoặc xóa có điều kiện.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="bg-white dark:bg-gray-800" onClick={onExport} disabled={busy}>
          <Download className="mr-2 h-4 w-4" /> Xuất chọn lọc
        </Button>
        <Button type="button" variant="outline" className="bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={onActivate} disabled={busy}>
          <UserCheck className="mr-2 h-4 w-4" /> Khôi phục
        </Button>
        <Button type="button" variant="outline" className="bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={onDeactivate} disabled={busy}>
          <Archive className="mr-2 h-4 w-4" /> Vô hiệu hóa
        </Button>
        <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={onDelete} disabled={busy}>
          <Trash2 className="mr-2 h-4 w-4" /> Xóa có điều kiện
        </Button>
      </div>
    </div>
  );
}
