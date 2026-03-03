/**
 * DeleteRoomModal Component - Modal xác nhận xóa phòng học
 * Thay thế native confirm() dialog
 */

import { useEffect } from 'react';
import { AlertTriangle, X, Trash2, Loader2, AlertCircle, Users, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteRoomModal({ 
  isOpen, 
  room, 
  deleting = false,
  error = null,
  onClose, 
  onConfirm 
}) {
  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deleting, onClose]);

  if (!isOpen || !room) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-room-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!deleting ? onClose : undefined}
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
                <h2 id="delete-room-modal-title" className="text-lg font-semibold text-white">Xác nhận xóa phòng học</h2>
                <p className="text-sm text-white/80">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={deleting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
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
          <div className="mb-4">
            <p className="text-zinc-700 text-center">
              Bạn có chắc chắn muốn xóa phòng học này không?
            </p>
          </div>

          {/* Room info card */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-red-100 to-red-200 flex items-center justify-center ring-2 ring-red-200">
                <DoorOpen className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{room.name}</p>
                <p className="text-sm text-zinc-500">
                  {room.code && (
                    <span className="font-mono bg-white/80 px-1.5 py-0.5 rounded text-xs mr-2">
                      {room.code}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {room.capacity} chỗ
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
                <strong>Lưu ý:</strong> Không thể xóa phòng nếu có lớp học đang sử dụng.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={deleting}
              className="min-w-[100px]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa phòng
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteRoomModal;
