/**
 * PromoteModal Component
 * Modal chuyển học viên thành nhân viên
 */

import { useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleModal } from './SimpleModal';
import { SimpleSelect } from './SimpleSelect';
import { ColorAvatar } from './ColorAvatar';
import { ROLE_OPTIONS } from '../utils';

export function PromoteModal({ isOpen, onClose, student, onConfirm }) {
  const [selectedRole, setSelectedRole] = useState('TEACHER');
  const [promoting, setPromoting] = useState(false);

  const handleConfirm = async () => {
    setPromoting(true);
    try {
      await onConfirm(student.id, selectedRole);
      const roleLabel = selectedRole === 'TEACHER' ? 'Giáo viên' : 'Quản lý';
      alert(`Đã chuyển ${student.full_name} thành ${roleLabel}`);
      onClose();
    } catch (error) {
      console.error('Error promoting student:', error);
      alert(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
    } finally {
      setPromoting(false);
    }
  };

  if (!student) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển thành Nhân viên"
    >
      <div className="space-y-4">
        {/* Student Info */}
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <ColorAvatar name={student.full_name} size="lg" />
          <div>
            <p className="font-medium">{student.full_name}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Lưu ý:</p>
            <p>Sau khi chuyển, học viên này sẽ trở thành nhân viên và có quyền truy cập hệ thống quản lý.</p>
          </div>
        </div>

        {/* Role Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Chọn vai trò mới</label>
          <SimpleSelect
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Chọn vai trò"
            options={ROLE_OPTIONS}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={promoting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {promoting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Xác nhận
              </>
            )}
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
}

export default PromoteModal;
