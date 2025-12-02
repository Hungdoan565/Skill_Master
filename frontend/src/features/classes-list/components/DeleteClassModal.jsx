/**
 * DeleteClassModal Component - Modal xác nhận xóa lớp
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleModal } from './SimpleModal';

export function DeleteClassModal({ isOpen, classItem, deleting, onClose, onConfirm }) {
  if (!classItem) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa lớp học"
      size="sm"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Bạn có chắc muốn xóa lớp này?</p>
            <p className="text-sm text-red-700 mt-1">
              Lớp <strong>{classItem.name}</strong> ({classItem.code}) sẽ bị xóa vĩnh viễn.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa lớp'}
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

export default DeleteClassModal;
