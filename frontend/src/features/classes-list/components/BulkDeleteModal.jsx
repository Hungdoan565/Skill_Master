/**
 * BulkDeleteModal Component - Modal xác nhận xóa hàng loạt
 */

import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BulkDeleteModal({ 
  isOpen, 
  selectedIds, 
  classes, 
  deleting, 
  onClose, 
  onConfirm 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !deleting && onClose()} 
      />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">
              Xác nhận xóa hàng loạt
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Bạn có chắc chắn muốn xóa{' '}
              <strong className="text-red-600">{selectedIds.length} lớp học</strong>{' '}
              đã chọn? Hành động này không thể hoàn tác.
            </p>
            
            {/* Preview danh sách sẽ xóa */}
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Danh sách lớp sẽ bị xóa:
              </p>
              <div className="space-y-1">
                {selectedIds.slice(0, 5).map(id => {
                  const cls = classes.find(c => c.id === id);
                  return cls ? (
                    <p key={id} className="text-xs text-slate-700">
                      • {cls.name} ({cls.code})
                    </p>
                  ) : null;
                })}
                {selectedIds.length > 5 && (
                  <p className="text-xs text-slate-400 italic">
                    ... và {selectedIds.length - 5} lớp khác
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa {selectedIds.length} lớp
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BulkDeleteModal;
