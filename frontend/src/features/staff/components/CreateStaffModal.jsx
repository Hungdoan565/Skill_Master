/**
 * CreateStaffModal Component
 * Modal thêm nhân viên mới
 */

import { UserPlus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { SimpleSelect } from './SimpleSelect';
import { ROLE_OPTIONS } from '../utils';

export function CreateStaffModal({
  isOpen,
  onClose,
  formData,
  onFieldChange,
  onSubmit,
  submitting,
  successMessage,
  copiedPassword,
  onCopyPassword,
  onAddAnother,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={successMessage ? '✅ Tạo tài khoản thành công!' : 'Thêm nhân viên mới'}
    >
      {successMessage ? (
        // Success State
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">
              Đã tạo tài khoản cho <strong>{successMessage.email}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Mật khẩu mặc định</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={successMessage.password} 
                readOnly 
                className="font-mono bg-slate-50"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={onCopyPassword}
                title="Copy"
              >
                {copiedPassword ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gửi mật khẩu này cho nhân viên và yêu cầu đổi sau khi đăng nhập lần đầu.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button onClick={onAddAnother}>
              Thêm nhân viên khác
            </Button>
          </div>
        </div>
      ) : (
        // Form State
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ tên */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Nguyễn Văn A"
              value={formData.full_name}
              onChange={(e) => onFieldChange('full_name', e.target.value)}
              required
            />
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@skillmaster.edu.vn"
              value={formData.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Email này sẽ được dùng làm tài khoản đăng nhập
            </p>
          </div>
          
          {/* Vai trò */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Vai trò <span className="text-red-500">*</span>
            </Label>
            <SimpleSelect
              value={formData.role_code}
              onChange={(value) => onFieldChange('role_code', value)}
              placeholder="Chọn vai trò"
              options={ROLE_OPTIONS}
            />
          </div>
          
          {/* Số điện thoại */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0901234567"
              value={formData.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
            />
          </div>
          
          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tạo tài khoản
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </SimpleModal>
  );
}

export default CreateStaffModal;
