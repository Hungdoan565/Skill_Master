/**
 * Classes List Constants - Cấu hình cho trang danh sách lớp học
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Status config cho lớp học
export const STATUS_CONFIG = {
  upcoming: { label: 'Sắp mở', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ongoing: { label: 'Đang học', color: 'bg-green-100 text-green-700 border-green-200' },
  completed: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' },
};

// Day names
export const DAY_NAMES = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

export const DAYS_OF_WEEK = [
  { value: 2, label: 'T2' },
  { value: 3, label: 'T3' },
  { value: 4, label: 'T4' },
  { value: 5, label: 'T5' },
  { value: 6, label: 'T6' },
  { value: 7, label: 'T7' },
  { value: 8, label: 'CN' },
];

// Category colors for courses
export const CATEGORY_COLORS = {
  english: 'bg-blue-100 text-blue-700',
  ielts: 'bg-amber-100 text-amber-700',
  toeic: 'bg-emerald-100 text-emerald-700',
  it: 'bg-purple-100 text-purple-700',
  programming: 'bg-violet-100 text-violet-700',
  default: 'bg-slate-100 text-slate-700',
};

// Default form values cho tạo lớp mới
export const DEFAULT_CLASS_FORM = {
  code: '',
  name: '',
  course_id: '',
  teacher_id: '',
  center_id: '',
  room_id: '',
  start_date: '',
  end_date: '',
  schedule: [],
  max_students: 20,
  status: 'upcoming'
};
