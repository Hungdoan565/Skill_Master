import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Search, 
  Filter,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  AlertCircle,
  Check,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper: Lấy token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

// Status config
const STATUS_CONFIG = {
  upcoming: { label: 'Sắp mở', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ongoing: { label: 'Đang học', color: 'bg-green-100 text-green-700 border-green-200' },
  completed: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' },
};

// Day names
const DAY_NAMES = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const DAYS_OF_WEEK = [
  { value: 2, label: 'T2' },
  { value: 3, label: 'T3' },
  { value: 4, label: 'T4' },
  { value: 5, label: 'T5' },
  { value: 6, label: 'T6' },
  { value: 7, label: 'T7' },
  { value: 8, label: 'CN' },
];

// Category colors for courses
const CATEGORY_COLORS = {
  english: 'bg-blue-100 text-blue-700',
  ielts: 'bg-amber-100 text-amber-700',
  toeic: 'bg-emerald-100 text-emerald-700',
  it: 'bg-purple-100 text-purple-700',
  programming: 'bg-violet-100 text-violet-700',
  default: 'bg-slate-100 text-slate-700',
};

// Avatar component
const ColorAvatar = ({ name, avatarUrl, size = 'sm' }) => {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm' };
  const gradients = [
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ];

  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const gradient = gradients[(name?.charCodeAt(0) || 0) % gradients.length];

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-semibold text-white`}>
      {getInitials(name)}
    </div>
  );
};

// Simple Modal Component
const SimpleModal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const overlayRef = useRef(null);
  const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl', '2xl': 'max-w-7xl' }[size] || 'max-w-lg';

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative w-full ${sizeClass} transform rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Select Component
const Select = ({ value, onChange, options, placeholder, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// Schedule display helper
const formatScheduleDisplay = (schedule) => {
  const parsed = parseSchedule(schedule);
  if (parsed.length === 0) return '-';
  
  const days = parsed.map(s => DAY_NAMES[s.day]).join(', ');
  const time = parsed[0] ? `${parsed[0].start}-${parsed[0].end}` : '';
  return `${days} | ${time}`;
};

// Helper: Parse schedule safely (có thể là null, string hoặc array)
const parseSchedule = (schedule) => {
  if (!schedule) return [];
  if (Array.isArray(schedule)) return schedule;
  if (typeof schedule === 'string') {
    try {
      const parsed = JSON.parse(schedule);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Helper: Auto-generate class name based on course code
// Format: [MÃ KHÓA]-[MM][YY]-01  (VD: IELTS-BASIC-1125-01)
const generateClassName = (courseCode, startDate) => {
  if (!courseCode) return '';
  
  // Dùng start_date nếu có, không thì dùng ngày hiện tại
  const date = startDate ? new Date(startDate) : new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2); // Lấy 2 số cuối năm
  
  return `${courseCode}-${month}${year}-01`;
};

// Helper: Auto-generate class code (mã lớp) - giống tên lớp
const generateClassCode = (courseCode, startDate) => {
  return generateClassName(courseCode, startDate);
};

// ============ MAIN COMPONENT ============
export function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [centers, setCenters] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data - schedule giờ là mảng JSONB
  const [formData, setFormData] = useState({
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
  });

  // Schedule builder state
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  
  // Smart Validation Card state
  const [conflictStatus, setConflictStatus] = useState('idle'); // idle | checking | ok | conflict | error
  const [conflictMessages, setConflictMessages] = useState([]);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, classItem: null });
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const [classesRes, coursesRes, teachersRes, centersRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/api/classes`, { headers }),
        axios.get(`${API_URL}/api/courses`),
        axios.get(`${API_URL}/api/teachers`, { headers }),
        axios.get(`${API_URL}/api/centers`),
        axios.get(`${API_URL}/api/rooms`, { headers }),
      ]);

      if (classesRes.data?.success) setClasses(classesRes.data.data);
      if (coursesRes.data?.success) setCourses(coursesRes.data.data);
      if (teachersRes.data?.success) setTeachers(teachersRes.data.data);
      if (centersRes.data?.success) setCenters(centersRes.data.data);
      if (roomsRes.data?.success) setRooms(roomsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build schedule array from selected days and time
  useEffect(() => {
    if (selectedDays.length > 0 && startTime && endTime) {
      const newSchedule = selectedDays.map(day => ({
        day,
        start: startTime,
        end: endTime
      }));
      setFormData(prev => ({ ...prev, schedule: newSchedule }));
    } else {
      setFormData(prev => ({ ...prev, schedule: [] }));
    }
  }, [selectedDays, startTime, endTime]);

  // Check conflict API - Smart Validation Card
  const checkConflict = useCallback(async () => {
    // Kiểm tra dữ liệu đầu vào - Phải ĐỦ thông tin mới check
    const isValidInput = 
      formData.teacher_id && 
      formData.room_id && 
      formData.start_date && 
      formData.end_date && 
      selectedDays.length > 0 && 
      startTime && 
      endTime;

    if (!isValidInput) {
      setConflictStatus('idle');
      setConflictMessages([]);
      return;
    }

    // Bắt đầu gọi API
    setConflictStatus('checking');
    
    try {
      const headers = await getAuthHeaders();
      
      const res = await axios.post(`${API_URL}/api/classes/check-conflict`, {
        teacher_id: formData.teacher_id,
        room_id: formData.room_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        schedule: formData.schedule,
        exclude_class_id: editingClass?.id || null
      }, { headers });

      const conflicts = res.data.conflicts || [];
      
      if (conflicts.length > 0) {
        setConflictStatus('conflict');
        // Lấy message từ mỗi conflict
        setConflictMessages(conflicts.map(c => c.message));
      } else {
        setConflictStatus('ok');
        setConflictMessages([]);
      }
    } catch (error) {
      console.error('Error checking conflict:', error);
      setConflictStatus('error');
      setConflictMessages([]);
    }
  }, [formData.teacher_id, formData.room_id, formData.start_date, formData.end_date, formData.schedule, selectedDays, startTime, endTime, editingClass]);

  // Debounced conflict check
  useEffect(() => {
    const timer = setTimeout(checkConflict, 500);
    return () => clearTimeout(timer);
  }, [checkConflict]);

  // Filter classes
  const filteredClasses = classes.filter((cls) => {
    const matchSearch = 
      cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || cls.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Open modal for create/edit
  const openModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      // Parse schedule an toàn (có thể là string hoặc array)
      const schedule = parseSchedule(classItem.schedule);
      const days = schedule.map(s => s.day);
      const time = schedule[0] || { start: '18:00', end: '20:00' };
      
      setSelectedDays(days);
      setStartTime(time.start || '18:00');
      setEndTime(time.end || '20:00');
      
      setFormData({
        code: classItem.code || '',
        name: classItem.name || '',
        course_id: classItem.course_id || classItem.courses?.id || '',
        teacher_id: classItem.teacher_id || classItem.teacher?.id || '',
        center_id: classItem.center_id || classItem.centers?.id || '',
        room_id: classItem.room_id || '',
        start_date: classItem.start_date || '',
        end_date: classItem.end_date || '',
        schedule: schedule,
        max_students: classItem.max_students || 20,
        status: classItem.status || 'upcoming'
      });
    } else {
      setEditingClass(null);
      setSelectedDays([]);
      setStartTime('18:00');
      setEndTime('20:00');
      setFormData({
        code: '',
        name: '',
        course_id: '',
        teacher_id: '',
        center_id: centers[0]?.id || '',
        room_id: '',
        start_date: '',
        end_date: '',
        schedule: [],
        max_students: 20,
        status: 'upcoming'
      });
    }
    // Reset Smart Validation state
    setConflictStatus('idle');
    setConflictMessages([]);
    setModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate sĩ số không vượt sức chứa phòng
    if (selectedRoom && formData.max_students > selectedRoom.capacity) {
      alert(`Sĩ số tối đa (${formData.max_students}) không được vượt quá sức chứa phòng (${selectedRoom.capacity} chỗ)`);
      return;
    }

    if (conflictStatus === 'conflict') {
      const confirm = window.confirm(`Phát hiện xung đột lịch học. Bạn vẫn muốn tiếp tục?`);
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      const headers = await getAuthHeaders();
      
      const payload = {
        ...formData,
        room: null
      };

      if (editingClass) {
        await axios.put(`${API_URL}/api/admin/classes/${editingClass.id}`, payload, { headers });
      } else {
        await axios.post(`${API_URL}/api/admin/classes`, payload, { headers });
      }

      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving class:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle day selection
  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.classItem) return;
    setDeleting(true);

    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_URL}/api/admin/classes/${deleteModal.classItem.id}`, { headers });
      setDeleteModal({ isOpen: false, classItem: null });
      setSelectedIds(prev => prev.filter(id => id !== deleteModal.classItem.id)); // Remove from selection
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);

    try {
      const headers = await getAuthHeaders();
      // Xóa từng lớp một (có thể tối ưu bằng API batch delete sau)
      await Promise.all(
        selectedIds.map(id => 
          axios.delete(`${API_URL}/api/admin/classes/${id}`, { headers })
        )
      );
      
      setBulkDeleteModal(false);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      console.error('Error bulk deleting classes:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Toggle select single item
  const toggleSelectItem = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  // Toggle select all (filtered)
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredClasses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClasses.map(c => c.id));
    }
  };

  // Check if all filtered items are selected
  const isAllSelected = filteredClasses.length > 0 && selectedIds.length === filteredClasses.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredClasses.length;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Get selected room capacity
  const selectedRoom = rooms.find(r => r.id === formData.room_id);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Lớp học</h1>
          <p className="text-muted-foreground">Danh sách các lớp học của trung tâm</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Mở lớp mới
        </Button>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên lớp, mã lớp..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Tất cả trạng thái"
                options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Tổng: <strong>{filteredClasses.length}</strong> lớp
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                <span>Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <BookOpen className="h-10 w-10 text-slate-300" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter ? 'Không tìm thấy lớp học phù hợp' : 'Chưa có lớp học nào'}
              </p>
              {!searchTerm && !statusFilter && (
                <Button variant="outline" size="sm" onClick={() => openModal()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Mở lớp đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Bulk Action Bar - hiện khi có selection */}
              {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-medium">
                      {selectedIds.length}
                    </div>
                    <span className="text-sm font-medium text-indigo-900">
                      Đã chọn {selectedIds.length} lớp học
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      className="text-slate-600"
                    >
                      Bỏ chọn
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteModal(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa {selectedIds.length} lớp
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3 pr-2 w-10">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={el => {
                            if (el) el.indeterminate = isSomeSelected;
                          }}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="pb-3 pr-4">Lớp học</th>
                      <th className="pb-3 pr-4">Khóa học</th>
                      <th className="pb-3 pr-4">Giáo viên</th>
                      <th className="pb-3 pr-4">Lịch học</th>
                      <th className="pb-3 pr-4">Sĩ số</th>
                      <th className="pb-3 pr-4">Trạng thái</th>
                      <th className="pb-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                  {filteredClasses.map((cls) => {
                    const statusCfg = STATUS_CONFIG[cls.status] || STATUS_CONFIG.upcoming;
                    const categoryCfg = CATEGORY_COLORS[cls.courses?.category] || CATEGORY_COLORS.default;
                    const roomName = cls.rooms?.name || cls.room || '';
                    const isSelected = selectedIds.includes(cls.id);
                    
                    return (
                      <tr 
                        key={cls.id} 
                        className={`border-b last:border-0 transition-colors ${
                          isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-4 pr-2 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(cls.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div 
                            className="cursor-pointer group"
                            onClick={() => navigate(`/admin/classes/${cls.id}`)}
                          >
                            <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">
                              <code className="bg-slate-100 px-1 rounded">{cls.code}</code>
                              {roomName && <span className="ml-2">• {roomName}</span>}
                            </p>
                          </div>
                        </td>
                        
                        <td className="py-4 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryCfg}`}>
                            {cls.courses?.title || '-'}
                          </span>
                        </td>
                        
                        <td className="py-4 pr-4">
                          {cls.teacher ? (
                            <div className="flex items-center gap-2">
                              <ColorAvatar name={cls.teacher.full_name} avatarUrl={cls.teacher.avatar_url} />
                              <span className="text-sm">{cls.teacher.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Chưa phân công</span>
                          )}
                        </td>
                        
                        <td className="py-4 pr-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {formatScheduleDisplay(cls.schedule)}
                            </div>
                            {cls.start_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(cls.start_date)} - {formatDate(cls.end_date)}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className={`text-sm font-medium ${cls.enrolled_count >= cls.max_students ? 'text-red-600' : 'text-slate-700'}`}>
                              {cls.enrolled_count || 0}/{cls.max_students}
                            </span>
                          </div>
                        </td>
                        
                        <td className="py-4 pr-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => navigate(`/admin/classes/${cls.id}`)} 
                              title="Xem chi tiết"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openModal(cls)} title="Chỉnh sửa">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteModal({ isOpen: true, classItem: cls })}
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ============ MODAL XÓA HÀNG LOẠT ============ */}
      {bulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !bulkDeleting && setBulkDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa hàng loạt</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Bạn có chắc chắn muốn xóa <strong className="text-red-600">{selectedIds.length} lớp học</strong> đã chọn? 
                  Hành động này không thể hoàn tác.
                </p>
                
                {/* Preview danh sách sẽ xóa */}
                <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Danh sách lớp sẽ bị xóa:</p>
                  <div className="space-y-1">
                    {selectedIds.slice(0, 5).map(id => {
                      const cls = classes.find(c => c.id === id);
                      return cls ? (
                        <p key={id} className="text-xs text-slate-700">• {cls.name} ({cls.code})</p>
                      ) : null;
                    })}
                    {selectedIds.length > 5 && (
                      <p className="text-xs text-slate-400 italic">... và {selectedIds.length - 5} lớp khác</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setBulkDeleteModal(false)}
                disabled={bulkDeleting}
              >
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa {selectedIds.length} lớp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL MỞ LỚP MỚI - 2 CỘT ============ */}
      <SimpleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? '✏️ Chỉnh sửa Lớp học' : '🎓 Mở lớp mới'}
        size="2xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row">
            {/* ========== CỘT TRÁI - FORM ========== */}
            <div className="w-full lg:w-2/5 p-5 space-y-4 border-r">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mã lớp</Label>
                  <Input
                    placeholder="Tự động tạo khi chọn khóa học..."
                    value={formData.code}
                    readOnly
                    className="h-9 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tên lớp <span className="text-red-500">*</span></Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Tự động sinh khi chọn khóa học..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-9 text-sm flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const course = courses.find(c => c.id === formData.course_id);
                        if (course) {
                          const autoName = generateClassName(course.code, formData.start_date);
                          setFormData(prev => ({ ...prev, name: autoName }));
                        }
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="Tự động tạo tên lớp"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Khóa học <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.course_id}
                  onChange={(v) => {
                    // Tìm khóa học được chọn
                    const selectedCourse = courses.find(c => c.id === v);
                    
                    // LUÔN tự động sinh mã + tên khi đổi khóa học (cả tạo mới và edit)
                    let newCode = formData.code;
                    let newName = formData.name;
                    if (selectedCourse) {
                      newCode = generateClassCode(selectedCourse.code, formData.start_date);
                      newName = generateClassName(selectedCourse.code, formData.start_date);
                    }
                    
                    setFormData({ ...formData, course_id: v, code: newCode, name: newName });
                  }}
                  placeholder="Chọn khóa học"
                  options={courses.map(c => ({ value: c.id, label: `${c.code} - ${c.title}` }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  Giáo viên
                  {formData.teacher_id && <span className="text-slate-400">(Xem lịch bên phải)</span>}
                </Label>
                <Select
                  value={formData.teacher_id}
                  onChange={(v) => setFormData({ ...formData, teacher_id: v })}
                  placeholder="Chọn giáo viên"
                  options={teachers.map(t => ({ value: t.id, label: t.full_name || t.email }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trung tâm</Label>
                  <Select
                    value={formData.center_id}
                    onChange={(v) => {
                      setFormData({ ...formData, center_id: v, room_id: '' });
                    }}
                    placeholder="Chọn"
                    options={centers.map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    Phòng học
                    {selectedRoom && <span className="text-slate-400">({selectedRoom.capacity} chỗ)</span>}
                  </Label>
                  <Select
                    value={formData.room_id}
                    onChange={(v) => setFormData({ ...formData, room_id: v })}
                    placeholder="Chọn phòng"
                    options={rooms
                      .filter(r => !formData.center_id || r.center_id === formData.center_id)
                      .map(r => ({ value: r.id, label: `${r.name} (${r.capacity} chỗ)` }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ngày khai giảng</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      // LUÔN cập nhật mã lớp VÀ tên lớp khi thay đổi ngày khai giảng
                      const course = courses.find(c => c.id === formData.course_id);
                      let newCode = formData.code;
                      let newName = formData.name;
                      if (course && newStartDate) {
                        newCode = generateClassCode(course.code, newStartDate);
                        newName = generateClassName(course.code, newStartDate);
                      }
                      setFormData({ ...formData, start_date: newStartDate, code: newCode, name: newName });
                    }}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Ngày kết thúc</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* ====== LỊCH HỌC - CHỌN THỨ ====== */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Chọn thứ trong tuần</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDay(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        selectedDays.includes(value)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Giờ bắt đầu</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Giờ kết thúc</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Sĩ số tối đa</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedRoom?.capacity || 100}
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 20 })}
                    className={`h-9 text-sm ${
                      selectedRoom && formData.max_students > selectedRoom.capacity 
                        ? 'border-red-300 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  {/* Warning nếu sĩ số vượt sức chứa phòng */}
                  {selectedRoom && formData.max_students > selectedRoom.capacity && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      Vượt quá sức chứa phòng ({selectedRoom.capacity} chỗ)
                    </p>
                  )}
                  {/* Gợi ý sức chứa phòng */}
                  {selectedRoom && formData.max_students <= selectedRoom.capacity && (
                    <p className="text-xs text-slate-500 mt-1">
                      Sức chứa phòng: <span className="font-medium">{selectedRoom.capacity} chỗ</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Trạng thái</Label>
                  <Select
                    value={formData.status}
                    onChange={(v) => setFormData({ ...formData, status: v })}
                    placeholder="Chọn"
                    options={Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))}
                  />
                </div>
              </div>

              {/* ====== LỊCH HỌC ĐÃ CHỌN (Preview) ====== */}
              {formData.schedule.length > 0 && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-indigo-800">
                      <p className="font-medium">Lịch học đã chọn:</p>
                      <p className="text-indigo-700">
                        {selectedDays.map(d => DAY_NAMES[d]).join(', ')} | {startTime} - {endTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========== CỘT PHẢI - SMART VALIDATION CARD ========== */}
            <div className="w-full lg:w-3/5 p-6 bg-slate-50 border-l flex flex-col">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Kiểm tra tình trạng</h3>

              {/* CASE 1: IDLE - Chưa đủ thông tin */}
              {conflictStatus === 'idle' && (
                <div className="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-sm">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Info className="text-blue-600 w-6 h-6" />
                  </div>
                  <h4 className="text-slate-900 font-medium mb-1">Chưa đủ thông tin</h4>
                  <p className="text-sm text-slate-500">
                    Vui lòng chọn đầy đủ <b>Giáo viên</b>, <b>Phòng học</b>, <b>Ngày khai giảng/kết thúc</b> và <b>Lịch học</b> để hệ thống kiểm tra xung đột.
                  </p>
                </div>
              )}

              {/* CASE 2: CHECKING - Đang tải */}
              {conflictStatus === 'checking' && (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center shadow-sm">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Đang kiểm tra lịch trùng...</p>
                </div>
              )}

              {/* CASE 3: OK - Hợp lệ */}
              {conflictStatus === 'ok' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-green-800 font-bold text-lg">Lịch học Hợp lệ!</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Không phát hiện xung đột. Bạn có thể tạo lớp học này ngay.
                      </p>
                      <div className="mt-3 text-sm text-green-800 bg-green-100 p-2 rounded">
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Giáo viên: <b>Sẵn sàng</b></li>
                          <li>Phòng học: <b>Sẵn sàng</b></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 4: CONFLICT - Có xung đột */}
              {conflictStatus === 'conflict' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="w-full">
                      <h4 className="text-red-800 font-bold text-lg">Phát hiện xung đột!</h4>
                      <p className="text-red-700 text-sm mt-1 mb-3">
                        Lịch học này bị trùng với các lớp đã có. Vui lòng điều chỉnh lại.
                      </p>
                      
                      {/* Danh sách lỗi chi tiết */}
                      <div className="bg-white border border-red-100 rounded p-3 max-h-60 overflow-y-auto">
                        {conflictMessages.map((msg, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-red-600 mb-2 last:mb-0">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                            <span>{msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CASE 5: ERROR - Lỗi Server */}
              {conflictStatus === 'error' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertCircle className="text-orange-600 w-5 h-5" />
                  <span className="text-orange-800 text-sm">Không thể kiểm tra xung đột. Vui lòng thử lại.</span>
                </div>
              )}

              {/* Thông tin bổ sung */}
              <div className="mt-auto pt-4">
                <div className="text-xs text-slate-500 bg-white rounded-lg p-3 border border-slate-200">
                  <p className="font-medium text-slate-700 mb-1">💡 Hướng dẫn</p>
                  <ul className="space-y-1">
                    <li>• Hệ thống tự động kiểm tra xung đột khi bạn điền đủ thông tin</li>
                    <li>• Xung đột xảy ra khi giáo viên hoặc phòng đã có lịch trùng</li>
                    <li>• Bạn vẫn có thể tạo lớp nếu chấp nhận xung đột</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {editingClass ? 'Cập nhật' : 'Tạo lớp'}
                </>
              )}
            </Button>
          </div>
        </form>
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      <SimpleModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, classItem: null })}
        title="Xác nhận xóa lớp học"
        size="sm"
      >
        {deleteModal.classItem && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Bạn có chắc muốn xóa lớp này?</p>
                <p className="text-sm text-red-700 mt-1">
                  Lớp <strong>{deleteModal.classItem.name}</strong> ({deleteModal.classItem.code}) sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, classItem: null })}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa lớp'}
              </Button>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}
