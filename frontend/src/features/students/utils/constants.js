/**
 * Students Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Status filter options
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
];

// Role options for promotion
export const ROLE_OPTIONS = [
  { value: 'TEACHER', label: 'Giáo viên', icon: 'GraduationCap', color: 'text-emerald-600 bg-emerald-50' },
  { value: 'CENTER_MANAGER', label: 'Quản lý Trung tâm', icon: 'Building2', color: 'text-blue-600 bg-blue-50' },
];

// Avatar gradients
export const AVATAR_GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
];
