/**
 * PayrollTable Component
 * Bảng danh sách bảng lương đã tạo
 */

import { Eye, Edit, Trash2, MoreHorizontal, FileText, CheckCircle, Clock, Ban, Printer, History } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    formatCurrency,
    formatDate,
    formatHours,
    formatMonthYear,
    getPayrollStatusLabel,
    getPayrollStatusColor
} from '../utils';

// Action Menu dropdown
function ActionMenu({ payroll, onView, onEdit, onDelete, onUpdateStatus, onPrint, onViewAudit }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const canEdit = payroll.status === 'draft' || payroll.status === 'pending';
    const canDelete = payroll.status === 'draft';

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MoreHorizontal className="h-4 w-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border bg-white py-1 shadow-lg z-10">
                    <button
                        onClick={() => { onView(payroll); setIsOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                    </button>

                    {onPrint && (
                        <button
                            onClick={() => { onPrint(payroll); setIsOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <Printer className="h-4 w-4" />
                            In phiếu lương
                        </button>
                    )}

                    {onViewAudit && (
                        <button
                            onClick={() => { onViewAudit(payroll.id); setIsOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <History className="h-4 w-4" />
                            Lịch sử thay đổi
                        </button>
                    )}

                    {canEdit && (
                        <button
                            onClick={() => { onEdit(payroll); setIsOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            <Edit className="h-4 w-4" />
                            Chỉnh sửa
                        </button>
                    )}

                    <hr className="my-1 border-slate-100" />

                    {/* Status updates */}
                    {payroll.status === 'draft' && (
                        <button
                            onClick={() => { onUpdateStatus(payroll.id, 'pending'); setIsOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                        >
                            <Clock className="h-4 w-4" />
                            Gửi duyệt
                        </button>
                    )}

                    {payroll.status === 'pending' && (
                        <>
                            <button
                                onClick={() => { onUpdateStatus(payroll.id, 'approved'); setIsOpen(false); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Duyệt
                            </button>
                            <button
                                onClick={() => { onUpdateStatus(payroll.id, 'draft'); setIsOpen(false); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            >
                                <Ban className="h-4 w-4" />
                                Trả về nháp
                            </button>
                        </>
                    )}

                    {payroll.status === 'approved' && (
                        <button
                            onClick={() => { onUpdateStatus(payroll.id, 'paid', payroll); setIsOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Đánh dấu đã thanh toán
                        </button>
                    )}

                    {canDelete && (
                        <>
                            <hr className="my-1 border-slate-100" />
                            <button
                                onClick={() => { onDelete(payroll); setIsOpen(false); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export function PayrollTable({
    payrolls = [],
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onPrint,
    onViewAudit,
    loading,
}) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (payrolls.length === 0) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
                <FileText className="h-10 w-10" />
                <p>Chưa có bảng lương nào</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4">Giáo viên</th>
                        <th className="pb-3 pr-4 text-center">Kỳ lương</th>
                        <th className="pb-3 pr-4 text-center">Buổi/Giờ</th>
                        <th className="pb-3 pr-4 text-right">Lương cơ bản</th>
                        <th className="pb-3 pr-4 text-right">Thưởng</th>
                        <th className="pb-3 pr-4 text-right">Khấu trừ</th>
                        <th className="pb-3 pr-4 text-right">Thực nhận</th>
                        <th className="pb-3 pr-4 text-center">Trạng thái</th>
                        <th className="pb-3 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {payrolls.map((payroll) => (
                        <tr
                            key={payroll.id}
                            className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                        >
                            {/* Teacher */}
                            <td className="py-4 pr-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-medium text-sm">
                                        {payroll.teacher?.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {payroll.teacher?.full_name || 'N/A'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {payroll.teacher?.email}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            {/* Period */}
                            <td className="py-4 pr-4 text-center">
                                <span className="text-sm font-medium">
                                    {formatMonthYear(payroll.period_month, payroll.period_year)}
                                </span>
                            </td>

                            {/* Sessions/Hours */}
                            <td className="py-4 pr-4 text-center">
                                <span className="text-sm">
                                    {payroll.total_sessions} buổi / {formatHours(payroll.total_hours)}
                                </span>
                            </td>

                            {/* Base Salary */}
                            <td className="py-4 pr-4 text-right">
                                <span className="text-sm">
                                    {formatCurrency(payroll.base_salary)}
                                </span>
                            </td>

                            {/* Bonus */}
                            <td className="py-4 pr-4 text-right">
                                <span className="text-sm text-green-600">
                                    +{formatCurrency(payroll.bonus || 0)}
                                </span>
                            </td>

                            {/* Deduction */}
                            <td className="py-4 pr-4 text-right">
                                <span className="text-sm text-red-600">
                                    -{formatCurrency(payroll.deduction || 0)}
                                </span>
                            </td>

                            {/* Net Salary */}
                            <td className="py-4 pr-4 text-right">
                                <span className="font-semibold text-green-600">
                                    {formatCurrency(payroll.net_salary)}
                                </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 pr-4 text-center">
                                <Badge variant={getPayrollStatusColor(payroll.status)}>
                                    {getPayrollStatusLabel(payroll.status)}
                                </Badge>
                            </td>

                            {/* Actions */}
                            <td className="py-4 text-right">
                                <ActionMenu
                                    payroll={payroll}
                                    onView={onView}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onUpdateStatus={onUpdateStatus}
                                    onPrint={onPrint}
                                    onViewAudit={onViewAudit}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PayrollTable;
