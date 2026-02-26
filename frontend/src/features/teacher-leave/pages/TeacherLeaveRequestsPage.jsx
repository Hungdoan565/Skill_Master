import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    CalendarDays,
    ClipboardList,
    Clock3,
    XCircle,
    AlertTriangle,
    Plus,
    Trash2,
    RefreshCw,
    Send,
    FileText,
    Ban
} from 'lucide-react';
import { useLeaveRequests } from '../hooks/useLeaveRequests';

const LEAVE_TYPE_OPTIONS = [
    { value: 'sick', label: 'Nghỉ ốm' },
    { value: 'personal', label: 'Nghỉ việc riêng' },
    { value: 'annual', label: 'Nghỉ phép năm' },
    { value: 'other', label: 'Lý do khác' }
];

const STATUS_CONFIG = {
    pending: {
        label: 'Chờ duyệt',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    },
    approved: {
        label: 'Đã duyệt',
        className: 'bg-green-100 text-green-800 border border-green-200'
    },
    rejected: {
        label: 'Từ chối',
        className: 'bg-red-100 text-red-800 border border-red-200'
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải danh sách đơn xin nghỉ...</p>
                </div>
            </div>
        );
    }

    if (error && requests.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center p-6 bg-red-50 rounded-xl max-w-md border border-red-100">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-700 mb-2">Không thể tải dữ liệu</h2>
                    <p className="text-red-600 mb-4">{error}</p>
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
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <ClipboardList className="h-7 w-7" />
                                Đơn xin nghỉ của giáo viên
                            </h1>
                            <p className="mt-1 text-blue-100">
                                Quản lý và theo dõi các đơn xin nghỉ của bạn{profile?.full_name ? ` - ${profile.full_name}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={refetch}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            <button
                                onClick={openModal}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Tạo đơn xin nghỉ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-blue-100 p-5">
                        <p className="text-sm text-gray-500 mb-1">Tổng số đơn</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-5">
                        <p className="text-sm text-yellow-700 mb-1">Chờ duyệt</p>
                        <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-100 p-5">
                        <p className="text-sm text-green-700 mb-1">Đã duyệt</p>
                        <p className="text-2xl font-bold text-green-800">{stats.approved}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl border border-red-100 p-5">
                        <p className="text-sm text-red-700 mb-1">Từ chối</p>
                        <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="bg-white rounded-xl border border-blue-100 p-10 text-center">
                            <FileText className="h-10 w-10 mx-auto text-blue-400 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-900">Chưa có đơn xin nghỉ nào</h3>
                            <p className="text-gray-500 mt-1">Hãy tạo đơn mới khi bạn cần xin nghỉ dạy.</p>
                        </div>
                    ) : (
                        requests.map((request) => {
                            const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                            const canDelete = request.status === 'pending';

                            return (
                                <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                                                    {status.label}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    Tạo lúc: {formatDate(request.created_at)}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {getLeaveTypeLabel(request.leave_type)}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="h-4 w-4 text-blue-500" />
                                                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 className="h-4 w-4 text-blue-500" />
                                                    {request.start_date === request.end_date ? 'Nghỉ 1 ngày' : 'Nghỉ nhiều ngày'}
                                                </span>
                                            </div>

                                            <p className="text-gray-700 leading-relaxed">
                                                <span className="font-medium">Lý do:</span> {request.reason}
                                            </p>

                                            {request.status === 'approved' && request.reviewer_note && (
                                                <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                                    <span className="font-medium">Ghi chú duyệt:</span> {request.reviewer_note}
                                                </p>
                                            )}

                                            {request.status === 'rejected' && request.reviewer_note && (
                                                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                                    <span className="font-medium">Lý do từ chối:</span> {request.reviewer_note}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            {canDelete ? (
                                                <button
                                                    onClick={() => handleDeleteRequest(request.id)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Xoá đơn
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                                    <Ban className="h-4 w-4" />
                                                    Không thể xoá
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/45" onClick={closeModal}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Tạo đơn xin nghỉ</h2>
                        <p className="text-sm text-gray-500 mb-5">Điền thông tin để gửi yêu cầu xin nghỉ đến quản lý.</p>

                        <form onSubmit={handleCreateRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại nghỉ</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, leave_type: event.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {LEAVE_TYPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, start_date: event.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(event) => setFormData((prev) => ({ ...prev, end_date: event.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do xin nghỉ</label>
                                <textarea
                                    rows={4}
                                    value={formData.reason}
                                    onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                                    placeholder="Nhập lý do xin nghỉ..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {formError && (
                                <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    {formError}
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
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
