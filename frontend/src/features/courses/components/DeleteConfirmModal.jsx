/**
 * DeleteConfirmModal Component - Modal xác nhận xóa khóa học
 * 
 * Design chuyên nghiệp với:
 * - Animation smooth
 * - Danger styling rõ ràng
 * - Hiển thị thông tin khóa học sắp xóa
 * - Hiển thị lỗi nếu không xóa được
 */

import { useEffect } from 'react';
import { AlertTriangle, X, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  course,
  loading = false,
  error = null
}) {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, loading]);

  if (!isOpen || !course) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-course-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with danger styling */}
        <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 id="delete-course-modal-title" className="text-lg font-semibold text-white">Xác nhận xóa</h2>
                <p className="text-sm text-white/80">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Đóng modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Warning message */}
          <div className="mb-6">
            <p className="text-zinc-700 text-center">
              Bạn có chắc chắn muốn xóa khóa học này không?
            </p>
          </div>

          {/* Course info card */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Course icon/image */}
              {course.cover_image ? (
                <img 
                  src={course.cover_image} 
                  alt={course.title}
                  className="w-12 h-12 rounded-lg object-cover ring-2 ring-red-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-red-100 to-red-200 flex items-center justify-center ring-2 ring-red-200">
                  <span className="text-xl font-bold text-red-500">
                    {course.title?.charAt(0) || 'K'}
                  </span>
                </div>
              )}
              
              {/* Course details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{course.title}</p>
                <p className="text-sm text-zinc-500">
                  <span className="font-mono bg-white/80 px-1.5 py-0.5 rounded text-xs">
                    {course.code}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Warning note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Lưu ý:</strong> Không thể xóa khóa học nếu đang có lớp học sử dụng. 
                Hãy chuyển hoặc xóa các lớp trước.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[100px]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa khóa học
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
