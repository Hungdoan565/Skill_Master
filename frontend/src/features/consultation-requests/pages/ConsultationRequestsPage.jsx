import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  History,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { gooeyToast } from 'goey-toast';
import { useAuth } from '@/contexts/auth-context';
import { useConsultationRequests } from '../hooks/useConsultationRequests';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Mới', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'assigned', label: 'Đã nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'contacted', label: 'Đã liên hệ', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'scheduled', label: 'Đã hẹn lịch', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'closed', label: 'Đã đóng', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'lost', label: 'Không thành công', className: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const CONVERSION_OPTIONS = [
  { value: '', label: 'Chưa xác định' },
  { value: 'enrolled', label: '✅ Đã ghi danh' },
  { value: 'resolved', label: '✔️ Đã giải đáp' },
  { value: 'not_interested', label: '❌ Không quan tâm' },
  { value: 'unreachable', label: '📵 Không liên lạc được' },
];

const SOURCE_LABELS = {
  chatbot: 'Molly',
  website: 'Website',
  website_course_detail: 'Trang khóa học'
};

const URGENCY_CONFIG = {
  hot: { label: 'Ưu tiên cao', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  warm: { label: 'Ưu tiên trung bình', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cold: { label: 'Ưu tiên thấp', className: 'bg-slate-100 text-slate-700 border-slate-200' }
};

function getStatusConfig(status) {
  return STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0];
}

function getUrgencyConfig(level) {
  return URGENCY_CONFIG[level] || null;
}

function inferLegacyNeed(transcriptSummary) {
  if (!transcriptSummary) return null;
  const customerLine = transcriptSummary
    .split('\n')
    .find(line => line.startsWith('Khách:'));
  return customerLine?.replace(/^Khách:\s*/, '').trim() || null;
}

function resolveQuickSummary(request) {
  const metadata = request.metadata || {};
  const fromMetadata = metadata.summary_line || metadata.primary_need || metadata.advisor_brief;
  if (fromMetadata) return fromMetadata;

  if (request.transcript_summary?.includes('Molly:') || request.transcript_summary?.includes('Khách:')) {
    return inferLegacyNeed(request.transcript_summary) || request.transcript_summary;
  }

  return request.transcript_summary || request.notes || null;
}

function formatRelativeTime(value) {
  if (!value) return 'Chưa cập nhật';
  const now = new Date();
  const date = new Date(value);
  const diffMs = now - date;
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function RequestItem({ request, selected, onClick }) {
  const status = getStatusConfig(request.status);
  const sourceLabel = SOURCE_LABELS[request.source] || request.source || 'Khác';
  const urgency = getUrgencyConfig(request.metadata?.urgency_level);
  const quickSummary = resolveQuickSummary(request);

  return (
    <button
      type="button"
      onClick={() => onClick(request)}
      className={`w-full border-b px-4 py-4 text-left transition-colors ${selected ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{request.full_name || 'Khách hàng chưa rõ tên'}</p>
          <p className="truncate text-sm text-slate-500">{request.phone || 'Chưa có số điện thoại'}</p>
        </div>
        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">{sourceLabel}</Badge>
        {urgency ? <Badge variant="outline" className={urgency.className}>{urgency.label}</Badge> : null}
        {request.has_follow_up_thread ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Follow-up</Badge> : null}
        {request.preferred_time ? <span>{request.preferred_time}</span> : null}
        <span>{formatRelativeTime(request.updated_at)}</span>
      </div>
      {quickSummary ? <p className="mt-2 line-clamp-1 text-xs text-slate-600">Nhu cầu: {quickSummary}</p> : null}
    </button>
  );
}

const ACTIVITY_LABELS = {
  status_change: { icon: Clock, label: 'Đổi trạng thái' },
  note_added: { icon: Sparkles, label: 'Cập nhật ghi chú' },
  claimed: { icon: User, label: 'Nhận xử lý' },
  released: { icon: User, label: 'Bỏ nhận xử lý' },
  follow_up_created: { icon: CalendarClock, label: 'Tạo follow-up thread' },
  follow_up_date_set: { icon: CalendarClock, label: 'Đặt ngày follow-up' },
};

function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-slate-500 italic">Chưa có hoạt động nào.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = ACTIVITY_LABELS[activity.action] || { icon: Clock, label: activity.action };
        const IconComp = config.icon;
        const details = activity.details || {};
        let detailText = '';
        if (activity.action === 'status_change') {
          const oldLabel = STATUS_OPTIONS.find(o => o.value === details.old_status)?.label || details.old_status;
          const newLabel = STATUS_OPTIONS.find(o => o.value === details.new_status)?.label || details.new_status;
          detailText = `${oldLabel} → ${newLabel}`;
        } else if (activity.action === 'note_added') {
          detailText = details.excerpt ? `"${details.excerpt.slice(0, 80)}${details.excerpt.length > 80 ? '...' : ''}"` : '';
        } else if (activity.action === 'follow_up_date_set') {
          detailText = details.follow_up_date ? new Date(details.follow_up_date).toLocaleDateString('vi-VN') : 'Đã xóa ngày';
        }

        return (
          <div key={activity.id} className="flex gap-3 text-sm">
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                <IconComp className="h-3.5 w-3.5 text-slate-600" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-800">{config.label}</p>
              {detailText ? <p className="text-xs text-slate-500">{detailText}</p> : null}
              <p className="text-xs text-slate-400">{activity.actor?.full_name || 'Hệ thống'} • {formatRelativeTime(activity.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatTranscript({ chatHistory }) {
  const { messages, session } = chatHistory || { messages: [], session: null };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">Không có lịch sử chat Molly cho yêu cầu này</p>
        <p className="text-xs text-slate-400 mt-1">Yêu cầu này có thể từ form website hoặc không có phiên chat liên kết</p>
      </div>
    );
  }

  return (
    <div>
      {session ? (
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>{session.title || 'Phiên chat Molly'}</span>
          <span>{session.message_count} tin nhắn</span>
        </div>
      ) : null}
      <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.filter(m => m.role !== 'system').map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
              }`}
            >
              {msg.role !== 'user' ? (
                <p className="mb-0.5 text-xs font-semibold text-violet-600">🤖 Molly</p>
              ) : null}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestDetail({
  request,
  notesDraft,
  followUpDate,
  activities,
  chatHistory,
  onNotesChange,
  onFollowUpDateChange,
  onSaveNotes,
  onStatusChange,
  onConversionChange,
  onClaim,
  onRelease,
  onEnsureFollowUp,
  followUpBusy,
  saving,
  profile
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!request) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-white p-8 text-center text-slate-500">
        Chọn một yêu cầu tư vấn để xem chi tiết.
      </div>
    );
  }

  const status = getStatusConfig(request.status);
  const metadata = request.metadata || {};
  const assigneeName = request.assigned_to?.full_name || 'Chưa có người nhận';
  const isAssignedToCurrentUser = request.assigned_to?.id === profile?.id;
  const hasLegacyTranscript = Boolean(request.transcript_summary?.includes('Molly:') || request.transcript_summary?.includes('Khách:'));
  const inferredNeedFromLegacy = hasLegacyTranscript
    ? request.transcript_summary
      ?.split('\n')
      .find(line => line.startsWith('Khách:'))
      ?.replace(/^Khách:\s*/, '')
      ?.trim() || null
    : null;
  const quickNeed = metadata.primary_need || inferredNeedFromLegacy;
  const advisorBrief = metadata.advisor_brief || (!hasLegacyTranscript ? request.transcript_summary : null);
  const transcriptExcerpt = metadata.raw_transcript_excerpt || (hasLegacyTranscript ? request.transcript_summary : null);
  const urgency = getUrgencyConfig(metadata.urgency_level);
  const hasFollowUpThread = Boolean(request.follow_up_ticket_id);
  const followUpTicketNumber = request.follow_up_ticket_number || null;

  const handleCopyPhone = async () => {
    if (!request.phone) return;
    try {
      await navigator.clipboard.writeText(request.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1400);
    } catch {
      setCopiedPhone(false);
    }
  };

  return (
    <Card className="h-full border-slate-200">
      <CardHeader className="space-y-4 border-b bg-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-slate-900">{request.full_name}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{SOURCE_LABELS[request.source] || request.source || 'Nguồn khác'} • {request.source_page || 'Không rõ trang'}</p>
          </div>
          <div className="flex items-center gap-2">
            {urgency ? <Badge variant="outline" className={urgency.className}>{urgency.label}</Badge> : null}
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <div className="rounded-md border bg-white px-3 py-2 text-base font-semibold text-slate-900">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-500" /> {request.phone}</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleCopyPhone} disabled={!request.phone}>
                {copiedPhone ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copiedPhone ? 'Đã copy' : 'Copy số'}
              </Button>
              <Button type="button" size="sm" variant="outline" asChild disabled={!request.phone}>
                <a href={request.phone ? `tel:${request.phone}` : undefined}>
                  <PhoneCall className="mr-1 h-4 w-4" />
                  Gọi nhanh
                </a>
              </Button>
            </div>
            {request.email ? <div className="mt-2 flex items-center gap-2"><Mail className="h-4 w-4" /> {request.email}</div> : null}
            {request.preferred_time ? <div className="mt-2 flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {request.preferred_time}</div> : null}
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <div className="flex items-center gap-2"><User className="h-4 w-4" /> {assigneeName}</div>
            <div className="mt-2 text-xs text-slate-500">Cập nhật {formatRelativeTime(request.updated_at)}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {!isAssignedToCurrentUser ? (
                <Button size="sm" onClick={onClaim} disabled={saving}>Nhận xử lý</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onRelease} disabled={saving}>Bỏ nhận</Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Cập nhật trạng thái</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter(option => option.value !== request.status).map(option => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(option.value)}
                disabled={saving}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {(request.status === 'closed' || request.status === 'lost') ? (
          <div className="rounded-xl border bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Kết quả chuyển đổi</p>
            <select
              value={request.conversion_outcome || ''}
              onChange={(e) => onConversionChange(e.target.value || null)}
              disabled={saving}
              className="h-10 rounded-md border bg-white px-3 text-sm"
            >
              {CONVERSION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ) : null}

        {(request.handoff_reason || request.transcript_summary) ? (
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Bot className="h-4 w-4" />
              Molly context
            </div>
            {request.handoff_reason ? <p className="text-sm text-slate-600">Lý do handoff: {request.handoff_reason}</p> : null}
            {quickNeed ? <p className="mt-2 text-sm font-medium text-slate-800">Nhu cầu chính: {quickNeed}</p> : null}
            {advisorBrief ? <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{advisorBrief}</p> : null}
            {transcriptExcerpt ? (
              <div className="mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTranscript(value => !value)}
                >
                  {showTranscript ? 'Ẩn đoạn chat gần nhất' : 'Xem đoạn chat gần nhất'}
                </Button>
                {showTranscript ? (
                  <pre className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border bg-white p-3 text-sm text-slate-600">
                    {transcriptExcerpt}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {(metadata.goal || metadata.level || metadata.course || metadata.message) ? (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4" />
              Thông tin intake
            </div>
            <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-600">
              {metadata.goal ? <div><span className="font-medium text-slate-900">Mục tiêu:</span> {metadata.goal}</div> : null}
              {metadata.level ? <div><span className="font-medium text-slate-900">Trình độ:</span> {metadata.level}</div> : null}
              {metadata.course ? <div><span className="font-medium text-slate-900">Khóa học:</span> {metadata.course}</div> : null}
              {metadata.message ? <div className="md:col-span-2"><span className="font-medium text-slate-900">Nội dung:</span> {metadata.message}</div> : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageSquare className="h-4 w-4" />
            Lịch sử chat Molly
          </div>
          <ChatTranscript chatHistory={chatHistory} />
        </div>

        <div className="rounded-xl border bg-indigo-50/60 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Luồng follow-up học viên</p>
            {hasFollowUpThread ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Đã liên kết</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Chưa liên kết</Badge>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {hasFollowUpThread
              ? `Ticket: #${followUpTicketNumber || request.follow_up_ticket_id}`
              : 'Tạo luồng follow-up để học viên nhận phản hồi và hỏi đáp hai chiều trong mục Hỗ trợ.'}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant={hasFollowUpThread ? 'outline' : 'default'}
              size="sm"
              onClick={onEnsureFollowUp}
              disabled={saving || followUpBusy}
            >
              {followUpBusy ? 'Đang xử lý...' : hasFollowUpThread ? 'Đồng bộ luồng follow-up' : 'Tạo luồng follow-up'}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">Ngày follow-up</p>
          <Input
            type="date"
            value={followUpDate}
            onChange={(event) => onFollowUpDateChange(event.target.value)}
            className="max-w-xs"
          />
          <p className="mt-1 text-xs text-slate-500">
            {followUpDate ? `Hẹn follow-up: ${new Date(followUpDate).toLocaleDateString('vi-VN')}` : 'Chưa đặt ngày follow-up'}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Ghi chú follow-up</p>
          <Textarea
            value={notesDraft}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Ghi chú nội dung tư vấn, hẹn lịch, kết quả liên hệ..."
            rows={5}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={onSaveNotes} disabled={saving}>Lưu ghi chú</Button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <History className="h-4 w-4" />
            Lịch sử hoạt động
          </div>
          <ActivityTimeline activities={activities} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ConsultationRequestsPage() {
  const { profile } = useAuth();
  const {
    requests,
    currentRequest,
    loading,
    saving,
    pagination,
    activities,
    chatHistory,
    setCurrentRequest,
    fetchRequests,
    fetchRequestDetail,
    fetchActivities,
    fetchChatHistory,
    updateRequest,
    claimRequest,
    releaseRequest,
    ensureFollowUpThread
  } = useConsultationRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpBusy, setFollowUpBusy] = useState(false);

  useEffect(() => {
    fetchRequests({ search: searchTerm, status: statusFilter, source: sourceFilter, page: currentPage });
  }, [fetchRequests, searchTerm, statusFilter, sourceFilter, currentPage]);

  useEffect(() => {
    setNotesDraft(currentRequest?.notes || '');
    setFollowUpDate(currentRequest?.follow_up_date || '');
  }, [currentRequest?.id, currentRequest?.notes, currentRequest?.follow_up_date]);

  const stats = useMemo(() => {
    const newItems = requests.filter(item => item.status === 'new');
    // SLA: avg time from created_at → contacted_at (only for items that have been contacted)
    const contactedItems = requests.filter(item => item.contacted_at && item.created_at);
    let avgResponseHours = null;
    if (contactedItems.length > 0) {
      const totalMs = contactedItems.reduce((sum, item) => {
        return sum + (new Date(item.contacted_at) - new Date(item.created_at));
      }, 0);
      avgResponseHours = Math.round((totalMs / contactedItems.length) / (1000 * 60 * 60) * 10) / 10;
    }
    return {
      total: pagination.total || requests.length,
      newCount: newItems.length,
      contacted: requests.filter(item => item.status === 'contacted').length,
      scheduled: requests.filter(item => item.status === 'scheduled').length,
      avgResponseHours,
    };
  }, [requests, pagination.total]);

  const totalPages = Math.max(1, Math.ceil((pagination.total || requests.length) / (pagination.limit || 50)));

  const handleSelectRequest = async (request) => {
    setCurrentRequest(request);
    setMobileShowDetail(true);
    const result = await fetchRequestDetail(request.id);
    if (result && !result.success) {
      gooeyToast.error(result.error || 'Không thể tải chi tiết');
    }
    fetchActivities(request.id);
    fetchChatHistory(request.id);
  };

  const handleSaveNotes = async () => {
    if (!currentRequest) return;
    const payload = { notes: notesDraft };
    if (followUpDate !== (currentRequest.follow_up_date || '')) {
      payload.follow_up_date = followUpDate || null;
    }
    const result = await updateRequest(currentRequest.id, payload);
    if (result?.success) {
      gooeyToast.success('Đã lưu ghi chú');
    } else {
      gooeyToast.error(result?.error || 'Không thể lưu ghi chú');
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!currentRequest) return;
    const result = await updateRequest(currentRequest.id, { status: nextStatus });
    if (result?.success) {
      gooeyToast.success(`Đã chuyển trạng thái sang "${STATUS_OPTIONS.find(o => o.value === nextStatus)?.label || nextStatus}"`);
    } else {
      gooeyToast.error(result?.error || 'Không thể cập nhật trạng thái');
    }
  };

  const handleClaim = async () => {
    if (!currentRequest) return;
    const result = await claimRequest(currentRequest.id);
    if (result?.success) {
      gooeyToast.success('Đã nhận xử lý yêu cầu tư vấn');
    } else {
      gooeyToast.error(result?.error || 'Không thể nhận xử lý');
    }
  };

  const handleRelease = async () => {
    if (!currentRequest) return;
    const result = await releaseRequest(currentRequest.id);
    if (result?.success) {
      gooeyToast.success('Đã bỏ nhận xử lý');
    } else {
      gooeyToast.error(result?.error || 'Không thể bỏ nhận');
    }
  };

  const handleEnsureFollowUp = async () => {
    if (!currentRequest) return;
    setFollowUpBusy(true);
    try {
      const result = await ensureFollowUpThread(currentRequest.id);
      if (result?.success) {
        gooeyToast.success('Đã tạo/đồng bộ luồng follow-up');
      } else {
        gooeyToast.error(result?.error || 'Không thể tạo luồng follow-up');
      }
    } finally {
      setFollowUpBusy(false);
    }
  };

  const handleConversionChange = async (outcome) => {
    if (!currentRequest) return;
    const result = await updateRequest(currentRequest.id, { conversion_outcome: outcome });
    if (result?.success) {
      gooeyToast.success(outcome ? 'Đã cập nhật kết quả chuyển đổi' : 'Đã xóa kết quả chuyển đổi');
    } else {
      gooeyToast.error(result?.error || 'Không thể cập nhật');
    }
  };

  // #11: Supabase Realtime — auto-refresh list on new/updated requests
  const fetchRef = useRef(null);
  fetchRef.current = useCallback(() => {
    fetchRequests({ search: searchTerm, status: statusFilter, source: sourceFilter, page: currentPage });
  }, [fetchRequests, searchTerm, statusFilter, sourceFilter, currentPage]);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const client = createClient(supabaseUrl, supabaseKey);
    const channel = client
      .channel('consultation_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'consultation_requests'
      }, () => {
        fetchRef.current?.();
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yêu cầu tư vấn</h1>
          <p className="text-slate-500">Advisor inbox cho Molly và các form tư vấn website</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchRequests({ search: searchTerm, status: statusFilter, source: sourceFilter, page: currentPage })} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Tổng yêu cầu</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Mới</p><p className="text-2xl font-bold text-blue-600">{stats.newCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Đã liên hệ</p><p className="text-2xl font-bold">{stats.contacted}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Đã hẹn lịch</p><p className="text-2xl font-bold">{stats.scheduled}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Avg phản hồi</p><p className="text-2xl font-bold">{stats.avgResponseHours !== null ? `${stats.avgResponseHours}h` : '—'}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className={`lg:col-span-1 ${mobileShowDetail ? 'hidden lg:block' : ''}`}>
          <CardHeader className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Tìm theo tên, email, số điện thoại..." className="pl-9" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} className="h-10 rounded-md border bg-white px-3 text-sm">
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setCurrentPage(1); }} className="h-10 rounded-md border bg-white px-3 text-sm">
                <option value="">Tất cả nguồn</option>
                <option value="chatbot">Molly</option>
                <option value="website">Website</option>
                <option value="website_course_detail">Trang khóa học</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {requests.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Chưa có yêu cầu tư vấn phù hợp bộ lọc.</div>
            ) : (
              requests.map(request => (
                <RequestItem
                  key={request.id}
                  request={request}
                  selected={currentRequest?.id === request.id}
                  onClick={handleSelectRequest}
                />
              ))
            )}

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-xs text-slate-500">
                  Trang {currentPage}/{totalPages} ({pagination.total} yêu cầu)
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className={`lg:col-span-2 ${mobileShowDetail ? 'block' : 'hidden lg:block'}`}>
          {mobileShowDetail ? (
            <Button variant="ghost" size="sm" className="mb-3 lg:hidden" onClick={() => setMobileShowDetail(false)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại danh sách
            </Button>
          ) : null}

          <RequestDetail
            key={currentRequest?.id || 'empty'}
            request={currentRequest}
            notesDraft={notesDraft}
            followUpDate={followUpDate}
            activities={activities}
            chatHistory={chatHistory}
            onNotesChange={setNotesDraft}
            onFollowUpDateChange={setFollowUpDate}
            onSaveNotes={handleSaveNotes}
            onStatusChange={handleStatusChange}
            onConversionChange={handleConversionChange}
            onClaim={handleClaim}
            onRelease={handleRelease}
            onEnsureFollowUp={handleEnsureFollowUp}
            followUpBusy={followUpBusy}
            saving={saving}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}
