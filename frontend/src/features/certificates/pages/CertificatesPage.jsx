/**
 * CertificatesPage - Trang quản lý chứng chỉ (Redesigned v2)
 * 
 * Features:
 * - Hiển thị loại chứng chỉ dạng compact
 * - Sắp xếp theo số học viên đạt (nhiều nhất lên đầu)
 * - Thu gọn/mở rộng từng category
 * - Filter chỉ hiển thị chứng chỉ có học viên
 * - View mode: Grid / List
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Award,
    Search,
    Plus,
    ChevronRight,
    ChevronDown,
    ChevronUp,
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
    LayoutGrid,
    List,
    SortDesc,
    Eye,
    EyeOff,
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

// Certificate Type Card - Compact Version
const CertificateTypeCard = ({ type, onClick, viewMode = 'grid' }) => {
    const config = CATEGORY_CONFIG[type.category] || CATEGORY_CONFIG.other;
    const Icon = config.icon;
    const studentCount = type.stats?.total || 0;

    if (viewMode === 'list') {
        // List view - more compact
        return (
            <div
                className="flex items-center gap-4 p-3 bg-white rounded-lg border hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
                onClick={onClick}
            >
                <div className={`h-10 w-10 rounded-lg ${config.bgLight} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${config.textColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 truncate">{type.name}</h3>
                        {type.is_external ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-200">Ngoài</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-200">Nội bộ</Badge>
                        )}
                    </div>
                    {type.provider && (
                        <p className="text-xs text-slate-500 truncate">{type.provider}</p>
                    )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${studentCount > 0 ? 'bg-green-50' : 'bg-slate-50'}`}>
                        <Users className={`h-3.5 w-3.5 ${studentCount > 0 ? 'text-green-600' : 'text-slate-400'}`} />
                        <span className={`text-sm font-semibold ${studentCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                            {studentCount}
                        </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        );
    }

    // Grid view - card style
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
                                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${studentCount > 0 ? 'bg-green-50' : 'bg-slate-50'}`}>
                                    <Users className={`h-3.5 w-3.5 ${studentCount > 0 ? 'text-green-500' : 'text-slate-400'}`} />
                                    <span className={`font-semibold ${studentCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                                        {studentCount}
                                    </span>
                                    <span className="text-slate-500">học viên</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
};

// Collapsible Category Section
const CategorySection = ({ category, types, config, onTypeClick, viewMode, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const CategoryIcon = config.icon;
    const totalStudents = types.reduce((sum, t) => sum + (t.stats?.total || 0), 0);
    const activeTypes = types.filter(t => t.stats?.total > 0).length;

    return (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Category Header - Clickable */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                style={{ borderLeft: `4px solid ${config.borderColor}` }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={`p-2 rounded-lg ${config.bgLight}`}>
                    <CategoryIcon className={`h-5 w-5 ${config.textColor}`} />
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900">{config.label}</h2>
                    <p className="text-xs text-slate-500">
                        {types.length} loại • {activeTypes} có học viên • Tổng: {totalStudents} học viên
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {totalStudents > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                            <Users className="h-3 w-3 mr-1" />
                            {totalStudents}
                        </Badge>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Category Content */}
            {isExpanded && (
                <div className={`p-4 pt-0 ${viewMode === 'list' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'}`}>
                    {types.map(type => (
                        <CertificateTypeCard
                            key={type.id}
                            type={type}
                            onClick={() => onTypeClick(type)}
                            viewMode={viewMode}
                        />
                    ))}
                </div>
            )}
        </div>
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
    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
    const [showOnlyWithStudents, setShowOnlyWithStudents] = useState(false);

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

        // Filter by has students
        if (showOnlyWithStudents) {
            result = result.filter(t => (t.stats?.total || 0) > 0);
        }

        return result;
    }, [certificateTypes, searchTerm, categoryFilter, typeFilter, showOnlyWithStudents]);

    // Group certificates by category - SORTED BY POPULARITY
    const groupedTypes = useMemo(() => {
        const groups = {};
        filteredTypes.forEach(type => {
            const category = type.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(type);
        });

        // Sort by popularity (number of students) within each category
        Object.keys(groups).forEach(category => {
            groups[category].sort((a, b) => (b.stats?.total || 0) - (a.stats?.total || 0));
        });

        // Sort categories by total students first, then by predefined order
        const categoryOrder = ['language', 'office', 'programming', 'soft_skill', 'other'];
        const categoriesWithStats = Object.keys(groups).map(cat => ({
            category: cat,
            totalStudents: groups[cat].reduce((sum, t) => sum + (t.stats?.total || 0), 0)
        }));

        // Sort by total students desc, then by predefined order
        categoriesWithStats.sort((a, b) => {
            if (b.totalStudents !== a.totalStudents) {
                return b.totalStudents - a.totalStudents;
            }
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        });

        const sortedGroups = {};
        categoriesWithStats.forEach(({ category }) => {
            if (groups[category] && groups[category].length > 0) {
                sortedGroups[category] = groups[category];
            }
        });

        return sortedGroups;
    }, [filteredTypes]);

    // Stats
    const stats = useMemo(() => {
        const totalIssued = certificateTypes.reduce((sum, t) => sum + (t.stats?.total || 0), 0);
        // Calculate last 30 days from API stats
        const last30Days = certificateTypes.reduce((sum, t) => sum + (t.stats?.last_30_days || 0), 0);
        const topType = [...certificateTypes].sort((a, b) =>
            (b.stats?.total || 0) - (a.stats?.total || 0)
        )[0];

        return {
            totalTypes: certificateTypes.length,
            totalIssued,
            last30Days,
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

                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg border overflow-hidden bg-white">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 transition-colors ${viewMode === 'grid'
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                                title="Xem dạng lưới"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 transition-colors border-l ${viewMode === 'list'
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                                    }`}
                                title="Xem dạng danh sách"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Toggle: Show only with students */}
                        <button
                            onClick={() => setShowOnlyWithStudents(!showOnlyWithStudents)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showOnlyWithStudents
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            title={showOnlyWithStudents ? 'Hiện tất cả' : 'Chỉ hiện chứng chỉ có học viên'}
                        >
                            {showOnlyWithStudents ? (
                                <Eye className="h-4 w-4" />
                            ) : (
                                <EyeOff className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Có học viên</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Certificate Types - Collapsible by Category */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredTypes.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">Không tìm thấy loại chứng chỉ nào</p>
                        {(searchTerm || showOnlyWithStudents) && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('');
                                    setTypeFilter('all');
                                    setShowOnlyWithStudents(false);
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div>
                    {/* Result count with sort indicator */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-500">
                                Hiển thị <span className="font-medium text-slate-700">{filteredTypes.length}</span> loại chứng chỉ
                            </p>
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                <SortDesc className="h-3 w-3 mr-1" />
                                Sắp xếp theo học viên
                            </Badge>
                        </div>
                        {(searchTerm || categoryFilter || typeFilter !== 'all' || showOnlyWithStudents) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('');
                                    setTypeFilter('all');
                                    setShowOnlyWithStudents(false);
                                }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>

                    {/* Grouped by Category - Using CategorySection component */}
                    <div className="space-y-4">
                        {Object.entries(groupedTypes).map(([category, types], index) => {
                            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                            return (
                                <CategorySection
                                    key={category}
                                    category={category}
                                    types={types}
                                    config={config}
                                    onTypeClick={handleTypeClick}
                                    viewMode={viewMode}
                                    defaultExpanded={index < 2} // First 2 categories expanded by default
                                />
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
