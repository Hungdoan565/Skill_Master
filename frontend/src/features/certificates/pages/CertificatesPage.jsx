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
        borderColor: '#3b82f6',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-700',
        label: 'Ngoại ngữ'
    },
    office: {
        icon: FileText,
        color: 'bg-green-500',
        borderColor: '#22c55e',
        bgLight: 'bg-green-50',
        textColor: 'text-green-700',
        label: 'Tin học văn phòng'
    },
    programming: {
        icon: BookOpen,
        color: 'bg-purple-500',
        borderColor: '#a855f7',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-700',
        label: 'Lập trình'
    },
    soft_skill: {
        icon: Users,
        color: 'bg-orange-500',
        borderColor: '#f97316',
        bgLight: 'bg-orange-50',
        textColor: 'text-orange-700',
        label: 'Kỹ năng mềm'
    },
    other: {
        icon: Award,
        color: 'bg-gray-500',
        borderColor: '#6b7280',
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

// Stats Overview Card - More compact
const StatsOverviewCard = ({ totalTypes, totalIssued, last30Days, topType }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="border-l-4 border-indigo-500">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <Award className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Loại chứng chỉ</p>
                        <p className="text-xl font-bold text-slate-900">{totalTypes}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Đã cấp</p>
                        <p className="text-xl font-bold text-slate-900">{totalIssued}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">30 ngày qua</p>
                        <p className="text-xl font-bold text-slate-900">{last30Days}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                        <Star className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Phổ biến nhất</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{topType || '-'}</p>
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
            className="hover:shadow-lg transition-all cursor-pointer group border-l-4 hover:scale-[1.02]"
            style={{ borderLeftColor: type.is_external ? '#3b82f6' : '#22c55e' }}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Type Icon/Logo - Smaller */}
                        <div className={`h-12 w-12 rounded-lg ${config.bgLight} flex items-center justify-center flex-shrink-0`}>
                            {type.template_preview_url ? (
                                <img
                                    src={type.template_preview_url}
                                    alt={type.name}
                                    className="h-8 w-8 object-contain"
                                />
                            ) : (
                                <span className="text-xl">
                                    {PROVIDER_LOGOS[type.provider] || <Icon className={`h-6 w-6 ${config.textColor}`} />}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900 text-base leading-tight flex-1">
                                    {type.name}
                                </h3>
                                {type.is_external ? (
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50 flex-shrink-0">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Bên ngoài
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50 flex-shrink-0">
                                        Nội bộ
                                    </Badge>
                                )}
                            </div>

                            {type.provider && (
                                <p className="text-xs text-slate-500 mb-2 truncate">
                                    {type.provider}
                                </p>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs">
                                    <Users className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-medium text-slate-700">
                                        {type.stats?.total || 0}
                                    </span>
                                    <span className="text-slate-500">học viên</span>
                                </div>

                                <Badge className={`text-xs ${config.bgLight} ${config.textColor} font-normal`}>
                                    {config.label}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>

                {/* Description - Shorter */}
                {type.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-1 ml-15">
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

    // Group certificates by category
    const groupedTypes = useMemo(() => {
        const groups = {};
        filteredTypes.forEach(type => {
            const category = type.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(type);
        });

        // Sort categories by predefined order
        const categoryOrder = ['language', 'office', 'programming', 'soft_skill', 'other'];
        const sortedGroups = {};
        categoryOrder.forEach(cat => {
            if (groups[cat] && groups[cat].length > 0) {
                sortedGroups[cat] = groups[cat];
            }
        });

        return sortedGroups;
    }, [filteredTypes]);

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
                    <Link to="/verify-certificate">
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

            {/* Filters - More compact */}
            <Card className="mb-4">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
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
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                        >
                            <option value="">Tất cả danh mục</option>
                            <option value="language">🌐 Ngoại ngữ</option>
                            <option value="office">📄 Tin học văn phòng</option>
                            <option value="programming">💻 Lập trình</option>
                            <option value="soft_skill">👥 Kỹ năng mềm</option>
                            <option value="other">📋 Khác</option>
                        </select>

                        <div className="flex rounded-lg border overflow-hidden bg-white">
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={`px-3 py-2 text-sm font-medium transition-colors ${typeFilter === 'all'
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setTypeFilter('external')}
                                className={`px-3 py-2 text-sm font-medium transition-colors border-l ${typeFilter === 'external'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Bên ngoài
                            </button>
                            <button
                                onClick={() => setTypeFilter('internal')}
                                className={`px-3 py-2 text-sm font-medium transition-colors border-l ${typeFilter === 'internal'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                Nội bộ
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Certificate Types Grid - 3 columns on large screens */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredTypes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Không tìm thấy loại chứng chỉ nào</p>
                        {searchTerm && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('');
                                    setTypeFilter('all');
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div>
                    {/* Result count */}
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-slate-500">
                            Hiển thị <span className="font-medium text-slate-700">{filteredTypes.length}</span> loại chứng chỉ
                        </p>
                        {(searchTerm || categoryFilter || typeFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('');
                                    setTypeFilter('all');
                                }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>

                    {/* Grouped by Category */}
                    <div className="space-y-6">
                        {Object.entries(groupedTypes).map(([category, types]) => {
                            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                            const CategoryIcon = config.icon;

                            return (
                                <div key={category} className="space-y-3">
                                    {/* Category Header */}
                                    <div className="flex items-center gap-3 pb-2 border-b-2" style={{ borderColor: config.borderColor }}>
                                        <div className={`p-2 rounded-lg ${config.bgLight}`}>
                                            <CategoryIcon className={`h-5 w-5 ${config.textColor}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-bold text-slate-900">{config.label}</h2>
                                            <p className="text-xs text-slate-500">{types.length} loại chứng chỉ</p>
                                        </div>
                                        <Badge variant="outline" className={`${config.bgLight} ${config.textColor}`}>
                                            {types.filter(t => t.stats?.total > 0).length} đang sử dụng
                                        </Badge>
                                    </div>

                                    {/* Category Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {types.map(type => (
                                            <CertificateTypeCard
                                                key={type.id}
                                                type={type}
                                                onClick={() => handleTypeClick(type)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
