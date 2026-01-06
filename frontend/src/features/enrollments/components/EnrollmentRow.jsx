/**
 * EnrollmentRow - Table row component for enrollment
 * Extracted from EnrollmentsPage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Trash2, Receipt, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStatusConfig } from '../utils';
import { calculateRemaining, getEnrollmentPaymentStatus, formatCurrency } from '../utils/paymentUtils';

export function EnrollmentRow({ enrollment, onView, onDelete, onViewInvoice, selected, onSelect }) {
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
        <tr className={`hover:bg-muted/50 transition-colors ${selected ? 'bg-indigo-50/50' : ''}`}>
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
                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                        {getInitials(enrollment.student?.full_name)}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{enrollment.student?.full_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.student?.email || 'N/A'}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <p className="font-medium text-foreground">{enrollment.class?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{enrollment.class?.courses?.title || 'N/A'}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm text-foreground">{enrollment.class?.teacher?.full_name || 'Chưa có'}</p>
            </td>
            <td className="px-4 py-3 text-right">
                <p className="font-medium text-foreground">{formatCurrency(tuition)}</p>
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
                            <div className="absolute right-0 top-full mt-1 w-48 bg-popover rounded-lg shadow-lg border z-20" role="menu" aria-label="Hành động ghi danh">
                                <button
                                    onClick={() => { onView(enrollment); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                                    role="menuitem"
                                    aria-label="Xem chi tiết học viên"
                                >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                </button>
                                <button
                                    onClick={() => { navigate(`/admin/invoices?student_id=${enrollment.student_id}`); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
                                        const params = new URLSearchParams({
                                            create: 'true',
                                            enrollment_id: enrollment.id,
                                            student_id: enrollment.student_id,
                                            student_name: enrollment.student?.full_name || '',
                                            class_id: enrollment.class_id,
                                            class_name: enrollment.class?.name || '',
                                            course_name: enrollment.class?.courses?.title || '',
                                            amount: remaining,
                                            type: 'tuition'
                                        });
                                        navigate(`/admin/invoices?${params.toString()}`);
                                        setMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    role="menuitem"
                                    aria-label="Thu học phí"
                                >
                                    <DollarSign className="h-4 w-4" />
                                    Thu học phí
                                </button>
                                <div className="border-t my-1"></div>
                                <button
                                    onClick={() => { onDelete(enrollment); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
}

export default EnrollmentRow;
