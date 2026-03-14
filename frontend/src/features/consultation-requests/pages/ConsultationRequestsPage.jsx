import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Check,
  Copy,
  Mail,
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

function RequestDetail({
  request,
  notesDraft,
  onNotesChange,
  onSaveNotes,
  onStatusChange,
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

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Ghi chú follow-up</p>
          <Textarea
            value={notesDraft}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Ghi chú nội dung tư vấn, hẹn lịch, kết quả liên hệ..."
            rows={8}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={onSaveNotes} disabled={saving}>Lưu ghi chú</Button>
          </div>
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
    setCurrentRequest,
    fetchRequests,
    fetchRequestDetail,
    updateRequest,
    claimRequest,
    releaseRequest,
    ensureFollowUpThread
  } = useConsultationRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [followUpBusy, setFollowUpBusy] = useState(false);

  useEffect(() => {
    fetchRequests({ search: searchTerm, status: statusFilter, source: sourceFilter });
  }, [fetchRequests, searchTerm, statusFilter, sourceFilter]);

  useEffect(() => {
    setNotesDraft(currentRequest?.notes || '');
  }, [currentRequest?.id, currentRequest?.notes]);

  const stats = useMemo(() => ({
    total: requests.length,
    newCount: requests.filter(item => item.status === 'new').length,
    contacted: requests.filter(item => item.status === 'contacted').length,
    scheduled: requests.filter(item => item.status === 'scheduled').length,
  }), [requests]);

  const handleSelectRequest = async (request) => {
    setCurrentRequest(request);
    setMobileShowDetail(true);
    await fetchRequestDetail(request.id);
  };

  const handleSaveNotes = async () => {
    if (!currentRequest) return;
    await updateRequest(currentRequest.id, { notes: notesDraft });
  };

  const handleStatusChange = async (nextStatus) => {
    if (!currentRequest) return;
    await updateRequest(currentRequest.id, { status: nextStatus });
  };

  const handleClaim = async () => {
    if (!currentRequest) return;
    await claimRequest(currentRequest.id);
  };

  const handleRelease = async () => {
    if (!currentRequest) return;
    await releaseRequest(currentRequest.id);
  };

  const handleEnsureFollowUp = async () => {
    if (!currentRequest) return;
    setFollowUpBusy(true);
    try {
      await ensureFollowUpThread(currentRequest.id);
    } finally {
      setFollowUpBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yêu cầu tư vấn</h1>
          <p className="text-slate-500">Advisor inbox cho Molly và các form tư vấn website</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchRequests({ search: searchTerm, status: statusFilter, source: sourceFilter })} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Tổng yêu cầu</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Mới</p><p className="text-2xl font-bold">{stats.newCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Đã liên hệ</p><p className="text-2xl font-bold">{stats.contacted}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Đã hẹn lịch</p><p className="text-2xl font-bold">{stats.scheduled}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className={`lg:col-span-1 ${mobileShowDetail ? 'hidden lg:block' : ''}`}>
          <CardHeader className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo tên, email, số điện thoại..." className="pl-9" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm">
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
            onNotesChange={setNotesDraft}
            onSaveNotes={handleSaveNotes}
            onStatusChange={handleStatusChange}
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
