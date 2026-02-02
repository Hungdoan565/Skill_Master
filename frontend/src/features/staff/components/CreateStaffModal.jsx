/**
 * CreateStaffModal Component
 * Modal thêm nhân viên mới - có cấu hình lương cho Giáo viên
 */

import { UserPlus, Copy, Check, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { SimpleSelect } from './SimpleSelect';
import { ROLE_OPTIONS, PAY_SCHEME_OPTIONS, HOURLY_RATE_SUGGESTIONS } from '../utils';

// Format currency for display
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
};

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

  const isTeacher = formData.role_code === 'TEACHER';
  const showFixedSalary = formData.pay_scheme !== 'HOURLY_ONLY';
  const showHourlyRate = formData.pay_scheme !== 'FIXED_ONLY';

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

          {/* Salary Configuration - Only for Teachers */}
          {isTeacher && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-base">Cấu hình lương</h3>
              </div>

              {/* Pay Scheme */}
              <div className="space-y-2 mb-4">
                <Label>Loại hình trả lương</Label>
                <SimpleSelect
                  value={formData.pay_scheme || 'HOURLY_ONLY'}
                  onChange={(value) => onFieldChange('pay_scheme', value)}
                  options={PAY_SCHEME_OPTIONS}
                />
              </div>

              {/* Hourly Rate */}
              {showHourlyRate && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="hourly_rate">
                    Mức lương/giờ <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="150000"
                      value={formData.hourly_rate || 150000}
                      onChange={(e) => onFieldChange('hourly_rate', parseInt(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      = {formatCurrency(formData.hourly_rate || 150000)}/giờ
                    </span>
                  </div>
                  {/* Quick select buttons */}
                  <div className="flex flex-wrap gap-1">
                    {HOURLY_RATE_SUGGESTIONS.map(rate => (
                      <button
                        key={rate.value}
                        type="button"
                        onClick={() => onFieldChange('hourly_rate', rate.value)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          formData.hourly_rate === rate.value
                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {rate.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed Monthly Salary */}
              {showFixedSalary && (
                <div className="space-y-2">
                  <Label htmlFor="fixed_monthly_salary">
                    Lương cố định/tháng <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fixed_monthly_salary"
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="5000000"
                      value={formData.fixed_monthly_salary || 0}
                      onChange={(e) => onFieldChange('fixed_monthly_salary', parseInt(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      = {formatCurrency(formData.fixed_monthly_salary || 0)}/tháng
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
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
