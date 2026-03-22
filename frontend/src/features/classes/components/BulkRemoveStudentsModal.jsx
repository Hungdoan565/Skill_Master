/**
 * BulkRemoveStudentsModal Component
 * Modal xác nhận xóa nhiều học viên khỏi lớp
 */

import { AlertTriangle, Trash2, Loader2, AlertCircle, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkRemoveStudentsModal({
  show,
  students,
  deleting,
  error,
  onConfirm,
  onCancel
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !deleting && onCancel()} 
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden dark:border dark:border-slate-800">
        {/* Header */}
        <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Xóa học viên hàng loạt
                </h3>
                <p className="text-sm text-red-100">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={deleting}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-300">
            Bạn có chắc chắn muốn xóa{' '}
            <strong className="text-red-600 dark:text-red-400">{students.length} học viên</strong>{' '}
            đã chọn khỏi lớp?
          </p>

          {/* Preview danh sách */}
          <div className="mt-4 max-h-48 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Danh sách học viên sẽ bị xóa:
            </p>
            <div className="space-y-2">
              {students.slice(0, 8).map((student) => (
                <div key={student.student_id} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0"></span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{student.full_name}</span>
                  <span className="text-slate-400 dark:text-slate-500">({student.email})</span>
                </div>
              ))}
              {students.length > 8 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-1">
                  ... và {students.length - 8} học viên khác
                </p>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-medium">Lưu ý:</span> Hóa đơn và lịch sử điểm danh của các học viên này sẽ bị xóa theo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={deleting}
          >
            Hủy bỏ
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => onConfirm(students)}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa {students.length} học viên
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BulkRemoveStudentsModal;
