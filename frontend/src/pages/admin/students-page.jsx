import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter,
  Eye,
  UserCog,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

// Helper: Lấy token
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Chưa đăng nhập');
  }
  return { Authorization: `Bearer ${session.access_token}` };
};

// Avatar với màu nền ngẫu nhiên
const ColorAvatar = ({ name, avatarUrl, size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const gradients = [
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
  ];

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getGradient = (name) => {
    if (!name) return gradients[0];
    const charCode = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
    return gradients[charCode % gradients.length];
  };

  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={name} 
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${getGradient(name)} font-semibold text-white ring-2 ring-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
};

// Dropdown Menu Component
const ActionMenu = ({ student, onPromote, onViewDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-white py-1 shadow-lg z-10">
          <button
            onClick={() => { onViewDetails(student); setIsOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Xem chi tiết
          </button>
          <button
            onClick={() => { onPromote(student); setIsOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
          >
            <UserCog className="h-4 w-4" />
            Chuyển thành Nhân viên
          </button>
        </div>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
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
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Select Component
const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [promoteModal, setPromoteModal] = useState({ isOpen: false, student: null });
  const [selectedRole, setSelectedRole] = useState('TEACHER');
  const [promoting, setPromoting] = useState(false);

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`/api/admin/students?${params}`, { headers });
      if (response.data?.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  // Filter by search
  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm)
  );

  // Handle promote student to staff
  const handlePromote = async () => {
    if (!promoteModal.student) return;
    setPromoting(true);
    
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch(
        `/api/admin/users/${promoteModal.student.id}/role`,
        { role_code: selectedRole },
        { headers }
      );
      
      if (response.data?.success) {
        // Remove from students list (they're now staff)
        setStudents(prev => prev.filter(s => s.id !== promoteModal.student.id));
        setPromoteModal({ isOpen: false, student: null });
        alert(`Đã chuyển ${promoteModal.student.full_name} thành ${selectedRole === 'TEACHER' ? 'Giáo viên' : 'Quản lý'}`);
      }
    } catch (error) {
      console.error('Error promoting student:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setPromoting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Học viên</h1>
          <p className="text-muted-foreground">
            Danh sách học viên đã đăng ký tài khoản
          </p>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 border border-green-200">
          <GraduationCap className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            {students.length} học viên
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên, email hoặc SĐT..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Tất cả trạng thái"
                  options={[
                    { value: 'active', label: 'Hoạt động' },
                    { value: 'inactive', label: 'Ngừng hoạt động' },
                  ]}
                />
              </div>
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Hiển thị: <strong>{filteredStudents.length}</strong> / {students.length}
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
          ) : filteredStudents.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <AlertCircle className="h-10 w-10 text-slate-300" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter
                  ? 'Không tìm thấy học viên phù hợp'
                  : 'Chưa có học viên nào đăng ký'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Học viên</th>
                    <th className="pb-3 pr-4">Liên hệ</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                    <th className="pb-3 pr-4">Ngày đăng ký</th>
                    <th className="pb-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      {/* Avatar + Name */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <ColorAvatar 
                            name={student.full_name} 
                            avatarUrl={student.avatar_url}
                          />
                          <div>
                            <p className="font-medium text-slate-900">
                              {student.full_name || 'Chưa cập nhật'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {student.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Contact */}
                      <td className="py-4 pr-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {student.email}
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 pr-4">
                        <Badge variant={student.status === 'active' ? 'success' : 'secondary'}>
                          {student.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                        </Badge>
                      </td>
                      
                      {/* Created Date */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(student.created_at)}
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-4 text-right">
                        <ActionMenu 
                          student={student}
                          onViewDetails={(s) => alert(`Chi tiết: ${s.full_name}\nEmail: ${s.email}`)}
                          onPromote={(s) => {
                            setPromoteModal({ isOpen: true, student: s });
                            setSelectedRole('TEACHER');
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Chuyển thành Nhân viên */}
      <Modal
        isOpen={promoteModal.isOpen}
        onClose={() => setPromoteModal({ isOpen: false, student: null })}
        title="Chuyển thành Nhân viên"
      >
        {promoteModal.student && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <ColorAvatar name={promoteModal.student.full_name} size="lg" />
              <div>
                <p className="font-medium">{promoteModal.student.full_name}</p>
                <p className="text-sm text-muted-foreground">{promoteModal.student.email}</p>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Lưu ý:</p>
                <p>Sau khi chuyển, học viên này sẽ trở thành nhân viên và có quyền truy cập hệ thống quản lý.</p>
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn vai trò mới</label>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                placeholder="Chọn vai trò"
                options={[
                  { value: 'TEACHER', label: '👨‍🏫 Giáo viên' },
                  { value: 'CENTER_MANAGER', label: '👔 Quản lý Trung tâm' },
                ]}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setPromoteModal({ isOpen: false, student: null })}
              >
                Hủy
              </Button>
              <Button 
                onClick={handlePromote}
                disabled={promoting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {promoting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Xác nhận
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
