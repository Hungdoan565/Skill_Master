import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, Pencil, Trash2, X, UserPlus, Filter, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

// Helper: Lấy token và tạo headers
const getAuthHeaders = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('[Staff] Getting auth session:', { hasSession: !!session, error });
  
  if (!session?.access_token) {
    console.error('[Staff] No access token found!');
    throw new Error('Chưa đăng nhập');
  }
  
  console.log('[Staff] Token found, length:', session.access_token.length);
  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

// Role config với màu sắc
const ROLE_CONFIG = {
  CENTER_MANAGER: { 
    label: 'Quản lý', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500'
  },
  TEACHER: { 
    label: 'Giáo viên', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500'
  },
  SUPER_ADMIN: { 
    label: 'Super Admin', 
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500'
  },
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
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

// Select Component đơn giản
const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role_code: 'TEACHER',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const params = roleFilter ? `?role=${roleFilter}` : '';
      const response = await axios.get(`/api/admin/staff${params}`, { headers });
      if (response.data?.success) {
        setStaff(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Mock data nếu API chưa có hoặc lỗi
      setStaff([
        {
          id: '1',
          full_name: 'Nguyễn Văn A',
          email: 'teacher.a@skillmaster.edu.vn',
          phone: '0901234567',
          avatar_url: null,
          status: 'active',
          created_at: new Date().toISOString(),
          roles: { code: 'TEACHER', name: 'Giáo viên' }
        },
        {
          id: '2',
          full_name: 'Trần Thị B',
          email: 'manager.hcm@skillmaster.edu.vn',
          phone: '0912345678',
          avatar_url: null,
          status: 'active',
          created_at: new Date().toISOString(),
          roles: { code: 'CENTER_MANAGER', name: 'Quản lý Trung tâm' }
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  // Filter staff by search term
  const filteredStaff = staff.filter(
    (member) =>
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post('/api/admin/users', formData, { headers });
      if (response.data?.success) {
        setSuccessMessage({
          email: formData.email,
          password: response.data.data?.default_password || 'SkillMaster@123',
        });
        // Reset form
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          role_code: 'TEACHER',
        });
        // Refresh list
        fetchStaff();
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy password to clipboard
  const copyPassword = () => {
    navigator.clipboard.writeText(successMessage?.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Close modal and reset
  const closeModal = () => {
    setIsModalOpen(false);
    setSuccessMessage(null);
    setCopiedPassword(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Nhân sự</h1>
          <p className="text-muted-foreground">
            Danh sách giáo viên và quản lý trung tâm
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
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
                placeholder="Tìm theo tên hoặc email..."
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
                  value={roleFilter}
                  onChange={setRoleFilter}
                  placeholder="Tất cả vai trò"
                  options={[
                    { value: 'TEACHER', label: 'Giáo viên' },
                    { value: 'CENTER_MANAGER', label: 'Quản lý' },
                  ]}
                />
              </div>
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Tổng: <strong>{filteredStaff.length}</strong> nhân viên
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
          ) : filteredStaff.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">
                {searchTerm || roleFilter
                  ? 'Không tìm thấy nhân viên phù hợp'
                  : 'Chưa có nhân viên nào'}
              </p>
              {!searchTerm && !roleFilter && (
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm nhân viên đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Nhân viên</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Vai trò</th>
                    <th className="pb-3 pr-4">Trạng thái</th>
                    <th className="pb-3 pr-4">Ngày tạo</th>
                    <th className="pb-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => {
                    const roleCode = member.roles?.code || 'TEACHER';
                    const roleConfig = ROLE_CONFIG[roleCode] || ROLE_CONFIG.TEACHER;
                    
                    return (
                      <tr
                        key={member.id}
                        className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        {/* Avatar + Name */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <ColorAvatar 
                              name={member.full_name} 
                              avatarUrl={member.avatar_url}
                            />
                            <div>
                              <p className="font-medium text-slate-900">
                                {member.full_name}
                              </p>
                              {member.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {member.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Email */}
                        <td className="py-4 pr-4">
                          <span className="text-sm text-slate-600">
                            {member.email}
                          </span>
                        </td>
                        
                        {/* Role Badge */}
                        <td className="py-4 pr-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${roleConfig.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${roleConfig.dotColor}`} />
                            {roleConfig.label}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="py-4 pr-4">
                          <Badge variant={member.status === 'active' ? 'success' : 'secondary'}>
                            {member.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                          </Badge>
                        </td>
                        
                        {/* Created Date */}
                        <td className="py-4 pr-4 text-sm text-muted-foreground">
                          {formatDate(member.created_at)}
                        </td>
                        
                        {/* Actions */}
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Chỉnh sửa">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
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
          )}
        </CardContent>
      </Card>

      {/* Modal Thêm nhân viên */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={successMessage ? '✅ Tạo tài khoản thành công!' : 'Thêm nhân viên mới'}
      >
        {successMessage ? (
          // Success State
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-800">
                Đã tạo tài khoản cho <strong>{successMessage.email}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Mật khẩu mặc định</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={successMessage.password} 
                  readOnly 
                  className="font-mono bg-slate-50"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyPassword}
                  title="Copy"
                >
                  {copiedPassword ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Gửi mật khẩu này cho nhân viên và yêu cầu đổi sau khi đăng nhập lần đầu.
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeModal}>
                Đóng
              </Button>
              <Button onClick={() => setSuccessMessage(null)}>
                Thêm nhân viên khác
              </Button>
            </div>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ tên */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@skillmaster.edu.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Email này sẽ được dùng làm tài khoản đăng nhập
              </p>
            </div>
            
            {/* Vai trò */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Vai trò <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role_code}
                onChange={(value) => setFormData({ ...formData, role_code: value })}
                placeholder="Chọn vai trò"
                options={[
                  { value: 'TEACHER', label: '👨‍🏫 Giáo viên' },
                  { value: 'CENTER_MANAGER', label: '👔 Quản lý Trung tâm' },
                ]}
              />
            </div>
            
            {/* Số điện thoại */}
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeModal}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tạo tài khoản
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
