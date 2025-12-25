/**
 * Courses Constants - Cấu hình và hằng số cho module courses
 */

import {
  Code2, Languages, Award, MessageCircle, Wrench,
  Target, Rocket, BookOpen, Trophy, FileText, Table2, TrendingUp, Users2
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
  status: 'active',
  // JSON Array fields for public UI
  syllabus: [],
  outcomes: [],
  features: [],
  faq: []
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

// ============================================================
// COURSE TEMPLATES - Mẫu khóa học nhanh
// ============================================================

export const COURSE_TEMPLATES = [
  {
    id: 'ielts-foundation',
    name: 'IELTS Foundation',
    icon: Target,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: 'Khóa IELTS cơ bản cho người mới bắt đầu',
    data: {
      code: 'IELTS-FOUND',
      title: 'IELTS Foundation',
      category: 'ielts',
      level: 'Beginner',
      total_sessions: 36,
      duration_weeks: 12,
      price: '8500000',
      description: 'Khóa IELTS cơ bản dành cho người mới bắt đầu. Mục tiêu đạt band 5.0-5.5. Bao gồm 4 kỹ năng: Listening, Reading, Writing, Speaking.',
      syllabus: [
        {
          title: 'Listening Fundamentals',
          topics: ['Note-taking skills', 'Common question types', 'Multiple choice strategies', 'Map and diagram labeling']
        },
        {
          title: 'Reading Basics',
          topics: ['Skimming and scanning techniques', 'True/False/Not Given questions', 'Matching headings', 'Summary completion']
        },
        {
          title: 'Writing Task 1',
          topics: ['Describing charts and graphs', 'Process diagrams', 'Map comparisons', 'Sentence structures']
        },
        {
          title: 'Writing Task 2',
          topics: ['Essay organization', 'Opinion essays', 'Discussion essays', 'Problem-solution essays']
        },
        {
          title: 'Speaking Part 1-3',
          topics: ['Fluency practice', 'Common topics', 'Idea development', 'Pronunciation drills']
        }
      ],
      outcomes: [
        'Achieve IELTS band 5.0-5.5',
        'Master fundamental grammar structures',
        'Build 1500+ academic vocabulary',
        'Understand all question types across 4 skills',
        'Develop effective time management for exam',
        'Gain confidence in English communication'
      ],
      features: [
        '100% mock tests chuẩn Cambridge',
        'Học liệu chính thức từ IELTS.org',
        'Luyện nói 1-1 với giáo viên',
        'Chấm bài writing chi tiết',
        'Đảm bảo đầu ra hoặc học lại miễn phí',
        'Hỗ trợ học tập 24/7'
      ],
      faq: [
        {
          question: 'Khóa học phù hợp với ai?',
          answer: 'Khóa này dành cho người mới bắt đầu hoặc có trình độ tiếng Anh cơ bản (tương đương Pre-Intermediate). Phù hợp với học sinh, sinh viên cần chứng chỉ IELTS 5.0-5.5 để du học, định cư hoặc xin việc.'
        },
        {
          question: 'Cần chuẩn bị gì trước khi học?',
          answer: 'Bạn chỉ cần có tiếng Anh cơ bản (biết ngữ pháp căn bản, vốn từ vựng khoảng 1000 từ). Trung tâm sẽ cung cấp đầy đủ giáo trình và tài liệu học tập.'
        },
        {
          question: 'Học online hay offline?',
          answer: 'Khóa học hỗ trợ cả hai hình thức. Bạn có thể chọn học trực tiếp tại trung tâm hoặc học online qua Zoom với tương tác trực tiếp với giáo viên.'
        },
        {
          question: 'Cam kết đầu ra như thế nào?',
          answer: 'Trung tâm cam kết học viên đạt band 5.0-5.5 sau khóa học. Nếu không đạt, học viên được học lại miễn phí đến khi đạt mục tiêu (với điều kiện tham gia đầy đủ các buổi học và làm bài tập).'
        }
      ]
    }
  },
  {
    id: 'ielts-intensive',
    name: 'IELTS Intensive',
    icon: Rocket,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Khóa IELTS luyện thi chuyên sâu',
    data: {
      code: 'IELTS-INT',
      title: 'IELTS Intensive',
      category: 'ielts',
      level: 'Intermediate',
      total_sessions: 48,
      duration_weeks: 8,
      price: '12000000',
      description: 'Khóa IELTS chuyên sâu cho người đã có nền tảng. Mục tiêu đạt band 6.5-7.0. Tập trung vào kỹ năng thi và strategies.'
    }
  },
  {
    id: 'toeic-standard',
    name: 'TOEIC 600+',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    description: 'Khóa TOEIC mục tiêu 600+ điểm',
    data: {
      code: 'TOEIC-600',
      title: 'TOEIC 600+',
      category: 'toeic',
      level: 'Beginner',
      total_sessions: 24,
      duration_weeks: 8,
      price: '6500000',
      description: 'Khóa TOEIC dành cho người mới, mục tiêu 600+ điểm. Phù hợp sinh viên và người đi làm cần chứng chỉ TOEIC.'
    }
  },
  {
    id: 'toeic-advanced',
    name: 'TOEIC 800+',
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Khóa TOEIC mục tiêu 800+ điểm',
    data: {
      code: 'TOEIC-800',
      title: 'TOEIC 800+',
      category: 'toeic',
      level: 'Advanced',
      total_sessions: 32,
      duration_weeks: 10,
      price: '8500000',
      description: 'Khóa TOEIC nâng cao, mục tiêu 800+ điểm. Dành cho người đã có nền tảng tiếng Anh tốt.'
    }
  },
  {
    id: 'mos-word',
    name: 'MOS Word',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Luyện thi MOS Word chuẩn quốc tế',
    data: {
      code: 'MOS-WORD',
      title: 'MOS Word 365/2019',
      category: 'office',
      level: 'Beginner',
      total_sessions: 12,
      duration_weeks: 4,
      price: '2500000',
      description: 'Khóa luyện thi chứng chỉ MOS Word Associate. Học 1 kèm 1 hoặc nhóm nhỏ. Cam kết đầu ra.'
    }
  },
  {
    id: 'mos-excel',
    name: 'MOS Excel',
    icon: Table2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Luyện thi MOS Excel chuẩn quốc tế',
    data: {
      code: 'MOS-EXCEL',
      title: 'MOS Excel 365/2019',
      category: 'office',
      level: 'Beginner',
      total_sessions: 12,
      duration_weeks: 4,
      price: '2500000',
      description: 'Khóa luyện thi chứng chỉ MOS Excel Associate. Học thực hành 70%, lý thuyết 30%.'
    }
  },
  {
    id: 'excel-advanced',
    name: 'Excel Nâng cao',
    icon: TrendingUp,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    description: 'Excel chuyên sâu: Pivot, Dashboard, VBA',
    data: {
      code: 'EXCEL-ADV',
      title: 'Excel Nâng cao - Pivot & Dashboard',
      category: 'office',
      level: 'Advanced',
      total_sessions: 16,
      duration_weeks: 6,
      price: '3500000',
      description: 'Khóa Excel chuyên sâu với Pivot Table, Power Query, Dashboard và VBA cơ bản. Dành cho người đã biết Excel.'
    }
  },
  {
    id: 'communication',
    name: 'Giao tiếp căn bản',
    icon: Users2,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Tiếng Anh giao tiếp cho người đi làm',
    data: {
      code: 'COMM-BASIC',
      title: 'English Communication Basic',
      category: 'communication',
      level: 'Beginner',
      total_sessions: 24,
      duration_weeks: 8,
      price: '5500000',
      description: 'Khóa tiếng Anh giao tiếp cơ bản dành cho người đi làm. Tập trung vào các tình huống thực tế.'
    }
  }
];
