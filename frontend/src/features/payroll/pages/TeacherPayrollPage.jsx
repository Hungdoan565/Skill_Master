/**
 * TeacherPayrollPage Component
 * Trang giáo viên xem bảng lương của mình
 */

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Calendar, Clock, FileText, Loader2, AlertTriangle, Briefcase, TrendingUp } from 'lucide-react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabaseClient';
import {
    formatCurrency,
    formatDate,
    formatHours,
    formatMonthYear,
    getPayrollStatusLabel,
    getPayrollStatusColor,
    getCurrentMonth,
    getMonthOptions,
    getYearOptions,
    API_URL,
} from '../utils';
import { PrintPayslipModal } from '../components/PrintPayslipModal';
import { DisputeModal } from '../components/DisputeModal';
import { usePayroll } from '../hooks/usePayroll';
import { useAuth } from '@/contexts/auth-context';

const ACTIVE_DISPUTE_STATUSES = ['pending', 'reviewing'];

const DISPUTE_STATUS_LABELS = {
    pending: 'Chờ xử lý',
    reviewing: 'Đang xem xét',
    resolved: 'Đã giải quyết',
    rejected: 'Từ chối',
};

const DISPUTE_STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
};

const DISPUTE_TYPE_LABELS = {
    incorrect_hours: 'Sai số giờ dạy',
    incorrect_rate: 'Sai mức lương',
    missing_sessions: 'Thiếu buổi dạy',
    incorrect_bonus: 'Sai thưởng',
    incorrect_deduction: 'Sai khấu trừ',
    other: 'Khác',
};

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Chưa đăng nhập');
    }
    return { Authorization: `Bearer ${session.access_token}` };
};

export function TeacherPayrollPage() {
    const currentPeriod = getCurrentMonth();
    const [year, setYear] = useState(currentPeriod.year);
    const [payrolls, setPayrolls] = useState([]);
    const [compensation, setCompensation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [printModal, setPrintModal] = useState({ isOpen: false, payrollData: null });
    const [disputeModal, setDisputeModal] = useState({ isOpen: false, payroll: null });
    const [disputeSubmitting, setDisputeSubmitting] = useState(false);
    const [payrollDisputes, setPayrollDisputes] = useState([]);
    const [disputesLoading, setDisputesLoading] = useState(false);

    const { submitDispute, fetchPayrollDisputes } = usePayroll();
    const { toast } = useToast();
    const { profile } = useAuth();

    // Fetch payroll list
    const fetchPayrolls = useCallback(async () => {
        try {
            setLoading(true);
            const headers = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/teacher/payroll?year=${year}`,
                { headers }
            );
            if (response.data?.success) {
                setPayrolls(response.data.data);
                if (response.data.compensation) {
                    setCompensation(response.data.compensation);
                }
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
            setPayrolls([]);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchPayrolls();
    }, [fetchPayrolls]);

    const loadPayrollDisputes = useCallback(async (payrollId) => {
        if (!payrollId) {
            setPayrollDisputes([]);
            return;
        }

        try {
            setDisputesLoading(true);
            const disputes = await fetchPayrollDisputes(payrollId);
            setPayrollDisputes(disputes || []);
        } catch (error) {
            console.error('Error fetching payroll disputes:', error);
            setPayrollDisputes([]);
        } finally {
            setDisputesLoading(false);
        }
    }, [fetchPayrollDisputes]);

    // Fetch payroll detail
    const handleViewDetail = async (payroll) => {
        try {
            setDetailLoading(true);
            setSelectedPayroll(payroll);
            const headers = await getAuthHeaders();
            const [detailResult, disputesResult] = await Promise.allSettled([
                axios.get(`${API_URL}/api/teacher/payroll/${payroll.id}`, { headers }),
                fetchPayrollDisputes(payroll.id),
            ]);

            if (detailResult.status === 'fulfilled' && detailResult.value.data?.success) {
                setSelectedPayroll(detailResult.value.data.data);
            }

            if (disputesResult.status === 'fulfilled') {
                setPayrollDisputes(disputesResult.value || []);
            } else {
                console.error('Error fetching payroll disputes:', disputesResult.reason);
                setPayrollDisputes([]);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
            setPayrollDisputes([]);
        } finally {
            setDetailLoading(false);
            setDisputesLoading(false);
        }
    };

    // Print payslip
    const handlePrint = (payroll) => {
        const payrollWithTeacher = {
            ...payroll,
            teacher: {
                full_name: payroll.teacher?.full_name || profile?.full_name || '',
                email: payroll.teacher?.email || profile?.email || '',
                hourly_rate: payroll.teacher?.hourly_rate || profile?.hourly_rate || compensation?.hourly_rate || 0
            }
        };
        setPrintModal({ isOpen: true, payrollData: payrollWithTeacher });
    };

    // Open dispute modal
    const handleOpenDispute = (payroll) => {
        if (!canCreateDispute) {
            toast.error(disputeActionMessage, {
                title: 'Chưa thể khiếu nại'
            });
            return;
        }

        setDisputeModal({ isOpen: true, payroll });
    };

    // Submit dispute
    const handleSubmitDispute = async (payrollId, data) => {
        try {
            setDisputeSubmitting(true);
            await submitDispute(payrollId, data);
            setDisputeModal({ isOpen: false, payroll: null });
            await loadPayrollDisputes(payrollId);
            // Show success notification
            toast.success('Khiếu nại đã được gửi thành công!', {
                title: 'Thành công'
            });
        } catch (error) {
            console.error('Error submitting dispute:', error);
            // Show actual error message from backend if available
            const errorMessage = error.response?.data?.message 
                || error.message 
                || 'Có lỗi xảy ra khi gửi khiếu nại';
            toast.error(errorMessage, {
                title: 'Lỗi'
            });
        } finally {
            setDisputeSubmitting(false);
        }
    };

    // Calculate year total
    const yearTotal = payrolls.reduce((sum, p) => {
        if (p.status === 'paid') {
            return sum + (parseFloat(p.net_salary) || 0);
        }
        return sum;
    }, 0);

    const pendingTotal = payrolls.reduce((sum, p) => {
        if (p.status !== 'paid') {
            return sum + (parseFloat(p.net_salary) || 0);
        }
        return sum;
    }, 0);

    const activeDispute = payrollDisputes.find((dispute) => ACTIVE_DISPUTE_STATUSES.includes(dispute.status));
    const hasClosedDispute = payrollDisputes.some((dispute) => !ACTIVE_DISPUTE_STATUSES.includes(dispute.status));
    const canCreateDispute = Boolean(selectedPayroll) && ['approved', 'paid'].includes(selectedPayroll.status) && !activeDispute;

    let disputeActionMessage = 'Bạn có thể gửi khiếu nại cho bảng lương này nếu phát hiện sai lệch.';

    if (selectedPayroll && !['approved', 'paid'].includes(selectedPayroll.status)) {
        disputeActionMessage = 'Bạn chỉ có thể khiếu nại khi bảng lương đã duyệt hoặc đã thanh toán.';
    } else if (activeDispute) {
        disputeActionMessage = 'Bạn đang có một khiếu nại đang được xử lý cho kỳ lương này. Hãy chờ manager phản hồi trước khi tạo khiếu nại mới.';
    } else if (hasClosedDispute) {
        disputeActionMessage = 'Khiếu nại trước đã được xử lý. Bạn vẫn có thể gửi khiếu nại mới cho cùng kỳ lương nếu phát hiện thêm sai lệch.';
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bảng lương của tôi</h1>
                    <p className="text-muted-foreground">
                        Xem chi tiết bảng lương và thu nhập
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                    >
                        {getYearOptions().map((y) => (
                            <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Đã nhận trong năm {year}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(yearTotal)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Đang chờ thanh toán
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(pendingTotal)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Số kỳ lương
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-indigo-600">
                            {payrolls.length} tháng
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Pay Scheme Info */}
            {compensation && (
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm text-muted-foreground">Hình thức trả lương:</span>
                                <Badge variant="outline" className="font-medium">
                                    {compensation.pay_scheme === 'HOURLY_ONLY' && 'Theo giờ dạy'}
                                    {compensation.pay_scheme === 'FIXED_ONLY' && 'Lương cố định'}
                                    {compensation.pay_scheme === 'FIXED_PLUS_HOURLY' && 'Cố định + Theo giờ'}
                                </Badge>
                            </div>
                            {compensation.hourly_rate > 0 && (
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-muted-foreground">Đơn giá:</span>
                                    <span className="text-sm font-semibold text-green-600">
                                        {formatCurrency(compensation.hourly_rate)}/giờ
                                    </span>
                                </div>
                            )}
                            {compensation.fixed_monthly_salary > 0 && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-muted-foreground">Lương cố định:</span>
                                    <span className="text-sm font-semibold text-blue-600">
                                        {formatCurrency(compensation.fixed_monthly_salary)}/tháng
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Payroll List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Danh sách bảng lương
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : payrolls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mb-2" />
                                <p>Chưa có bảng lương nào</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {payrolls.map((payroll) => (
                                    <div
                                        key={payroll.id}
                                        onClick={() => handleViewDetail(payroll)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-colors ${selectedPayroll?.id === payroll.id
                                                ? 'border-indigo-500 bg-indigo-500/10'
                                                : 'border-border hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {formatMonthYear(payroll.period_month, payroll.period_year)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {payroll.total_sessions} buổi • {formatHours(payroll.total_hours)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    {formatCurrency(payroll.net_salary)}
                                                </p>
                                                <Badge variant={getPayrollStatusColor(payroll.status)} className="mt-1">
                                                    {getPayrollStatusLabel(payroll.status)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payroll Detail */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Chi tiết bảng lương
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !selectedPayroll ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Calendar className="h-12 w-12 mb-2" />
                                <p>Chọn một bảng lương để xem chi tiết</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary */}
                                <div className="p-4 rounded-lg bg-muted">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-semibold text-lg">
                                            {formatMonthYear(selectedPayroll.period_month, selectedPayroll.period_year)}
                                        </span>
                                        <Badge variant={getPayrollStatusColor(selectedPayroll.status)}>
                                            {getPayrollStatusLabel(selectedPayroll.status)}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Số buổi dạy:</span>
                                            <span className="ml-2 font-medium">{selectedPayroll.total_sessions}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Tổng giờ:</span>
                                            <span className="ml-2 font-medium">{formatHours(selectedPayroll.total_hours)}</span>
                                        </div>
                                        {compensation?.hourly_rate > 0 && selectedPayroll.total_hours > 0 && (
                                            <div className="col-span-2 pt-1 border-t border-border/50">
                                                <span className="text-muted-foreground">Tính lương:</span>
                                                <span className="ml-2 font-medium text-foreground">
                                                    {formatHours(selectedPayroll.total_hours)} × {formatCurrency(compensation.hourly_rate)} = {formatCurrency(selectedPayroll.base_salary)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Salary Breakdown */}
                                <div className="space-y-2">
                                    <div className="flex justify-between py-2 border-b">
                                        <span>Thu nhập giờ dạy</span>
                                        <span>{formatCurrency(selectedPayroll.base_salary)}</span>
                                    </div>
                                    {(selectedPayroll.fixed_salary > 0) && (
                                        <div className="flex justify-between py-2 border-b">
                                            <span>Lương cố định tháng</span>
                                            <span>{formatCurrency(selectedPayroll.fixed_salary)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between py-2 border-b text-green-600">
                                        <span>Thưởng</span>
                                        <span>+{formatCurrency(selectedPayroll.bonus || 0)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b text-red-600">
                                        <span>Khấu trừ</span>
                                        <span>-{formatCurrency(selectedPayroll.deduction || 0)}</span>
                                    </div>
                                    <div className="flex justify-between py-3 font-bold text-lg text-foreground">
                                        <span>Thực nhận</span>
                                        <span className="text-green-500">{formatCurrency(selectedPayroll.net_salary)}</span>
                                    </div>
                                </div>

                                {/* Sessions List */}
                                {selectedPayroll.sessions && selectedPayroll.sessions.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3">Chi tiết buổi dạy</h4>
                                        <div className="max-h-48 overflow-auto space-y-2">
                                            {selectedPayroll.sessions.map((session, idx) => (
                                                <div key={idx} className="flex justify-between text-sm p-2 bg-muted rounded">
                                                    <div>
                                                        <span className="font-medium">{formatDate(session.session_date)}</span>
                                                        <span className="text-muted-foreground ml-2">{session.classes?.name}</span>
                                                    </div>
                                                    <span>{formatHours(session.duration_hours)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedPayroll.notes && (
                                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-sm text-amber-700 dark:text-amber-300">{selectedPayroll.notes}</p>
                                    </div>
                                )}

                                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <h4 className="font-medium">Lịch sử khiếu nại</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Mỗi kỳ lương chỉ có thể có 1 khiếu nại đang xử lý. Khi khiếu nại cũ đã giải quyết hoặc bị từ chối, bạn có thể tạo khiếu nại mới.
                                            </p>
                                        </div>
                                        {activeDispute ? (
                                            <Badge className={`self-start shrink-0 whitespace-nowrap px-3 py-1 text-xs ${DISPUTE_STATUS_COLORS[activeDispute.status] || DISPUTE_STATUS_COLORS.pending}`}>
                                                {DISPUTE_STATUS_LABELS[activeDispute.status] || activeDispute.status}
                                            </Badge>
                                        ) : hasClosedDispute ? (
                                            <Badge className="self-start shrink-0 whitespace-nowrap bg-emerald-100 px-3 py-1 text-xs text-emerald-800 border-emerald-200">
                                                Có thể khiếu nại lại
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="self-start shrink-0 whitespace-nowrap px-3 py-1 text-xs">Chưa có khiếu nại</Badge>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-dashed border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
                                        {disputeActionMessage}
                                    </div>

                                    {disputesLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang tải lịch sử khiếu nại...
                                        </div>
                                    ) : payrollDisputes.length > 0 ? (
                                        <div className="space-y-3">
                                            {payrollDisputes.map((dispute) => (
                                                <div key={dispute.id} className="rounded-lg border border-border/70 bg-background p-3 space-y-2">
                                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {DISPUTE_TYPE_LABELS[dispute.dispute_type] || DISPUTE_TYPE_LABELS.other}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Gửi lúc {formatDate(dispute.created_at)}
                                                            </p>
                                                        </div>
                                                        <Badge className={`self-start shrink-0 whitespace-nowrap px-3 py-1 text-xs ${DISPUTE_STATUS_COLORS[dispute.status] || DISPUTE_STATUS_COLORS.pending}`}>
                                                            {DISPUTE_STATUS_LABELS[dispute.status] || dispute.status}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-sm text-foreground whitespace-pre-wrap">{dispute.reason}</p>

                                                    {dispute.admin_response && (
                                                        <div className="rounded-md bg-muted p-3 text-sm">
                                                            <p className="font-medium text-foreground">Phản hồi từ manager</p>
                                                            <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{dispute.admin_response}</p>
                                                            {dispute.resolved_at && (
                                                                <p className="mt-2 text-xs text-muted-foreground">
                                                                    Cập nhật lúc {formatDate(dispute.resolved_at)}
                                                                    {dispute.resolver?.full_name ? ` bởi ${dispute.resolver.full_name}` : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Chưa có khiếu nại nào cho kỳ lương này.
                                        </p>
                                    )}
                                </div>

                                {/* Payment Proof */}
                                {selectedPayroll.status === 'paid' && selectedPayroll.payment_proof_url && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">Chứng từ thanh toán</h4>
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <img 
                                                src={selectedPayroll.payment_proof_url} 
                                                alt="Payment proof" 
                                                className="w-full max-h-48 object-contain bg-muted"
                                                onClick={() => window.open(selectedPayroll.payment_proof_url, '_blank')}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                        {selectedPayroll.payment_reference && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Mã GD: {selectedPayroll.payment_reference}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Print Button */}
                                {selectedPayroll.status === 'paid' && (
                                    <Button
                                        onClick={() => handlePrint(selectedPayroll)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        In phiếu lương
                                    </Button>
                                )}

                                <Button
                                    onClick={() => handleOpenDispute(selectedPayroll)}
                                    className="w-full"
                                    variant="outline"
                                    disabled={!canCreateDispute}
                                >
                                    <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                                    {hasClosedDispute ? 'Tạo khiếu nại mới' : 'Khiếu nại bảng lương'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Print Modal */}
            <PrintPayslipModal
                isOpen={printModal.isOpen}
                onClose={() => setPrintModal({ isOpen: false, payrollData: null })}
                payrollData={printModal.payrollData}
            />

            {/* Dispute Modal */}
            <DisputeModal
                isOpen={disputeModal.isOpen}
                onClose={() => setDisputeModal({ isOpen: false, payroll: null })}
                payroll={disputeModal.payroll}
                onSubmit={handleSubmitDispute}
                submitting={disputeSubmitting}
            />
        </div>
    );
}

export default TeacherPayrollPage;
