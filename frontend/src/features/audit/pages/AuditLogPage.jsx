import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'Tất cả hành động' },
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'APPROVE', label: 'Duyệt' },
  { value: 'REJECT', label: 'Từ chối' },
  { value: 'LOGIN', label: 'Đăng nhập' },
];

const ENTITY_OPTIONS = [
  { value: 'ALL', label: 'Tất cả đối tượng' },
  { value: 'user', label: 'Người dùng' },
  { value: 'enrollment', label: 'Ghi danh' },
  { value: 'grade', label: 'Điểm số' },
  { value: 'invoice', label: 'Hóa đơn' },
  { value: 'leave_request', label: 'Đơn xin nghỉ' },
  { value: 'settings', label: 'Cài đặt' },
  { value: 'course', label: 'Khóa học' },
  { value: 'class', label: 'Lớp học' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN');
}

function formatJson(value) {
  if (value === null || value === undefined) return 'null';
  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
}

function getActionBadgeVariant(action) {
  if (action === 'DELETE' || action === 'REJECT') return 'destructive';
  if (action === 'CREATE' || action === 'APPROVE') return 'default';
  return 'secondary';
}

function diffTopLevel(oldValues, newValues) {
  const oldObj = oldValues && typeof oldValues === 'object' ? oldValues : {};
  const newObj = newValues && typeof newValues === 'object' ? newValues : {};
  const keys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];

  return keys
    .filter((key) => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key]))
    .map((key) => ({ key, oldValue: oldObj[key], newValue: newObj[key] }));
}

export function AuditLogPage() {
  const { session } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    action: 'ALL',
    entity_type: 'ALL',
    search: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    from: '',
    to: '',
    action: 'ALL',
    entity_type: 'ALL',
    search: '',
  });

  const totalPages = useMemo(() => {
    if (!pagination.total || !pagination.limit) return 1;
    return Math.max(Math.ceil(pagination.total / pagination.limit), 1);
  }, [pagination.total, pagination.limit]);

  const fetchAuditLogs = useCallback(async (nextPage = pagination.page, nextLimit = pagination.limit, activeFilters = appliedFilters) => {
    if (!session?.access_token) {
      toast.error('Phiên đăng nhập không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });

      if (activeFilters.from) query.set('from', activeFilters.from);
      if (activeFilters.to) query.set('to', activeFilters.to);
      if (activeFilters.action !== 'ALL') query.set('action', activeFilters.action);
      if (activeFilters.entity_type !== 'ALL') query.set('entity_type', activeFilters.entity_type);
      if (activeFilters.search?.trim()) query.set('search', activeFilters.search.trim());

      const response = await fetch(`${API_URL}/api/admin/audit-logs?${query.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Không thể tải nhật ký hoạt động');
      }

      setLogs(result.data || []);
      setPagination({
        page: result.pagination?.page || nextPage,
        limit: result.pagination?.limit || nextLimit,
        total: result.pagination?.total || 0,
      });
      setExpandedRows(new Set());
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error(error.message || 'Không thể tải nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pagination.page, pagination.limit, session?.access_token]);

  useEffect(() => {
    fetchAuditLogs(1, pagination.limit, appliedFilters);
  }, [appliedFilters, pagination.limit, fetchAuditLogs]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    const defaultFilters = {
      from: '',
      to: '',
      action: 'ALL',
      entity_type: 'ALL',
      search: '',
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    fetchAuditLogs(nextPage, pagination.limit, appliedFilters);
  }, [totalPages, fetchAuditLogs, pagination.limit, appliedFilters]);

  const handleLimitChange = useCallback((value) => {
    const nextLimit = parseInt(value, 10) || 20;
    setPagination((prev) => ({ ...prev, page: 1, limit: nextLimit }));
    fetchAuditLogs(1, nextLimit, appliedFilters);
  }, [fetchAuditLogs, appliedFilters]);

  const toggleExpanded = useCallback((id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nhật ký hoạt động</h1>
        <p className="text-sm text-muted-foreground">Theo dõi thao tác quan trọng của người dùng.</p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Input type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
          <Input type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />

          <Select value={filters.action} onValueChange={(value) => setFilters((prev) => ({ ...prev, action: value }))}>
            <SelectTrigger><SelectValue placeholder="Hành động" /></SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.entity_type} onValueChange={(value) => setFilters((prev) => ({ ...prev, entity_type: value }))}>
            <SelectTrigger><SelectValue placeholder="Đối tượng" /></SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Tìm theo người dùng/hành động..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={handleApplyFilters}>Lọc</Button>
          <Button variant="outline" onClick={handleResetFilters}>Đặt lại</Button>
          <Button variant="outline" size="icon" onClick={() => fetchAuditLogs()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">Thời gian</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Đang tải dữ liệu...</TableCell>
              </TableRow>
            )}

            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Không có bản ghi phù hợp.</TableCell>
              </TableRow>
            )}

            {!loading && logs.map((log) => {
              const isExpanded = expandedRows.has(log.id);
              const diffs = diffTopLevel(log.old_values, log.new_values);

              return (
                <Fragment key={log.id}>
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{log.user?.full_name || 'Không xác định'}</div>
                      <div className="text-xs text-muted-foreground">{log.user?.email || log.user_id || '--'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.entity_type || '--'}</div>
                      <div className="text-xs text-muted-foreground">ID: {log.entity_id || '--'}</div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleExpanded(log.id)}>
                        {isExpanded ? <ChevronDown className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/30">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <div className="mb-2 text-sm font-semibold">Giá trị cũ</div>
                            <pre className="max-h-64 overflow-auto rounded-md border bg-background p-3 text-xs">{formatJson(log.old_values)}</pre>
                          </div>
                          <div>
                            <div className="mb-2 text-sm font-semibold">Giá trị mới</div>
                            <pre className="max-h-64 overflow-auto rounded-md border bg-background p-3 text-xs">{formatJson(log.new_values)}</pre>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 text-sm font-semibold">Các trường thay đổi</div>
                          {diffs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Không phát hiện thay đổi ở cấp thuộc tính.</p>
                          ) : (
                            <div className="space-y-2">
                              {diffs.map((item) => (
                                <div key={item.key} className="rounded-md border bg-background p-3">
                                  <div className="mb-1 flex items-center gap-2">
                                    <Badge variant="outline">{item.key}</Badge>
                                  </div>
                                  <div className="grid gap-2 text-xs md:grid-cols-2">
                                    <div className="rounded border border-red-200 bg-red-50 p-2">
                                      <div className="mb-1 font-medium text-red-700">Trước</div>
                                      <pre className="whitespace-pre-wrap break-all">{formatJson(item.oldValue)}</pre>
                                    </div>
                                    <div className="rounded border border-emerald-200 bg-emerald-50 p-2">
                                      <div className="mb-1 font-medium text-emerald-700">Sau</div>
                                      <pre className="whitespace-pre-wrap break-all">{formatJson(item.newValue)}</pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Tổng cộng: <span className="font-medium text-foreground">{pagination.total}</span> bản ghi
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(pagination.limit)} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Số dòng" /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size} / trang</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1 || loading}>Trước</Button>
            <span className="text-sm text-muted-foreground">Trang {pagination.page} / {totalPages}</span>
            <Button variant="outline" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= totalPages || loading}>Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogPage;
