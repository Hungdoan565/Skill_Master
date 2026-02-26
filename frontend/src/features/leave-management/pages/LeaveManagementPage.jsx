import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Đã từ chối' },
];

const STATUS_BADGE_VARIANT = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const LEAVE_TYPE_LABELS = {
  sick: 'Nghỉ ốm',
  personal: 'Nghỉ việc riêng',
  annual: 'Nghỉ phép năm',
  other: 'Khác',
};

function formatDate(value) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN');
}

function getLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.floor((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86400000) + 1;
  return Math.max(days, 1);
}

export function LeaveManagementPage() {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    action: 'approve',
    request: null,
  });
  const [adminNote, setAdminNote] = useState('');

  const getHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Bạn chưa đăng nhập');
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }, [session]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'all') {
        query.set('status', statusFilter);
      }

      const response = await fetch(`${API_URL}/api/admin/leave-requests${query.toString() ? `?${query.toString()}` : ''}`, {
        headers: getHeaders(),
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Không thể tải danh sách đơn xin nghỉ');
      }

      setRequests(result.data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error(error.message || 'Không thể tải danh sách đơn xin nghỉ');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendingCount = useMemo(() => requests.filter((item) => item.status === 'pending').length, [requests]);

  const openActionDialog = useCallback((request, action) => {
    setDialogState({ open: true, action, request });
    setAdminNote('');
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({ open: false, action: 'approve', request: null });
    setAdminNote('');
  }, []);

  const submitAction = useCallback(async () => {
    if (!dialogState.request) return;

    if (dialogState.action === 'reject' && !adminNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setProcessingId(dialogState.request.id);
    try {
      const response = await fetch(`${API_URL}/api/admin/leave-requests/${dialogState.request.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          action: dialogState.action,
          admin_note: adminNote.trim() || '',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Không thể cập nhật trạng thái đơn xin nghỉ');
      }

      toast.success(dialogState.action === 'approve' ? 'Đã duyệt đơn xin nghỉ' : 'Đã từ chối đơn xin nghỉ');
      closeDialog();
      await fetchRequests();
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast.error(error.message || 'Không thể xử lý đơn xin nghỉ');
    } finally {
      setProcessingId(null);
    }
  }, [adminNote, closeDialog, dialogState.action, dialogState.request, fetchRequests, getHeaders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duyệt đơn xin nghỉ</h1>
          <p className="text-muted-foreground">Quản lý và xét duyệt đơn nghỉ của giáo viên theo trung tâm.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 text-sm text-muted-foreground">
          Tổng đơn: <span className="font-medium text-foreground">{requests.length}</span> · Chờ duyệt: <span className="font-medium text-foreground">{pendingCount}</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giáo viên</TableHead>
              <TableHead>Loại nghỉ</TableHead>
              <TableHead>Từ ngày</TableHead>
              <TableHead>Đến ngày</TableHead>
              <TableHead>Số ngày</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Không có đơn xin nghỉ nào.
                </TableCell>
              </TableRow>
            )}

            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Đang tải dữ liệu...</TableCell>
              </TableRow>
            )}

            {!loading && requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.teacher?.full_name || 'Chưa rõ'}</TableCell>
                <TableCell>{LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type || '--'}</TableCell>
                <TableCell>{formatDate(request.start_date)}</TableCell>
                <TableCell>{formatDate(request.end_date)}</TableCell>
                <TableCell>{getLeaveDays(request.start_date, request.end_date)}</TableCell>
                <TableCell className="max-w-[260px] truncate" title={request.reason || ''}>{request.reason || '--'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANT[request.status] || 'secondary'}>
                    {STATUS_LABELS[request.status] || request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {request.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => openActionDialog(request, 'approve')}
                          disabled={processingId === request.id}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(request, 'reject')}
                          disabled={processingId === request.id}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Từ chối
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Đã xử lý</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogState.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.action === 'approve' ? 'Duyệt đơn xin nghỉ' : 'Từ chối đơn xin nghỉ'}</DialogTitle>
            <DialogDescription>
              {dialogState.action === 'approve'
                ? 'Bạn có thể để lại ghi chú cho giáo viên (không bắt buộc).'
                : 'Vui lòng nhập lý do từ chối để giáo viên nắm rõ.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">{dialogState.action === 'approve' ? 'Ghi chú duyệt (tuỳ chọn)' : 'Lý do từ chối *'}</label>
            <Textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder={dialogState.action === 'approve' ? 'Nhập ghi chú (nếu có)...' : 'Nhập lý do từ chối...'}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Huỷ</Button>
            <Button
              variant={dialogState.action === 'approve' ? 'default' : 'destructive'}
              className={dialogState.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={submitAction}
              disabled={processingId === dialogState.request?.id}
            >
              {processingId === dialogState.request?.id ? 'Đang xử lý...' : dialogState.action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LeaveManagementPage;
