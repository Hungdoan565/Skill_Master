/**
 * TeacherPayrollPage Component
 * Trang giáo viên xem bảng lương của mình
 */

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Calendar, Clock, FileText, Loader2, AlertTriangle } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [printModal, setPrintModal] = useState({ isOpen: false, payrollData: null });
    const [disputeModal, setDisputeModal] = useState({ isOpen: false, payroll: null });
    const [disputeSubmitting, setDisputeSubmitting] = useState(false);

    const { submitDispute } = usePayroll();
    const { toast } = useToast();

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

    // Fetch payroll detail
    const handleViewDetail = async (payroll) => {
        try {
            setDetailLoading(true);
            setSelectedPayroll(payroll);
            const headers = await getAuthHeaders();
            const response = await axios.get(
                `${API_URL}/api/teacher/payroll/${payroll.id}`,
                { headers }
            );
            if (response.data?.success) {
                setSelectedPayroll(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    // Print payslip
    const handlePrint = (payroll) => {
        setPrintModal({ isOpen: true, payrollData: payroll });
    };

    // Open dispute modal
    const handleOpenDispute = (payroll) => {
        setDisputeModal({ isOpen: true, payroll });
    };

    // Submit dispute
    const handleSubmitDispute = async (payrollId, data) => {
        try {
            setDisputeSubmitting(true);
            await submitDispute(payrollId, data);
            setDisputeModal({ isOpen: false, payroll: null });
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
                        className="rounded-md border px-3 py-2 text-sm"
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
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : payrolls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
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
                                                : 'border-border hover:bg-muted/50'
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
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : !selectedPayroll ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Calendar className="h-12 w-12 mb-2" />
                                <p>Chọn một bảng lương để xem chi tiết</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Summary */}
                                <div className="p-4 rounded-lg bg-slate-50">
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
                                                <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
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
                                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                        <p className="text-sm text-yellow-700">{selectedPayroll.notes}</p>
                                    </div>
                                )}

                                {/* Payment Proof */}
                                {selectedPayroll.status === 'paid' && selectedPayroll.payment_proof_url && (
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-slate-600">Chứng từ thanh toán</h4>
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <img 
                                                src={selectedPayroll.payment_proof_url} 
                                                alt="Payment proof" 
                                                className="w-full max-h-48 object-contain bg-muted/50"
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

                                {/* Dispute Button - show for non-paid payrolls */}
                                {['draft', 'pending', 'approved'].includes(selectedPayroll.status) && (
                                    <Button
                                        onClick={() => handleOpenDispute(selectedPayroll)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                                        Khiếu nại bảng lương
                                    </Button>
                                )}
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
