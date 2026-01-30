/**
 * Constants for Class Detail module
 */

// API Base URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// BANK CONFIG - MOVED TO DATABASE
// ============================================
// IMPORTANT: Bank configuration is now stored in system_settings table
// and fetched via API endpoints:
// - GET /api/payment-config (for any authenticated user)
// - GET /api/settings/bank-config (for admin view)  
// - PUT /api/settings/bank-config (for admin update)
// - GET /api/student/payment-config (for student self-payment)
//
// See: database/17_system_settings.sql for table schema
// ============================================

// Day names mapping (2 = Monday, 8 = Sunday)
export const DAY_NAMES = {
  2: 'T2',
  3: 'T3',
  4: 'T4',
  5: 'T5',
  6: 'T6',
  7: 'T7',
  8: 'CN'
};

// Class status configuration
export const CLASS_STATUS_CONFIG = {
  upcoming: { label: 'Sắp mở', color: 'bg-blue-100 text-blue-700' },
  ongoing: { label: 'Đang học', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' }
};

// Session status configuration
export const SESSION_STATUS = {
  today: { label: 'Hôm nay', color: 'bg-indigo-500 text-white' },
  completed: { label: 'Đã học', color: 'bg-slate-300 text-slate-600' },
  upcoming: { label: 'Sắp tới', color: 'bg-blue-50 text-blue-600 border border-blue-200' }
};

// Attendance status configuration
export const ATTENDANCE_STATUS = {
  present: { label: 'Có mặt', color: 'bg-emerald-500', icon: 'check' },
  late: { label: 'Đi trễ', color: 'bg-amber-500', icon: 'clock' },
  absent: { label: 'Vắng mặt', color: 'bg-red-500', icon: 'x' }
};

// Payment methods
export const PAYMENT_METHODS = {
  cash: { label: 'Tiền mặt', icon: 'banknote' },
  bank_transfer: { label: 'Chuyển khoản', icon: 'qrcode' }
};

// Quick amount options for payment (in VND)
export const QUICK_PAYMENT_AMOUNTS = [1000000, 2000000, 5000000];

// Tab configuration
export const TABS = {
  students: { key: 'students', label: 'Học viên', icon: 'users' },
  schedule: { key: 'schedule', label: 'Lịch trình & Điểm danh', icon: 'calendar' },
  grades: { key: 'grades', label: 'Bảng điểm', icon: 'graduation-cap' }
};

// Pagination defaults
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  search: '',
  paymentStatus: 'all'
};

// Avatar colors (for initials fallback)
export const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-violet-500'
];

// Toast duration in ms
export const TOAST_DURATION = 3000;

// Debounce delay for search in ms
export const SEARCH_DEBOUNCE_DELAY = 300;

// Minimum characters for search
export const MIN_SEARCH_LENGTH = 2;

// Grade pass threshold
export const GRADE_PASS_THRESHOLD = 5.0;
