import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, X, Users, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PendingApprovalsDialog({ open, onOpenChange, onApprove, onReject }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Chưa đăng nhập');
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`${API_URL}/api/admin/certificates/pending-approvals`, { headers });
      setApprovals(data.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách chờ duyệt');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (open) fetchApprovals();
  }, [open, fetchApprovals]);

  const handleApprove = async (approvalId) => {
    try {
      setActionLoading(approvalId);
      const headers = await getAuthHeaders();
      await axios.put(`${API_URL}/api/admin/certificates/${approvalId}/approve`, {}, { headers });
      toast.success('Đã duyệt chứng chỉ');
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      onApprove?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approvalId) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error('Lý do từ chối phải có ít nhất 5 ký tự');
      return;
    }
    try {
      setActionLoading(approvalId);
      const headers = await getAuthHeaders();
      await axios.put(`${API_URL}/api/admin/certificates/${approvalId}/reject`, {
        rejection_reason: rejectReason,
      }, { headers });
      toast.success('Đã từ chối yêu cầu');
      setApprovals(prev => prev.filter(a => a.id !== approvalId));
      setRejectingId(null);
      setRejectReason('');
      onReject?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    for (const approval of approvals) {
      await handleApprove(approval.id);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'GV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Chứng chỉ đang chờ duyệt
            {approvals.length > 0 && <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">{approvals.length}</Badge>}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-muted-foreground">Không có yêu cầu nào đang chờ duyệt</p>
          </div>
        ) : (
          <>
            {approvals.length > 1 && (
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-muted-foreground">Tổng cộng {approvals.length} yêu cầu</span>
                <Button size="sm" onClick={handleApproveAll} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-0">
                  <CheckCircle className="h-4 w-4 mr-2" /> Duyệt tất cả
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {approvals.map(approval => (
                <Card key={approval.id} className="p-0 overflow-hidden border-l-4 border-l-amber-500 bg-card border-border shadow-sm transition-all hover:shadow-md">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {getInitials(approval.requester_name)}
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{approval.requester_name || 'Giáo viên'}</span>
                          {approval.notes?.includes('Tự động') && (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-normal">Tự động</Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {approval.requested_at ? formatDistanceToNow(new Date(approval.requested_at), { addSuffix: true, locale: vi }) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Yêu cầu cấp: <span className="font-medium text-foreground">{approval.certificate_type_name || 'N/A'}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-normal text-xs gap-1">
                            <Users className="h-3 w-3" />
                            {approval.student_names?.length || approval.certificate_ids?.length || 0} học viên
                          </Badge>
                          {approval.student_names?.slice(0, 3).map((name, idx) => (
                            <Badge key={idx} variant="outline" className="border-border text-muted-foreground font-normal text-xs bg-muted">{name}</Badge>
                          ))}
                          {approval.student_names?.length > 3 && (
                            <Badge variant="outline" className="border-border text-muted-foreground font-normal text-xs bg-muted">+{approval.student_names.length - 3} nữa</Badge>
                          )}
                        </div>
                        {approval.notes?.includes('Tự động') && approval.attendance_rate != null && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className={`${approval.attendance_rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                              Điểm danh: {Math.round(approval.attendance_rate)}%
                            </span>
                            {approval.average_grade != null && (
                              <span className={`${approval.average_grade >= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                Điểm TB: {Number(approval.average_grade).toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:ml-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                      {rejectingId === approval.id ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-4">
                          <Input
                            placeholder="Lý do từ chối..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full sm:w-48 h-9 text-sm bg-background border-border text-foreground"
                            autoFocus
                          />
                          <Button size="sm" variant="destructive" onClick={() => handleReject(approval.id)}
                            disabled={actionLoading === approval.id} className="shrink-0 h-9">
                            Xác nhận
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => { setRejectingId(null); setRejectReason(''); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors h-9"
                            onClick={() => setRejectingId(approval.id)}>
                            <X className="h-4 w-4 mr-1.5" /> Từ chối
                          </Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white transition-colors h-9 shadow-sm border-0"
                            onClick={() => handleApprove(approval.id)}
                            disabled={actionLoading === approval.id}>
                            <CheckCircle className="h-4 w-4 mr-1.5" /> Duyệt
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}