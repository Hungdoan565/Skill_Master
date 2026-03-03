import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Search, ChevronLeft, ChevronRight, Filter, RefreshCw } from 'lucide-react';

const ENTITY_TYPE_LABELS = {
  grade: 'Điểm',
  grades: 'Điểm',
  student: 'Học viên',
  students: 'Học viên',
  payment: 'Thanh toán',
  payments: 'Thanh toán',
  attendance: 'Điểm danh',
  enrollment: 'Ghi danh',
  enrollments: 'Ghi danh',
  user_profiles: 'Nhân sự',
  staff: 'Nhân sự',
  setting: 'Cài đặt',
  settings: 'Cài đặt',
};

const ACTION_LABELS = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  EXPORT: 'Xuất dữ liệu',
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOCK_USER: 'Khóa tài khoản',
  UNLOCK_USER: 'Mở khóa tài khoản',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  RESTORE: 'Khôi phục',
  LOCK_GRADES: 'Khóa điểm',
};

const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPORT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  LOGIN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  LOGIN_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOCK_USER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  UNLOCK_USER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  RESET_PASSWORD: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESTORE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  LOCK_GRADES: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_LABELS = {
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  DENIED: 'Từ chối',
};

const STATUS_COLORS = {
  SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DENIED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const SEVERITY_LABELS = {
  INFO: 'Thông tin',
  WARNING: 'Cảnh báo',
  CRITICAL: 'Nghiêm trọng',
};

const SEVERITY_COLORS = {
  INFO: 'bg-blue-500',
  WARNING: 'bg-yellow-500',
  CRITICAL: 'bg-red-500',
};

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function AuditTrailPage() {
  const { session, isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    status: '',
    severity: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs || []);
        setPagination(json.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, filters]);

  useEffect(() => {
    if (session?.access_token) fetchLogs(1);
  }, [session?.access_token, fetchLogs]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLogs(1);
  };

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', startDate: '', endDate: '', status: '', severity: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhật ký hệ thống</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Theo dõi tất cả hoạt động thay đổi dữ liệu {!isSuperAdmin?.() && '(trung tâm của bạn)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" />
            Bộ lọc
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.page)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Hành động</label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="CREATE">Tạo mới</option>
                  <option value="UPDATE">Cập nhật</option>
                  <option value="DELETE">Xóa</option>
                  <option value="EXPORT">Xuất dữ liệu</option>
                  <option value="LOGIN">Đăng nhập</option>
                  <option value="LOGOUT">Đăng xuất</option>
                  <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
                  <option value="LOCK_USER">Khóa tài khoản</option>
                  <option value="UNLOCK_USER">Mở khóa</option>
                  <option value="RESET_PASSWORD">Đặt lại mật khẩu</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Loại dữ liệu</label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="grades">Điểm</option>
                  <option value="attendance">Điểm danh</option>
                  <option value="payments">Thanh toán</option>
                  <option value="enrollments">Ghi danh</option>
                  <option value="students">Học viên</option>
                  <option value="user_profiles">Nhân sự</option>
                  <option value="settings">Cài đặt</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Từ ngày</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Đến ngày</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Trạng thái</label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="FAILED">Thất bại</option>
                  <option value="DENIED">Từ chối</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Mức độ</label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="INFO">Thông tin</option>
                  <option value="WARNING">Cảnh báo</option>
                  <option value="CRITICAL">Nghiêm trọng</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={applyFilters}>
                <Search className="h-4 w-4 mr-1" />
                Áp dụng
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Hiển thị {logs.length} / {pagination.total} bản ghi
      </div>

      {/* Audit log table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Người thực hiện</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hành động</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mức độ</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loại dữ liệu</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trung tâm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      Chưa có nhật ký nào. Nhật ký sẽ được ghi tự động khi có thao tác trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap" title={new Date(log.timestamp).toLocaleString('vi-VN')}>
                        {formatRelativeTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {log.actor?.name || 'System'}
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({log.actor?.role})</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[log.status] || STATUS_COLORS.SUCCESS}`}>
                          {STATUS_LABELS[log.status] || 'Thành công'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.INFO}`} />
                          {SEVERITY_LABELS[log.severity] || 'Thông tin'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {log.center?.name || 'Hệ thống'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Trang {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
