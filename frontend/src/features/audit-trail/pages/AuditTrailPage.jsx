import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Download,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  AlertTriangle,
  Info,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────

const ENTITY_TYPE_LABELS = {
  grade: 'Điểm', grades: 'Điểm',
  student: 'Học viên', students: 'Học viên',
  payment: 'Thanh toán', payments: 'Thanh toán',
  attendance: 'Điểm danh',
  enrollment: 'Ghi danh', enrollments: 'Ghi danh',
  user_profiles: 'Nhân sự', staff: 'Nhân sự',
  setting: 'Cài đặt', settings: 'Cài đặt',
  class: 'Lớp học', classes: 'Lớp học',
  teacher: 'Giáo viên', teachers: 'Giáo viên',
  user: 'Người dùng', users: 'Người dùng',
  center: 'Trung tâm', centers: 'Trung tâm',
  course: 'Khóa học', courses: 'Khóa học',
  invoice: 'Hóa đơn', invoices: 'Hóa đơn',
};

const ACTION_CONFIG = {
  CREATE: { label: 'Tạo mới', icon: Plus, color: 'emerald' },
  UPDATE: { label: 'Cập nhật', icon: Pencil, color: 'blue' },
  DELETE: { label: 'Xóa', icon: Trash2, color: 'rose' },
  EXPORT: { label: 'Xuất dữ liệu', icon: Download, color: 'purple' },
  LOGIN: { label: 'Đăng nhập', icon: LogIn, color: 'violet' },
  LOGOUT: { label: 'Đăng xuất', icon: LogOut, color: 'slate' },
  LOGIN_FAILED: { label: 'Đ.nhập thất bại', icon: AlertTriangle, color: 'red' },
  LOCK_USER: { label: 'Khóa TK', icon: Lock, color: 'orange' },
  UNLOCK_USER: { label: 'Mở khóa', icon: Unlock, color: 'teal' },
  RESET_PASSWORD: { label: 'Đặt lại MK', icon: KeyRound, color: 'amber' },
  RESTORE: { label: 'Khôi phục', icon: RotateCcw, color: 'cyan' },
  LOCK_GRADES: { label: 'Khóa điểm', icon: Lock, color: 'amber' },
};

const getActionStyles = (color) => ({
  iconBg: `bg-${color}-100 dark:bg-${color}-900/30`,
  iconText: `text-${color}-600 dark:text-${color}-400`,
  badge: `bg-${color}-50 text-${color}-700 border-${color}-200 dark:bg-${color}-900/20 dark:text-${color}-300 dark:border-${color}-800`,
});

const STATUS_CONFIG = {
  SUCCESS: { label: 'Thành công', dotColor: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400' },
  FAILED: { label: 'Thất bại', dotColor: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400' },
  DENIED: { label: 'Từ chối', dotColor: 'bg-orange-500', textColor: 'text-orange-700 dark:text-orange-400' },
};

const SEVERITY_CONFIG = {
  INFO: { label: 'Thông tin', icon: Info, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  WARNING: { label: 'Cảnh báo', icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  CRITICAL: { label: 'Nghiêm trọng', icon: AlertTriangle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

// ─── Helpers ──────────────────────────────────────────────────

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

function formatExactTime(dateStr) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Component ──────────────────────────────────────────────────

export default function AuditTrailPage() {
  const { session, isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '', entityType: '', startDate: '', endDate: '', status: '', severity: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
    if (newPage >= 1 && newPage <= pagination.totalPages) fetchLogs(newPage);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', startDate: '', endDate: '', status: '', severity: '' });
  };

  // ─── Select component ──────────────────────────────────────────
  const FilterSelect = ({ label, value, onChange, children }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <select
        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Nhật ký hệ thống</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi tất cả hoạt động thay đổi dữ liệu
              {!isSuperAdmin?.() && ' (trung tâm của bạn)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "gap-1.5 rounded-lg",
              showFilters && "bg-indigo-600 hover:bg-indigo-700 text-white"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/20">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            className="gap-1.5 rounded-lg"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* ─── Filters panel ──────────────────────────────────────── */}
      {showFilters && (
        <Card className="rounded-xl border-border/80 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <FilterSelect label="Hành động" value={filters.action} onChange={(v) => handleFilterChange('action', v)}>
                <option value="">Tất cả</option>
                {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </FilterSelect>

              <FilterSelect label="Loại dữ liệu" value={filters.entityType} onChange={(v) => handleFilterChange('entityType', v)}>
                <option value="">Tất cả</option>
                <option value="grades">Điểm</option>
                <option value="attendance">Điểm danh</option>
                <option value="payments">Thanh toán</option>
                <option value="enrollments">Ghi danh</option>
                <option value="students">Học viên</option>
                <option value="user_profiles">Nhân sự</option>
                <option value="settings">Cài đặt</option>
              </FilterSelect>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Từ ngày</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đến ngày</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="h-9 rounded-lg"
                />
              </div>

              <FilterSelect label="Trạng thái" value={filters.status} onChange={(v) => handleFilterChange('status', v)}>
                <option value="">Tất cả</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
                <option value="DENIED">Từ chối</option>
              </FilterSelect>

              <FilterSelect label="Mức độ" value={filters.severity} onChange={(v) => handleFilterChange('severity', v)}>
                <option value="">Tất cả</option>
                <option value="INFO">Thông tin</option>
                <option value="WARNING">Cảnh báo</option>
                <option value="CRITICAL">Nghiêm trọng</option>
              </FilterSelect>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <Button size="sm" onClick={() => fetchLogs(1)} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                <Search className="h-3.5 w-3.5" />
                Áp dụng
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg">
                  <X className="h-3.5 w-3.5" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Results summary ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{logs.length}</span> / {pagination.total} bản ghi
        </p>
        {pagination.totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Trang <span className="font-semibold text-foreground">{pagination.page}</span> / {pagination.totalPages}
          </p>
        )}
      </div>

      {/* ─── Audit log table ──────────────────────────────────────── */}
      <Card className="rounded-xl border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Người thực hiện</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hành động</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mức độ</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Loại dữ liệu</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trung tâm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-16 rounded" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-16 rounded" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-muted rounded-full">
                          <Activity className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Chưa có nhật ký nào</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Nhật ký sẽ được ghi tự động khi có thao tác trong hệ thống.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.LOGOUT;
                    const ActionIcon = actionCfg.icon;
                    const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.SUCCESS;
                    const severityCfg = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.INFO;
                    const SeverityIcon = severityCfg.icon;

                    return (
                      <tr
                        key={log.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        {/* Time */}
                        <td className="px-4 py-3.5 whitespace-nowrap" title={formatExactTime(log.timestamp)}>
                          <div className="text-sm text-foreground">{formatRelativeTime(log.timestamp)}</div>
                          <div className="text-[11px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                            {formatExactTime(log.timestamp)}
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {(log.actor?.name || 'S')[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {log.actor?.name || 'System'}
                              </p>
                              {log.actor?.role && (
                                <p className="text-[11px] text-muted-foreground truncate">{log.actor.role}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold gap-1 inline-flex items-center',
                              `bg-${actionCfg.color}-50 text-${actionCfg.color}-700 border-${actionCfg.color}-200`,
                              `dark:bg-${actionCfg.color}-900/20 dark:text-${actionCfg.color}-300 dark:border-${actionCfg.color}-800`
                            )}
                          >
                            <ActionIcon className="h-3 w-3" />
                            {actionCfg.label}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dotColor)} />
                            <span className={cn("text-xs font-medium", statusCfg.textColor)}>
                              {statusCfg.label}
                            </span>
                          </span>
                        </td>

                        {/* Severity */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5">
                            <SeverityIcon className={cn("h-3.5 w-3.5", severityCfg.color)} />
                            <span className="text-xs text-muted-foreground">
                              {severityCfg.label}
                            </span>
                          </span>
                        </td>

                        {/* Entity type */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-foreground">
                            {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                          </span>
                        </td>

                        {/* Center */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-muted-foreground">
                            {log.center?.name || 'Hệ thống'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Pagination ──────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang <span className="font-semibold text-foreground">{pagination.page}</span> / {pagination.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {(() => {
              const pages = [];
              const current = pagination.page;
              const total = pagination.totalPages;
              const start = Math.max(1, current - 2);
              const end = Math.min(total, current + 2);

              for (let i = start; i <= end; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={i === current ? 'default' : 'outline'}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs",
                      i === current && "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                    onClick={() => handlePageChange(i)}
                  >
                    {i}
                  </Button>
                );
              }
              return pages;
            })()}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
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
