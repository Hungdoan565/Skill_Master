/**
 * CertificatesPage - Trang quản lý chứng chỉ (Redesigned)
 * 
 * Features:
 * - Hiển thị loại chứng chỉ dạng card (IELTS, TOEIC, MOS, Internal...)
 * - Thống kê số lượng học viên đạt
 * - Click vào loại để xem danh sách chi tiết
 * - Tạo chứng chỉ mới (internal/external)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useCertificates, useCertificateTypes } from '../hooks';
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

// Create Certificate Modal
const CreateCertificateModal = ({
    isOpen,
    onClose,
    certificateTypes,
    students,
    onSubmit,
    submitting
}) => {
    const [formData, setFormData] = useState({
        certificate_type_id: '',
        student_id: '',
        completion_date: new Date().toISOString().split('T')[0],
        scores: {},
        external_id: '',
        exam_date: '',
        file_url: '',
        grade: '',
    });
    const [selectedType, setSelectedType] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                certificate_type_id: '',
                student_id: '',
                completion_date: new Date().toISOString().split('T')[0],
                scores: {},
                external_id: '',
                exam_date: '',
                file_url: '',
                grade: '',
            });
            setSelectedType(null);
        }
    }, [isOpen]);

    const handleTypeChange = (typeId) => {
        const type = certificateTypes.find(t => t.id === typeId);
        setSelectedType(type);
        setFormData(prev => ({ ...prev, certificate_type_id: typeId, scores: {} }));
    };

    const handleScoreChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            scores: { ...prev.scores, [key]: parseFloat(value) || value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    const scoreConfig = selectedType?.score_config || {};
    const subScores = scoreConfig.sub_scores || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-slate-900">Thêm chứng chỉ mới</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Certificate Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Loại chứng chỉ <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.certificate_type_id}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Chọn loại chứng chỉ</option>
                            {certificateTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} {type.is_external ? '(Bên ngoài)' : '(Nội bộ)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Student */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Học viên <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.student_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Chọn học viên</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.full_name} - {student.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Ngày hoàn thành <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={formData.completion_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
                                required
                            />
                        </div>
                        {selectedType?.is_external && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ngày thi
                                </label>
                                <Input
                                    type="date"
                                    value={formData.exam_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                                />
                            </div>
                        )}
                    </div>

                    {/* Score section based on type */}
                    {selectedType && (
                        <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                            <h3 className="font-medium text-slate-900">
                                Điểm số / Kết quả
                            </h3>

                            {scoreConfig.type === 'band' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Overall Band Score
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            min={scoreConfig.min || 0}
                                            max={scoreConfig.max || 9}
                                            placeholder="Ví dụ: 7.5"
                                            value={formData.scores.overall || ''}
                                            onChange={(e) => handleScoreChange('overall', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {subScores.map(key => (
                                            <div key={key}>
                                                <label className="block text-sm text-slate-600 mb-1 capitalize">
                                                    {scoreConfig.labels?.[key] || key}
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    min={scoreConfig.min || 0}
                                                    max={scoreConfig.max || 9}
                                                    value={formData.scores[key] || ''}
                                                    onChange={(e) => handleScoreChange(key, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {scoreConfig.type === 'numeric' && (
                                <>
                                    {subScores.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {subScores.map(key => (
                                                <div key={key}>
                                                    <label className="block text-sm text-slate-600 mb-1 capitalize">
                                                        {scoreConfig.labels?.[key] || key}
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={formData.scores[key] || ''}
                                                        onChange={(e) => handleScoreChange(key, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1">
                                                    {scoreConfig.total_label || 'Tổng điểm'}
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={formData.scores.total || ''}
                                                    onChange={(e) => handleScoreChange('total', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">
                                                Điểm số
                                            </label>
                                            <Input
                                                type="number"
                                                min={scoreConfig.min || 0}
                                                max={scoreConfig.max || 1000}
                                                value={formData.scores.score || ''}
                                                onChange={(e) => handleScoreChange('score', e.target.value)}
                                            />
                                            {scoreConfig.pass_score && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Điểm đạt: {scoreConfig.pass_score}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {scoreConfig.type === 'grade' && (
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">
                                        Xếp loại
                                    </label>
                                    <select
                                        value={formData.grade}
                                        onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Chọn xếp loại</option>
                                        {(scoreConfig.grades || ['Xuất sắc', 'Giỏi', 'Khá', 'Đạt']).map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* External certificate fields */}
                    {selectedType?.is_external && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Số chứng chỉ / TRF Number
                                </label>
                                <Input
                                    value={formData.external_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, external_id: e.target.value }))}
                                    placeholder="Ví dụ: VN0028"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    URL file scan (PDF/Image)
                                </label>
                                <Input
                                    value={formData.file_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm chứng chỉ
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
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
    const [createModal, setCreateModal] = useState({ isOpen: false, submitting: false });

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

    // Handle create certificate
    const handleCreateCertificate = async (data) => {
        try {
            setCreateModal(prev => ({ ...prev, submitting: true }));
            await createCertificate(data);
            setCreateModal({ isOpen: false, submitting: false });
            fetchCertificateTypes({ include_stats: true });
        } catch (error) {
            console.error('Error creating certificate:', error);
            setCreateModal(prev => ({ ...prev, submitting: false }));
        }
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
                <Button onClick={() => setCreateModal({ isOpen: true, submitting: false })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm chứng chỉ
                </Button>
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

            {/* Create Modal */}
            <CreateCertificateModal
                isOpen={createModal.isOpen}
                onClose={() => setCreateModal({ isOpen: false, submitting: false })}
                certificateTypes={certificateTypes}
                students={students}
                onSubmit={handleCreateCertificate}
                submitting={createModal.submitting}
            />
        </div>
    );
}

export default CertificatesPage;
