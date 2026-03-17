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
    ArrowRight
} from 'lucide-react';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { TeacherPageHeader } from '@/components/ui/teacher-page-header';

const LEAVE_TYPE_OPTIONS = [
    { value: 'sick', label: 'Nghỉ ốm' },
    { value: 'personal', label: 'Nghỉ việc riêng' },
    { value: 'annual', label: 'Nghỉ phép năm' },
    { value: 'other', label: 'Lý do khác' }
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

const EMPTY_FORM = {
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
};

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

const getLeaveTypeLabel = (type) => {
    return LEAVE_TYPE_OPTIONS.find((item) => item.value === type)?.label || 'Không xác định';
};

export function TeacherLeaveRequestsPage() {
    const { profile } = useAuth();
    const { requests, loading, error, createLeaveRequest, deleteLeaveRequest, refetch } = useLeaveRequests();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const stats = useMemo(() => {
        const total = requests.length;
        const pending = requests.filter((item) => item.status === 'pending').length;
        const approved = requests.filter((item) => item.status === 'approved').length;
        const rejected = requests.filter((item) => item.status === 'rejected').length;

        return { total, pending, approved, rejected };
    }, [requests]);

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        setFormError('');
    };

    const openModal = () => {
        setIsModalOpen(true);
        setFormError('');
    };

    const handleCreateRequest = async (event) => {
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
        const result = await createLeaveRequest({
            ...formData,
            reason: formData.reason.trim()
        });
        setSubmitting(false);

        if (!result.success) {
            setFormError(result.message || 'Không thể tạo đơn xin nghỉ');
            return;
        }

        closeModal();
    };

    const handleDeleteRequest = async (requestId) => {
        const confirmed = window.confirm('Bạn có chắc muốn xoá đơn xin nghỉ này không?');
        if (!confirmed) return;

        await deleteLeaveRequest(requestId);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                            onClick={openModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 btn-tactile hover-card-lift"
                        >
                            <Plus className="h-5 w-5" />
                            Tạo đơn xin nghỉ
                        </button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in-up stagger-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover-card-lift transition-all">
                        <p className="text-sm font-medium text-slate-500 mb-2">Tổng số đơn</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-2xl border border-yellow-500/20 p-5 shadow-sm hover-card-lift transition-all">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">Chờ duyệt</p>
                        <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-400">{stats.pending}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-2xl border border-green-500/20 p-5 shadow-sm hover-card-lift transition-all">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Đã duyệt</p>
                        <p className="text-3xl font-bold text-green-800 dark:text-green-400">{stats.approved}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-2xl border border-red-500/20 p-5 shadow-sm hover-card-lift transition-all">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Từ chối</p>
                        <p className="text-3xl font-bold text-red-800 dark:text-red-400">{stats.rejected}</p>
                    </div>
                </div>
                {error && (
                    <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm animate-fade-in-up stagger-2">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Chưa có đơn xin nghỉ nào</h3>
                            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Hãy tạo đơn mới khi bạn cần xin nghỉ dạy. Quản lý sẽ xét duyệt và phản hồi sớm nhất.</p>
                            <button
                                onClick={openModal}
                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 btn-tactile hover-card-lift"
                            >
                                <Plus className="h-5 w-5" />
                                Tạo đơn đầu tiên
                            </button>
                        </div>
                    ) : (
                        requests.map((request, index) => {
                            const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                            const canDelete = request.status === 'pending';
                            const StatusIcon = status.icon || Clock3;
                            const durationDays = getDurationInDays(request.start_date, request.end_date);
                            const isSingleDay = durationDays <= 1;
                            const staggerClass = `stagger-${Math.min(index + 2, 5)}`;

                            return (
                                <div key={request.id} className={`bg-white rounded-2xl border border-border/80 p-5 sm:p-6 shadow-sm hover-card-lift transition-all animate-fade-in-up ${staggerClass}`}>
                                    <div className="flex flex-col gap-5">
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

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Yêu cầu nghỉ phép
                                            </p>
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-indigo-500" />
                                                {getLeaveTypeLabel(request.leave_type)}
                                            </h3>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                                                    <CalendarRange className="h-4 w-4 text-blue-600" />
                                                    <span>{formatDate(request.start_date)}</span>
                                                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{formatDate(request.end_date)}</span>
                                                </div>

                                                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 w-fit">
                                                    <CalendarDays className="h-3.5 w-3.5" />
                                                    {isSingleDay ? 'Nghỉ 1 ngày' : `Nghỉ ${durationDays} ngày`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Lý do xin nghỉ</p>
                                            <p className="leading-relaxed text-slate-700">{request.reason}</p>
                                        </div>

                                        {request.status === 'approved' && request.reviewer_notes && (
                                            <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                                <p className="font-semibold mb-1.5 flex items-center gap-1.5"><ClipboardList className="w-4 h-4" /> Ghi chú duyệt</p>
                                                <p>{request.reviewer_notes}</p>
                                            </div>
                                        )}

                                        {request.status === 'rejected' && request.reviewer_notes && (
                                            <div className="text-sm text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                                <p className="font-semibold mb-1.5 flex items-center gap-1.5"><Ban className="w-4 h-4" /> Lý do từ chối</p>
                                                <p>{request.reviewer_notes}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end pt-1 border-t border-slate-100">
                                            {canDelete ? (
                                                <button
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-700 hover:bg-rose-50 hover:border-rose-500/40 transition-all font-semibold btn-tactile shadow-sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Thu hồi đơn chờ duyệt
                                                </button>
                                            ) : (
                                                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
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

            {isModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={closeModal}></div>
                    <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/70">
                            <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">Tạo đơn xin nghỉ</h2>
                            <p className="text-sm text-muted-foreground">Điền đầy đủ thông tin để gửi yêu cầu xin nghỉ đến quản lý.</p>
                        </div>

                        <form onSubmit={handleCreateRequest} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-foreground">Loại nghỉ</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, leave_type: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                >
                                    {LEAVE_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-foreground">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, start_date: event.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-foreground">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, end_date: event.target.value }))}
                                        className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-foreground">Lý do xin nghỉ</label>
                                <textarea
                                    rows={4}
                                    value={formData.reason}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                                    placeholder="Nhập lý do xin nghỉ..."
                                    className="w-full rounded-xl border border-slate-200 bg-white text-foreground px-3.5 py-2.5 leading-relaxed placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {formError && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400 flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4" />
                                    {formError}
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm shadow-blue-600/20"
                                >
                                    {submitting ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Gửi đơn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherLeaveRequestsPage;
