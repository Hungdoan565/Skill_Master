import { gooeyToast } from 'goey-toast';
/**
 * StudentDetailPage - Trang chi tiết học viên
 * 
 * Features:
 * - Thông tin cá nhân
 * - Danh sách lớp học đã/đang theo học
 * - Lịch sử thanh toán
 * - Điểm số và chứng chỉ
 * - Điểm danh
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    GraduationCap,
    CreditCard,
    FileText,
    Award,
    Clock,
    Edit2,
    ChevronRight,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    BookOpen,
    BarChart3,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useStudents } from '../hooks';
import { formatDate, getInitials, getGradient, STATUS_OPTIONS } from '../utils';
import { EditStudentModal, StudentTransferModal } from '../components';
import { StudentDocumentsTab } from '../components/StudentDocumentsTab';
import { Share2 } from 'lucide-react'; // For transfer icon

// Tab components
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
    <button
        onClick={onClick}
        className={`
      flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all
      ${active
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }
    `}
    >
        <Icon className="h-4 w-4" />
        {label}
        {count !== undefined && (
            <span className={`
        ml-1 px-1.5 py-0.5 text-xs rounded-full
        ${active ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'}
      `}>
                {count}
            </span>
        )}
    </button>
);

// Info Card
const InfoCard = ({ icon: Icon, label, value, iconColor = 'text-slate-400' }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
        <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
        <div className="min-w-0">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-900 truncate">{value || '—'}</p>
        </div>
    </div>
);

// Classes Tab
const ClassesTab = ({ enrollments = [] }) => {
    if (!enrollments || enrollments.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Chưa đăng ký lớp học nào</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <Link
                                to={`/admin/classes/${enrollment.class_id}`}
                                className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                            >
                                {enrollment.classes?.name || 'N/A'}
                            </Link>
                            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                <span>{enrollment.classes?.courses?.title || 'N/A'}</span>
                                {(enrollment.classes?.teacher?.full_name || enrollment.classes?.teachers?.full_name || enrollment.classes?.users?.full_name) && (
                                    <>
                                        <span>•</span>
                                        <span>GV: {enrollment.classes.teacher?.full_name || enrollment.classes.teachers?.full_name || enrollment.classes.users?.full_name}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(enrollment.enrolled_at)}
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant={enrollment.status === 'active' ? 'success' : enrollment.status === 'completed' ? 'default' : 'secondary'}
                        >
                            {STATUS_OPTIONS.find(s => s.value === enrollment.status)?.label || enrollment.status}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Payments Tab
const PaymentsTab = ({ invoices = [] }) => {
    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có hóa đơn nào</p>
            </div>
        );
    }

    const statusConfig = {
        paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
        refunded: { label: 'Hoàn tiền', color: 'bg-purple-100 text-purple-700', icon: AlertCircle },
    };

    return (
        <div className="divide-y divide-slate-100">
            {invoices.map((invoice) => {
                const status = statusConfig[invoice.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                    <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">
                                        #{invoice.invoice_number || invoice.id.slice(0, 8)}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {status.label}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                    {invoice.description || invoice.classes?.name || 'Học phí'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {formatDate(invoice.created_at)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.amount || 0)}
                                </p>
                                {invoice.paid_amount > 0 && invoice.paid_amount !== invoice.amount && (
                                    <p className="text-xs text-green-600">
                                        Đã thanh toán: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.paid_amount)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Grades Tab
const GradesTab = ({ grades = [] }) => {
    if (!grades || grades.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có điểm số nào</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {grades.map((grade, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900">{grade.class_name || 'N/A'}</p>
                            <p className="text-sm text-slate-500">{grade.course_name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-bold ${grade.final_grade >= 8 ? 'text-green-600' :
                                grade.final_grade >= 6.5 ? 'text-blue-600' :
                                    grade.final_grade >= 5 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {grade.final_grade?.toFixed(1) || '—'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {grade.final_grade >= 8 ? 'Giỏi' :
                                    grade.final_grade >= 6.5 ? 'Khá' :
                                        grade.final_grade >= 5 ? 'Trung bình' : 'Yếu'}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Attendance Tab
const AttendanceTab = ({ attendance = [] }) => {
    if (!attendance || attendance.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có dữ liệu điểm danh</p>
            </div>
        );
    }

    const statusConfig = {
        present: { label: 'Có mặt', color: 'bg-green-100 text-green-700' },
        absent: { label: 'Vắng', color: 'bg-red-100 text-red-700' },
        late: { label: 'Đi muộn', color: 'bg-yellow-100 text-yellow-700' },
        excused: { label: 'Nghỉ phép', color: 'bg-blue-100 text-blue-700' },
    };

    return (
        <div className="divide-y divide-slate-100">
            {attendance.slice(0, 20).map((record, idx) => {
                const status = statusConfig[record.status] || statusConfig.absent;

                return (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-900">
                                    {record.class_name || 'N/A'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {formatDate(record.session_date)} • {record.session_time || 'N/A'}
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Certificate Score Display Helper
const formatCertificateScore = (certificate) => {
    if (!certificate.scores || !certificate.certificate_types) return null;

    const type = certificate.certificate_types;
    const scores = certificate.scores;
    const scoreType = type.score_config?.type;

    if (scoreType === 'band') {
        // IELTS style - band scores
        return (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {scores.overall && (
                    <span className="font-semibold text-indigo-600">
                        Overall: {scores.overall}
                    </span>
                )}
                {scores.listening && <span>L: {scores.listening}</span>}
                {scores.reading && <span>R: {scores.reading}</span>}
                {scores.writing && <span>W: {scores.writing}</span>}
                {scores.speaking && <span>S: {scores.speaking}</span>}
            </div>
        );
    }

    if (scoreType === 'numeric') {
        // TOEIC / MOS style - numeric scores
        return (
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-indigo-600">
                    {scores.total || scores.score || 0}
                </span>
                {type.score_config?.max && (
                    <span className="text-xs text-slate-500">
                        / {type.score_config.max}
                    </span>
                )}
            </div>
        );
    }

    if (scoreType === 'grade') {
        // Grade style - letter or numeric
        return (
            <div className="flex items-center gap-2">
                {scores.grade && (
                    <span className={`px-2 py-0.5 rounded text-sm font-bold ${scores.grade === 'A' || scores.grade === 'Xuất sắc' ? 'bg-green-100 text-green-700' :
                        scores.grade === 'B' || scores.grade === 'Giỏi' ? 'bg-blue-100 text-blue-700' :
                            scores.grade === 'C' || scores.grade === 'Khá' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-slate-100 text-slate-700'
                        }`}>
                        {scores.grade}
                    </span>
                )}
                {scores.score && (
                    <span className="text-sm text-slate-600">
                        Điểm: {scores.score}
                    </span>
                )}
            </div>
        );
    }

    return null;
};

// Category badge helpers
const getCategoryLabel = (category) => {
    const labels = {
        language: 'Ngôn ngữ',
        it: 'Công nghệ thông tin',
        soft_skill: 'Kỹ năng mềm',
        professional: 'Chuyên môn',
        other: 'Khác'
    };
    return labels[category] || category;
};

const getCategoryColor = (category) => {
    const colors = {
        language: 'bg-blue-100 text-blue-700',
        it: 'bg-purple-100 text-purple-700',
        soft_skill: 'bg-green-100 text-green-700',
        professional: 'bg-orange-100 text-orange-700',
        other: 'bg-slate-100 text-slate-700'
    };
    return colors[category] || colors.other;
};

// Certificates Tab
const CertificatesTab = ({ certificates = [] }) => {
    if (!certificates || certificates.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có chứng chỉ nào</p>
                <p className="text-xs mt-2">Chứng chỉ sẽ được cấp khi hoàn thành khóa học</p>
            </div>
        );
    }

    const statusConfig = {
        issued: { label: 'Đã cấp', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        pending: { label: 'Chờ cấp', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        revoked: { label: 'Đã thu hồi', color: 'bg-red-100 text-red-700', icon: XCircle },
    };

    // Group certificates by external/internal
    const externalCerts = certificates.filter(c => c.certificate_types?.is_external);
    const internalCerts = certificates.filter(c => !c.certificate_types?.is_external);

    const renderCertificateItem = (certificate) => {
        const status = statusConfig[certificate.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        const certType = certificate.certificate_types;
        const isExternal = certType?.is_external;

        return (
            <div key={certificate.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Certificate Icon */}
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isExternal
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                            : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                            }`}>
                            <Award className="h-6 w-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Certificate Type Name */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-slate-900">
                                    {certType?.name || certificate.courses?.title || 'Chứng chỉ'}
                                </p>
                                {isExternal && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                                        Bên ngoài
                                    </span>
                                )}
                            </div>

                            {/* Category & Issuing Organization */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {certType?.category && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(certType.category)}`}>
                                        {getCategoryLabel(certType.category)}
                                    </span>
                                )}
                                {certType?.issuing_organization && (
                                    <span className="text-xs text-slate-500">
                                        {certType.issuing_organization}
                                    </span>
                                )}
                            </div>

                            {/* Certificate Number & External ID */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                {certificate.certificate_number && (
                                    <span>Số: <span className="font-medium">{certificate.certificate_number}</span></span>
                                )}
                                {certificate.external_id && (
                                    <span>Mã ngoài: <span className="font-medium">{certificate.external_id}</span></span>
                                )}
                            </div>

                            {/* Scores */}
                            <div className="mt-2">
                                {formatCertificateScore(certificate)}
                            </div>

                            {/* Dates */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                {certificate.issued_at && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Cấp: {formatDate(certificate.issued_at)}
                                    </span>
                                )}
                                {certificate.expires_at && (
                                    <span className={`flex items-center gap-1 ${new Date(certificate.expires_at) < new Date() ? 'text-red-500' : ''}`}>
                                        <Clock className="h-3 w-3" />
                                        Hết hạn: {formatDate(certificate.expires_at)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                        </span>

                        <div className="flex items-center gap-2">
                            {certificate.file_url && (
                                <a
                                    href={certificate.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                    <FileText className="h-3 w-3" />
                                    Xem file
                                </a>
                            )}
                            {certificate.status === 'issued' && (
                                <Link
                                    to={`/admin/certificates/${certificate.id}/print`}
                                    className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                                >
                                    <Award className="h-3 w-3" />
                                    In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="divide-y divide-slate-100">
            {/* External Certificates */}
            {externalCerts.length > 0 && (
                <div>
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                        <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Chứng chỉ bên ngoài ({externalCerts.length})
                        </p>
                    </div>
                    {externalCerts.map(renderCertificateItem)}
                </div>
            )}

            {/* Internal Certificates */}
            {internalCerts.length > 0 && (
                <div>
                    <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                        <p className="text-xs font-medium text-indigo-700 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Chứng chỉ nội bộ ({internalCerts.length})
                        </p>
                    </div>
                    {internalCerts.map(renderCertificateItem)}
                </div>
            )}

            {/* If no grouping available, show flat list */}
            {externalCerts.length === 0 && internalCerts.length === 0 && (
                certificates.map(renderCertificateItem)
            )}
        </div>
    );
};

// Main Component
export function StudentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { session, isManager, getCenterId } = useAuth();

    const [activeTab, setActiveTab] = useState('classes');
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModal, setEditModal] = useState({ isOpen: false, submitting: false });
    const [transferModal, setTransferModal] = useState({ isOpen: false, submitting: false });

    const { fetchStudentDetail, updateStudent, transferStudent } = useStudents();

    // Fetch student data
    const loadStudent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchStudentDetail(id);

            // CENTER_MANAGER permission check
            if (isManager() && data.center_id && data.center_id !== getCenterId()) {
                setError('Bạn không có quyền xem thông tin học viên này');
                return;
            }

            setStudent(data);
        } catch (err) {
            console.error('Error loading student:', err);
            setError(err.message || 'Không thể tải thông tin học viên');
        } finally {
            setLoading(false);
        }
    }, [id, fetchStudentDetail, isManager, getCenterId]);

    useEffect(() => {
        loadStudent();
    }, [loadStudent]);

    // Handle edit
    const handleEditSubmit = async (studentId, formData) => {
        setEditModal(prev => ({ ...prev, submitting: true }));
        try {
            await updateStudent(studentId, formData);
            setEditModal({ isOpen: false, submitting: false });
            loadStudent(); // Refresh data
        } catch (err) {
            console.error('Error updating student:', err);
            setEditModal(prev => ({ ...prev, submitting: false }));
            throw err;
        }
    };

    // Handle transfer
    const handleTransferSubmit = async (studentId, transferData) => {
        setTransferModal(prev => ({ ...prev, submitting: true }));
        try {
            await transferStudent(studentId, transferData);
            setTransferModal({ isOpen: false, submitting: false });
            gooeyToast.success('Chuyển chi nhánh thành công');
            loadStudent(); // Refresh data to show new center
        } catch (err) {
            console.error('Error transferring student:', err);
            setTransferModal(prev => ({ ...prev, submitting: false }));
            gooeyToast.error(err.message || 'Không thể chuyển chi nhánh');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <Card>
                    <CardContent className="py-12 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <p className="text-lg font-medium text-slate-900">{error}</p>
                        <Button variant="outline" onClick={loadStudent} className="mt-4">
                            Thử lại
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!student) {
        return null;
    }

    const tabs = [
        { id: 'classes', label: 'Lớp học', icon: BookOpen, count: student.enrollments?.length || 0 },
        { id: 'payments', label: 'Thanh toán', icon: CreditCard, count: student.invoices?.length || 0 },
        { id: 'grades', label: 'Điểm số', icon: BarChart3, count: student.grades?.length || 0 },
        { id: 'certificates', label: 'Chứng chỉ', icon: Award, count: student.certificates?.length || 0 },
        { id: 'attendance', label: 'Điểm danh', icon: Clock },
        { id: 'documents', label: 'Tài liệu', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            {/* Back button & Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ Học viên</h1>
                        <p className="text-slate-500">Xem và quản lý thông tin học viên</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {session?.user?.email?.includes('admin') && (
                        <Button
                            variant="outline"
                            className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => setTransferModal({ isOpen: true, submitting: false })}
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Chuyển chi nhánh
                        </Button>
                    )}
                    <Button onClick={() => setEditModal({ isOpen: true, submitting: false })}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Student Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Profile Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                {/* Avatar */}
                                {student.avatar_url ? (
                                    <img
                                        src={student.avatar_url}
                                        alt={student.full_name}
                                        className="h-24 w-24 rounded-full object-cover mx-auto ring-4 ring-white shadow-lg"
                                    />
                                ) : (
                                    <div className={`h-24 w-24 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br ${getGradient(student.full_name)} ring-4 ring-white shadow-lg`}>
                                        {getInitials(student.full_name)}
                                    </div>
                                )}

                                {/* Name & Status */}
                                <h2 className="mt-4 text-xl font-bold text-slate-900">{student.full_name}</h2>
                                <Badge variant={student.status === 'active' ? 'success' : 'secondary'} className="mt-2">
                                    {student.status === 'active' ? 'Đang học' : student.status}
                                </Badge>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 gap-2 mt-6 pt-6 border-t">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-indigo-600">{student.enrollments?.length || 0}</p>
                                    <p className="text-xs text-slate-500">Lớp học</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {student.invoices?.filter(i => i.status === 'paid').length || 0}
                                    </p>
                                    <p className="text-xs text-slate-500">Đã thanh toán</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">{student.grades?.length || 0}</p>
                                    <p className="text-xs text-slate-500">Kết quả</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{student.certificates?.length || 0}</p>
                                    <p className="text-xs text-slate-500">Chứng chỉ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoCard icon={Mail} label="Email" value={student.email} iconColor="text-blue-500" />
                            <InfoCard icon={Phone} label="Số điện thoại" value={student.phone} iconColor="text-green-500" />
                            <InfoCard icon={Calendar} label="Ngày tham gia" value={formatDate(student.created_at)} iconColor="text-purple-500" />
                            {student.centers?.name && (
                                <InfoCard icon={Building2} label="Trung tâm" value={student.centers.name} iconColor="text-orange-500" />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-0 border-b">
                            <div className="flex items-center gap-2 flex-wrap">
                                {tabs.map((tab) => (
                                    <TabButton
                                        key={tab.id}
                                        active={activeTab === tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        icon={tab.icon}
                                        label={tab.label}
                                        count={tab.count}
                                    />
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {activeTab === 'classes' && <ClassesTab enrollments={student.enrollments} />}
                            {activeTab === 'payments' && <PaymentsTab invoices={student.invoices} />}
                            {activeTab === 'grades' && <GradesTab grades={student.grades} />}
                            {activeTab === 'certificates' && <CertificatesTab certificates={student.certificates} />}
            {activeTab === 'attendance' && <AttendanceTab attendance={student.attendance} />}
            {activeTab === 'documents' && (
                <StudentDocumentsTab
                    studentId={id}
                    studentName={student.full_name}
                    getHeaders={() => ({
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json'
                    })}
                />
            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Modal */}
            <EditStudentModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, submitting: false })}
                student={student}
                onSubmit={handleEditSubmit}
                submitting={editModal.submitting}
            />
            {/* Transfer Modal */}
            <StudentTransferModal
                isOpen={transferModal.isOpen}
                onClose={() => setTransferModal({ isOpen: false, submitting: false })}
                student={student}
                onSubmit={handleTransferSubmit}
                submitting={transferModal.submitting}
            />
        </div>
    );
}

export default StudentDetailPage;
