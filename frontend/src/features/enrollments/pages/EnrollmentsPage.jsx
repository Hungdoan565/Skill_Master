/**
 * EnrollmentsPage - Trang danh sách ghi danh
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useEnrollments } from '../hooks';
import { formatDate, getStatusConfig, STATUS_OPTIONS } from '../utils';

// Stats Card
const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    </div>
);

// Enrollment Row
const EnrollmentRow = ({ enrollment, onView, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const statusConfig = getStatusConfig(enrollment.status);

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                        {getInitials(enrollment.student?.full_name)}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{enrollment.student?.full_name || 'N/A'}</p>
                        <p className="text-sm text-slate-500">{enrollment.student?.email || 'N/A'}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{enrollment.class?.name || 'N/A'}</p>
                <p className="text-sm text-slate-500">{enrollment.class?.courses?.title || 'N/A'}</p>
            </td>
            <td className="px-4 py-3 text-slate-500">
                {formatDate(enrollment.enrolled_at)}
            </td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border z-20">
                                <button
                                    onClick={() => { onView(enrollment); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                </button>
                                <button
                                    onClick={() => { onDelete(enrollment); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
    const [centers, setCenters] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, enrollment: null });
    const debounceRef = useRef(null);

    const {
        enrollments,
        loading,
        fetchEnrollments,
        deleteEnrollment,
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
                        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/centers`,
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

    // Debounce search term (300ms delay)
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchTerm]);

    // Fetch enrollments with server-side filtering
    useEffect(() => {
        fetchEnrollments({
            status: statusFilter,
            centerId: effectiveCenterId,
            search: debouncedSearch,
        });
    }, [fetchEnrollments, statusFilter, effectiveCenterId, debouncedSearch]);

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
        } catch (err) {
            console.error('Error deleting enrollment:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Ghi danh</h1>
                    <p className="text-slate-500">Danh sách học viên đã đăng ký vào các lớp học</p>
                </div>
                <Button onClick={() => navigate('/admin/enrollments/new')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ghi danh mới
                </Button>
            </div>

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
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả trung tâm</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id}>{center.name}</option>
                                ))}
                            </select>
                        )}

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

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : enrollments.length === 0 ? (
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
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Học viên
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Lớp học
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Ngày ghi danh
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {enrollments.map(enrollment => (
                                        <EnrollmentRow
                                            key={enrollment.id}
                                            enrollment={enrollment}
                                            onView={(e) => navigate(`/admin/students/${e.student_id}`)}
                                            onDelete={(e) => setDeleteModal({ isOpen: true, enrollment: e })}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-900">Xác nhận hủy ghi danh</h3>
                        <p className="text-slate-500 mt-2">
                            Bạn có chắc muốn hủy ghi danh của{' '}
                            <strong>{deleteModal.enrollment?.students?.full_name}</strong> khỏi lớp{' '}
                            <strong>{deleteModal.enrollment?.classes?.name}</strong>?
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
        </div>
    );
}

export default EnrollmentsPage;
