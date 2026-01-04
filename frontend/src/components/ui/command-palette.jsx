/**
 * Command Palette Component (⌘K / Ctrl+K)
 * 
 * Global search và navigation cho Admin Dashboard
 * - Search across: Students, Courses, Classes, Staff, Invoices
 * - Quick actions: Create, Navigate, Settings
 * - Recent searches
 * - Keyboard accessible
 * 
 * Best Practices 2025:
 * - cmdk library for accessibility & performance
 * - Fuzzy search with keywords
 * - Grouped results với icons
 * - Loading states
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  UserCog,
  Receipt,
  Calendar,
  Settings,
  FileText,
  Award,
  Building2,
  DoorOpen,
  BarChart3,
  Bell,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  Command as CommandIcon,
  Headphones,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Navigation items với keywords cho search
const NAVIGATION_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    path: '/admin/dashboard', 
    icon: BarChart3,
    keywords: ['tổng quan', 'home', 'thống kê', 'overview'],
    group: 'navigation'
  },
  { 
    id: 'courses', 
    label: 'Khóa học', 
    path: '/admin/courses', 
    icon: BookOpen,
    keywords: ['course', 'môn học', 'chương trình'],
    group: 'navigation'
  },
  { 
    id: 'classes', 
    label: 'Lớp học', 
    path: '/admin/classes', 
    icon: GraduationCap,
    keywords: ['class', 'lớp', 'nhóm'],
    group: 'navigation'
  },
  { 
    id: 'schedule', 
    label: 'Lịch dạy', 
    path: '/admin/schedule', 
    icon: Calendar,
    keywords: ['lịch', 'thời khóa biểu', 'schedule', 'buổi học'],
    group: 'navigation'
  },
  { 
    id: 'students', 
    label: 'Học viên', 
    path: '/admin/students', 
    icon: Users,
    keywords: ['student', 'sinh viên', 'người học'],
    group: 'navigation'
  },
  { 
    id: 'enrollments', 
    label: 'Ghi danh', 
    path: '/admin/enrollments', 
    icon: Plus,
    keywords: ['đăng ký', 'enrollment', 'nhập học'],
    group: 'navigation'
  },
  { 
    id: 'invoices', 
    label: 'Hóa đơn', 
    path: '/admin/invoices', 
    icon: Receipt,
    keywords: ['thanh toán', 'payment', 'bill', 'phiếu thu'],
    group: 'navigation'
  },
  { 
    id: 'staff', 
    label: 'Nhân sự', 
    path: '/admin/staff', 
    icon: UserCog,
    keywords: ['nhân viên', 'employee', 'giáo viên', 'teacher'],
    group: 'navigation'
  },
  { 
    id: 'payroll', 
    label: 'Bảng lương', 
    path: '/admin/payroll', 
    icon: Wallet,
    keywords: ['lương', 'salary', 'thanh toán giáo viên'],
    group: 'navigation'
  },
  { 
    id: 'centers', 
    label: 'Trung tâm', 
    path: '/admin/centers', 
    icon: Building2,
    keywords: ['cơ sở', 'chi nhánh', 'center', 'branch'],
    group: 'navigation'
  },
  { 
    id: 'rooms', 
    label: 'Phòng học', 
    path: '/admin/rooms', 
    icon: DoorOpen,
    keywords: ['room', 'phòng', 'thiết bị'],
    group: 'navigation'
  },
  { 
    id: 'certificates', 
    label: 'Chứng chỉ', 
    path: '/admin/certificates', 
    icon: Award,
    keywords: ['certificate', 'bằng cấp', 'diploma'],
    group: 'navigation'
  },
  { 
    id: 'documents', 
    label: 'Tài liệu', 
    path: '/admin/documents', 
    icon: FileText,
    keywords: ['document', 'file', 'học liệu'],
    group: 'navigation'
  },
  { 
    id: 'reports', 
    label: 'Báo cáo', 
    path: '/admin/reports', 
    icon: BarChart3,
    keywords: ['report', 'thống kê', 'analytics'],
    group: 'navigation'
  },
  { 
    id: 'notifications', 
    label: 'Thông báo', 
    path: '/admin/notifications', 
    icon: Bell,
    keywords: ['notification', 'alert', 'tin nhắn'],
    group: 'navigation'
  },
  { 
    id: 'support', 
    label: 'Hỗ trợ', 
    path: '/admin/support', 
    icon: Headphones,
    keywords: ['support', 'help', 'ticket', 'hỗ trợ'],
    group: 'navigation'
  },
  { 
    id: 'settings', 
    label: 'Cài đặt', 
    path: '/admin/settings', 
    icon: Settings,
    keywords: ['setting', 'config', 'cấu hình'],
    group: 'navigation'
  },
];

// Quick actions
const QUICK_ACTIONS = [
  { 
    id: 'new-enrollment', 
    label: 'Ghi danh mới', 
    path: '/admin/enrollments/new', 
    icon: Plus,
    keywords: ['tạo', 'thêm', 'ghi danh', 'new'],
    group: 'actions'
  },
  { 
    id: 'new-invoice', 
    label: 'Tạo hóa đơn', 
    path: '/admin/invoices?create=true', 
    icon: Receipt,
    keywords: ['tạo hóa đơn', 'thu tiền', 'create invoice'],
    group: 'actions'
  },
];

// Hook để search data từ API
function useGlobalSearch(query, accessToken) {
  const [results, setResults] = useState({ students: [], courses: [], classes: [], staff: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2 || !accessToken) {
      setResults({ students: [], courses: [], classes: [], staff: [] });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // Parallel fetch for better performance
        const [studentsRes, coursesRes, classesRes, staffRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/students?search=${encodeURIComponent(query)}&limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/courses?search=${encodeURIComponent(query)}&limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/classes?search=${encodeURIComponent(query)}&limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/staff?search=${encodeURIComponent(query)}&limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }),
        ]);

        const parseResponse = async (res) => {
          if (res.status === 'fulfilled' && res.value.ok) {
            const data = await res.value.json();
            return data.data || data || [];
          }
          return [];
        };

        setResults({
          students: await parseResponse(studentsRes),
          courses: await parseResponse(coursesRes),
          classes: await parseResponse(classesRes),
          staff: await parseResponse(staffRes),
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, accessToken]);

  return { results, loading };
}

// Recent searches hook (localStorage)
function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('command-palette-recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  const addRecent = useCallback((item) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('command-palette-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('command-palette-recent');
  }, []);

  return { recentSearches, addRecent, clearRecent };
}

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const { results, loading } = useGlobalSearch(query, session?.access_token);
  const { recentSearches, addRecent, clearRecent } = useRecentSearches();

  // Handle navigation
  const handleSelect = useCallback((item) => {
    addRecent(item);
    onOpenChange(false);
    setQuery('');
    navigate(item.path);
  }, [navigate, onOpenChange, addRecent]);

  // Handle entity navigation
  const handleEntitySelect = useCallback((type, entity) => {
    const paths = {
      student: `/admin/students/${entity.id}`,
      course: `/admin/courses/${entity.id}`,
      class: `/admin/classes/${entity.id}`,
      staff: `/admin/staff/${entity.id}`,
    };
    const item = {
      id: `${type}-${entity.id}`,
      label: entity.full_name || entity.title || entity.code || entity.name,
      path: paths[type],
      type,
    };
    addRecent(item);
    onOpenChange(false);
    setQuery('');
    navigate(paths[type]);
  }, [navigate, onOpenChange, addRecent]);

  // Check if we have search results
  const hasSearchResults = useMemo(() => {
    return (
      results.students.length > 0 ||
      results.courses.length > 0 ||
      results.classes.length > 0 ||
      results.staff.length > 0
    );
  }, [results]);

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className="command-palette-dialog"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => onOpenChange(false)} />
      
      {/* Dialog Content */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-zinc-100">
            <Search className="w-5 h-5 text-zinc-400 flex-shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Tìm kiếm học viên, khóa học, hoặc gõ lệnh..."
              className="flex-1 h-14 text-base bg-transparent border-none outline-none placeholder:text-zinc-400"
              autoFocus
            />
            {loading && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />}
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-md text-xs text-zinc-500 font-medium">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-12 text-center text-zinc-500">
              {query.length > 0 ? 'Không tìm thấy kết quả.' : 'Bắt đầu gõ để tìm kiếm...'}
            </Command.Empty>

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <Command.Group heading={
                <div className="flex items-center justify-between">
                  <span>Tìm kiếm gần đây</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); clearRecent(); }}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    Xóa
                  </button>
                </div>
              }>
                {recentSearches.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                    className="command-item"
                  >
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Quick Actions */}
            {!query && (
              <Command.Group heading="Thao tác nhanh">
                {QUICK_ACTIONS.map((action) => (
                  <Command.Item
                    key={action.id}
                    value={action.label}
                    keywords={action.keywords}
                    onSelect={() => handleSelect(action)}
                    className="command-item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <action.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="flex-1 font-medium">{action.label}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Students */}
            {query && results.students.length > 0 && (
              <Command.Group heading="Học viên">
                {results.students.map((student) => (
                  <Command.Item
                    key={`student-${student.id}`}
                    value={`student ${student.full_name} ${student.email}`}
                    onSelect={() => handleEntitySelect('student', student)}
                    className="command-item"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.full_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{student.email}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Courses */}
            {query && results.courses.length > 0 && (
              <Command.Group heading="Khóa học">
                {results.courses.map((course) => (
                  <Command.Item
                    key={`course-${course.id}`}
                    value={`course ${course.title} ${course.code}`}
                    onSelect={() => handleEntitySelect('course', course)}
                    className="command-item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{course.code}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Classes */}
            {query && results.classes.length > 0 && (
              <Command.Group heading="Lớp học">
                {results.classes.map((cls) => (
                  <Command.Item
                    key={`class-${cls.id}`}
                    value={`class ${cls.code} ${cls.name}`}
                    onSelect={() => handleEntitySelect('class', cls)}
                    className="command-item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cls.code}</p>
                      <p className="text-xs text-zinc-500 truncate">{cls.courses?.title || 'N/A'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Search Results - Staff */}
            {query && results.staff.length > 0 && (
              <Command.Group heading="Nhân sự">
                {results.staff.map((member) => (
                  <Command.Item
                    key={`staff-${member.id}`}
                    value={`staff ${member.full_name} ${member.email}`}
                    onSelect={() => handleEntitySelect('staff', member)}
                    className="command-item"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                      <UserCog className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.full_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.roles?.name || 'Staff'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation - Always show when no specific results */}
            {(!query || !hasSearchResults) && (
              <Command.Group heading="Điều hướng">
                {NAVIGATION_ITEMS.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    keywords={item.keywords}
                    onSelect={() => handleSelect(item)}
                    className="command-item"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-zinc-600" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-zinc-200">↑↓</kbd>
                <span>di chuyển</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-zinc-200">↵</kbd>
                <span>chọn</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-zinc-200">esc</kbd>
                <span>đóng</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <CommandIcon className="w-3 h-3" />
              <span>Command Palette</span>
            </div>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

// Hook để sử dụng Command Palette
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  // Listen for ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((currentOpen) => !currentOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}

export default CommandPalette;
