import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    CalendarDays,
    CalendarRange,
    ClipboardList,
    Clock3,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Plus,
    Trash2,
    RefreshCw,
    Send,
    FileText,
    Ban,
    Sparkles,
    ArrowRight,
    Pencil,
    Stethoscope,
    User,
    Palmtree,
    Baby,
    Repeat2,
    HelpCircle,
    SlidersHorizontal,
    Paperclip,
    X,
    Check
} from 'lucide-react';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';

// ─────────────────────────── Constants ───────────────────────────

const LEAVE_TYPE_OPTIONS = [
    {
        value: 'sick',
        label: 'Nghỉ ốm',
        description: 'Nghỉ do bệnh tật, cần đi khám',
        icon: Stethoscope,
        color: 'text-rose-600',
        bg: 'bg-rose-50 border-rose-200 hover:border-rose-400'
    },
    {
        value: 'personal',
        label: 'Việc riêng',
        description: 'Giải quyết công việc cá nhân',
        icon: User,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400'
    },
    {
        value: 'annual',
        label: 'Phép năm',
        description: 'Nghỉ phép thường niên',
        icon: Palmtree,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
    },
    {
        value: 'maternity',
        label: 'Thai sản',
        description: 'Nghỉ thai sản / chăm sóc con nhỏ',
        icon: Baby,
        color: 'text-pink-600',
        bg: 'bg-pink-50 border-pink-200 hover:border-pink-400'
    },
    {
        value: 'compensatory',
        label: 'Nghỉ bù',
        description: 'Nghỉ bù sau khi làm thêm',
        icon: Repeat2,
        color: 'text-amber-600',
        bg: 'bg-amber-50 border-amber-200 hover:border-amber-400'
    },
    {
        value: 'other',
        label: 'Lý do khác',
        description: 'Các lý do không thuộc danh mục trên',
        icon: HelpCircle,
        color: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-200 hover:border-slate-400'
    }
];

const STATUS_CONFIG = {
    pending: {
        label: 'Chờ duyệt',
        icon: Clock3,
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
    },
    approved: {
        label: 'Đã duyệt',
        icon: CheckCircle2,
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
    },
    rejected: {
        label: 'Từ chối',
        icon: XCircle,
        className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10'
    }
};

const STATUS_CARD_ACCENT = {
    pending: 'border-l-4 border-l-amber-500',
    approved: 'border-l-4 border-l-emerald-500',
    rejected: 'border-l-4 border-l-rose-500'
};

const EMPTY_FORM = {
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
};

const FILTER_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' }
];

// ─────────────────────────── Helpers ───────────────────────────

const getTodayISO = () => new Date().toISOString().split('T')[0];

const formatDate = (value) => {
    if (!value) return '--';
    return new Date(value).toLocaleDateString('vi-VN');
};

const formatDateTime = (value) => {
    if (!value) return '--';
    return new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const getDurationInDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (Number.isNaN(diff) || diff < 0) return 0;
    return diff + 1;
};

const getLeaveTypeOption = (type) =>
    LEAVE_TYPE_OPTIONS.find((item) => item.value === type) || LEAVE_TYPE_OPTIONS[5];

// ─────────────────────────── Sub-components ───────────────────────────

function LeaveTypePicker({ value, onChange }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEAVE_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${isSelected
                            ? `${option.bg} border-current ring-2 ring-offset-1 ring-current/30`
                            : `bg-white border-slate-200 hover:${option.bg}`
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${isSelected ? option.color : 'text-slate-400'}`} />
                            {isSelected && <Check className={`h-3.5 w-3.5 ${option.color} ml-auto`} />}
                        </div>
                        <span className={`text-xs font-semibold ${isSelected ? option.color : 'text-slate-700'}`}>
                            {option.label}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight">{option.description}</span>
                    </button>
                );
            })}
        </div>
    );
}

function DurationPreview({ startDate, endDate }) {
    const days = getDurationInDays(startDate, endDate);
    if (!startDate || !endDate || days <= 0) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold animate-fade-in-up">
            <CalendarDays className="h-4 w-4" />
            {days === 1 ? 'Nghỉ 1 ngày' : `Nghỉ ${days} ngày liên tiếp`}
        </div>
    );
}

function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-xl border border-border p-6 max-w-sm w-full">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{message}</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Huỷ
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${confirmColor}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────── Main Page ───────────────────────────

export function TeacherLeaveRequestsPage() {
    const { profile } = useAuth();
    const { requests, loading, error, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest, refetch } = useLeaveRequests();

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null); // null = create, object = edit
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    // Confirm dialog state
    const [confirmState, setConfirmState] = useState({ open: false, id: null });

    // Filter state
    const [statusFilter, setStatusFilter] = useState('all');

    // ─── Stats ───
    const stats = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter((item) => item.status === 'pending').length;
        const approved = requests.filter((item) => item.status === 'approved').length;
        const rejected = requests.filter((item) => item.status === 'rejected').length;
        return { total, pending, approved, rejected };
    }, [requests]);

    // ─── Filtered list ───
    const filteredRequests = useMemo(() => {
        if (statusFilter === 'all') return requests;
        return requests.filter((r) => r.status === statusFilter);
    }, [requests, statusFilter]);

    // ─── Modal helpers ───
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRequest(null);
        setFormData(EMPTY_FORM);
        setFormError('');
    };

    const openCreateModal = () => {
        setEditingRequest(null);
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (request) => {
        setEditingRequest(request);
        setFormData({
            leave_type: request.leave_type || 'sick',
            start_date: request.start_date || '',
            end_date: request.end_date || '',
            reason: request.reason || ''
        });
        setFormError('');
        setIsModalOpen(true);
    };

    // ─── Form submit ───
    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        if (!formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason.trim()) {
            setFormError('Vui lòng nhập đầy đủ thông tin đơn xin nghỉ');
            return;
        }

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            setFormError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
            return;
        }

        setSubmitting(true);

        const payload = { ...formData, reason: formData.reason.trim() };
        const result = editingRequest
            ? await updateLeaveRequest(editingRequest.id, payload)
            : await createLeaveRequest(payload);

        setSubmitting(false);

        if (!result.success) {
            setFormError(result.message || 'Không thể lưu đơn xin nghỉ');
            return;
        }

        closeModal();
    };

    // ─── Delete flow ───
    const handleDeleteClick = (requestId) => {
        setConfirmState({ open: true, id: requestId });
    };

    const handleDeleteConfirm = async () => {
        const { id } = confirmState;
        setConfirmState({ open: false, id: null });
        if (id) await deleteLeaveRequest(id);
    };

    // ─── Loading / Error states ───
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-muted-foreground">Đang tải danh sách đơn xin nghỉ...</p>
                </div>
            </div>
        );
    }

    if (error && requests.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-white">
                <div className="text-center p-6 bg-red-500/10 rounded-2xl max-w-md border border-red-500/20 shadow-sm">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Không thể tải dữ liệu</h2>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-12">
            {/* ─── Page Header ─── */}
            <TeacherPageHeader
                title="Đơn xin nghỉ phép"
                subtitle={`Quản lý và theo dõi các đơn xin nghỉ của bạn${profile?.full_name ? ` - ${profile.full_name}` : ''}`}
                icon={ClipboardList}
                breadcrumbs={[
                    { label: 'Tổng quan', href: '/teacher/dashboard' },
                    { label: 'Xin nghỉ phép', active: true }
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={refetch}
                            className="p-2.5 rounded-xl bg-white shadow-sm border border-border hover:bg-slate-50 transition-all hover-card-lift text-slate-600"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 btn-tactile hover-card-lift"
                        >
                            <Plus className="h-5 w-5" />
                            Tạo đơn xin nghỉ
                        </button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in-up stagger-1">

                {/* ─── Stats Cards ─── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 shadow-sm hover-card-lift transition-all">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <ClipboardList className="h-4 w-4 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-blue-700">Tổng số đơn</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-5 shadow-sm hover-card-lift transition-all">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock3 className="h-4 w-4 text-amber-600" />
                            </div>
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Chờ duyệt</p>
                        </div>
                        <p className="text-3xl font-bold text-amber-800 dark:text-amber-400">{stats.pending}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-2xl border border-green-500/20 p-5 shadow-sm hover-card-lift transition-all">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Đã duyệt</p>
                        </div>
                        <p className="text-3xl font-bold text-green-800 dark:text-green-400">{stats.approved}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-2xl border border-red-500/20 p-5 shadow-sm hover-card-lift transition-all">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Từ chối</p>
                        </div>
                        <p className="text-3xl font-bold text-red-800 dark:text-red-400">{stats.rejected}</p>
                    </div>
                </div>

                {/* ─── Error banner ─── */}
                {error && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {/* ─── Filter Bar ─── */}
                {requests.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600 mr-1">Lọc:</span>
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${statusFilter === opt.value
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                    }`}
                            >
                                {opt.label}
                                {opt.value !== 'all' && (
                                    <span className="ml-1.5 opacity-70">
                                        ({opt.value === 'pending' ? stats.pending : opt.value === 'approved' ? stats.approved : stats.rejected})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* ─── Request List ─── */}
                <div className="space-y-4">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm animate-fade-in-up stagger-2">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {statusFilter === 'all' ? 'Chưa có đơn xin nghỉ nào' : `Không có đơn ${FILTER_OPTIONS.find(o => o.value === statusFilter)?.label?.toLowerCase()}`}
                            </h3>
                            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                                {statusFilter === 'all'
                                    ? 'Hãy tạo đơn mới khi bạn cần xin nghỉ dạy. Quản lý sẽ xét duyệt và phản hồi sớm nhất.'
                                    : 'Thử bỏ bộ lọc hoặc chọn trạng thái khác.'}
                            </p>
                            {statusFilter === 'all' && (
                                <button
                                    onClick={openCreateModal}
                                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 btn-tactile hover-card-lift"
                                >
                                    <Plus className="h-5 w-5" />
                                    Tạo đơn đầu tiên
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredRequests.map((request, index) => {
                            const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                            const cardAccent = STATUS_CARD_ACCENT[request.status] || STATUS_CARD_ACCENT.pending;
                            const canEdit = request.status === 'pending';
                            const StatusIcon = status.icon || Clock3;
                            const durationDays = request.total_days || getDurationInDays(request.start_date, request.end_date);
                            const leaveTypeOpt = getLeaveTypeOption(request.leave_type);
                            const LeaveTypeIcon = leaveTypeOpt.icon;
                            const staggerClass = `stagger-${Math.min(index + 2, 5)}`;
                            const hasAttachments = Array.isArray(request.attachments) && request.attachments.length > 0;

                            return (
                                <div
                                    key={request.id}
                                    className={`bg-white rounded-2xl border border-border/80 shadow-sm hover-card-lift transition-all animate-fade-in-up ${cardAccent} ${staggerClass}`}
                                >
                                    <div className="p-5 sm:p-6 flex flex-col gap-4">
                                        {/* Top row: Status badge + Timestamp */}
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${status.className}`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {status.label}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                Tạo lúc: {formatDateTime(request.created_at)}
                                            </span>
                                        </div>

                                        {/* Leave type heading */}
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${leaveTypeOpt.bg.split(' ')[0]} border ${leaveTypeOpt.bg.split(' ')[1]}`}>
                                                <LeaveTypeIcon className={`h-5 w-5 ${leaveTypeOpt.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Loại nghỉ</p>
                                                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                                                    {leaveTypeOpt.label}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Date range */}
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                                            <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400 mb-1.5">Khoảng thời gian nghỉ</p>
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <CalendarRange className="h-4 w-4 text-blue-600" />
                                                    <span>{formatDate(request.start_date)}</span>
                                                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{formatDate(request.end_date)}</span>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 w-fit">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {durationDays <= 1 ? 'Nghỉ 1 ngày' : `Nghỉ ${durationDays} ngày`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Lý do xin nghỉ</p>
                                            <p className="leading-relaxed text-slate-700 whitespace-pre-line">{request.reason}</p>
                                        </div>

                                        {/* Attachments (if any) */}
                                        {hasAttachments && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Paperclip className="h-4 w-4 text-slate-400" />
                                                <span className="text-xs text-slate-500 font-medium">Đính kèm:</span>
                                                {request.attachments.map((att, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={att.url || att}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        {att.name || `File ${idx + 1}`}
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reviewer notes */}
                                        {request.status === 'approved' && request.reviewer_notes && (
                                            <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 border-l-4 border-l-emerald-500">
                                                <p className="font-semibold mb-1 flex items-center gap-1.5">
                                                    <ClipboardList className="w-4 h-4" /> Ghi chú duyệt
                                                </p>
                                                <p>{request.reviewer_notes}</p>
                                            </div>
                                        )}
                                        {request.status === 'rejected' && request.reviewer_notes && (
                                            <div className="text-sm text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 border-l-4 border-l-rose-500">
                                                <p className="font-semibold mb-1 flex items-center gap-1.5">
                                                    <Ban className="w-4 h-4" /> Lý do từ chối
                                                </p>
                                                <p>{request.reviewer_notes}</p>
                                            </div>
                                        )}

                                        {/* Action footer */}
                                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                                            {canEdit ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(request)}
                                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-300 text-blue-700 hover:bg-blue-50 transition-all font-semibold text-sm btn-tactile"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Chỉnh sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(request.id)}
                                                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 transition-all font-semibold text-sm btn-tactile"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Thu hồi
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    <Ban className="h-3.5 w-3.5" />
                                                    Đơn đã xử lý
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Create / Edit Modal ─── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={closeModal} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-border overflow-hidden max-h-[92vh] flex flex-col">
                        {/* Modal header */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground tracking-tight">
                                        {editingRequest ? 'Chỉnh sửa đơn xin nghỉ' : 'Tạo đơn xin nghỉ'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {editingRequest
                                            ? 'Cập nhật thông tin đơn đang chờ duyệt.'
                                            : 'Điền đầy đủ thông tin để gửi yêu cầu đến quản lý.'}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-500"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Modal body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                            {/* Leave type picker */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-foreground">Loại nghỉ</label>
                                <LeaveTypePicker
                                    value={formData.leave_type}
                                    onChange={(val) => setFormData((prev) => ({ ...prev, leave_type: val }))}
                                />
                            </div>

                            {/* Date range */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-foreground">Thời gian nghỉ</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Ngày bắt đầu</p>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            min={getTodayISO()}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Ngày kết thúc</p>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            min={formData.start_date || getTodayISO()}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                                            className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                {/* Live duration preview */}
                                <DurationPreview startDate={formData.start_date} endDate={formData.end_date} />
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-foreground">Lý do xin nghỉ <span className="text-rose-500">*</span></label>
                                <textarea
                                    rows={4}
                                    value={formData.reason}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Mô tả lý do xin nghỉ một cách cụ thể để quản lý có thể xem xét nhanh..."
                                    className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
                                />
                                <p className="text-xs text-slate-400 text-right">{formData.reason.length} ký tự</p>
                            </div>

                            {/* Error */}
                            {formError && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400 flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    {formError}
                                </div>
                            )}

                            {/* Footer buttons */}
                            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm shadow-blue-600/20"
                                >
                                    {submitting ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : editingRequest ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {editingRequest ? 'Lưu thay đổi' : 'Gửi đơn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirm Dialog ─── */}
            <ConfirmDialog
                open={confirmState.open}
                title="Thu hồi đơn xin nghỉ"
                message="Bạn có chắc muốn thu hồi đơn xin nghỉ này không? Hành động này không thể hoàn tác."
                confirmLabel="Thu hồi đơn"
                confirmColor="bg-rose-600 hover:bg-rose-700"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmState({ open: false, id: null })}
            />
        </div>
    );
}

export default TeacherLeaveRequestsPage;
