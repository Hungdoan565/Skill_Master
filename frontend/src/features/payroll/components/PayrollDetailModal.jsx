/**
 * PayrollDetailModal Component
 * Modal xem chi tiết bảng lương với danh sách sessions
 */

import { X, User, Calendar, Clock, DollarSign, FileText, CheckCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    formatCurrency,
    formatDate,
    formatTime,
    formatHours,
    formatMonthYear,
    getPayrollStatusLabel,
    getPayrollStatusColor
} from '../utils';

export function PayrollDetailModal({
    isOpen,
    onClose,
    payroll,
    detailData,
    loading,
    onPrint,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/80"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg bg-card border border-border text-foreground shadow-xl dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-2xl mx-4">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-card dark:bg-zinc-950 border-b border-border dark:border-zinc-800 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-xl font-semibold">Chi tiết Bảng lương</h2>
                        {detailData && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {formatMonthYear(detailData.period_month, detailData.period_year)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {onPrint && detailData && (
                            <Button variant="outline" onClick={onPrint} className="gap-2">
                                <Printer className="h-4 w-4" />
                                In
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="h-32 bg-muted animate-pulse rounded-lg" />
                            <div className="h-64 bg-muted animate-pulse rounded-lg" />
                        </div>
                    ) : detailData ? (
                        <div className="space-y-6">
                            {/* Teacher Info & Summary */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Teacher Card */}
                                <div className="p-4 rounded-lg bg-muted dark:bg-muted/20 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                            {detailData.teacher?.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">{detailData.teacher?.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{detailData.teacher?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            {formatCurrency(detailData.teacher?.hourly_rate || 150000)}/giờ
                                        </span>
                                        {detailData.teacher?.phone && (
                                            <span className="text-muted-foreground">
                                                📞 {detailData.teacher.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="p-4 rounded-lg border border-border bg-muted/30 dark:bg-muted/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Trạng thái</span>
                                        <Badge variant={getPayrollStatusColor(detailData.status)}>
                                            {getPayrollStatusLabel(detailData.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Số buổi dạy</span>
                                        <span className="font-medium">{detailData.total_sessions} buổi</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Tổng giờ</span>
                                        <span className="font-medium">{formatHours(detailData.total_hours)}</span>
                                    </div>
                                    {detailData.approved_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Ngày duyệt</span>
                                            <span className="font-medium">{formatDate(detailData.approved_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Salary Breakdown */}
                            <div className="p-4 rounded-lg border border-border bg-card">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Chi tiết lương
                                </h3>
                                <div className="space-y-2">
                                    {/* Teaching Earnings (previously base_salary) */}
                                    <div className="flex justify-between text-sm">
                                        <span>Thu nhập giờ dạy ({formatHours(detailData.total_hours)} × rate)</span>
                                        <span>{formatCurrency(detailData.base_salary)}</span>
                                    </div>
                                    {/* Fixed Salary - only show if > 0 */}
                                    {(detailData.fixed_salary > 0) && (
                                        <div className="flex justify-between text-sm">
                                            <span>Lương cố định tháng</span>
                                            <span>{formatCurrency(detailData.fixed_salary)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Thưởng</span>
                                        <span>+{formatCurrency(detailData.bonus || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Khấu trừ</span>
                                        <span>-{formatCurrency(detailData.deduction || 0)}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Thực nhận</span>
                                        <span className="text-green-600">{formatCurrency(detailData.net_salary)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {detailData.notes && (
                                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <h4 className="font-medium text-sm text-yellow-800 dark:text-yellow-500 mb-1">Ghi chú</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">{detailData.notes}</p>
                                </div>
                            )}

                            {/* Sessions List */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="p-4 border-b border-border bg-muted dark:bg-muted/20">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                        Danh sách buổi dạy ({detailData.sessions?.length || 0})
                                    </h3>
                                </div>
                                <div className="max-h-64 overflow-auto">
                                    {detailData.sessions && detailData.sessions.length > 0 ? (
                                        <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                            <thead className="bg-muted dark:bg-muted/20 sticky top-0 z-10">
                                                <tr className="text-left text-sm text-muted-foreground">
                                                    <th className="px-4 py-2">Ngày</th>
                                                    <th className="px-4 py-2">Lớp</th>
                                                    <th className="px-4 py-2">Giờ học</th>
                                                    <th className="px-4 py-2 text-right">Số giờ</th>
                                                    <th className="px-4 py-2 text-right">Rate</th>
                                                    <th className="px-4 py-2 text-right">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailData.sessions.map((session) => (
                                                    <tr key={session.id} className="border-t hover:bg-muted/50">
                                                        <td className="px-4 py-2 text-sm">
                                                            {formatDate(session.session_date)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {session.classes?.name || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right">
                                                            {formatHours(session.duration_hours)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right">
                                                            {formatCurrency(session.teacher_rate)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right font-medium">
                                                            {formatCurrency(
                                                                (parseFloat(session.duration_hours) || 0) *
                                                                (parseFloat(session.teacher_rate) || 0)
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            Không có buổi dạy nào trong kỳ này
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Approver Info */}
                            {detailData.approver && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Được duyệt bởi <strong>{detailData.approver.full_name}</strong>
                                    {detailData.approved_at && (
                                        <span>vào {formatDate(detailData.approved_at)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            Không có dữ liệu
                        </div>
                    )}
                </div>

                {/* Footer */}
                    <div className="sticky bottom-0 z-20 bg-card dark:bg-zinc-950 border-t border-border dark:border-zinc-800 px-6 py-4 flex justify-end shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)]">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default PayrollDetailModal;
