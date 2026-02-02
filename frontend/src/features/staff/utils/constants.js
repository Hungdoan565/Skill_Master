/**
 * Staff Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Role configuration với màu sắc
export const ROLE_CONFIG = {
  CENTER_MANAGER: { 
    label: 'Quản lý', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500'
  },
  TEACHER: { 
    label: 'Giáo viên', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500'
  },
  SUPER_ADMIN: { 
    label: 'Super Admin', 
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500'
  },
};

// Role options for forms
export const ROLE_OPTIONS = [
  { value: 'TEACHER', label: '👨‍🏫 Giáo viên' },
  { value: 'CENTER_MANAGER', label: '👔 Quản lý Trung tâm' },
];

// Role filter options
export const ROLE_FILTER_OPTIONS = [
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'CENTER_MANAGER', label: 'Quản lý' },
];

// Default form data
export const DEFAULT_STAFF_FORM = {
  full_name: '',
  email: '',
  phone: '',
  role_code: 'TEACHER',
  // Salary configuration
  hourly_rate: 150000,
  pay_scheme: 'HOURLY_ONLY',
  fixed_monthly_salary: 0,
};

// Pay scheme options for forms
export const PAY_SCHEME_OPTIONS = [
  { value: 'HOURLY_ONLY', label: 'Chỉ lương theo giờ', description: 'Part-time, sinh viên dạy thêm' },
  { value: 'FIXED_PLUS_HOURLY', label: 'Lương cố định + Giờ dạy thêm', description: 'Full-time, có dạy thêm ngoài giờ' },
  { value: 'FIXED_ONLY', label: 'Chỉ lương cố định', description: 'Không tính theo giờ dạy' },
];

// Default hourly rate suggestions
export const HOURLY_RATE_SUGGESTIONS = [
  { value: 100000, label: '100.000đ' },
  { value: 150000, label: '150.000đ' },
  { value: 200000, label: '200.000đ' },
  { value: 250000, label: '250.000đ' },
  { value: 300000, label: '300.000đ' },
];
