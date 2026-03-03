/**
 * DeleteConfirmModal Component
 * Confirmation modal for removing a student from class
 */

import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from './Avatar';

export function DeleteConfirmModal({
  show,
  student,
  deleting,
  onConfirm,
  onCancel
}) {
  if (!show || !student) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !deleting && onCancel()}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 text-center">
            Xác nhận xóa học viên
          </h3>
          <p className="text-sm text-slate-500 text-center mt-2">
            Bạn có chắc muốn xóa học viên <strong className="text-slate-700">"{student.full_name}"</strong> khỏi lớp?
          </p>
        </div>

        {/* Student info preview */}
        <div className="mx-6 my-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3">
          <Avatar name={student.full_name} url={student.avatar_url} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{student.email}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            ⚠️ Lưu ý: Hành động này sẽ xóa học viên khỏi lớp và các dữ liệu liên quan (điểm danh, điểm số). Hóa đơn học phí vẫn được giữ lại.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={deleting}
          >
            Hủy bỏ
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa học viên
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
