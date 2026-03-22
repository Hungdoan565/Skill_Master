/**
 * EnrollmentsPage - Trang danh sách ghi danh
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UserPlus,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Trash2,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Loader2,
    Building2,
    DollarSign,
    Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnrollmentRequestsTab from '../EnrollmentRequestsTab';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import { useEnrollments } from '../hooks';
import { formatDate, getStatusConfig, STATUS_OPTIONS } from '../utils';
import {
    calculateRemaining,
    getEnrollmentPaymentStatus,
    formatCurrency
} from '../utils/paymentUtils';
import { TableSkeleton, StatsCardSkeleton } from '../components/TableSkeleton';

// Stats Card
const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800/60 rounded-lg border dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    </div>
);

// Enrollment Row
const EnrollmentRow = ({ enrollment, onView, onDelete, onViewInvoice, selected, onSelect }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const statusConfig = getStatusConfig(enrollment.status);
    const paymentStatus = getEnrollmentPaymentStatus(enrollment);
    const navigate = useNavigate();

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const tuition = enrollment.tuition_fee || 0;
    const discount = enrollment.discount_amount || 0;
    const paid = enrollment.paid_amount || 0;
    const remaining = calculateRemaining(tuition, discount, paid);

    return (
        <tr className={`hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors ${selected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
            <td className="px-4 py-3 w-[50px]">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onSelect(enrollment.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {getInitials(enrollment.student?.full_name)}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-gray-100">{enrollment.student?.full_name || 'N/A'}</p>
                        <p className="text-sm text-slate-500 dark:text-gray-400">{enrollment.student?.email || 'N/A'}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <p className="font-medium text-slate-900 dark:text-gray-100">{enrollment.class?.name || 'N/A'}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{enrollment.class?.courses?.title || 'N/A'}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm text-slate-700 dark:text-gray-300">{enrollment.class?.teacher?.full_name || 'Chưa có'}</p>
            </td>
            <td className="px-4 py-3 text-right">
                <p className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(tuition)}</p>
                {discount > 0 && <p className="text-xs text-green-600">-{formatCurrency(discount)}</p>}
            </td>
            <td className="px-4 py-3 text-right">
                <p className="font-medium text-blue-600">{formatCurrency(paid)}</p>
            </td>
            <td className="px-4 py-3 text-right">
                <p className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(remaining)}
                </p>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.color}`}>
                        {paymentStatus.label}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Mở menu hành động"
                        aria-expanded={menuOpen}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20" role="menu" aria-label="Hành động ghi danh">
                                <button
                                    onClick={() => { onView(enrollment); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                    role="menuitem"
                                    aria-label="Xem chi tiết học viên"
                                >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                </button>
                                <button
                                    onClick={() => { navigate(`/admin/invoices?student_id=${enrollment.student_id}`); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                    role="menuitem"
                                    aria-label="Xem hóa đơn của học viên"
                                >
                                    <Receipt className="h-4 w-4" />
                                    Xem hóa đơn
                                </button>
                                <button
                                    onClick={() => {
                                        const remaining = calculateRemaining(
                                            enrollment.tuition_fee,
                                            enrollment.discount_amount,
                                            enrollment.paid_amount
                                        );
                                        // Navigate với full data để auto-fill modal
                                        const params = new URLSearchParams({
                                            create: 'true',
                                            enrollment_id: enrollment.id,
                                            student_id: enrollment.student_id,
                                            student_name: enrollment.student?.full_name || '',
                                            class_id: enrollment.class_id,
                                            class_name: enrollment.class?.name || '',
                                            course_name: enrollment.class?.courses?.title || '',
                                            amount: remaining,
                                            type: 'tuition' // Mặc định học phí
                                        });
                                        navigate(`/admin/invoices?${params.toString()}`);
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"
                                    role="menuitem"
                                    aria-label="Thu học phí"
                                >
                                    <DollarSign className="h-4 w-4" />
                                    Thu học phí
                                </button>
                                <div className="border-t dark:border-gray-700 my-1"></div>
                                <button
                                    onClick={() => { onDelete(enrollment); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    role="menuitem"
                                    aria-label="Hủy ghi danh"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Hủy ghi danh
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export function EnrollmentsPage() {
    const navigate = useNavigate();
    const { isManager, getCenterId, isSuperAdmin, profile } = useAuth();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [activeTab, setActiveTab] = useState('enrollments');
    const [pendingRequestCount, setPendingRequestCount] = useState(0);
    const [centers, setCenters] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, enrollment: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

    const {
        enrollments,
        loading,
        pagination,
        fetchEnrollments,
        deleteEnrollment,
        deleteMultipleEnrollments,
        filterEnrollments,
    } = useEnrollments();

    // Effective center ID
    const effectiveCenterId = useMemo(() => {
        if (isSuperAdmin()) {
            return selectedCenter || null;
        }
        return getCenterId();
    }, [isSuperAdmin, selectedCenter, getCenterId]);

    // Fetch centers for SUPER_ADMIN
    useEffect(() => {
        if (isSuperAdmin()) {
            const fetchCentersData = async () => {
                try {
                    const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/centers`,
                        { headers: { Authorization: `Bearer ${session?.access_token}` } }
                    );
                    const result = await response.json();
                    if (result.success) {
                        setCenters(result.data || []);
                    }
                } catch (err) {
                    console.error('Error fetching centers:', err);
                }
            };
            fetchCentersData();
        }
    }, [isSuperAdmin]);

    // Debounced search value
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch enrollments (with server-side search)
    useEffect(() => {
        fetchEnrollments({
            status: statusFilter,
            centerId: effectiveCenterId,
            search: debouncedSearch,
            page: currentPage,
            limit: 20,
        });
    }, [fetchEnrollments, statusFilter, effectiveCenterId, debouncedSearch, currentPage]);

    // Filter by payment status only (search is now server-side)
    const filteredEnrollments = useMemo(() => {
        let filtered = enrollments;

        // Filter by payment status
        if (paymentStatusFilter) {
            filtered = filtered.filter(e => {
                const tuition = e.tuition_fee || 0;
                const discount = e.discount_amount || 0;
                const paid = e.paid_amount || 0;
                const remaining = calculateRemaining(tuition, discount, paid);

                if (paymentStatusFilter === 'paid') return remaining <= 0;
                if (paymentStatusFilter === 'unpaid') return paid === 0;
                if (paymentStatusFilter === 'partial') return paid > 0 && remaining > 0;
                return true;
            });
        }

        return filtered;
    }, [enrollments, paymentStatusFilter]);

    // Stats
    const stats = useMemo(() => ({
        total: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        dropped: enrollments.filter(e => e.status === 'dropped').length,
    }), [enrollments]);

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.enrollment) return;
        try {
            await deleteEnrollment(deleteModal.enrollment.id);
            setDeleteModal({ isOpen: false, enrollment: null });
            toast.success('Hủy ghi danh thành công!');
        } catch (err) {
            console.error('Error deleting enrollment:', err);
            toast.error(err.message || 'Có lỗi xảy ra khi hủy ghi danh');
        }
    };

    // Bulk Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredEnrollments.map(e => e.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    // Bulk Delete Handler
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            await deleteMultipleEnrollments(selectedIds);
            setBulkDeleteModal(false);
            setSelectedIds([]);
            toast.success(`Đã hủy ${selectedIds.length} ghi danh thành công!`);
        } catch (err) {
            console.error('Error bulk deleting:', err);
            toast.error(err.message || 'Có lỗi xảy ra khi hủy nhiều ghi danh');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Quản lý Ghi danh</h1>
                    <p className="text-slate-500 dark:text-gray-400">Danh sách học viên đã đăng ký vào các lớp học</p>
                </div>
                <Button onClick={() => navigate('/admin/enrollments/new')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ghi danh mới
                </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 border-b dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('enrollments')}
                    className={cn(
                        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === 'enrollments'
                            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                    )}
                >
                    Danh sách đăng ký
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={cn(
                        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
                        activeTab === 'requests'
                            ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                    )}
                >
                    Yêu cầu đăng ký
                    {pendingRequestCount > 0 && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                            {pendingRequestCount}
                        </Badge>
                    )}
                </button>
            </div>

            {activeTab === 'enrollments' ? (
                <>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard icon={Users} label="Tổng ghi danh" value={stats.total} color="bg-indigo-500" />
                <StatsCard icon={CheckCircle} label="Đang học" value={stats.active} color="bg-green-500" />
                <StatsCard icon={Clock} label="Hoàn thành" value={stats.completed} color="bg-blue-500" />
                <StatsCard icon={XCircle} label="Đã nghỉ" value={stats.dropped} color="bg-red-500" />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm học viên, lớp học..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Center Filter for SUPER_ADMIN */}
                        {isSuperAdmin() && centers.length > 0 && (
                            <select
                                value={selectedCenter}
                                onChange={(e) => setSelectedCenter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả trung tâm</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Payment Status Filter */}
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
                        >
                            <option value="">Tất cả thanh toán</option>
                            <option value="paid">Đã đóng</option>
                            <option value="partial">Nợ một phần</option>
                            <option value="unpaid">Chưa đóng</option>
                        </select>

                        {/* Refresh */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchEnrollments({ status: statusFilter, centerId: effectiveCenterId })}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Đã chọn {selectedIds.length} ghi danh
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                            onClick={() => setSelectedIds([])}
                        >
                            Bỏ chọn
                        </Button>
                    </div>

                    <Button variant="destructive" size="sm" onClick={() => setBulkDeleteModal(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hủy {selectedIds.length} ghi danh
                    </Button>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <TableSkeleton rows={5} columns={8} />
                    ) : filteredEnrollments.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Chưa có ghi danh nào</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => navigate('/admin/enrollments/new')}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Ghi danh ngay
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 dark:bg-gray-800/60 border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 w-[50px]">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={filteredEnrollments.length > 0 && selectedIds.length === filteredEnrollments.length}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Học viên
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Lớp học
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Giáo viên
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Học phí
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Đã đóng
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Còn nợ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                    {filteredEnrollments.map(enrollment => (
                                        <EnrollmentRow
                                            key={enrollment.id}
                                            enrollment={enrollment}
                                            selected={selectedIds.includes(enrollment.id)}
                                            onSelect={handleSelectOne}
                                            onView={(e) => navigate(`/admin/students/${e.student_id}`)}
                                            onDelete={(e) => setDeleteModal({ isOpen: true, enrollment: e })}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredEnrollments.length > 0 && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
                            <div className="text-sm text-slate-500 dark:text-gray-400">
                                Hiển thị {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} ghi danh
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Trước
                                </Button>
                                <div className="flex items-center gap-2 px-3">
                                    <span className="text-sm text-slate-600 dark:text-gray-400">
                                        Trang {pagination.page} / {pagination.totalPages}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Xác nhận hủy ghi danh</h3>
                        <p className="text-slate-500 dark:text-gray-400 mt-2">
                            Bạn có chắc muốn hủy ghi danh của{' '}
                            <strong>{deleteModal.enrollment?.student?.full_name}</strong> khỏi lớp{' '}
                            <strong>{deleteModal.enrollment?.class?.name}</strong>?
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteModal({ isOpen: false, enrollment: null })}
                            >
                                Không
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Hủy ghi danh
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {bulkDeleteModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Xác nhận hủy hàng loạt</h3>
                        <p className="text-slate-500 dark:text-gray-400 mt-2">
                            Bạn có chắc chắn muốn hủy <strong>{selectedIds.length}</strong> ghi danh đã chọn không?
                        </p>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setBulkDeleteModal(false)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                Xác nhận hủy ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                </div>
            )}
                </>
            ) : (
                <EnrollmentRequestsTab onPendingCountChange={setPendingRequestCount} />
            )}
        </div>
    );
}

export default EnrollmentsPage;
