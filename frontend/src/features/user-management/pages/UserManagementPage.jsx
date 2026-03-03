import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { gooeyToast } from 'goey-toast';
import {
  UsersRound, Search, ChevronLeft, ChevronRight, Lock, Unlock,
  KeyRound, UserCheck, UserX, RefreshCw, UserPlus,
  ChevronDown, ChevronRight as ChevronRightIcon, Building2, GraduationCap, AlertTriangle,
} from 'lucide-react';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  CENTER_MANAGER: 'Quản lý',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học viên',
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CENTER_MANAGER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TEACHER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  STUDENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_CONFIG = {
  active: { label: 'Hoạt động', icon: UserCheck, color: 'text-green-600 dark:text-green-400' },
  inactive: { label: 'Không hoạt động', icon: UserX, color: 'text-gray-400' },
  suspended: { label: 'Đã khóa', icon: Lock, color: 'text-red-600 dark:text-red-400' },
};

const ROLE_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'CENTER_MANAGER', label: 'Quản lý' },
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'STUDENT', label: 'Học viên' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function UserManagementPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [networkError, setNetworkError] = useState('');

  // Tree view state
  const [treeData, setTreeData] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expandedCenters, setExpandedCenters] = useState({});
  const [expandedClasses, setExpandedClasses] = useState({});

  // Centers list
  const [centers, setCenters] = useState([]);

  // Create user modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', fullName: '', role: '', centerId: '' });
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch centers on mount
  useEffect(() => {
    if (!session?.access_token) return;
    const fetchCenters = async () => {
      try {
        const res = await fetch(`${API_URL}/api/centers`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) {
          setCenters(json.data || []);
        } else {
          throw new Error(json.message || 'Không thể tải danh sách trung tâm');
        }
      } catch (err) {
        console.error('Error fetching centers:', err);
        setNetworkError('Không thể tải danh sách trung tâm. Vui lòng kiểm tra kết nối API.');
      }
    };
    fetchCenters();
  }, [session?.access_token]);

  // Fetch flat user list
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setNetworkError('');
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (activeTab) params.set('role', activeTab);
      if (search) params.set('search', search);
      if (selectedCenter !== 'all') params.set('centerId', selectedCenter);

      const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users || []);
        setPagination(json.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } else {
        throw new Error(json.message || json.error || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
      setNetworkError('Không thể tải dữ liệu người dùng. Vui lòng kiểm tra API hoặc quyền truy cập.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, activeTab, search, selectedCenter]);

  // Fetch tree data for student tab
  const fetchTreeData = useCallback(async () => {
    setTreeLoading(true);
    setNetworkError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/by-class`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setTreeData(json.data || []);
        // Auto-expand first center
        if (json.data?.length > 0) {
          setExpandedCenters({ [json.data[0].id]: true });
          const firstClass = json.data[0]?.classes?.[0];
          if (firstClass) setExpandedClasses({ [firstClass.id]: true });
        }
      } else {
        throw new Error(json.message || json.error || 'Không thể tải cây học viên');
      }
    } catch (err) {
      console.error('Error fetching tree data:', err);
      setTreeData([]);
      setNetworkError('Không thể tải dữ liệu cây học viên. Vui lòng kiểm tra API hoặc quyền truy cập.');
    } finally {
      setTreeLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    if (activeTab === 'STUDENT') {
      fetchTreeData();
    } else {
      fetchUsers(1);
    }
  }, [session?.access_token, activeTab, selectedCenter]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeTab === 'STUDENT') {
      fetchTreeData();
    } else {
      fetchUsers(1);
    }
  };

  const handleAction = async (userId, action) => {
    setActionLoading(userId);
    setNetworkError('');
    try {
      const method = action === 'reset-password' ? 'POST' : 'PATCH';
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/${action}`, {
        method,
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        gooeyToast.success(action === 'lock' ? 'Đã khóa tài khoản' : action === 'unlock' ? 'Đã mở khóa' : 'Đã gửi link đặt lại mật khẩu');
        if (activeTab === 'STUDENT') fetchTreeData();
        else fetchUsers(pagination.page);
      } else {
        throw new Error(json.message || json.error || 'Không thể thực hiện thao tác');
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      gooeyToast.error('Có lỗi xảy ra');
      setNetworkError('Thao tác người dùng thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) fetchUsers(newPage);
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.fullName || !createForm.role || !createForm.centerId) {
      gooeyToast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setCreateLoading(true);
    setNetworkError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        gooeyToast.success(`Đã tạo tài khoản cho ${createForm.fullName}`, {
          description: `Vai trò: ${ROLE_LABELS[createForm.role] || createForm.role} • Email: ${createForm.email}`,
        });
        setShowCreate(false);
        setCreateForm({ email: '', fullName: '', role: '', centerId: '' });
        if (activeTab === 'STUDENT') fetchTreeData();
        else fetchUsers(1);
      } else {
        throw new Error(json.error || json.message || 'Tạo tài khoản thất bại');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      gooeyToast.error('Có lỗi xảy ra');
      setNetworkError('Không thể tạo tài khoản mới. Vui lòng kiểm tra API hoặc dữ liệu nhập.');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleCenter = (centerId) => {
    setExpandedCenters(prev => ({ ...prev, [centerId]: !prev[centerId] }));
  };

  const toggleClass = (classId) => {
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const renderUserRow = (user, indent = 0) => {
    const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
    const StatusIcon = statusConfig.icon;
    return (
      <div key={user.id} className="flex items-center justify-between py-2.5 px-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors" style={{ paddingLeft: `${indent + 16}px` }}>
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {getInitials(user.full_name)}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-foreground">{user.full_name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
            <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {user.status === 'suspended' ? (
              <Button variant="ghost" size="sm" disabled={actionLoading === user.id} onClick={() => handleAction(user.id, 'unlock')} title="Mở khóa">
                <Unlock className="h-3.5 w-3.5 text-green-600" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled={actionLoading === user.id || user.role === 'SUPER_ADMIN'} onClick={() => handleAction(user.id, 'lock')} title="Khóa tài khoản">
                <Lock className="h-3.5 w-3.5 text-red-500" />
              </Button>
            )}
            <Button variant="ghost" size="sm" disabled={actionLoading === user.id} onClick={() => handleAction(user.id, 'reset-password')} title="Đặt lại mật khẩu">
              <KeyRound className="h-3.5 w-3.5 text-amber-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderTreeView = () => {
    if (treeLoading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (treeData.length === 0) {
      return (
        <div className="px-4 py-12 text-center text-muted-foreground">
          Không tìm thấy học viên
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {treeData.map((center) => {
          const totalStudents = center.classes.reduce((sum, c) => sum + c.students.length, 0) + center.unassigned.length;
          const isExpanded = expandedCenters[center.id];

          return (
            <div key={center.id}>
              {/* Center header */}
              <button
                onClick={() => toggleCenter(center.id)}
                className="flex items-center gap-2 w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />}
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm text-foreground">{center.name}</span>
                <Badge variant="outline" className="text-xs ml-1">{totalStudents} học viên</Badge>
              </button>

              {/* Classes inside center */}
              {isExpanded && (
                <div>
                  {center.classes.map((cls) => {
                    const isClassExpanded = expandedClasses[cls.id];
                    if (cls.students.length === 0) return null;
                    return (
                      <div key={cls.id}>
                        <button
                          onClick={() => toggleClass(cls.id)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 pl-10 hover:bg-muted/30 transition-colors text-left"
                        >
                          {isClassExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                          <GraduationCap className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm text-foreground">{cls.name}</span>
                          <Badge variant="outline" className="text-xs">{cls.students.length}</Badge>
                        </button>
                        {isClassExpanded && cls.students.map((student) => renderUserRow(student, 56))}
                      </div>
                    );
                  })}

                  {/* Unassigned students */}
                  {center.unassigned.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2.5 pl-10 text-muted-foreground">
                        <span className="text-sm italic">Chưa xếp lớp</span>
                        <Badge variant="outline" className="text-xs">{center.unassigned.length}</Badge>
                      </div>
                      {center.unassigned.map((student) => renderUserRow(student, 56))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const isStudentTab = activeTab === 'STUDENT';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <UsersRound className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý tài khoản người dùng toàn hệ thống
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => isStudentTab ? fetchTreeData() : fetchUsers(pagination.page)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Tạo tài khoản
          </Button>
        </div>
      </div>

      {networkError && (
        <Card className="border-amber-500/40 bg-amber-50/80 dark:bg-amber-900/10 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{networkError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs + Center filter + Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {!isStudentTab && (
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả trung tâm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trung tâm</SelectItem>
                {centers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {!isStudentTab && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button type="submit" size="sm" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>

      {/* Results count (flat view only) */}
      {!isStudentTab && (
        <div className="text-sm text-muted-foreground">
          {pagination.total} người dùng
        </div>
      )}

      {/* Content */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isStudentTab ? (
            renderTreeView()
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Người dùng</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Vai trò</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Trung tâm</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Trạng thái</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-10 w-48" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        Không tìm thấy người dùng
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                  {getInitials(user.full_name)}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role] || ''}`}>
                              {ROLE_LABELS[user.role] || user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {user.center_name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                              <span className={`text-sm ${statusConfig.color}`}>{statusConfig.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {user.status === 'suspended' ? (
                                <Button variant="ghost" size="sm" disabled={actionLoading === user.id} onClick={() => handleAction(user.id, 'unlock')} title="Mở khóa">
                                  <Unlock className="h-4 w-4 text-green-600" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" disabled={actionLoading === user.id || user.role === 'SUPER_ADMIN'} onClick={() => handleAction(user.id, 'lock')} title="Khóa tài khoản">
                                  <Lock className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" disabled={actionLoading === user.id} onClick={() => handleAction(user.id, 'reset-password')} title="Đặt lại mật khẩu">
                                <KeyRound className="h-4 w-4 text-amber-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination (flat view only) */}
      {!isStudentTab && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Họ và tên</label>
              <Input
                placeholder="Nguyễn Văn A"
                value={createForm.fullName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Vai trò</label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm(prev => ({ ...prev, role: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CENTER_MANAGER">Quản lý</SelectItem>
                  <SelectItem value="TEACHER">Giáo viên</SelectItem>
                  <SelectItem value="STUDENT">Học viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trung tâm</label>
              <Select value={createForm.centerId} onValueChange={(v) => setCreateForm(prev => ({ ...prev, centerId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trung tâm" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreateUser} disabled={createLoading}>
              {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
