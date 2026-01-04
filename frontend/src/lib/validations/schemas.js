/**
 * Validation Schemas
 * 
 * Central Zod schemas cho form validation
 * Đảm bảo type-safe và consistent validation across modules
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATION RULES
// ============================================

// Vietnamese phone number pattern
const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

// Email pattern (more permissive than default)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Common error messages (Vietnamese)
export const errorMessages = {
  required: 'Trường này là bắt buộc',
  email: 'Email không hợp lệ',
  phone: 'Số điện thoại không hợp lệ (VD: 0901234567)',
  minLength: (min) => `Tối thiểu ${min} ký tự`,
  maxLength: (max) => `Tối đa ${max} ký tự`,
  min: (min) => `Giá trị tối thiểu là ${min}`,
  max: (max) => `Giá trị tối đa là ${max}`,
  positive: 'Giá trị phải là số dương',
  integer: 'Giá trị phải là số nguyên',
  url: 'URL không hợp lệ',
  date: 'Ngày không hợp lệ',
};

// ============================================
// REUSABLE FIELD SCHEMAS
// ============================================

export const fields = {
  // Required string
  requiredString: z
    .string({ required_error: errorMessages.required })
    .min(1, errorMessages.required),

  // Optional string (empty string → undefined)
  optionalString: z
    .string()
    .optional()
    .transform((val) => val?.trim() || undefined),

  // Email field
  email: z
    .string({ required_error: errorMessages.required })
    .min(1, errorMessages.required)
    .email(errorMessages.email)
    .toLowerCase()
    .trim(),

  // Optional email
  optionalEmail: z
    .string()
    .email(errorMessages.email)
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal('')),

  // Vietnamese phone
  phone: z
    .string()
    .regex(phoneRegex, errorMessages.phone)
    .optional()
    .or(z.literal('')),

  // Full name (2-100 chars)
  fullName: z
    .string({ required_error: errorMessages.required })
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100))
    .trim(),

  // Optional full name
  optionalFullName: z
    .string()
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100))
    .trim()
    .optional()
    .or(z.literal('')),

  // Status field
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Trạng thái không hợp lệ' }),
  }),

  // Positive number
  positiveNumber: z
    .number({ required_error: errorMessages.required })
    .positive(errorMessages.positive),

  // Optional positive number
  optionalPositiveNumber: z
    .number()
    .positive(errorMessages.positive)
    .optional()
    .nullable(),

  // Integer
  integer: z
    .number({ required_error: errorMessages.required })
    .int(errorMessages.integer),

  // Date string (YYYY-MM-DD)
  dateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, errorMessages.date)
    .optional()
    .or(z.literal('')),

  // URL
  url: z
    .string()
    .url(errorMessages.url)
    .optional()
    .or(z.literal('')),

  // UUID
  uuid: z.string().uuid('ID không hợp lệ'),

  // Optional UUID
  optionalUuid: z.string().uuid('ID không hợp lệ').optional().nullable(),
};

// ============================================
// STUDENT SCHEMAS
// ============================================

export const studentSchema = z.object({
  full_name: fields.fullName,
  phone: fields.phone,
  status: fields.status.default('active'),
  // Parent/Guardian fields (for students under 18)
  parent_name: fields.optionalFullName,
  parent_phone: fields.phone,
  parent_email: fields.optionalEmail,
  parent_relationship: z
    .enum(['father', 'mother', 'guardian', 'other'], {
      errorMap: () => ({ message: 'Mối quan hệ không hợp lệ' }),
    })
    .optional()
    .or(z.literal('')),
  date_of_birth: fields.dateString,
});

export const createStudentSchema = z.object({
  email: fields.email,
  full_name: fields.fullName,
  phone: fields.phone,
  password: z
    .string({ required_error: errorMessages.required })
    .min(6, errorMessages.minLength(6)),
  // Parent/Guardian fields
  parent_name: fields.optionalFullName,
  parent_phone: fields.phone,
  parent_email: fields.optionalEmail,
  parent_relationship: z
    .enum(['father', 'mother', 'guardian', 'other'], {
      errorMap: () => ({ message: 'Mối quan hệ không hợp lệ' }),
    })
    .optional()
    .or(z.literal('')),
  date_of_birth: fields.dateString,
});

export const updateStudentSchema = studentSchema.partial();

// ============================================
// STAFF SCHEMAS
// ============================================

export const staffSchema = z.object({
  full_name: fields.fullName,
  email: fields.email,
  phone: fields.phone,
  role_code: z.enum(['CENTER_MANAGER', 'TEACHER', 'RECEPTIONIST'], {
    errorMap: () => ({ message: 'Vai trò không hợp lệ' }),
  }),
  status: fields.status.default('active'),
  center_id: fields.optionalUuid,
});

export const createStaffSchema = staffSchema.extend({
  password: z
    .string({ required_error: errorMessages.required })
    .min(6, errorMessages.minLength(6)),
});

export const updateStaffSchema = staffSchema.partial();

// ============================================
// COURSE SCHEMAS
// ============================================

export const courseSchema = z.object({
  name: z
    .string({ required_error: errorMessages.required })
    .min(3, errorMessages.minLength(3))
    .max(200, errorMessages.maxLength(200)),
  description: z
    .string()
    .max(2000, errorMessages.maxLength(2000))
    .optional(),
  category_id: fields.optionalUuid,
  price: z
    .number({ required_error: errorMessages.required })
    .min(0, 'Giá không được âm'),
  duration_hours: z
    .number({ required_error: errorMessages.required })
    .int(errorMessages.integer)
    .min(1, 'Thời lượng tối thiểu 1 giờ'),
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Cấp độ không hợp lệ' }),
  }).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

// ============================================
// CLASS SCHEMAS
// ============================================

export const classSchema = z.object({
  name: z
    .string({ required_error: errorMessages.required })
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100)),
  course_id: fields.uuid,
  teacher_id: fields.optionalUuid,
  center_id: fields.optionalUuid,
  room_id: fields.optionalUuid,
  start_date: fields.dateString,
  end_date: fields.dateString,
  max_students: z
    .number()
    .int(errorMessages.integer)
    .min(1, 'Tối thiểu 1 học viên')
    .max(100, 'Tối đa 100 học viên')
    .optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).default('upcoming'),
});

// ============================================
// ENROLLMENT SCHEMAS
// ============================================

export const enrollmentSchema = z.object({
  student_id: fields.uuid,
  class_id: fields.uuid,
  enrollment_date: fields.dateString,
  status: z.enum(['pending', 'active', 'completed', 'dropped']).default('pending'),
  notes: z.string().max(500, errorMessages.maxLength(500)).optional(),
});

// Trial enrollment schema
export const trialEnrollmentSchema = z.object({
  student_id: fields.uuid,
  class_id: fields.uuid,
  notes: z.string().max(500, errorMessages.maxLength(500)).optional(),
});

// Convert trial to regular schema
export const convertTrialSchema = z.object({
  tuition_fee: z
    .number({ required_error: errorMessages.required })
    .positive('Học phí phải lớn hơn 0'),
  discount_amount: z
    .number()
    .min(0, 'Giảm giá không được âm')
    .optional()
    .default(0),
});

// ============================================
// WAITING LIST SCHEMAS
// ============================================

export const waitingListSchema = z.object({
  student_id: fields.uuid,
  class_id: fields.uuid,
  priority: z
    .number()
    .int(errorMessages.integer)
    .min(0, 'Độ ưu tiên tối thiểu 0')
    .max(2, 'Độ ưu tiên tối đa 2')
    .default(0),
  notes: z.string().max(500, errorMessages.maxLength(500)).optional(),
});

export const completeWaitingListSchema = z.object({
  status: z.enum(['enrolled', 'cancelled'], {
    errorMap: () => ({ message: 'Trạng thái phải là "enrolled" hoặc "cancelled"' }),
  }),
  reason: z.string().max(500, errorMessages.maxLength(500)).optional(),
});

export const notifyWaitingListSchema = z.object({
  slots: z
    .number()
    .int(errorMessages.integer)
    .min(1, 'Tối thiểu 1 slot')
    .max(10, 'Tối đa 10 slots')
    .default(1),
});

// ============================================
// INVOICE SCHEMAS
// ============================================

export const invoiceSchema = z.object({
  student_id: fields.uuid,
  enrollment_id: fields.optionalUuid,
  amount: z
    .number({ required_error: errorMessages.required })
    .positive(errorMessages.positive),
  discount_amount: z
    .number()
    .min(0, 'Giảm giá không được âm')
    .optional()
    .default(0),
  due_date: fields.dateString,
  notes: z.string().max(500, errorMessages.maxLength(500)).optional(),
  status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled']).default('pending'),
});

// ============================================
// CENTER SCHEMAS
// ============================================

export const centerSchema = z.object({
  name: z
    .string({ required_error: errorMessages.required })
    .min(2, errorMessages.minLength(2))
    .max(200, errorMessages.maxLength(200)),
  address: z
    .string()
    .max(500, errorMessages.maxLength(500))
    .optional(),
  phone: fields.phone,
  email: fields.optionalEmail,
  manager_id: fields.optionalUuid,
  status: fields.status.default('active'),
});

// ============================================
// ROOM SCHEMAS
// ============================================

export const roomSchema = z.object({
  name: z
    .string({ required_error: errorMessages.required })
    .min(1, errorMessages.required)
    .max(100, errorMessages.maxLength(100)),
  center_id: fields.uuid,
  capacity: z
    .number({ required_error: errorMessages.required })
    .int(errorMessages.integer)
    .min(1, 'Sức chứa tối thiểu 1')
    .max(200, 'Sức chứa tối đa 200'),
  facilities: z.string().max(500, errorMessages.maxLength(500)).optional(),
  status: fields.status.default('active'),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: fields.email,
  password: z
    .string({ required_error: errorMessages.required })
    .min(1, errorMessages.required),
});

export const registerSchema = z.object({
  email: fields.email,
  password: z
    .string({ required_error: errorMessages.required })
    .min(6, errorMessages.minLength(6)),
  confirmPassword: z.string({ required_error: errorMessages.required }),
  full_name: fields.fullName,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: errorMessages.required })
    .min(1, errorMessages.required),
  newPassword: z
    .string({ required_error: errorMessages.required })
    .min(6, errorMessages.minLength(6)),
  confirmNewPassword: z.string({ required_error: errorMessages.required }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmNewPassword'],
});

// ============================================
// CONTACT / LEAD SCHEMAS
// ============================================

export const contactSchema = z.object({
  name: fields.fullName,
  email: fields.email,
  phone: fields.phone,
  message: z
    .string({ required_error: errorMessages.required })
    .min(10, errorMessages.minLength(10))
    .max(2000, errorMessages.maxLength(2000)),
  course_interest: fields.optionalUuid,
});

// ============================================
// EXPORT TYPE INFERENCE HELPERS
// ============================================

/**
 * Type inference from schema
 * @example
 * type StudentFormData = InferSchema<typeof studentSchema>;
 */
// Note: These are for TypeScript projects
// export type InferSchema<T extends z.ZodType> = z.infer<T>;
