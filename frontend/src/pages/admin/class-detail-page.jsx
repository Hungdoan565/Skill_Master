import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  ArrowLeft,
  Users,
  Calendar,
  GraduationCap,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Trash2,
  Edit,
  MoreVertical,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Banknote,
  Receipt,
  QrCode,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============ VIETQR CONFIG ============
// Cấu hình tài khoản ngân hàng trung tâm (có thể lấy từ .env hoặc settings)
const BANK_CONFIG = {
  bankId: 'VCB',              // Mã ngân hàng (MB, VCB, TCB, ACB, TPB...)
  accountNo: '1029849106',   // Số tài khoản nhận tiền
  accountName: 'SKILL MASTER EDU',  // Tên chủ tài khoản
  template: 'compact2'       // Template QR: compact, compact2, qr_only, print
};

// Day names mapping
const DAY_NAMES = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' };

// Status badge colors
const STATUS_CONFIG = {
  upcoming: { label: 'Sắp mở', color: 'bg-blue-100 text-blue-700' },
  ongoing: { label: 'Đang học', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Hoàn thành', color: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' }
};

// Payment status
const getPaymentStatus = (student) => {
  if (!student.tuition_fee || student.tuition_fee === 0) return { label: 'Chưa có học phí', color: 'bg-slate-100 text-slate-600' };
  if (student.remaining <= 0) return { label: 'Đã đóng đủ', color: 'bg-green-100 text-green-700' };
  if (student.paid_amount > 0) return { label: `Còn nợ ${student.remaining.toLocaleString()}đ`, color: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Chưa đóng', color: 'bg-red-100 text-red-700' };
};

// Helper: Parse schedule safely
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

// Format schedule for display
const formatScheduleDisplay = (schedule) => {
  const parsed = parseSchedule(schedule);
  if (parsed.length === 0) return 'Chưa có lịch';
  
  const days = parsed.map(s => DAY_NAMES[s.day]).join(', ');
  const time = parsed[0] ? `${parsed[0].start} - ${parsed[0].end}` : '';
  return `${days} | ${time}`;
};

// Avatar component
const Avatar = ({ name, size = 'md', url }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name?.split(' ').map(n => n[0]).join('').slice(-2).toUpperCase() || '?';
  
  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }
  
  // Generate color from name
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500'];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  
  return (
    <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);

// ============ MAIN COMPONENT ============
export function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  // States
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  // ============ PAGINATION & FILTER STATES ============
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    paymentStatus: 'all' // all | paid | unpaid
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [summary, setSummary] = useState({
    totalInClass: 0,
    paid: 0,
    unpaid: 0
  });
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(''); // Debounce input

  // Modal thêm học viên
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [enrolling, setEnrolling] = useState(null);
  const [resultType, setResultType] = useState('recent'); // 'recent' | 'search'

  // Modal xác nhận xóa học viên
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modal Thu phí
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentToPay, setStudentToPay] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false); // Đã copy nội dung CK

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // API headers
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  }), [session?.access_token]);

  // Fetch class details
  const fetchClassDetail = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/classes/${id}`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setClassData(json.data);
      }
    } catch (error) {
      console.error('Error fetching class detail:', error);
    }
  }, [id, getHeaders]);

  // Fetch students in class với pagination & filters
  const fetchStudents = useCallback(async (filterParams = filters) => {
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({
        page: filterParams.page.toString(),
        limit: filterParams.limit.toString(),
        payment_status: filterParams.paymentStatus,
        search: filterParams.search
      });
      
      const res = await fetch(`${API_URL}/api/classes/${id}/students?${params}`, { headers: getHeaders() });
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
        setPagination(json.pagination || {
          total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false
        });
        setSummary(json.summary || { totalInClass: 0, paid: 0, unpaid: 0 });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, [id, getHeaders, filters]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClassDetail(), fetchStudents(filters)]);
      setLoading(false);
    };
    if (session?.access_token && id) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, id]);

  // Khi filters thay đổi (trừ initial load)
  useEffect(() => {
    if (session?.access_token && id && !loading) {
      fetchStudents(filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.paymentStatus, filters.search]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputValue !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInputValue, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Helper functions for pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit) => {
    setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  const handlePaymentFilterChange = (status) => {
    setFilters(prev => ({ ...prev, paymentStatus: status, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInputValue('');
    setFilters({ page: 1, limit: 10, search: '', paymentStatus: 'all' });
  };

  // Fetch recent students (khi mở modal)
  const fetchRecentStudents = useCallback(async () => {
    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?exclude_class_id=${id}`,
        { headers: getHeaders() }
      );
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data || []);
        setResultType('recent');
      }
    } catch (error) {
      console.error('Error fetching recent students:', error);
    } finally {
      setSearching(false);
    }
  }, [id, getHeaders]);

  // Khi mở modal -> Load danh sách học viên mới
  useEffect(() => {
    if (showAddModal && session?.access_token) {
      fetchRecentStudents();
    }
  }, [showAddModal, session?.access_token, fetchRecentStudents]);

  // Search students
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Nếu xóa hết text -> Load lại danh sách gợi ý
    if (!query || query.length === 0) {
      fetchRecentStudents();
      return;
    }
    
    // Chờ ít nhất 2 ký tự mới search
    if (query.length < 2) {
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/students/search?q=${encodeURIComponent(query)}&exclude_class_id=${id}`,
        { headers: getHeaders() }
      );
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data || []);
        setResultType(json.type || 'search');
      }
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearching(false);
    }
  };

  // Enroll student
  const handleEnroll = async (student) => {
    setEnrolling(student.id);
    try {
      const res = await fetch(`${API_URL}/api/classes/${id}/enroll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          student_id: student.id,
          tuition_fee: classData?.courses?.price || 0
        })
      });
      const json = await res.json();
      if (json.success) {
        // Refresh students list với filters hiện tại
        await fetchStudents(filters);
        // Remove from search results
        setSearchResults(prev => prev.filter(s => s.id !== student.id));
        // Update class data (student count)
        await fetchClassDetail();
        // Show success toast
        showToast(`Đã thêm "${student.full_name}" vào lớp`, 'success');
      } else {
        showToast(json.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      showToast('Có lỗi xảy ra khi ghi danh', 'error');
    } finally {
      setEnrolling(null);
    }
  };

  // Remove student from class - Mở modal xác nhận
  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  // Thực hiện xóa học viên
  const handleRemoveStudent = async () => {
    if (!studentToDelete) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/classes/${id}/students/${studentToDelete.student_id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const json = await res.json();
      if (json.success) {
        // Refresh lại danh sách với filters hiện tại (để cập nhật pagination đúng)
        await fetchStudents(filters);
        // Cập nhật class data (student count)
        await fetchClassDetail();
        showToast(`Đã xóa "${studentToDelete.full_name}" khỏi lớp`, 'success');
        // Đóng modal
        setShowDeleteModal(false);
        setStudentToDelete(null);
      } else {
        showToast(json.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      showToast('Có lỗi xảy ra khi xóa học viên', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ============ PAYMENT MODAL HANDLERS ============
  const openPaymentModal = (student) => {
    setStudentToPay(student);
    // Pre-fill với số tiền còn nợ
    setPaymentData({
      amount: student.remaining > 0 ? student.remaining.toString() : '',
      method: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setStudentToPay(null);
    setPaymentData({ amount: '', method: 'cash', notes: '' });
  };

  const handlePaymentSubmit = async () => {
    if (!studentToPay || !paymentData.amount) {
      showToast('Vui lòng nhập số tiền thanh toán', 'error');
      return;
    }

    const amount = parseFloat(paymentData.amount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      showToast('Số tiền không hợp lệ', 'error');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          enrollment_id: studentToPay.enrollment_id,
          student_id: studentToPay.student_id,
          class_id: id,
          amount: amount,
          payment_method: paymentData.method,
          notes: paymentData.notes
        })
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Đã thu ${amount.toLocaleString()}đ từ "${studentToPay.full_name}"`, 'success');
        closePaymentModal();
        // Refresh danh sách học viên
        await fetchStudents(filters);
      } else {
        showToast(json.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast('Có lỗi xảy ra khi xử lý thanh toán', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Format number input
  const formatCurrency = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    return num ? parseInt(num).toLocaleString('vi-VN') : '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Not found
  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg text-slate-600">Không tìm thấy lớp học</p>
        <Button onClick={() => navigate('/admin/classes')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[classData.status] || STATUS_CONFIG.upcoming;

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <button 
            onClick={() => navigate('/admin/classes')} 
            className="hover:text-indigo-600 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Quản lý lớp học
          </button>
          <span>/</span>
          <span className="text-slate-900 font-medium">{classData.code}</span>
        </div>

        {/* Title & Status */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{classData.name}</h1>
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            </div>
            <p className="text-slate-500">Mã lớp: {classData.code}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/admin/classes?edit=${id}`)}>
              <Edit className="w-4 h-4 mr-2" /> Sửa thông tin
            </Button>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          {/* Khóa học */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Khóa học</p>
              <p className="text-sm font-medium text-slate-900 truncate">{classData.courses?.title || '-'}</p>
            </div>
          </div>

          {/* Giáo viên */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Giáo viên</p>
              <p className="text-sm font-medium text-slate-900 truncate">{classData.users?.full_name || 'Chưa phân'}</p>
            </div>
          </div>

          {/* Sĩ số */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Sĩ số</p>
              <p className="text-sm font-medium text-slate-900">
                {classData.current_students || 0}/{classData.max_students || 20}
              </p>
            </div>
          </div>

          {/* Lịch học */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Lịch học</p>
              <p className="text-sm font-medium text-slate-900 truncate">{formatScheduleDisplay(classData.schedule)}</p>
            </div>
          </div>

          {/* Phòng học */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-violet-100 rounded-lg">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Phòng</p>
              <p className="text-sm font-medium text-slate-900">{classData.rooms?.name || 'Chưa xếp'}</p>
            </div>
          </div>

          {/* Trung tâm */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Building2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Trung tâm</p>
              <p className="text-sm font-medium text-slate-900 truncate">{classData.centers?.name || '-'}</p>
            </div>
          </div>
        </div>

        {/* Progress bar - Tiến độ khóa học */}
        {classData.courses?.total_sessions && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Tiến độ khóa học</span>
              <span className="font-medium text-slate-900">0/{classData.courses.total_sessions} buổi</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all" 
                style={{ width: '0%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ============ TABS ============ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200">
          <TabButton 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
            icon={Users}
          >
            Học viên ({students.length})
          </TabButton>
          <TabButton 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')}
            icon={Calendar}
          >
            Lịch trình & Điểm danh
          </TabButton>
          <TabButton 
            active={activeTab === 'grades'} 
            onClick={() => setActiveTab('grades')}
            icon={GraduationCap}
          >
            Bảng điểm
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ============ TAB 1: STUDENTS ============ */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {/* ========== TOOLBAR: Tiêu đề + Nút thêm ========== */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Danh sách học viên</h3>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Thêm học viên
                </Button>
              </div>

              {/* ========== FILTER BAR: Search trái, Controls phải ========== */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                {/* Trái: Search Input */}
                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    placeholder="Tìm tên, email, SĐT..."
                    className="pl-10 bg-white border-slate-200 focus:border-indigo-400"
                  />
                  {searchInputValue && (
                    <button
                      onClick={() => setSearchInputValue('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Phải: Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Payment Status Filter - Custom styled */}
                  <div className="relative">
                    <select
                      value={filters.paymentStatus}
                      onChange={(e) => handlePaymentFilterChange(e.target.value)}
                      className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none cursor-pointer transition-all hover:border-slate-300"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="paid">● Đã đóng đủ</option>
                      <option value="unpaid">● Còn nợ</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {/* Color indicator dot */}
                    {filters.paymentStatus !== 'all' && (
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                        filters.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                    )}
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block h-6 w-px bg-slate-200" />

                  {/* Page Size */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 whitespace-nowrap">Hiển thị</span>
                    <select
                      value={filters.limit}
                      onChange={(e) => handleLimitChange(e.target.value)}
                      className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer transition-all hover:border-slate-300"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {(filters.search || filters.paymentStatus !== 'all') && (
                    <>
                      <div className="hidden sm:block h-6 w-px bg-slate-200" />
                      <button 
                        onClick={clearFilters} 
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Xóa lọc</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Filter Summary - Compact badge row */}
              {(filters.search || filters.paymentStatus !== 'all') && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Bộ lọc:</span>
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                      <Search className="w-3 h-3" />
                      "{filters.search}"
                    </span>
                  )}
                  {filters.paymentStatus === 'paid' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Đã đóng đủ
                    </span>
                  )}
                  {filters.paymentStatus === 'unpaid' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Còn nợ
                    </span>
                  )}
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">{pagination.total} kết quả</span>
                </div>
              )}

              {/* ========== STUDENTS TABLE ========== */}
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  {filters.search || filters.paymentStatus !== 'all' ? (
                    <>
                      <p className="text-slate-600 font-medium">Không tìm thấy học viên</p>
                      <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      <Button variant="outline" className="mt-4" onClick={clearFilters}>
                        <X className="w-4 h-4 mr-2" /> Xóa bộ lọc
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-500">Chưa có học viên nào trong lớp</p>
                      <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Thêm học viên đầu tiên
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Học viên</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày vào lớp</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Học phí</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {students.map((student) => {
                        const paymentStatus = getPaymentStatus(student);
                        return (
                          <tr key={student.enrollment_id} className="hover:bg-slate-50 transition-colors">
                            {/* Avatar + Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={student.full_name} url={student.avatar_url} />
                                <div>
                                  <p className="font-medium text-slate-900">{student.full_name}</p>
                                  <p className="text-xs text-slate-500">{student.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-600">{student.phone || '-'}</p>
                            </td>

                            {/* Enrolled date */}
                            <td className="py-3 px-4">
                              <p className="text-sm text-slate-600">
                                {new Date(student.enrolled_at).toLocaleDateString('vi-VN')}
                              </p>
                            </td>

                            {/* Tuition */}
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                <p className="text-slate-900 font-medium">
                                  {(student.amount_due || 0).toLocaleString()}đ
                                </p>
                                <p className="text-xs text-slate-500">
                                  Đã đóng: {(student.paid_amount || 0).toLocaleString()}đ
                                </p>
                              </div>
                            </td>

                            {/* Payment Status - Click để mở Modal Thu phí */}
                            <td className="py-3 px-4">
                              {student.remaining > 0 ? (
                                <button
                                  onClick={() => openPaymentModal(student)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:ring-2 hover:ring-offset-1 ${paymentStatus.color} hover:ring-current`}
                                  title="Click để thu tiền"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  {paymentStatus.label}
                                </button>
                              ) : (
                                <Badge className={paymentStatus.color}>{paymentStatus.label}</Badge>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Nút Thu tiền (hiện khi còn nợ) */}
                                {student.remaining > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openPaymentModal(student)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    title="Thu học phí"
                                  >
                                    <Banknote className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openDeleteModal(student)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ========== PAGINATION ========== */}
              {pagination.totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  {/* Summary */}
                  <div className="text-sm text-slate-500">
                    Đang xem <span className="font-medium text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium text-slate-900">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}trên tổng số{' '}
                    <span className="font-medium text-slate-900">{pagination.total}</span> học viên
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-1">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-2"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    
                    {/* Prev Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {/* Generate page buttons */}
                      {(() => {
                        const pages = [];
                        const current = pagination.page;
                        const total = pagination.totalPages;
                        
                        // Always show first page
                        if (current > 3) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className="w-8 h-8 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                              1
                            </button>
                          );
                          if (current > 4) {
                            pages.push(<span key="dots1" className="px-1 text-slate-400">...</span>);
                          }
                        }
                        
                        // Pages around current
                        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                i === current
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        // Always show last page
                        if (current < total - 2) {
                          if (current < total - 3) {
                            pages.push(<span key="dots2" className="px-1 text-slate-400">...</span>);
                          }
                          pages.push(
                            <button
                              key={total}
                              onClick={() => handlePageChange(total)}
                              className="w-8 h-8 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                              {total}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>

                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      disabled={!pagination.hasNextPage}
                      className="px-2"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ========== SUMMARY CARDS ========== */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Tổng học viên trong lớp</p>
                  <p className="text-2xl font-bold text-slate-900">{summary.totalInClass}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Đã đóng đủ</p>
                  <p className="text-2xl font-bold text-green-700">{summary.paid}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Còn nợ</p>
                  <p className="text-2xl font-bold text-red-700">{summary.unpaid}</p>
                </div>
              </div>
            </div>
          )}

          {/* ============ TAB 2: SCHEDULE ============ */}
          {activeTab === 'schedule' && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Tính năng Lịch trình & Điểm danh đang phát triển</p>
              <p className="text-sm text-slate-400 mt-1">Sẽ sớm cập nhật trong phiên bản tiếp theo</p>
            </div>
          )}

          {/* ============ TAB 3: GRADES ============ */}
          {activeTab === 'grades' && (
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Tính năng Bảng điểm đang phát triển</p>
              <p className="text-sm text-slate-400 mt-1">Sẽ sớm cập nhật trong phiên bản tiếp theo</p>
            </div>
          )}
        </div>
      </div>

      {/* ============ MODAL: THÊM HỌC VIÊN ============ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => {
              setShowAddModal(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Thêm học viên vào lớp</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm theo tên, email hoặc số điện thoại..."
                  className="pl-10"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                💡 Nhập ít nhất 2 ký tự để tìm kiếm. Học viên đã trong lớp sẽ tự động bị loại trừ.
              </p>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[350px]">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                  <p className="text-sm text-slate-500">Đang tải...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  {searchQuery.length >= 2 ? (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 font-medium">Không tìm thấy học viên</p>
                      <p className="text-sm text-slate-400 mt-1">Thử tìm với từ khóa khác</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-amber-400" />
                      </div>
                      <p className="text-slate-600 font-medium">Chưa có học viên nào</p>
                      <p className="text-sm text-slate-400 mt-1">Tất cả học viên đã được thêm vào lớp hoặc chưa có học viên trong hệ thống</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Tiêu đề thay đổi theo ngữ cảnh */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-slate-500">
                      {resultType === 'recent' ? (
                        <>🕐 Học viên mới đăng ký ({searchResults.length})</>
                      ) : (
                        <>🔍 Kết quả tìm kiếm ({searchResults.length})</>
                      )}
                    </p>
                  </div>
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={student.full_name} url={student.avatar_url} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{student.full_name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleEnroll(student)}
                        disabled={enrolling === student.id}
                        className="ml-3 shrink-0"
                      >
                        {enrolling === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" /> Thêm
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer với thông tin bổ sung */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 text-center">
                📋 Học phí mặc định: <strong>{(classData?.courses?.price || 0).toLocaleString()}đ</strong> (theo khóa học)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: THU HỌC PHÍ ============ */}
      {showPaymentModal && studentToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => !processing && closePaymentModal()}
          />
          
          {/* Modal - Compact version */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header - Compact with Student Name */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Thu học phí - {studentToPay?.full_name}</h3>
                    <p className="text-xs text-emerald-100">Lớp {classData?.code}</p>
                  </div>
                </div>
                <button 
                  onClick={closePaymentModal}
                  disabled={processing}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Student Info - Compact */}
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Avatar name={studentToPay.full_name} url={studentToPay.avatar_url} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{studentToPay.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{studentToPay.email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info Summary - Inline Compact */}
              <div className="px-4 py-2 flex gap-2 border-b border-slate-100">
                <div className="flex-1 p-2 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Tổng</p>
                  <p className="text-sm font-bold text-slate-900">
                    {(studentToPay.amount_due || 0).toLocaleString()}đ
                  </p>
                </div>
                <div className="flex-1 p-2 bg-emerald-50 rounded-lg text-center">
                  <p className="text-xs text-emerald-600">Đã đóng</p>
                  <p className="text-sm font-bold text-emerald-700">
                    {(studentToPay.paid_amount || 0).toLocaleString()}đ
                  </p>
                </div>
                <div className="flex-1 p-2 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-red-600">Còn nợ</p>
                  <p className="text-sm font-bold text-red-600">
                    {(studentToPay.remaining || 0).toLocaleString()}đ
                  </p>
                </div>
              </div>

              {/* Form - Compact */}
              <div className="px-4 py-3 space-y-3">
                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số tiền thực đóng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formatCurrency(paymentData.amount)}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      placeholder="Nhập số tiền..."
                      className="w-full h-10 pl-8 pr-10 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      autoFocus
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">VNĐ</span>
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {studentToPay.remaining > 0 && (
                      <button
                        onClick={() => setPaymentData({ ...paymentData, amount: studentToPay.remaining.toString() })}
                        className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                      >
                        Đóng đủ
                      </button>
                    )}
                    {[1000000, 2000000, 5000000].filter(v => v <= studentToPay.remaining).map(amount => (
                    <button
                      key={amount}
                      onClick={() => setPaymentData({ ...paymentData, amount: amount.toString() })}
                      className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                    >
                      {(amount / 1000000).toFixed(0)}tr
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method - Compact */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setPaymentData({ ...paymentData, method: 'cash' }); setCopied(false); }}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-all text-sm ${
                      paymentData.method === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="font-medium">Tiền mặt</span>
                  </button>
                  <button
                    onClick={() => { setPaymentData({ ...paymentData, method: 'bank_transfer' }); setCopied(false); }}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 transition-all text-sm ${
                      paymentData.method === 'bank_transfer'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="font-medium">Chuyển khoản</span>
                  </button>
                </div>

                {/* ============ VIETQR CODE SECTION - Compact ============ */}
                {paymentData.method === 'bank_transfer' && paymentData.amount && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-3">
                      {/* QR Code Image - Smaller */}
                      <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                        <img 
                          src={`https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${parseInt(paymentData.amount.replace(/[^0-9]/g, '')) || 0}&addInfo=${encodeURIComponent(`HP ${studentToPay?.full_name?.split(' ').pop() || ''} ${classData?.code || ''}`)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`}
                          alt="VietQR Code"
                          className="w-28 h-28 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-28 h-28 items-center justify-center text-slate-400 text-xs text-center">
                          <div>
                            <QrCode className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <p>Lỗi QR</p>
                          </div>
                        </div>
                      </div>

                      {/* Bank Info - Side */}
                      <div className="flex-1 flex flex-col justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Smartphone className="w-3 h-3 text-blue-600" />
                            <span className="font-medium text-blue-700">VietQR</span>
                          </div>
                          <p className="text-slate-500">NH: <span className="font-semibold text-slate-700">{BANK_CONFIG.bankId}</span></p>
                          <p className="text-slate-500">STK: <span className="font-semibold text-slate-700">{BANK_CONFIG.accountNo}</span></p>
                          <p className="text-slate-500 truncate">CTK: <span className="font-semibold text-slate-700">{BANK_CONFIG.accountName}</span></p>
                        </div>
                        
                        {/* Transfer Content - Inline */}
                        <div className="mt-2">
                          <p className="text-slate-500 mb-0.5">Nội dung CK:</p>
                          <div className="flex items-center gap-1 bg-white rounded border border-blue-200 p-1">
                            <code className="flex-1 text-xs font-mono text-blue-700 truncate">
                              HP {studentToPay?.full_name?.split(' ').pop() || ''} {classData?.code || ''}
                            </code>
                            <button
                              onClick={() => {
                                const content = `HP ${studentToPay?.full_name?.split(' ').pop() || ''} ${classData?.code || ''}`;
                                navigator.clipboard.writeText(content);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className={`p-1 rounded transition-colors ${
                                copied 
                                  ? 'bg-emerald-100 text-emerald-600' 
                                  : 'hover:bg-blue-100 text-blue-600'
                              }`}
                              title="Copy"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                        
                        {/* Amount Display */}
                        <div className="mt-2 px-2 py-1 bg-emerald-100 rounded text-center">
                          <p className="text-xs font-bold text-emerald-700">
                            {parseInt(paymentData.amount.replace(/[^0-9]/g, '') || 0).toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes - Compact */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="VD: Đóng trước 50%, hẹn đóng nốt tuần sau..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            </div>

            {/* Footer - Compact */}
            <div className="flex-shrink-0 px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={closePaymentModal}
                disabled={processing}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handlePaymentSubmit}
                disabled={processing || !paymentData.amount}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 " />
                    Xác nhận thu <span className="font-bold ml-1">{parseInt(paymentData.amount?.replace(/[^0-9]/g, '') || 0).toLocaleString('vi-VN')}đ</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ TOAST NOTIFICATION ============ */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 p-0.5 hover:bg-white/50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============ MODAL: XÁC NHẬN XÓA HỌC VIÊN ============ */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => {
              if (!deleting) {
                setShowDeleteModal(false);
                setStudentToDelete(null);
              }
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 text-center">
                Xác nhận xóa học viên
              </h3>
              <p className="text-sm text-slate-500 text-center mt-2">
                Bạn có chắc muốn xóa học viên <strong className="text-slate-700">"{studentToDelete.full_name}"</strong> khỏi lớp?
              </p>
            </div>

            {/* Student info preview */}
            <div className="mx-6 my-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3">
              <Avatar name={studentToDelete.full_name} url={studentToDelete.avatar_url} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{studentToDelete.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{studentToDelete.email}</p>
              </div>
            </div>

            {/* Warning */}
            <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                ⚠️ Lưu ý: Hành động này sẽ xóa học viên khỏi lớp và các dữ liệu liên quan (điểm danh, điểm số). Hóa đơn học phí vẫn được giữ lại.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-t border-slate-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setStudentToDelete(null);
                }}
                disabled={deleting}
              >
                Hủy bỏ
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRemoveStudent}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa học viên
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
