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
};
