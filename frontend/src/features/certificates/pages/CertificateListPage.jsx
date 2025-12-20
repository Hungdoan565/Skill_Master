/**
 * CertificateListPage - Danh sách tất cả chứng chỉ đã cấp
 * 
 * Features:
 * - Hiển thị danh sách chứng chỉ theo dạng bảng
 * - Lọc theo loại, học viên, ngày cấp
 * - Tìm kiếm theo tên học viên hoặc số hiệu
 * - Xem chi tiết và in chứng chỉ
 * - Hủy chứng chỉ (nếu có quyền)
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Award,
    Search,
    Filter,
    Download,
    Printer,
    Eye,
    XCircle,
    Calendar,
    User,
    FileText,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Certificate status config
const STATUS_CONFIG = {
    issued: {
        label: 'Đang hiệu lực',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
    },
    active: {
        label: 'Đang hiệu lực',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
    },
    revoked: {
        label: 'Đã hủy',
        icon: XCircle,
        color: 'bg-red-100 text-red-700',
    },
    expired: {
        label: 'Đã hết hạn',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-700',
    },
};

export function CertificateListPage() {
    const navigate = useNavigate();
    const { session, isAdmin } = useAuth();

    // States
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // Empty = show all
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Certificate types for filter
    const [certificateTypes, setCertificateTypes] = useState([]);

    // Fetch certificates
    useEffect(() => {
        fetchCertificates();
        fetchCertificateTypes();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/certificates?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // API returns { data: [...], pagination: {...} }
                setCertificates(data.data || data.certificates || []);
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
        }
        setLoading(false);
    };

    const fetchCertificateTypes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/certificate-types`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCertificateTypes(data.data || data.types || []);
            }
        } catch (error) {
            console.error('Error fetching certificate types:', error);
        }
    };

    // Filter certificates
    const filteredCertificates = useMemo(() => {
        let result = certificates;

        // Search by student name or certificate number
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(cert =>
                cert.student_name?.toLowerCase().includes(term) ||
                cert.certificate_number?.toLowerCase().includes(term)
            );
        }

        // Filter by type
        if (typeFilter) {
            result = result.filter(cert => cert.certificate_type_id === typeFilter);
        }

        // Filter by status
        if (statusFilter) {
            result = result.filter(cert => cert.status === statusFilter);
        }

        // Filter by date range
        if (dateFrom) {
            result = result.filter(cert => new Date(cert.issued_at) >= new Date(dateFrom));
        }
        if (dateTo) {
            result = result.filter(cert => new Date(cert.issued_at) <= new Date(dateTo));
        }

        return result;
    }, [certificates, searchTerm, typeFilter, statusFilter, dateFrom, dateTo]);

    // Pagination
    const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
    const paginatedCertificates = filteredCertificates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle print certificate
    const handlePrint = (certificate) => {
        window.open(`/certificates/${certificate.id}/print`, '_blank');
    };

    // Handle view certificate
    const handleView = (certificate) => {
        window.open(`/certificates/${certificate.id}/view`, '_blank');
    };

    // Handle revoke certificate
    const handleRevoke = async (certificate) => {
        if (!confirm(`Bạn có chắc muốn hủy chứng chỉ ${certificate.certificate_number}?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/certificates/${certificate.id}/revoke`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Đã hủy chứng chỉ thành công');
                fetchCertificates();
            } else {
                const error = await response.json();
                alert(error.message || 'Có lỗi xảy ra khi hủy chứng chỉ');
            }
        } catch (error) {
            console.error('Error revoking certificate:', error);
            alert('Có lỗi xảy ra khi hủy chứng chỉ');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/admin/certificates')}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Danh sách chứng chỉ</h1>
                        <p className="text-slate-500 mt-1">
                            Tất cả chứng chỉ đã cấp ({filteredCertificates.length})
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm theo tên hoặc số hiệu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Certificate Type */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả loại chứng chỉ</option>
                            {certificateTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>

                        {/* Status */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="issued">Đang hiệu lực</option>
                            <option value="revoked">Đã hủy</option>
                            <option value="expired">Đã hết hạn</option>
                        </select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="Từ ngày"
                            />
                            <span className="text-slate-400">-</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="Đến ngày"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Certificates Table */}
            {loading ? (
                <Card>
                    <CardContent className="py-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </CardContent>
                </Card>
            ) : paginatedCertificates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Không tìm thấy chứng chỉ nào</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            STT
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Số hiệu
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Học viên
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Loại chứng chỉ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Xếp loại
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Ngày cấp
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginatedCertificates.map((cert, index) => {
                                        const statusConfig = STATUS_CONFIG[cert.status] || STATUS_CONFIG['issued'];
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-blue-500" />
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {cert.certificate_number}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-900">
                                                    {cert.student_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {cert.course_name || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {cert.grade ? (
                                                        <Badge className="bg-green-100 text-green-700">
                                                            {cert.grade}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {formatDate(cert.issued_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={statusConfig.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusConfig.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleView(cert)}
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handlePrint(cert)}
                                                            title="In chứng chỉ"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        {isAdmin && (cert.status === 'issued' || cert.status === 'active') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleRevoke(cert)}
                                                                title="Hủy chứng chỉ"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-slate-500">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCertificates.length)} / {filteredCertificates.length} chứng chỉ
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="w-10"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CertificateListPage;
