/**
 * CertificateTypeDetailPage - Chi tiết loại chứng chỉ
 * 
 * Features:
 * - Thông tin loại chứng chỉ
 * - Thống kê điểm, tỷ lệ đạt
 * - Danh sách học viên đã đạt
 * - Xem chi tiết / In chứng chỉ
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Award,
    Search,
    Users,
    TrendingUp,
    Calendar,
    BarChart3,
    Download,
    Printer,
    Eye,
    MoreVertical,
    CheckCircle,
    XCircle,
    FileText,
    ExternalLink,
    Building2,
    Globe,
    Loader2,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useCertificateTypes, useCertificates } from '../hooks';
import { formatDate } from '../utils';

// Category config
const CATEGORY_CONFIG = {
    language: { label: 'Ngoại ngữ', color: 'bg-blue-100 text-blue-700' },
    office: { label: 'Tin học văn phòng', color: 'bg-green-100 text-green-700' },
    programming: { label: 'Lập trình', color: 'bg-purple-100 text-purple-700' },
    soft_skill: { label: 'Kỹ năng mềm', color: 'bg-orange-100 text-orange-700' },
    other: { label: 'Khác', color: 'bg-gray-100 text-gray-700' }
};

// Score Display Component
const ScoreDisplay = ({ scores, scoreConfig }) => {
    if (!scores || !scoreConfig) return <span className="text-slate-400">-</span>;

    const { type, sub_scores, labels } = scoreConfig;

    if (type === 'band') {
        return (
            <div className="space-y-1">
                <span className="text-lg font-bold text-indigo-600">
                    Overall {scores.overall || '-'}
                </span>
                {sub_scores && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {sub_scores.map(key => (
                            <span key={key}>
                                {labels?.[key]?.[0] || key[0].toUpperCase()}: {scores[key] || '-'}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (type === 'numeric') {
        const total = scores.total || scores.score;
        return (
            <div className="space-y-1">
                <span className="text-lg font-bold text-indigo-600">
                    {total || '-'}
                </span>
                {sub_scores && sub_scores.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {sub_scores.map(key => (
                            <span key={key}>
                                {labels?.[key]?.[0] || key[0].toUpperCase()}: {scores[key] || '-'}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (type === 'grade') {
        return (
            <span className="text-lg font-bold text-indigo-600">
                {scores.grade || '-'}
            </span>
        );
    }

    return <span className="text-slate-400">-</span>;
};

// Certificate Row Component
const CertificateRow = ({ certificate, scoreConfig, onViewDetail, onViewStudent, onPrint }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const statusConfig = {
        issued: { label: 'Đã cấp', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        revoked: { label: 'Thu hồi', color: 'bg-red-100 text-red-700', icon: XCircle },
    };

    const status = statusConfig[certificate.status] || statusConfig.issued;
    const StatusIcon = status.icon;

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b last:border-b-0">
            {/* Student Avatar */}
            <div
                className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600 cursor-pointer hover:bg-indigo-200 transition-colors"
                onClick={() => onViewStudent(certificate.student_id)}
            >
                {certificate.students?.avatar_url ? (
                    <img
                        src={certificate.students.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                    />
                ) : (
                    getInitials(certificate.student_name || certificate.students?.full_name)
                )}
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Link
                        to={`/admin/students/${certificate.student_id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                        {certificate.student_name || certificate.students?.full_name || 'N/A'}
                    </Link>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="font-mono">{certificate.certificate_number}</span>
                    {certificate.classes && (
                        <>
                            <span>•</span>
                            <span>Lớp: {certificate.classes.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Score */}
            <div className="text-right min-w-[120px]">
                <ScoreDisplay scores={certificate.scores} scoreConfig={scoreConfig} />
            </div>

            {/* Date */}
            <div className="text-right text-sm text-slate-500 min-w-[100px]">
                <p>{formatDate(certificate.issued_at)}</p>
                {certificate.exam_date && (
                    <p className="text-xs">Thi: {formatDate(certificate.exam_date)}</p>
                )}
            </div>

            {/* Actions */}
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
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border z-20">
                            <button
                                onClick={() => { onViewDetail(certificate); setMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                <Eye className="h-4 w-4" />
                                Xem chi tiết
                            </button>
                            {certificate.status === 'issued' && (
                                <button
                                    onClick={() => { onPrint(certificate); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Printer className="h-4 w-4" />
                                    In chứng chỉ
                                </button>
                            )}
                            {certificate.file_url && (
                                <a
                                    href={certificate.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Download className="h-4 w-4" />
                                    Tải file gốc
                                </a>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Main Component
export function CertificateTypeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    // Hooks
    const { typeDetail, loading, fetchTypeDetail, formatScore } = useCertificateTypes();

    // Load data
    useEffect(() => {
        if (id) {
            fetchTypeDetail(id, page);
        }
    }, [id, page, fetchTypeDetail]);

    // Filter certificates
    const filteredCertificates = useMemo(() => {
        let result = typeDetail?.certificates || [];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.student_name?.toLowerCase().includes(term) ||
                c.students?.full_name?.toLowerCase().includes(term) ||
                c.certificate_number?.toLowerCase().includes(term)
            );
        }

        if (statusFilter) {
            result = result.filter(c => c.status === statusFilter);
        }

        return result;
    }, [typeDetail?.certificates, searchTerm, statusFilter]);

    // Handlers
    const handleViewDetail = (certificate) => {
        navigate(`/certificates/${certificate.id}/view`);
    };

    const handleViewStudent = (studentId) => {
        navigate(`/admin/students/${studentId}`);
    };

    const handlePrint = (certificate) => {
        navigate(`/certificates/${certificate.id}/print`);
    };

    const handleExportExcel = async () => {
        if (!filteredCertificates || filteredCertificates.length === 0) return;

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `chung-chi_${type.name.replace(/\s+/g, '-')}_${timestamp}`;

        // Define columns
        const columns = [
            { label: 'Mã chứng chỉ', accessor: (c) => c.certificate_number },
            { label: 'Học viên', accessor: (c) => c.student_name || c.students?.full_name || '' },
            { label: 'Lớp', accessor: (c) => c.classes?.name || '' },
            { label: 'Điểm', accessor: (c) => c.scores?.overall || c.scores?.total || c.scores?.grade || '' },
            { label: 'Ngày thi', accessor: (c) => c.exam_date || '' },
            { label: 'Ngày cấp', accessor: (c) => c.issued_at || '' },
            { label: 'Trạng thái', accessor: (c) => c.status === 'issued' ? 'Đã cấp' : 'Thu hồi' },
        ];

        try {
            // Try Excel export with xlsx
            const XLSX = await import('xlsx');
            const worksheetData = [
                columns.map(col => col.label),
                ...filteredCertificates.map(item => columns.map(col => col.accessor(item) ?? ''))
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        } catch (error) {
            // Fallback to CSV
            console.warn('XLSX not available, exporting as CSV');
            const headers = columns.map(col => col.label).join(',');
            const rows = filteredCertificates.map(item =>
                columns.map(col => {
                    let value = col.accessor(item);
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(',')
            );
            const csvContent = [headers, ...rows].join('\n');
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    };

    if (loading && !typeDetail) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!typeDetail) {
        return (
            <div className="p-6 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Không tìm thấy loại chứng chỉ</p>
                <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
                    Quay lại
                </Button>
            </div>
        );
    }

    const { type, stats, pagination } = typeDetail;
    const categoryConfig = CATEGORY_CONFIG[type.category] || CATEGORY_CONFIG.other;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{type.name}</h1>
                        {type.is_external ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Bên ngoài
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <Building2 className="h-3 w-3 mr-1" />
                                Nội bộ
                            </Badge>
                        )}
                        <Badge className={categoryConfig.color}>
                            {categoryConfig.label}
                        </Badge>
                    </div>
                    {type.provider && (
                        <p className="text-slate-500 mt-1">{type.provider}</p>
                    )}
                    {type.description && (
                        <p className="text-sm text-slate-500 mt-2">{type.description}</p>
                    )}
                </div>

                <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500 text-white">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Tổng đã cấp</p>
                                <p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500 text-white">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Đang hiệu lực</p>
                                <p className="text-2xl font-bold text-slate-900">{stats?.issued || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500 text-white">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">30 ngày qua</p>
                                <p className="text-2xl font-bold text-slate-900">{stats?.last_30_days || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {stats?.avg_score && (
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500 text-white">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Điểm TB</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.avg_score}</p>
                                    <p className="text-xs text-slate-400">
                                        Min: {stats.min_score} | Max: {stats.max_score}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Certificates List */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>Danh sách học viên đạt chứng chỉ</CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Tìm học viên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-[200px]"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="issued">Đã cấp</option>
                                <option value="revoked">Thu hồi</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {filteredCertificates.length === 0 ? (
                        <div className="py-12 text-center">
                            <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">Chưa có học viên nào đạt chứng chỉ này</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredCertificates.map(cert => (
                                <CertificateRow
                                    key={cert.id}
                                    certificate={cert}
                                    scoreConfig={type.score_config}
                                    onViewDetail={handleViewDetail}
                                    onViewStudent={handleViewStudent}
                                    onPrint={handlePrint}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-slate-500">
                            Hiển thị {filteredCertificates.length} / {pagination.total} chứng chỉ
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Trước
                            </Button>
                            <span className="text-sm text-slate-600">
                                Trang {page} / {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default CertificateTypeDetailPage;
