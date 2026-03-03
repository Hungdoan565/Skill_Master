/**
 * PromoteModal Component
 * Modal chuyển học viên thành nhân viên
 */

import { useState } from 'react';
import { AlertCircle, Check, GraduationCap, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { SimpleModal } from './SimpleModal';

import { ColorAvatar } from './ColorAvatar';
import { ROLE_OPTIONS } from '../utils';

export function PromoteModal({ isOpen, onClose, student, onConfirm }) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState('TEACHER');
  const [promoting, setPromoting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleConfirm = async () => {
    setPromoting(true);
    try {
      await onConfirm(student.id, selectedRole);
      const roleLabel = selectedRole === 'TEACHER' ? 'Giáo viên' : 'Quản lý';
      toast.success(`Đã chuyển ${student.full_name} thành ${roleLabel}`);
      onClose();
    } catch (error) {
      console.error('Error promoting student:', error);
      toast.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="flex items-center gap-2">
                {selectedRole === 'TEACHER' ? (
                  <><GraduationCap className="h-4 w-4 text-emerald-600" /> Giáo viên</>
                ) : (
                  <><Building2 className="h-4 w-4 text-blue-600" /> Quản lý Trung tâm</>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('TEACHER'); setDropdownOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${selectedRole === 'TEACHER' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                >
                  <GraduationCap className="h-4 w-4 text-emerald-600" /> Giáo viên
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedRole('CENTER_MANAGER'); setDropdownOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${selectedRole === 'CENTER_MANAGER' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                >
                  <Building2 className="h-4 w-4 text-blue-600" /> Quản lý Trung tâm
                </button>
              </div>
            )}
          </div>
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
