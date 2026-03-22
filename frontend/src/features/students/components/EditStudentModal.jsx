/**
 * EditStudentModal Component (Refactored)
 * 
 * Modal chỉnh sửa thông tin học viên
 * ✅ Uses React Hook Form + Zod validation
 * ✅ Type-safe form handling
 * ✅ Consistent error display
 * ✅ Parent/Guardian support for underage students
 */

import { useEffect, useMemo } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleModal } from './SimpleModal';
import { useZodForm, FormInput, FormSelect } from '@/lib/form';
import { studentSchema } from '@/lib/validations';

// Status options
const STATUS_OPTIONS = [
  { value: 'active', label: '🟢 Hoạt động' },
  { value: 'inactive', label: '🔴 Ngừng hoạt động' },
];

// Parent relationship options
const PARENT_RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Chọn mối quan hệ' },
  { value: 'father', label: 'Bố' },
  { value: 'mother', label: 'Mẹ' },
  { value: 'guardian', label: 'Người giám hộ' },
  { value: 'other', label: 'Khác' },
];

/**
 * Calculate age from date of birth
 * @param {string} dob - Date string in YYYY-MM-DD format
 * @returns {number|null} - Age in years or null
 */
function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function EditStudentModal({
  isOpen,
  onClose,
  student,
  onSubmit,
  submitting = false,
}) {
  // Initialize form with Zod validation
  const form = useZodForm({
    schema: studentSchema,
    defaultValues: {
      full_name: '',
      phone: '',
      status: 'active',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      parent_relationship: '',
      date_of_birth: '',
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isDirty } } = form;

  // Watch date of birth to show/hide parent fields
  const dateOfBirth = watch('date_of_birth');

  // Calculate age and determine if parent fields should show
  const studentAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);
  const showParentFields = studentAge !== null && studentAge < 18;

  // Populate form when student data changes
  useEffect(() => {
    if (student && isOpen) {
      reset({
        full_name: student.full_name || '',
        phone: student.phone || '',
        status: student.status || 'active',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_email: student.parent_email || '',
        parent_relationship: student.parent_relationship || '',
        date_of_birth: student.date_of_birth || '',
      });
    }
  }, [student, isOpen, reset]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle form submission
  const onFormSubmit = async (data) => {
    const submitData = {
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || null,
      status: data.status,
      date_of_birth: data.date_of_birth || null,
      // Only include parent data if student is under 18
      ...(showParentFields && {
        parent_name: data.parent_name?.trim() || null,
        parent_phone: data.parent_phone?.trim() || null,
        parent_email: data.parent_email?.trim() || null,
        parent_relationship: data.parent_relationship || null,
      }),
    };
    
    await onSubmit(student.id, submitData);
  };

  if (!student) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa học viên"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Email (readonly) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-gray-300">Email</Label>
          <Input
            value={student.email}
            readOnly
            disabled
            className="bg-slate-50 dark:bg-gray-800 cursor-not-allowed"
          />
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Email không thể thay đổi
          </p>
        </div>

        {/* Họ tên - Using FormInput with validation */}
        <FormInput
          control={control}
          name="full_name"
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          required
        />

        {/* Ngày sinh */}
        <FormInput
          control={control}
          name="date_of_birth"
          label="Ngày sinh"
          type="date"
          description={studentAge !== null ? `Tuổi: ${studentAge}` : 'Nhập để hiển thị tuổi'}
        />

        {/* Số điện thoại */}
        <FormInput
          control={control}
          name="phone"
          label="Số điện thoại"
          type="tel"
          placeholder="0901234567"
          description="Định dạng: 0901234567 hoặc +84901234567"
        />

        {/* Parent/Guardian Section - Show only if student is under 18 */}
        {showParentFields && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-4">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              👨‍👩‍👧 Thông tin Phụ huynh/Người giám hộ
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Học viên dưới 18 tuổi cần thông tin phụ huynh để liên hệ
            </p>

            <FormInput
              control={control}
              name="parent_name"
              label="Họ tên phụ huynh"
              placeholder="Nguyễn Văn B"
            />

            <FormSelect
              control={control}
              name="parent_relationship"
              label="Mối quan hệ"
              options={PARENT_RELATIONSHIP_OPTIONS}
            />

            <FormInput
              control={control}
              name="parent_phone"
              label="Số điện thoại phụ huynh"
              type="tel"
              placeholder="0901234567"
            />

            <FormInput
              control={control}
              name="parent_email"
              label="Email phụ huynh"
              type="email"
              placeholder="parent@example.com"
            />
          </div>
        )}

        {/* Trạng thái */}
        <FormSelect
          control={control}
          name="status"
          label="Trạng thái"
          options={STATUS_OPTIONS}
          required
        />

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || !isDirty}
            className="min-w-[100px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </SimpleModal>
  );
}

export default EditStudentModal;
