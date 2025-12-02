/**
 * Courses Constants - Cấu hình và hằng số cho module courses
 */

import { 
  Code2, Languages, Award, MessageCircle, Wrench 
} from 'lucide-react';

// API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================================
// CATEGORY CONFIGURATION
// ============================================================

// Config màu cho từng danh mục khóa học
export const CATEGORY_CONFIG = {
  english: { 
    label: 'Tiếng Anh', 
    color: 'bg-blue-100 text-blue-700 border-blue-200' 
  },
  it: { 
    label: 'Tin học', 
    color: 'bg-purple-100 text-purple-700 border-purple-200' 
  },
  programming: { 
    label: 'Lập trình', 
    color: 'bg-violet-100 text-violet-700 border-violet-200' 
  },
  ielts: { 
    label: 'IELTS', 
    color: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  toeic: { 
    label: 'TOEIC', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  communication: { 
    label: 'Giao tiếp', 
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200' 
  },
  office: { 
    label: 'Tin học VP', 
    color: 'bg-orange-100 text-orange-700 border-orange-200' 
  },
  default: { 
    label: 'Khác', 
    color: 'bg-slate-100 text-slate-700 border-slate-200' 
  },
};

// Danh sách danh mục cho dropdown
export const CATEGORIES = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'toeic', label: 'TOEIC' },
  { value: 'english', label: 'Tiếng Anh tổng quát' },
  { value: 'communication', label: 'Tiếng Anh giao tiếp' },
  { value: 'programming', label: 'Lập trình' },
  { value: 'it', label: 'Tin học' },
  { value: 'office', label: 'Tin học văn phòng' },
];

// Danh sách trình độ
export const LEVELS = [
  { value: 'Beginner', label: 'Cơ bản (Beginner)' },
  { value: 'Intermediate', label: 'Trung cấp (Intermediate)' },
  { value: 'Advanced', label: 'Nâng cao (Advanced)' },
];

// Trạng thái khóa học
export const COURSE_STATUS = [
  { value: 'draft', label: 'Nháp', color: 'bg-zinc-100 text-zinc-600 border-zinc-300' },
  { value: 'active', label: 'Đang tuyển sinh', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'inactive', label: 'Tạm ngưng', color: 'bg-orange-100 text-orange-700 border-orange-300' }
];

// Default form data cho tạo mới khóa học
export const DEFAULT_COURSE_FORM = {
  code: '',
  title: '',
  category: 'ielts',
  level: 'Beginner',
  total_sessions: 24,
  duration_weeks: 12,
  price: '',
  cover_image: '',
  description: '',
  status: 'active'
};

// ============================================================
// GRADE STRUCTURE TEMPLATES
// ============================================================

// Mẫu cấu hình điểm theo loại khóa học
export const GRADE_TEMPLATES = {
  // Lập trình / Tin học
  programming: {
    id: 'programming',
    name: 'Lập trình / Tin học',
    Icon: Code2,
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-100',
    description: 'Thang 10, đạt từ 5.0',
    categories: ['programming', 'it', 'office'],
    config: { calculationType: 'weighted', passScore: 5.0, maxTotalScore: 10.0 },
    structures: [
      { name: 'Chuyên cần', weight: 0.10, max_score: 10 },
      { name: 'Giữa kỳ', weight: 0.40, max_score: 10 },
      { name: 'Cuối kỳ', weight: 0.50, max_score: 10 },
    ]
  },
  // IELTS
  ielts: {
    id: 'ielts',
    name: 'IELTS',
    Icon: Award,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Band 9.0, đạt từ 6.0',
    categories: ['ielts'],
    config: { calculationType: 'weighted', passScore: 6.0, maxTotalScore: 9.0 },
    structures: [
      { name: 'Listening', weight: 0.25, max_score: 9 },
      { name: 'Reading', weight: 0.25, max_score: 9 },
      { name: 'Writing', weight: 0.25, max_score: 9 },
      { name: 'Speaking', weight: 0.25, max_score: 9 },
    ]
  },
  // TOEIC
  toeic: {
    id: 'toeic',
    name: 'TOEIC',
    Icon: Languages,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Tổng 990, đạt từ 450',
    categories: ['toeic'],
    config: { calculationType: 'sum', passScore: 450, maxTotalScore: 990 },
    structures: [
      { name: 'Listening', weight: 0, max_score: 495 },
      { name: 'Reading', weight: 0, max_score: 495 },
    ]
  },
  // Tiếng Anh giao tiếp / Tổng quát
  english: {
    id: 'english',
    name: 'Tiếng Anh',
    Icon: MessageCircle,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Thang 10, đạt từ 5.0',
    categories: ['english', 'communication'],
    config: { calculationType: 'weighted', passScore: 5.0, maxTotalScore: 10.0 },
    structures: [
      { name: 'Listening', weight: 0.25, max_score: 10 },
      { name: 'Speaking', weight: 0.25, max_score: 10 },
      { name: 'Reading', weight: 0.25, max_score: 10 },
      { name: 'Writing', weight: 0.25, max_score: 10 },
    ]
  },
  // Tùy chỉnh
  custom: {
    id: 'custom',
    name: 'Tùy chỉnh',
    Icon: Wrench,
    iconColor: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
    description: 'Tự cấu hình',
    categories: [],
    config: { calculationType: 'weighted', passScore: 5.0, maxTotalScore: 10.0 },
    structures: []
  }
};

// Default config cho grade structure
export const DEFAULT_GRADE_CONFIG = {
  calculationType: 'weighted',
  passScore: 5.0,
  maxTotalScore: 10.0
};
