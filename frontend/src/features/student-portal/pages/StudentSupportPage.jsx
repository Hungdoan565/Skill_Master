import React, { useEffect, useState } from 'react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';
import { useStudentSupport } from '../hooks';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { HeadphonesIcon, AlertTriangle, Plus, Clock, Tag, ChevronRight, RefreshCw, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const STATUS_MAP = {
  open: { label: 'Mở', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
  in_progress: { label: 'Đang xử lý', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-l-amber-500' },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-500/10 text-green-600 dark:text-green-400', border: 'border-l-green-500' },
  closed: { label: 'Đã đóng', color: 'bg-muted text-muted-foreground', border: 'border-l-muted-foreground' },
};

const CATEGORY_MAP = {
  academic: 'Học vụ',
  technical: 'Kỹ thuật',
  billing: 'Tài chính',
  course: 'Khóa học',
  general: 'Tổng quát',
  financial: 'Tài chính',
  other: 'Khác'
};

const PRIORITY_MAP = {
  low: { label: 'Thấp', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Trung bình', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  medium: { label: 'Trung bình', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  high: { label: 'Cao', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  urgent: { label: 'Khẩn cấp', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' }
};

export default function StudentSupportPage() {
  const {
    tickets,
    ticketDetail,
    ticketMessages,
    loading,
    detailLoading,
    sendingReply,
    error,
    createTicket,
    fetchTicketDetail,
    sendReply,
    setTicketDetail,
    refetch
  } = useStudentSupport();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    subject: '',
    category: 'academic',
    priority: 'medium',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    setSubmitting(true);
    const result = await createTicket(formData);
    setSubmitting(false);

    if (result.success) {
      toast({
        title: 'Thành công',
        description: 'Đã gửi yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi sớm nhất.',
        type: 'success'
      });
      setIsModalOpen(false);
      setFormData({
        subject: '',
        category: 'academic',
        priority: 'medium',
        message: ''
      });
    } else {
      toast({
        title: 'Lỗi',
        description: result.error,
        type: 'error'
      });
    }
  };

  // Supabase Realtime: subscribe to ticket_messages for selected ticket
  useEffect(() => {
    if (!selectedTicketId) return;

    const channel = supabaseClient
      .channel(`student-ticket-${selectedTicketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicketId}`
        },
        () => {
          fetchTicketDetail(selectedTicketId);
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [selectedTicketId, fetchTicketDetail]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  const syncTicketQuery = (ticketId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (ticketId) {
      nextParams.set('ticketId', ticketId);
    } else {
      nextParams.delete('ticketId');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleOpenTicket = async (ticketId) => {
    if (!ticketId) return;
    setSelectedTicketId(ticketId);
    syncTicketQuery(ticketId);
    await fetchTicketDetail(ticketId);
  };

  const handleCloseTicket = () => {
    setSelectedTicketId(null);
    setReplyText('');
    setTicketDetail(null);
    syncTicketQuery(null);
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;

    const result = await sendReply(selectedTicketId, replyText);
    if (result.success) {
      setReplyText('');
      toast({
        title: 'Đã gửi phản hồi',
        description: 'Tin nhắn của bạn đã được gửi đến trung tâm.',
        type: 'success'
      });
      return;
    }

    toast({
      title: 'Không thể gửi phản hồi',
      description: result.error || 'Vui lòng thử lại sau.',
      type: 'error'
    });
  };

  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId || selectedTicketId === ticketId) return;

    const existsInList = tickets.some(ticket => ticket.id === ticketId);
    if (existsInList) {
      setSelectedTicketId(ticketId);
      fetchTicketDetail(ticketId);
    }
  }, [fetchTicketDetail, searchParams, selectedTicketId, tickets]);

  useEffect(() => {
    if (!selectedTicketId) return undefined;

    const pollTimer = setInterval(() => {
      fetchTicketDetail(selectedTicketId);
      refetch();
    }, 20000);

    return () => clearInterval(pollTimer);
  }, [fetchTicketDetail, refetch, selectedTicketId]);

  const selectedTicket = ticketDetail || tickets.find(ticket => ticket.id === selectedTicketId) || null;
  const canReply = selectedTicket && selectedTicket.status !== 'closed';

  if (loading && !tickets.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && !tickets.length) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4 opacity-80" />
          <h2 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={refetch} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 sm:p-8 shadow-lg mb-8">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <HeadphonesIcon className="h-8 w-8 opacity-90" />
              Hỗ trợ
            </h1>
            <p className="text-emerald-50 text-base sm:text-lg max-w-xl">
              Theo dõi trao đổi với trung tâm về học tập, kỹ thuật hoặc học phí
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm border-0"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo yêu cầu hỗ trợ
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,97.3,-2.6C97.8,12.9,92.8,28.5,83.9,41.9C75,55.3,62.2,66.5,47.9,73.5C33.6,80.5,17.8,83.3,2.4,79.1C-13.1,74.9,-28.1,63.7,-41.8,54.1C-55.5,44.5,-67.9,36.5,-75.4,24.8C-82.9,13.1,-85.5,-2.3,-81.4,-15.8C-77.3,-29.3,-66.5,-40.9,-54.2,-49.2C-41.9,-57.5,-28.1,-62.5,-14.6,-66.1C-1.1,-69.7,12.1,-71.9,26.5,-73.4C40.9,-74.9,56.5,-75.7,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Yêu cầu của bạn</h2>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading} className="text-muted-foreground">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white rounded-2xl border border-border shadow-sm">
          <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <HeadphonesIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Chưa có yêu cầu hỗ trợ nào</p>
          <p className="text-sm mb-6 max-w-sm text-center">Bạn có thể tạo yêu cầu hỗ trợ nếu gặp bất kỳ vấn đề nào về học tập, kỹ thuật hoặc học phí.</p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Tạo yêu cầu đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map(ticket => {
            const statusConfig = STATUS_MAP[ticket.status] || STATUS_MAP.open;
            const priorityConfig = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;

            return (
              <Card key={ticket.id} className={cn("hover:shadow-md transition-shadow group overflow-hidden border-l-4 rounded-2xl bg-white border-y-border border-r-border", statusConfig.border)}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                      #{ticket.ticket_number}
                    </span>
                    <Badge variant="outline" className={cn("border-0 font-medium", statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-base line-clamp-2 mb-3 group-hover:text-emerald-600 transition-colors">
                    {ticket.subject}
                  </h3>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {ticket.is_consultation_follow_up ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Theo dõi sau tư vấn
                      </Badge>
                    ) : null}
                    {ticket.message_count > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {ticket.message_count} tin nhắn
                      </Badge>
                    ) : null}
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{CATEGORY_MAP[ticket.category] || ticket.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <Badge variant="secondary" className={cn("text-xs border-0", priorityConfig.color)}>
                      {priorityConfig.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-emerald-600 dark:text-emerald-400 px-2 group-hover:bg-emerald-500/10"
                      onClick={() => handleOpenTicket(ticket.id)}
                    >
                      Chi tiết <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTicketId ? (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-5 md:p-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {selectedTicket?.ticket_number ? `#${selectedTicket.ticket_number}` : 'Ticket'}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{selectedTicket?.subject || 'Chi tiết yêu cầu'}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {selectedTicket?.status ? (
                    <Badge variant="outline" className={cn('border-0', (STATUS_MAP[selectedTicket.status] || STATUS_MAP.open).color)}>
                      {(STATUS_MAP[selectedTicket.status] || STATUS_MAP.open).label}
                    </Badge>
                  ) : null}
                  {selectedTicket?.is_consultation_follow_up ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Theo dõi sau tư vấn
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleCloseTicket}>
                Đóng chi tiết
              </Button>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Lịch sử trao đổi</p>
              {detailLoading && !ticketMessages.length ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tải hội thoại...
                </div>
              ) : ticketMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có phản hồi nào. Trung tâm sẽ phản hồi sớm nhất.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {ticketMessages.map((msg) => {
                    const isMine = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                            isMine
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-border text-slate-800'
                          )}
                        >
                          <p className={cn('font-medium text-xs mb-1', isMine ? 'text-emerald-50' : 'text-muted-foreground')}>
                            {isMine ? 'Bạn' : (msg.sender?.full_name || 'Trung tâm')}
                          </p>
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={cn('mt-1 text-[11px]', isMine ? 'text-emerald-100' : 'text-muted-foreground')}>
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="ticket-reply" className="font-medium">Phản hồi cho trung tâm</Label>
              <Textarea
                id="ticket-reply"
                placeholder={canReply ? 'Nhập thắc mắc hoặc phản hồi của bạn...' : 'Ticket đã đóng, không thể phản hồi thêm.'}
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                className="min-h-[110px] resize-none"
                disabled={!canReply || sendingReply}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!canReply || sendingReply || !replyText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {sendingReply ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Gửi phản hồi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Create Ticket Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HeadphonesIcon className="h-5 w-5 text-emerald-600" />
              Tạo yêu cầu hỗ trợ mới
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp chi tiết về vấn đề bạn đang gặp phải. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="font-medium">Tiêu đề <span className="text-red-500">*</span></Label>
              <Input
                id="subject"
                placeholder="VD: Không thể xem video bài giảng"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-medium">Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={val => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="focus:ring-emerald-500">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Học vụ</SelectItem>
                    <SelectItem value="technical">Kỹ thuật</SelectItem>
                    <SelectItem value="financial">Tài chính</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="font-medium">Mức độ ưu tiên</Label>
                <Select
                  value={formData.priority}
                  onValueChange={val => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="focus:ring-emerald-500">
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="font-medium">Nội dung chi tiết <span className="text-red-500">*</span></Label>
              <Textarea
                id="message"
                placeholder="Mô tả rõ vấn đề của bạn..."
                className="min-h-[120px] resize-none focus-visible:ring-emerald-500"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={submitting || !formData.subject.trim() || !formData.message.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Gửi yêu cầu</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
