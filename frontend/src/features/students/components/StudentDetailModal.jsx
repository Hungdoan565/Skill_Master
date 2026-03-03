import { gooeyToast } from 'goey-toast';
/**
 * StudentDetailModal Component
 * Modal hiển thị chi tiết học viên với enrollments, invoices, attendance
 */

import {
    X, Mail, Phone, Calendar, BookOpen,
    Receipt, CheckCircle2, XCircle, Clock,
    TrendingUp, DollarSign, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColorAvatar } from './ColorAvatar';
import { formatDate } from '../utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStudents } from '../hooks';
import StudentTransferModal from './StudentTransferModal';
import { Share2 } from 'lucide-react';

// Status badges for enrollments
const ENROLLMENT_STATUS = {
    active: { label: 'Đang học', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Hoàn thành', color: 'bg-blue-100 text-blue-700' },
    dropped: { label: 'Đã rời', color: 'bg-red-100 text-red-700' },
    transferred: { label: 'Đã chuyển', color: 'bg-amber-100 text-amber-700' },
};

// Status badges for invoices
const INVOICE_STATUS = {
    paid: { label: 'Đã TT', color: 'bg-green-100 text-green-700' },
    partial: { label: 'TT 1 phần', color: 'bg-amber-100 text-amber-700' },
    unpaid: { label: 'Chưa TT', color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700' },
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0);
};

export function StudentDetailModal({
    isOpen,
    onClose,
    student,
    detailData,
    loading = false,
}) {
    if (!isOpen) return null;

    // Merge student basic info với detailData từ API
    // detailData chứa enrollments, invoices, stats
    const studentData = detailData || student;

    const { session } = useAuth();
    const { transferStudent } = useStudents();
    const [transferModal, setTransferModal] = useState({ isOpen: false, submitting: false });

    // Handle transfer
    const handleTransferSubmit = async (studentId, transferData) => {
        setTransferModal(prev => ({ ...prev, submitting: true }));
        try {
            await transferStudent(studentId, transferData);
            setTransferModal({ isOpen: false, submitting: false });
            gooeyToast.success('Chuyển chi nhánh thành công');
            onClose(); // Close detail modal
        } catch (err) {
            console.error('Error transferring student:', err);
            setTransferModal(prev => ({ ...prev, submitting: false }));
            gooeyToast('❌ Lỗi: ' + (err.message || 'Không thể chuyển chi nhánh'));
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
                >
                    <X className="h-5 w-5" />
                </button>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : studentData ? (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-white">
                            <div className="flex items-center gap-4">
                                <ColorAvatar
                                    name={studentData.full_name}
                                    avatarUrl={studentData.avatar_url}
                                    size="lg"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold">{studentData.full_name || 'Chưa cập nhật'}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                            Học viên
                                        </Badge>
                                        <Badge variant={studentData.status === 'active' ? 'success' : 'secondary'}>
                                            {studentData.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <p className="font-medium text-sm">{studentData.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Số điện thoại</p>
                                        <p className="font-medium text-sm">{studentData.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Ngày đăng ký</p>
                                        <p className="font-medium text-sm">{formatDate(studentData.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            {studentData.stats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <StatBox
                                        icon={BookOpen}
                                        label="Lớp đang học"
                                        value={studentData.stats.activeClasses}
                                        color="blue"
                                    />
                                    <StatBox
                                        icon={CheckCircle2}
                                        label="Đã hoàn thành"
                                        value={studentData.stats.completedClasses}
                                        color="emerald"
                                    />
                                    <StatBox
                                        icon={DollarSign}
                                        label="Đã thanh toán"
                                        value={`${formatCurrency(studentData.stats.totalPaid)}đ`}
                                        color="green"
                                        small
                                    />
                                    <StatBox
                                        icon={AlertCircle}
                                        label="Còn nợ"
                                        value={`${formatCurrency(studentData.stats.totalDebt)}đ`}
                                        color={studentData.stats.totalDebt > 0 ? 'red' : 'slate'}
                                        small
                                    />
                                </div>
                            )}

                            {/* Attendance Stats */}
                            {studentData.stats?.attendance && studentData.stats.attendance.total > 0 && (
                                <div className="p-4 rounded-lg bg-slate-50">
                                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Điểm danh 30 ngày gần nhất
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                            <span className="text-sm">Có mặt: {studentData.stats.attendance.present}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <span className="text-sm">Vắng: {studentData.stats.attendance.absent}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                                            <span className="text-sm">Trễ: {studentData.stats.attendance.late}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Enrollments List */}
                            {studentData.enrollments && studentData.enrollments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-blue-600" />
                                        Lớp học ({studentData.enrollments.length})
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {studentData.enrollments.map((enrollment) => (
                                            <div
                                                key={enrollment.id}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{enrollment.classes?.name || 'N/A'}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {enrollment.classes?.courses?.title} • {enrollment.classes?.courses?.category}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${ENROLLMENT_STATUS[enrollment.status]?.color || 'bg-slate-100'
                                                    }`}>
                                                    {ENROLLMENT_STATUS[enrollment.status]?.label || enrollment.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Invoices List */}
                            {studentData.invoices && studentData.invoices.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-purple-600" />
                                        Hóa đơn gần đây ({studentData.invoices.length})
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {studentData.invoices.map((invoice) => (
                                            <div
                                                key={invoice.id}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{invoice.invoice_code}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatDate(invoice.created_at)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">
                                                        {formatCurrency(invoice.paid_amount)}/{formatCurrency(invoice.final_amount)}đ
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${INVOICE_STATUS[invoice.status]?.color || 'bg-slate-100'
                                                        }`}>
                                                        {INVOICE_STATUS[invoice.status]?.label || invoice.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {(!studentData.enrollments || studentData.enrollments.length === 0) &&
                                (!studentData.invoices || studentData.invoices.length === 0) && (
                                    <div className="text-center py-8 text-slate-500">
                                        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                        <p>Học viên chưa đăng ký lớp nào</p>
                                    </div>
                                )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Đóng
                            </Button>
                            {session?.user?.email?.includes('admin') && (
                                <Button
                                    className="ml-2 bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                    variant="outline"
                                    onClick={() => setTransferModal({ isOpen: true, submitting: false })}
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Chuyển chi nhánh
                                </Button>
                            )}
                        </div>

                        {/* Nested Transfer Modal */}
                        <StudentTransferModal
                            isOpen={transferModal.isOpen}
                            onClose={() => setTransferModal({ isOpen: false, submitting: false })}
                            student={studentData}
                            onSubmit={handleTransferSubmit}
                            submitting={transferModal.submitting}
                        />
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        Không tìm thấy thông tin học viên
                    </div>
                )}
            </div>
        </div >
    );
}

// Sub-component: StatBox
function StatBox({ icon: Icon, label, value, color = 'blue', small = false }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        slate: 'bg-slate-50 text-slate-700 border-slate-200',
    };

    return (
        <div className={`p-3 rounded-lg border ${colors[color]}`}>
            <Icon className="h-4 w-4 mb-1 opacity-70" />
            <p className="text-xs opacity-80">{label}</p>
            <p className={`font-bold ${small ? 'text-sm' : 'text-lg'}`}>{value}</p>
        </div>
    );
}

export default StudentDetailModal;
