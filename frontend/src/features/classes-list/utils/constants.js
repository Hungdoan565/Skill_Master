/**
 * Classes List Constants - Cấu hình cho trang danh sách lớp học
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Status config cho lớp học
export const STATUS_CONFIG = {
  upcoming: { label: 'Sắp mở', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
  ongoing: { label: 'Đang học', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' },
  completed: { label: 'Đã kết thúc', color: 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' },
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
  english: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  ielts: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  toeic: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  it: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  programming: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  default: 'bg-muted text-muted-foreground',
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
