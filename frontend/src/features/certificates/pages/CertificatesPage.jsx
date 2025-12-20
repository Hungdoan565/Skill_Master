/**
 * CertificatesPage - Trang quản lý chứng chỉ (Redesigned)
 * 
 * Features:
 * - Hiển thị loại chứng chỉ dạng card (IELTS, TOEIC, MOS, Internal...)
 * - Thống kê số lượng học viên đạt
 * - Click vào loại để xem danh sách chi tiết
 * - Tạo chứng chỉ mới với Wizard multi-step
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Award,
    Search,
    Plus,
    ChevronRight,
    CheckCircle,
    Loader2,
    Building2,
    Globe,
    BookOpen,
    Users,
    TrendingUp,
    Filter,
    FileText,
    ExternalLink,
    Star,
    X,
    Shield,
    QrCode,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useCertificates, useCertificateTypes } from '../hooks';
import { CertificateIssuanceWizard } from '../components/CertificateIssuanceWizard';
import { formatDate } from '../utils';

// Category icons and colors
const CATEGORY_CONFIG = {
    language: {
        icon: Globe,
        color: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-700',
        label: 'Ngoại ngữ'
    },
    office: {
        icon: FileText,
        color: 'bg-green-500',
        bgLight: 'bg-green-50',
        textColor: 'text-green-700',
        label: 'Tin học văn phòng'
    },
    programming: {
        icon: BookOpen,
        color: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-700',
        label: 'Lập trình'
    },
    soft_skill: {
        icon: Users,
        color: 'bg-orange-500',
        bgLight: 'bg-orange-50',
        textColor: 'text-orange-700',
        label: 'Kỹ năng mềm'
    },
    other: {
        icon: Award,
        color: 'bg-gray-500',
        bgLight: 'bg-gray-50',
        textColor: 'text-gray-700',
        label: 'Khác'
    }
};

// Provider logos (placeholder)
const PROVIDER_LOGOS = {
    'British Council / IDP / Cambridge': '🇬🇧',
    'ETS': '🇺🇸',
    'Microsoft': '🪟',
};

// Stats Overview Card
const StatsOverviewCard = ({ totalTypes, totalIssued, last30Days, topType }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
            <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500 text-white">
                        <Award className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Loại chứng chỉ</p>
                        <p className="text-2xl font-bold text-slate-900">{totalTypes}</p>
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
                        <p className="text-sm text-slate-500">Đã cấp</p>
                        <p className="text-2xl font-bold text-slate-900">{totalIssued}</p>
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
                        <p className="text-2xl font-bold text-slate-900">{last30Days}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500 text-white">
                        <Star className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Phổ biến nhất</p>
                        <p className="text-lg font-bold text-slate-900 truncate">{topType || '-'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

// Certificate Type Card
const CertificateTypeCard = ({ type, onClick }) => {
    const config = CATEGORY_CONFIG[type.category] || CATEGORY_CONFIG.other;
    const Icon = config.icon;

    return (
        <Card
            className="hover:shadow-lg transition-all cursor-pointer group border-l-4"
            style={{ borderLeftColor: type.is_external ? '#3b82f6' : '#22c55e' }}
            onClick={onClick}
        >
            <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        {/* Type Icon/Logo */}
                        <div className={`h-14 w-14 rounded-xl ${config.bgLight} flex items-center justify-center`}>
                            {type.template_preview_url ? (
                                <img
                                    src={type.template_preview_url}
                                    alt={type.name}
                                    className="h-10 w-10 object-contain"
                                />
                            ) : (
                                <span className="text-2xl">
                                    {PROVIDER_LOGOS[type.provider] || <Icon className={`h-7 w-7 ${config.textColor}`} />}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900 text-lg">
                                    {type.name}
                                </h3>
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
                            </div>

                            {type.provider && (
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {type.provider}
                                </p>
                            )}

                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1 text-sm">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span className="font-medium text-slate-700">
                                        {type.stats?.total || 0}
                                    </span>
                                    <span className="text-slate-500">học viên</span>
                                </div>

                                <Badge className={`${config.bgLight} ${config.textColor} font-normal`}>
                                    {config.label}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Description */}
                {type.description && (
                    <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                        {type.description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

// Main Page Component
export function CertificatesPage() {
    const navigate = useNavigate();
    const { session, getCenterId, isAdmin } = useAuth();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, external, internal
    const [wizardOpen, setWizardOpen] = useState(false);

    // Hooks
    const {
        certificateTypes,
        loading,
        fetchCertificateTypes,
        getCategoryLabel,
    } = useCertificateTypes();

    const {
        students,
        fetchStudents,
        createCertificate,
    } = useCertificates();

    // Load data
    useEffect(() => {
        fetchCertificateTypes({ include_stats: true });
        fetchStudents();
    }, [fetchCertificateTypes, fetchStudents]);

    // Filter certificate types
    const filteredTypes = useMemo(() => {
        let result = certificateTypes;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(term) ||
                t.code.toLowerCase().includes(term) ||
                t.provider?.toLowerCase().includes(term)
            );
        }

        if (categoryFilter) {
            result = result.filter(t => t.category === categoryFilter);
        }

        if (typeFilter === 'external') {
            result = result.filter(t => t.is_external);
        } else if (typeFilter === 'internal') {
            result = result.filter(t => t.is_internal && !t.is_external);
        }

        return result;
    }, [certificateTypes, searchTerm, categoryFilter, typeFilter]);

    // Stats
    const stats = useMemo(() => {
        const totalIssued = certificateTypes.reduce((sum, t) => sum + (t.stats?.total || 0), 0);
        const topType = [...certificateTypes].sort((a, b) =>
            (b.stats?.total || 0) - (a.stats?.total || 0)
        )[0];

        return {
            totalTypes: certificateTypes.length,
            totalIssued,
            last30Days: 0, // TODO: Calculate from API
            topType: topType?.name
        };
    }, [certificateTypes]);

    // Handle wizard success
    const handleWizardSuccess = (result) => {
        console.log('Certificates issued:', result);
        fetchCertificateTypes({ include_stats: true });
    };

    // Navigate to type detail
    const handleTypeClick = (type) => {
        navigate(`/admin/certificates/type/${type.id}`);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Chứng chỉ</h1>
                    <p className="text-slate-500 mt-1">
                        Quản lý các loại chứng chỉ và cấp phát cho học viên
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/verify-certificate" target="_blank">
                        <Button variant="outline">
                            <Shield className="h-4 w-4 mr-2" />
                            Xác thực
                        </Button>
                    </Link>
                    <Link to="/admin/certificates/list">
                        <Button variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Danh sách đã cấp
                        </Button>
                    </Link>
                    <Button onClick={() => setWizardOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Cấp chứng chỉ
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsOverviewCard {...stats} />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm chứng chỉ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Tất cả danh mục</option>
                    <option value="language">Ngoại ngữ</option>
                    <option value="office">Tin học văn phòng</option>
                    <option value="programming">Lập trình</option>
                    <option value="soft_skill">Kỹ năng mềm</option>
                    <option value="other">Khác</option>
                </select>

                <div className="flex rounded-lg border overflow-hidden">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${typeFilter === 'all'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setTypeFilter('external')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-l ${typeFilter === 'external'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Bên ngoài
                    </button>
                    <button
                        onClick={() => setTypeFilter('internal')}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-l ${typeFilter === 'internal'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Nội bộ
                    </button>
                </div>
            </div>

            {/* Certificate Types Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredTypes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Không tìm thấy loại chứng chỉ nào</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTypes.map(type => (
                        <CertificateTypeCard
                            key={type.id}
                            type={type}
                            onClick={() => handleTypeClick(type)}
                        />
                    ))}
                </div>
            )}

            {/* Certificate Issuance Wizard */}
            <CertificateIssuanceWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onSuccess={handleWizardSuccess}
            />
        </div>
    );
}

export default CertificatesPage;
