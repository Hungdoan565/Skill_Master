import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Check, X, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gooeyToast } from 'goey-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const statusConfig = {
  pending: { label: 'Chờ duyệt', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
  approved: { label: 'Đã duyệt', className: 'border-blue-500 text-blue-700 bg-blue-50' },
  enrolled: { label: 'Đã đăng ký', className: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
  rejected: { label: 'Từ chối', className: 'border-red-500 text-red-700 bg-red-50' },
  waitlisted: { label: 'Chờ slot', className: 'border-orange-500 text-orange-700 bg-orange-50' },
  cancelled: { label: 'Đã hủy', className: 'border-gray-400 text-gray-600 bg-gray-50' },
};

export default function EnrollmentRequestsTab({ onPendingCountChange }) {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      if (statusFilter !== 'all') {
        query.append('status', statusFilter);
      }

      const res = await fetch(`${API_URL}/api/admin/enrollment-requests?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setRequests(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        
        // Also fetch pending count separately if not filtering by pending
        // Or get it from the meta info if backend provides it
        if (data.meta && data.meta.pendingCount !== undefined) {
          setPendingCount(data.meta.pendingCount);
          if (onPendingCountChange) onPendingCountChange(data.meta.pendingCount);
        } else {
          // Fallback: fetch just pending count if backend doesn't provide it in meta
          fetchPendingCount();
        }
      } else {
        gooeyToast.error('Lỗi khi tải danh sách yêu cầu', { description: data.message });
      }
    } catch (err) {
      console.error('Error fetching enrollment requests:', err);
      gooeyToast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, session, onPendingCountChange]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/enrollment-requests?status=pending&limit=1`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (data.success && data.pagination) {
        setPendingCount(data.pagination.total);
        if (onPendingCountChange) onPendingCountChange(data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  }, [session, onPendingCountChange]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/api/admin/enrollment-requests/${id}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (res.status === 409 || (data.success === false && data.message?.includes('full'))) {
        gooeyToast.error('Không thể phê duyệt', { description: 'Lớp học đã đủ số lượng học viên tối đa' });
        return;
      }
      
      if (data.success) {
        gooeyToast.success('Đã phê duyệt. Học viên đã được đăng ký vào lớp.');
        fetchRequests();
      } else {
        gooeyToast.error('Lỗi khi phê duyệt', { description: data.message });
      }
    } catch (err) {
      console.error('Error approving request:', err);
      gooeyToast.error('Có lỗi xảy ra khi phê duyệt yêu cầu');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaitlist = async (id) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/api/admin/enrollment-requests/${id}/waitlist`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (data.success) {
        gooeyToast.success('Đã chuyển vào danh sách chờ');
        fetchRequests();
      } else {
        gooeyToast.error('Lỗi khi chuyển trạng thái', { description: data.message });
      }
    } catch (err) {
      console.error('Error waitlisting request:', err);
      gooeyToast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (request) => {
    setSelectedRequest(request);
    setAdminNote('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!adminNote.trim()) {
      gooeyToast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/api/admin/enrollment-requests/${selectedRequest.id}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_note: adminNote })
      });
      const data = await res.json();
      
      if (data.success) {
        gooeyToast.success('Đã từ chối yêu cầu');
        setRejectDialogOpen(false);
        fetchRequests();
      } else {
        gooeyToast.error('Lỗi khi từ chối', { description: data.message });
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      gooeyToast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="enrolled">Đã đăng ký</SelectItem>
            <SelectItem value="waitlisted">Chờ slot</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-24 h-8 bg-slate-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : requests.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-white">
            <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Không có yêu cầu đăng ký nào</p>
          </div>
        ) : (
          requests.map(req => (
            <Card key={req.id}>
              <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-slate-900">{req.student?.full_name || 'Học viên ẩn danh'}</span>
                    <Badge variant="outline" className={cn('border', statusConfig[req.status]?.className)}>
                      {statusConfig[req.status]?.label || req.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600 grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4">
                    <div><span className="font-medium">Lớp:</span> {req.class?.name || 'N/A'}</div>
                    <div><span className="font-medium">Khóa:</span> {req.class?.courses?.title || 'N/A'}</div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatDateStr(req.created_at)}
                    </div>
                  </div>
                  {req.parent_note && (
                    <div className="mt-2 text-sm bg-slate-50 p-2 rounded text-slate-700">
                      <span className="font-medium text-slate-900">Ghi chú: </span>
                      {req.parent_note}
                    </div>
                  )}
                  {req.admin_note && req.status === 'rejected' && (
                    <div className="mt-2 text-sm bg-red-50 border border-red-100 p-2 rounded text-red-700">
                      <span className="font-medium">Lý do từ chối: </span>
                      {req.admin_note}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end mt-4 md:mt-0">
                  {req.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Phê duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        onClick={() => handleWaitlist(req.id)}
                        disabled={actionLoading}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Chờ slot
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => openRejectDialog(req)}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </>
                  )}
                  
                  {req.status === 'waitlisted' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Phê duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => openRejectDialog(req)}
                        disabled={actionLoading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>
          <div className="text-sm text-slate-500">
            Trang {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Sau
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu đăng ký</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lý do từ chối <span className="text-red-500">*</span></label>
              <Textarea
                placeholder="Nhập lý do từ chối (bắt buộc)..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !adminNote.trim()}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
