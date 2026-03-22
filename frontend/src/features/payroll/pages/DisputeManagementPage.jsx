/**
 * DisputeManagementPage Component
 * Trang quản lý khiếu nại bảng lương cho Admin
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Loader2,
    MessageSquare,
    User,
    Calendar,
    FileText,
    ChevronDown,
    Filter
} from 'lucide-react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatMonthYear, API_URL } from '../utils';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

const DISPUTE_STATUS = {
    pending: { label: 'Chờ xử lý', color: 'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300', icon: Clock },
    reviewing: { label: 'Đang xem xét', color: 'border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300', icon: Search },
    resolved: { label: 'Đã giải quyết', color: 'border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300', icon: CheckCircle },
    rejected: { label: 'Từ chối', color: 'border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300', icon: XCircle },
};

const DISPUTE_TYPES = {
    incorrect_hours: 'Sai số giờ dạy',
    incorrect_rate: 'Sai mức lương/giờ',
    missing_sessions: 'Thiếu buổi dạy',
    incorrect_bonus: 'Sai tiền thưởng',
    incorrect_deduction: 'Sai tiền khấu trừ',
    other: 'Lý do khác',
};

// Custom IconSelect Component
function IconSelect({ value, onChange, options, placeholder, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex min-w-[160px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/50 h-10"
            >
                <div className="flex items-center gap-2">
                    {selectedOption?.icon ? (
                        <selectedOption.icon className={`h-4 w-4 ${selectedOption.iconColor}`} />
                    ) : Icon ? (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${value === option.value ? 'bg-muted/50 font-medium' : 'text-popover-foreground'
                                }`}
                        >
                            {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || 'text-muted-foreground'}`} />}
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function DisputeManagementPage() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [responseModal, setResponseModal] = useState({ isOpen: false, dispute: null });
    const [responseData, setResponseData] = useState({ status: 'resolved', admin_response: '' });
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    // Status filter options với icons
    const statusOptions = [
        { value: 'all', label: 'Tất cả trạng thái', icon: Filter, iconColor: 'text-muted-foreground' },
        { value: 'pending', label: 'Chờ xử lý', icon: Clock, iconColor: 'text-yellow-500' },
        { value: 'reviewing', label: 'Đang xem xét', icon: Search, iconColor: 'text-blue-500' },
        { value: 'resolved', label: 'Đã giải quyết', icon: CheckCircle, iconColor: 'text-green-500' },
        { value: 'rejected', label: 'Từ chối', icon: XCircle, iconColor: 'text-red-500' },
    ];

    // Fetch disputes
    const fetchDisputes = useCallback(async () => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await axios.get(
                `${API_URL}/api/admin/payroll-disputes?${params}`,
                { headers }
            );

            if (response.data?.success) {
                setDisputes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching disputes:', error);
            setDisputes([]);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchDisputes();
    }, [fetchDisputes]);

    // Handle response submit
    const handleSubmitResponse = async () => {
        if (!responseModal.dispute) return;

        try {
            setSubmitting(true);
            const headers = await getAuthHeaders();

            await axios.patch(
                `${API_URL}/api/admin/payroll-disputes/${responseModal.dispute.id}`,
                responseData,
                { headers }
            );

            // Refresh list
            await fetchDisputes();
            setResponseModal({ isOpen: false, dispute: null });
            setResponseData({ status: 'resolved', admin_response: '' });
            toast.success('Đã cập nhật khiếu nại thành công');
        } catch (error) {
            console.error('Error updating dispute:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    // Stats
    const stats = {
        total: disputes.length,
        pending: disputes.filter(d => d.status === 'pending').length,
        reviewing: disputes.filter(d => d.status === 'reviewing').length,
        resolved: disputes.filter(d => d.status === 'resolved').length,
        rejected: disputes.filter(d => d.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý khiếu nại</h1>
                    <p className="text-muted-foreground">
                        Xem và xử lý các khiếu nại bảng lương từ giáo viên
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tổng số</span>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Chờ xử lý</span>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Đang xem xét</span>
                            <Search className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{stats.reviewing}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Đã giải quyết</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Từ chối</span>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Label className="text-sm font-medium">Trạng thái:</Label>
                <IconSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    placeholder="Lọc theo trạng thái"
                    icon={Filter}
                />
            </div>

            {/* Disputes List */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danh sách khiếu nại
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : disputes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <CheckCircle className="h-12 w-12 mb-2" />
                                <p>Không có khiếu nại nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {disputes.map((dispute) => {
                                    const StatusIcon = DISPUTE_STATUS[dispute.status]?.icon || Clock;
                                    return (
                                        <div
                                            key={dispute.id}
                                            onClick={() => setSelectedDispute(dispute)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedDispute?.id === dispute.id
                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium truncate">
                                                            {dispute.teacher?.full_name || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <FileText className="h-3 w-3" />
                                                        <span>
                                                            {formatMonthYear(
                                                                dispute.payroll?.period_month,
                                                                dispute.payroll?.period_year
                                                            )}
                                                        </span>
                                                        <span>-</span>
                                                        <span>{DISPUTE_TYPES[dispute.dispute_type] || dispute.dispute_type}</span>
                                                    </div>
                                                </div>
                                                <Badge className={DISPUTE_STATUS[dispute.status]?.color}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {DISPUTE_STATUS[dispute.status]?.label}
                                                </Badge>
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                {dispute.reason}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {new Date(dispute.created_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detail */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Chi tiết khiếu nại
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedDispute ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Search className="h-12 w-12 mb-2" />
                                <p>Chọn một khiếu nại để xem chi tiết</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Teacher Info */}
                                <div className="rounded-lg border border-border bg-muted/30 p-4">
                                    <h4 className="font-medium mb-2">Giáo viên</h4>
                                    <p className="text-lg font-semibold">{selectedDispute.teacher?.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedDispute.teacher?.email}</p>
                                </div>

                                {/* Payroll Info */}
                                <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                                    <h4 className="mb-2 font-medium text-orange-700 dark:text-orange-300">Bảng lương</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-orange-700 dark:text-orange-300">Kỳ lương:</span>
                                            <span className="ml-2 font-medium">
                                                {formatMonthYear(
                                                    selectedDispute.payroll?.period_month,
                                                    selectedDispute.payroll?.period_year
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-orange-700 dark:text-orange-300">Tiền lương:</span>
                                            <span className="ml-2 font-medium">
                                                {formatCurrency(selectedDispute.payroll?.net_salary)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dispute Details */}
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-muted-foreground">Loại khiếu nại</Label>
                                        <p className="font-medium">
                                            {DISPUTE_TYPES[selectedDispute.dispute_type] || selectedDispute.dispute_type}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Lý do chi tiết</Label>
                                        <p className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                                            {selectedDispute.reason}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Ngày gửi</Label>
                                        <p className="font-medium">
                                            {new Date(selectedDispute.created_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                {/* Admin Response */}
                                {selectedDispute.admin_response && (
                                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                                        <h4 className="mb-2 font-medium text-blue-700 dark:text-blue-300">Phản hồi của quản lý</h4>
                                        <p className="text-sm whitespace-pre-wrap">{selectedDispute.admin_response}</p>
                                        {selectedDispute.resolved_at && (
                                            <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                                Xử lý lúc: {new Date(selectedDispute.resolved_at).toLocaleString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {['pending', 'reviewing'].includes(selectedDispute.status) && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            onClick={() => {
                                                setResponseData({ status: 'reviewing', admin_response: '' });
                                                setResponseModal({ isOpen: true, dispute: selectedDispute });
                                            }}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            <Search className="mr-2 h-4 w-4" />
                                            Xem xét
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setResponseData({ status: 'resolved', admin_response: '' });
                                                setResponseModal({ isOpen: true, dispute: selectedDispute });
                                            }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Giải quyết
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setResponseData({ status: 'rejected', admin_response: '' });
                                                setResponseModal({ isOpen: true, dispute: selectedDispute });
                                            }}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Từ chối
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Response Modal */}
            {responseModal.isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setResponseModal({ isOpen: false, dispute: null })}
                    />
                    <div className="relative z-10 mx-4 w-full max-w-md rounded-lg border border-border bg-card text-foreground shadow-xl">
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold">
                                {responseData.status === 'reviewing' && 'Đánh dấu đang xem xét'}
                                {responseData.status === 'resolved' && 'Giải quyết khiếu nại'}
                                {responseData.status === 'rejected' && 'Từ chối khiếu nại'}
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="admin_response">Phản hồi (bắt buộc)</Label>
                                <textarea
                                    id="admin_response"
                                    value={responseData.admin_response}
                                    onChange={(e) => setResponseData(prev => ({ ...prev, admin_response: e.target.value }))}
                                    placeholder="Nhập phản hồi của bạn..."
                                    rows={4}
                                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setResponseModal({ isOpen: false, dispute: null })}
                                    disabled={submitting}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleSubmitResponse}
                                    disabled={submitting || !responseData.admin_response.trim()}
                                    className={
                                        responseData.status === 'resolved' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                            responseData.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                                ''
                                    }
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Xác nhận'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DisputeManagementPage;
