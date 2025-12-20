/**
 * CertificateIssuanceWizard - Wizard cấp chứng chỉ theo từng bước
 * 
 * Steps:
 * 1. Chọn loại chứng chỉ (Internal/External)
 * 2. Chọn học viên (từ lớp hoặc search)
 * 3. Nhập thông tin điểm/xếp loại
 * 4. Chọn template thiết kế
 * 5. Preview & Confirm
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Award,
    Users,
    FileText,
    Eye,
    ChevronRight,
    ChevronLeft,
    Check,
    CheckCircle,
    Search,
    Loader2,
    Globe,
    Building2,
    BookOpen,
    Code,
    UserCheck,
    AlertCircle,
    X,
    Star,
    Shield,
    Download,
    Printer,
    Send,
    ExternalLink,
    FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { CertificateTemplate } from './CertificateTemplates';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Category config
const CATEGORY_CONFIG = {
    language: {
        icon: Globe,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Ngoại ngữ'
    },
    office: {
        icon: FileText,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Tin học Văn phòng'
    },
    programming: {
        icon: Code,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        label: 'Lập trình'
    },
    soft_skill: {
        icon: Users,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Kỹ năng mềm'
    },
};

// Wizard Steps
const STEPS = [
    { id: 1, name: 'Loại chứng chỉ', icon: Award },
    { id: 2, name: 'Chọn học viên', icon: Users },
    { id: 3, name: 'Thông tin điểm', icon: FileText },
    { id: 4, name: 'Xem trước', icon: Eye },
];

// Step Indicator Component
const StepIndicator = ({ steps, currentStep }) => (
    <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                isCompleted && "bg-green-500 text-white",
                                isActive && "bg-blue-600 text-white ring-4 ring-blue-200",
                                !isActive && !isCompleted && "bg-slate-100 text-slate-400"
                            )}
                        >
                            {isCompleted ? (
                                <Check className="h-5 w-5" />
                            ) : (
                                <Icon className="h-5 w-5" />
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-xs mt-1 font-medium",
                                isActive && "text-blue-600",
                                isCompleted && "text-green-600",
                                !isActive && !isCompleted && "text-slate-400"
                            )}
                        >
                            {step.name}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                "w-16 h-0.5 mx-2 mt-[-20px]",
                                isCompleted ? "bg-green-500" : "bg-slate-200"
                            )}
                        />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// Step 1: Certificate Type Selection
const Step1CertificateType = ({
    certificateTypes,
    selectedType,
    onSelectType,
    loading
}) => {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'internal', 'external'
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTypes = certificateTypes.filter(type => {
        const matchCategory = categoryFilter === 'all' || type.category === categoryFilter;
        const matchType = typeFilter === 'all' ||
            (typeFilter === 'internal' && type.is_internal) ||
            (typeFilter === 'external' && type.is_external);
        const matchSearch = !searchQuery ||
            type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            type.code.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchType && matchSearch;
    });

    // Group by category
    const groupedTypes = filteredTypes.reduce((acc, type) => {
        const cat = type.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(type);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm chứng chỉ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={typeFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter('all')}
                    >
                        Tất cả
                    </Button>
                    <Button
                        variant={typeFilter === 'internal' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter('internal')}
                        className="gap-1"
                    >
                        <Building2 className="h-4 w-4" />
                        Nội bộ
                    </Button>
                    <Button
                        variant={typeFilter === 'external' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTypeFilter('external')}
                        className="gap-1"
                    >
                        <Globe className="h-4 w-4" />
                        Quốc tế
                    </Button>
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-[180px]"
                >
                    <option value="all">Tất cả danh mục</option>
                    <option value="language">Ngoại ngữ</option>
                    <option value="office">Tin học VP</option>
                    <option value="programming">Lập trình</option>
                    <option value="soft_skill">Kỹ năng mềm</option>
                </select>
            </div>

            {/* Certificate Types Grid */}
            <div className="max-h-[500px] overflow-y-auto space-y-6">
                {Object.entries(groupedTypes).map(([category, types]) => {
                    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.soft_skill;
                    const Icon = config.icon;

                    return (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className={`h-5 w-5 ${config.color}`} />
                                <h3 className="font-semibold text-slate-700">{config.label}</h3>
                                <Badge variant="secondary">{types.length}</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {types.map((type) => (
                                    <Card
                                        key={type.id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:shadow-md",
                                            selectedType?.id === type.id
                                                ? "ring-2 ring-blue-500 border-blue-500"
                                                : "hover:border-slate-300"
                                        )}
                                        onClick={() => onSelectType(type)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-slate-900">
                                                            {type.name}
                                                        </h4>
                                                        {selectedType?.id === type.id && (
                                                            <Check className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                                        {type.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {type.is_external ? (
                                                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
                                                                <Globe className="h-3 w-3 mr-1" />
                                                                Quốc tế
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                                                                <Building2 className="h-3 w-3 mr-1" />
                                                                Nội bộ
                                                            </Badge>
                                                        )}
                                                        {type.provider && (
                                                            <span className="text-xs text-slate-400">
                                                                {type.provider}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {Object.keys(groupedTypes).length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Không tìm thấy loại chứng chỉ nào</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Step 2: Student Selection
const Step2StudentSelection = ({
    students,
    selectedStudents,
    onSelectStudents,
    classes,
    loading,
    onSearchStudents
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectionMode, setSelectionMode] = useState('search'); // 'search' | 'class' | 'manual'

    const filteredStudents = students.filter(student => {
        const matchSearch = !searchQuery ||
            student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchClass = !selectedClassId ||
            student.class_id === selectedClassId ||
            student.enrollments?.some(e => e.class_id === selectedClassId);
        return matchSearch && matchClass;
    });

    const toggleStudent = (student) => {
        const isSelected = selectedStudents.some(s => s.id === student.id);
        if (isSelected) {
            onSelectStudents(selectedStudents.filter(s => s.id !== student.id));
        } else {
            onSelectStudents([...selectedStudents, student]);
        }
    };

    const selectAll = () => {
        onSelectStudents(filteredStudents);
    };

    const deselectAll = () => {
        onSelectStudents([]);
    };

    return (
        <div className="space-y-6">
            {/* Selection Mode */}
            <div className="flex gap-2">
                <Button
                    variant={selectionMode === 'search' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectionMode('search')}
                >
                    <Search className="h-4 w-4 mr-1" />
                    Tìm kiếm
                </Button>
                <Button
                    variant={selectionMode === 'class' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectionMode('class')}
                >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Theo lớp
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm học viên theo tên, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {selectionMode === 'class' && (
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-[250px]"
                    >
                        <option value="">Tất cả lớp</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.course_name})
                            </option>
                        ))}
                    </select>
                )}

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                        Chọn tất cả
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                        Bỏ chọn
                    </Button>
                </div>
            </div>

            {/* Selected Count */}
            {selectedStudents.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">
                        Đã chọn {selectedStudents.length} học viên
                    </span>
                </div>
            )}

            {/* Students List */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg divide-y">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Không tìm thấy học viên nào</p>
                    </div>
                ) : (
                    filteredStudents.map((student) => {
                        const isSelected = selectedStudents.some(s => s.id === student.id);
                        return (
                            <div
                                key={student.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                                    isSelected && "bg-blue-50"
                                )}
                                onClick={() => toggleStudent(student)}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleStudent(student)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    {student.avatar_url ? (
                                        <img
                                            src={student.avatar_url}
                                            alt={student.full_name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg font-semibold text-slate-500">
                                            {student.full_name?.charAt(0) || '?'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-900">{student.full_name}</p>
                                    <p className="text-sm text-slate-500">{student.email}</p>
                                </div>
                                {student.class_name && (
                                    <Badge variant="outline">{student.class_name}</Badge>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// Step 3: Score/Grade Input
const Step3ScoreInput = ({
    certificateType,
    selectedStudents,
    studentScores,
    onUpdateScores,
}) => {
    const scoreConfig = certificateType?.score_config || {};
    const isExternal = certificateType?.is_external;

    const handleScoreChange = (studentId, field, value) => {
        onUpdateScores({
            ...studentScores,
            [studentId]: {
                ...studentScores[studentId],
                [field]: value
            }
        });
    };

    const applyToAll = (field, value) => {
        const newScores = { ...studentScores };
        selectedStudents.forEach(student => {
            newScores[student.id] = {
                ...newScores[student.id],
                [field]: value
            };
        });
        onUpdateScores(newScores);
    };

    // Render score input based on type
    const renderScoreInput = (student) => {
        const scores = studentScores[student.id] || {};

        if (scoreConfig.type === 'band') {
            // IELTS style
            return (
                <div className="space-y-3">
                    <div>
                        <Label>Overall Band Score</Label>
                        <Input
                            type="number"
                            step="0.5"
                            min={scoreConfig.min || 0}
                            max={scoreConfig.max || 9}
                            value={scores.overall || ''}
                            onChange={(e) => handleScoreChange(student.id, 'overall', e.target.value)}
                            placeholder="e.g., 7.0"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {scoreConfig.sub_scores?.map(key => (
                            <div key={key}>
                                <Label className="text-xs">{scoreConfig.labels?.[key] || key}</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min={scoreConfig.min || 0}
                                    max={scoreConfig.max || 9}
                                    value={scores[key] || ''}
                                    onChange={(e) => handleScoreChange(student.id, key, e.target.value)}
                                    placeholder="0-9"
                                    className="h-9"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (scoreConfig.type === 'numeric') {
            // TOEIC/MOS style
            return (
                <div className="space-y-3">
                    <div>
                        <Label>{scoreConfig.total_label || 'Total Score'}</Label>
                        <Input
                            type="number"
                            min={scoreConfig.min || 0}
                            max={scoreConfig.max || 1000}
                            value={scores.total || scores.score || ''}
                            onChange={(e) => handleScoreChange(student.id, 'total', e.target.value)}
                            placeholder={`${scoreConfig.min || 0}-${scoreConfig.max || 1000}`}
                        />
                    </div>
                    {scoreConfig.sub_scores && (
                        <div className="grid grid-cols-2 gap-2">
                            {scoreConfig.sub_scores.map(key => (
                                <div key={key}>
                                    <Label className="text-xs">{scoreConfig.labels?.[key] || key}</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={scores[key] || ''}
                                        onChange={(e) => handleScoreChange(student.id, key, e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Grade type (internal certificates)
        if (scoreConfig.type === 'grade' || !isExternal) {
            return (
                <div>
                    <Label>Xếp loại</Label>
                    <select
                        value={scores.grade || ''}
                        onChange={(e) => handleScoreChange(student.id, 'grade', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn xếp loại</option>
                        {(scoreConfig.grades || ['Xuất sắc', 'Giỏi', 'Khá', 'Đạt']).map(grade => (
                            <option key={grade} value={grade}>
                                {grade}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        Nhập điểm/xếp loại cho {selectedStudents.length} học viên
                    </h3>
                    <p className="text-sm text-slate-500">
                        Chứng chỉ: {certificateType?.name}
                    </p>
                </div>

                {/* Quick Apply */}
                {!certificateType?.is_external && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Áp dụng tất cả:</span>
                        <select
                            onChange={(e) => applyToAll('grade', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-[150px]"
                        >
                            <option value="">Chọn xếp loại</option>
                            {['Xuất sắc', 'Giỏi', 'Khá', 'Đạt'].map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* External Certificate Extra Fields */}
            {isExternal && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Chứng chỉ quốc tế - Vui lòng nhập thông tin từ chứng chỉ gốc
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Students List with Score Input */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto">
                {selectedStudents.map((student, index) => (
                    <Card key={student.id}>
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                {/* Student Info */}
                                <div className="flex items-center gap-3 min-w-[200px]">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        {student.avatar_url ? (
                                            <img
                                                src={student.avatar_url}
                                                alt={student.full_name}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-semibold text-slate-500">
                                                {student.full_name?.charAt(0) || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {index + 1}. {student.full_name}
                                        </p>
                                        <p className="text-xs text-slate-500">{student.email}</p>
                                    </div>
                                </div>

                                {/* Score Input */}
                                <div className="flex-1">
                                    {renderScoreInput(student)}
                                </div>

                                {/* External fields */}
                                {isExternal && (
                                    <div className="min-w-[200px] space-y-2">
                                        <div>
                                            <Label className="text-xs">Mã chứng chỉ gốc</Label>
                                            <Input
                                                value={studentScores[student.id]?.external_id || ''}
                                                onChange={(e) => handleScoreChange(student.id, 'external_id', e.target.value)}
                                                placeholder="TRF Number..."
                                                className="h-9"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Ngày thi</Label>
                                            <Input
                                                type="date"
                                                value={studentScores[student.id]?.exam_date || ''}
                                                onChange={(e) => handleScoreChange(student.id, 'exam_date', e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// Available templates - 4 mẫu thiết kế riêng biệt
const CERTIFICATE_TEMPLATES = [
    {
        id: 'modern-blue',
        name: 'Hoàn thành khóa học',
        description: 'Phong cách hiện đại, chuyên nghiệp với tông màu xanh chủ đạo. Phù hợp cho các khóa học tin học, công nghệ.',
        icon: CheckCircle,
        iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        borderColor: 'border-blue-500',
        bgSelected: 'bg-blue-50',
        previewColors: { bg: '#dbeafe', accent: '#3b82f6', text: '#1e3a8a' },
        category: ['office', 'programming']
    },
    {
        id: 'classic-gold',
        name: 'Chứng nhận xuất sắc',
        description: 'Thiết kế cổ điển với viền vàng sang trọng. Thích hợp cho trao giải và vinh danh.',
        icon: Award,
        iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
        borderColor: 'border-amber-500',
        bgSelected: 'bg-amber-50',
        previewColors: { bg: '#fef3c7', accent: '#d97706', text: '#78350f' },
        category: ['language']
    },
    {
        id: 'professional-purple',
        name: 'Chứng chỉ tham gia',
        description: 'Thiết kế tối giản, tập trung vào nội dung sự kiện. Dễ dàng tùy chỉnh logo.',
        icon: FileText,
        iconBg: 'bg-gradient-to-br from-purple-500 to-violet-500',
        borderColor: 'border-purple-500',
        bgSelected: 'bg-purple-50',
        previewColors: { bg: '#ede9fe', accent: '#7c3aed', text: '#4c1d95' },
        category: ['soft_skill']
    },
    {
        id: 'elegant-warm',
        name: 'Tốt nghiệp',
        description: 'Mẫu truyền thống dành cho các cơ sở giáo dục và đào tạo chính quy.',
        icon: Star,
        iconBg: 'bg-gradient-to-br from-orange-500 to-rose-500',
        borderColor: 'border-orange-500',
        bgSelected: 'bg-orange-50',
        previewColors: { bg: '#ffedd5', accent: '#ea580c', text: '#7c2d12' },
        category: ['language', 'office']
    },
];

// Mini Preview Component cho mỗi template
const TemplateMiniPreview = ({ colors }) => (
    <div
        className="w-full h-16 rounded-lg border shadow-inner overflow-hidden"
        style={{ backgroundColor: colors.bg }}
    >
        <div className="h-full flex flex-col items-center justify-center p-2">
            <div
                className="w-4 h-4 rounded-full mb-1"
                style={{ backgroundColor: colors.accent }}
            />
            <div
                className="w-16 h-1 rounded"
                style={{ backgroundColor: colors.accent }}
            />
            <div
                className="w-12 h-0.5 rounded mt-1 opacity-50"
                style={{ backgroundColor: colors.text }}
            />
            <div className="flex gap-4 mt-1">
                <div className="w-6 h-0.5 rounded opacity-30" style={{ backgroundColor: colors.text }} />
                <div className="w-6 h-0.5 rounded opacity-30" style={{ backgroundColor: colors.text }} />
            </div>
        </div>
    </div>
);

// ============================================================
// SUCCESS MODAL - Hiển thị sau khi cấp chứng chỉ thành công
// ============================================================
const SuccessModal = ({ issuedCertificates, onClose, onViewCertificates }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-full">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Cấp chứng chỉ thành công!</h2>
                            <p className="text-white/90 text-sm mt-1">
                                Đã cấp {issuedCertificates.length} chứng chỉ cho học viên
                            </p>
                        </div>
                    </div>
                </div>

                {/* Certificate List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-3">
                        {issuedCertificates.map((cert, index) => (
                            <div
                                key={cert.id || index}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-semibold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{cert.student_name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {cert.certificate_number}
                                            </Badge>
                                            {cert.grade && (
                                                <Badge className="text-xs bg-green-100 text-green-700">
                                                    {cert.grade}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(`/certificates/${cert.id}/print`, '_blank')}
                                        className="h-8"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Đóng
                    </Button>
                    <Button
                        onClick={onViewCertificates}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Xem danh sách chứng chỉ
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Step 4: Preview & Confirm - UI giống mẫu tham khảo
const Step4Preview = ({
    certificateType,
    selectedStudents,
    studentScores,
    centerInfo,
    onConfirm,
    isSubmitting,
    onPrintAll,
    selectedTemplate,
    onTemplateChange,
}) => {
    const [previewStudent, setPreviewStudent] = useState(selectedStudents[0]);
    const [searchTemplate, setSearchTemplate] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [showQR, setShowQR] = useState(true);
    const [showID, setShowID] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = React.useRef(null);

    // Print all certificates - using new window approach
    const handlePrintAll = () => {
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            alert('Vui lòng cho phép popup để in chứng chỉ');
            return;
        }

        // Get template colors based on selection
        const templateColors = {
            'modern-blue': { primary: '#1e40af', secondary: '#3b82f6', bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' },
            'classic-gold': { primary: '#92400e', secondary: '#d97706', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)' },
            'professional-purple': { primary: '#5b21b6', secondary: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)' },
            'elegant-warm': { primary: '#9a3412', secondary: '#ea580c', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)' },
        };
        const colors = templateColors[selectedTemplate] || templateColors['modern-blue'];

        // Build certificate HTML
        let certificatesHTML = '';
        selectedStudents.forEach((student, index) => {
            const scores = studentScores[student.id] || {};
            const grade = scores.grade || '';
            const totalScore = scores.total || scores.overall || scores.score || '';

            certificatesHTML += `
                <div class="certificate-page">
                    <div class="certificate" style="background: ${colors.bg};">
                        <!-- Border -->
                        <div class="border-outer"></div>
                        <div class="border-inner"></div>
                        
                        <!-- Content -->
                        <div class="content">
                            <!-- Header -->
                            <div class="header">
                                <div class="logo">${centerInfo?.name?.charAt(0) || 'S'}</div>
                                <div class="center-name">${centerInfo?.name || 'SKILL MASTER'}</div>
                                <div class="center-tagline">Digital Skills Training Center</div>
                            </div>
                            
                            <!-- Certificate Title -->
                            <div class="cert-label">CERTIFICATE</div>
                            <h1 class="course-name" style="color: ${colors.primary}">${certificateType?.name || 'Certificate'}</h1>
                            ${certificateType?.provider ? `<div class="provider">Certified by ${certificateType.provider}</div>` : ''}
                            
                            <!-- Student -->
                            <div class="certifies">This certifies that</div>
                            <h2 class="student-name" style="color: ${colors.primary}">${student.full_name}</h2>
                            <div class="completion">has successfully completed all requirements</div>
                            
                            <!-- Score/Grade -->
                            ${grade ? `
                                <div class="achievement">
                                    <div class="achievement-label">Achievement Level</div>
                                    <div class="achievement-value" style="color: ${colors.primary}">${grade}</div>
                                </div>
                            ` : ''}
                            ${totalScore ? `
                                <div class="score">
                                    <div class="score-label">Score</div>
                                    <div class="score-value" style="color: ${colors.primary}">${totalScore}</div>
                                </div>
                            ` : ''}
                            
                            <!-- Details -->
                            <div class="details">
                                <div class="detail-item">
                                    <div class="detail-label">Certificate ID</div>
                                    <div class="detail-value">SM-202412-${String(index + 1).padStart(4, '0')}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Completion Date</div>
                                    <div class="detail-value">${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Issued</div>
                                    <div class="detail-value">${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>
                            
                            <!-- Signatures -->
                            <div class="signatures">
                                <div class="signature">
                                    <div class="sign-line"></div>
                                    <div class="sign-title">Center Director</div>
                                </div>
                                <div class="verified">
                                    <svg viewBox="0 0 24 24" fill="${colors.secondary}" width="32" height="32">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                    <div style="color: ${colors.secondary}; font-size: 10px;">VERIFIED</div>
                                </div>
                                <div class="signature">
                                    <div class="sign-line"></div>
                                    <div class="sign-title">Program Director</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>In Chứng Chỉ - ${certificateType?.name || 'Certificate'}</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Georgia', 'Times New Roman', serif;
                    }
                    
                    .certificate-page {
                        width: 297mm;
                        height: 210mm;
                        page-break-after: always;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 5mm;
                    }
                    
                    .certificate-page:last-child {
                        page-break-after: avoid;
                    }
                    
                    .certificate {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    .border-outer {
                        position: absolute;
                        inset: 8px;
                        border: 3px solid ${colors.primary};
                        border-radius: 4px;
                        opacity: 0.6;
                    }
                    
                    .border-inner {
                        position: absolute;
                        inset: 14px;
                        border: 1px solid ${colors.secondary};
                        border-radius: 4px;
                        opacity: 0.4;
                    }
                    
                    .content {
                        position: relative;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 20mm 30mm;
                        text-align: center;
                    }
                    
                    .header {
                        margin-bottom: 8mm;
                    }
                    
                    .logo {
                        width: 50px;
                        height: 50px;
                        background: ${colors.primary};
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0 auto 8px;
                    }
                    
                    .center-name {
                        font-size: 18px;
                        font-weight: bold;
                        color: ${colors.primary};
                        letter-spacing: 2px;
                    }
                    
                    .center-tagline {
                        font-size: 10px;
                        color: #666;
                        letter-spacing: 1px;
                    }
                    
                    .cert-label {
                        font-size: 12px;
                        letter-spacing: 4px;
                        color: #888;
                        margin-bottom: 4mm;
                    }
                    
                    .course-name {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 2mm;
                    }
                    
                    .provider {
                        font-size: 11px;
                        color: #666;
                        margin-bottom: 6mm;
                    }
                    
                    .certifies {
                        font-size: 12px;
                        color: #888;
                        margin-bottom: 2mm;
                    }
                    
                    .student-name {
                        font-size: 32px;
                        font-weight: bold;
                        margin-bottom: 2mm;
                    }
                    
                    .completion {
                        font-size: 11px;
                        color: #666;
                        margin-bottom: 6mm;
                    }
                    
                    .achievement, .score {
                        margin-bottom: 4mm;
                    }
                    
                    .achievement-label, .score-label {
                        font-size: 10px;
                        color: #888;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    .achievement-value, .score-value {
                        font-size: 20px;
                        font-weight: bold;
                    }
                    
                    .details {
                        display: flex;
                        justify-content: center;
                        gap: 20mm;
                        margin: 6mm 0;
                        padding: 4mm 8mm;
                        background: rgba(255,255,255,0.5);
                        border-radius: 4px;
                    }
                    
                    .detail-item {
                        text-align: center;
                    }
                    
                    .detail-label {
                        font-size: 8px;
                        color: #888;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    .detail-value {
                        font-size: 11px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        width: 100%;
                        max-width: 200mm;
                        margin-top: auto;
                    }
                    
                    .signature {
                        text-align: center;
                        min-width: 50mm;
                    }
                    
                    .sign-line {
                        width: 50mm;
                        border-bottom: 1px solid #333;
                        margin-bottom: 2mm;
                    }
                    
                    .sign-title {
                        font-size: 10px;
                        color: #666;
                    }
                    
                    .verified {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                ${certificatesHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Drag to scroll functionality
    const templateListRef = React.useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const handleMouseDown = (e) => {
        if (!templateListRef.current) return;
        setIsDragging(true);
        setStartY(e.pageY - templateListRef.current.offsetTop);
        setScrollTop(templateListRef.current.scrollTop);
        templateListRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !templateListRef.current) return;
        e.preventDefault();
        const y = e.pageY - templateListRef.current.offsetTop;
        const walk = (y - startY) * 1.5; // Scroll speed multiplier
        templateListRef.current.scrollTop = scrollTop - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (templateListRef.current) {
            templateListRef.current.style.cursor = 'grab';
        }
    };

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startY, scrollTop]);

    // Filter templates by search
    const filteredTemplates = CERTIFICATE_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTemplate.toLowerCase())
    );

    const currentTemplate = CERTIFICATE_TEMPLATES.find(t => t.id === selectedTemplate);

    return (
        <div className="flex gap-6 h-[550px]">
            {/* Left Sidebar - Template Selection */}
            <div className="w-80 flex-shrink-0 flex flex-col">
                {/* Header */}
                <div className="mb-4">
                    <h3 className="font-semibold text-slate-800 text-lg">Mẫu chứng chỉ</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Chọn mẫu thiết kế phù hợp cho sự kiện của bạn.</p>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm mẫu..."
                        value={searchTemplate}
                        onChange={(e) => setSearchTemplate(e.target.value)}
                        className="pl-9 h-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                    />
                </div>

                {/* Template List - Drag to scroll, hidden scrollbar */}
                <div
                    ref={templateListRef}
                    onMouseDown={handleMouseDown}
                    className="flex-1 overflow-y-auto space-y-3 cursor-grab select-none"
                    style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none', /* IE/Edge */
                    }}
                >
                    <style>{`
                        .flex-1::-webkit-scrollbar {
                            display: none; /* Chrome/Safari/Opera */
                        }
                    `}</style>
                    {filteredTemplates.map((template) => {
                        const Icon = template.icon;
                        const isSelected = selectedTemplate === template.id;

                        return (
                            <div
                                key={template.id}
                                onClick={() => onTemplateChange(template.id)}
                                className={cn(
                                    "p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                    isSelected
                                        ? `${template.borderColor} ${template.bgSelected} shadow-md`
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                                        template.iconBg
                                    )}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-slate-800 text-sm">{template.name}</h4>
                                            {isSelected && (
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center",
                                                    template.iconBg
                                                )}>
                                                    <Check className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {template.description}
                                        </p>
                                        {/* Mini Preview */}
                                        <div className="mt-2">
                                            <TemplateMiniPreview colors={template.previewColors} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Student Info */}
                <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Học viên được cấp:</span>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {selectedStudents.length} người
                        </Badge>
                    </div>

                    {selectedStudents.length > 1 && (
                        <div>
                            <Label className="text-xs text-slate-500">Xem trước học viên</Label>
                            <select
                                value={previewStudent?.id || ''}
                                onChange={(e) => {
                                    const student = selectedStudents.find(s => s.id === e.target.value);
                                    setPreviewStudent(student);
                                }}
                                className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50"
                            >
                                {selectedStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Right - Certificate Preview */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden shadow-inner">
                {/* Preview Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur border-b">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                        >
                            −
                        </Button>
                        <div className="px-3 py-1 bg-slate-100 rounded-md min-w-[60px] text-center">
                            <span className="text-sm font-medium text-slate-600">{zoomLevel}%</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                        >
                            +
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrintAll}
                            disabled={isSubmitting}
                            className="h-9"
                        >
                            <Printer className="h-4 w-4 mr-1.5" />
                            In tất cả
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className="h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang cấp...
                                </>
                            ) : (
                                <>
                                    <Award className="h-4 w-4 mr-2 text-white" />
                                    Cấp {selectedStudents.length} chứng chỉ
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Certificate Preview Area */}
                <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                    <div
                        className="transform origin-center transition-all duration-300 ease-out"
                        style={{ transform: `scale(${zoomLevel / 100 * 0.38})` }}
                    >
                        {previewStudent && (
                            <div className="shadow-2xl rounded-lg overflow-hidden">
                                <CertificateTemplate
                                    key={`${selectedTemplate}-${previewStudent.id}`}
                                    certificate={{
                                        student_name: previewStudent.full_name,
                                        certificate_number: 'SM-202412-XXXX',
                                        completion_date: new Date().toISOString(),
                                        issued_at: new Date().toISOString(),
                                        grade: studentScores[previewStudent.id]?.grade,
                                        scores: studentScores[previewStudent.id] || {},
                                        center: centerInfo,
                                    }}
                                    certificateType={certificateType}
                                    centerInfo={centerInfo}
                                    template={selectedTemplate}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur border-t">
                    <div className="text-xs text-slate-500 font-medium">
                        Kích thước: 297mm x 210mm (A4)
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className={cn(
                                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                                showQR ? "text-blue-600" : "text-slate-400"
                            )}
                        >
                            <div className={cn(
                                "w-3 h-3 rounded-full transition-colors",
                                showQR ? "bg-blue-500" : "bg-slate-300"
                            )} />
                            Hiện mã QR
                        </button>
                        <button
                            onClick={() => setShowID(!showID)}
                            className={cn(
                                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                                showID ? "text-green-600" : "text-slate-400"
                            )}
                        >
                            <div className={cn(
                                "w-3 h-3 rounded-full transition-colors",
                                showID ? "bg-green-500" : "bg-slate-300"
                            )} />
                            Số hiệu ID
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// MAIN WIZARD COMPONENT
// ============================================================
export function CertificateIssuanceWizard({ isOpen, onClose, onSuccess }) {
    const { session, profile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [issuedCertificates, setIssuedCertificates] = useState([]);

    // Data states
    const [certificateTypes, setCertificateTypes] = useState([]);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [centerInfo, setCenterInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [selectedType, setSelectedType] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [studentScores, setStudentScores] = useState({});
    const [selectedTemplate, setSelectedTemplate] = useState('modern-blue');

    // Fetch certificate types
    useEffect(() => {
        if (isOpen) {
            fetchCertificateTypes();
            fetchStudents();
            fetchClasses();
            fetchCenterInfo();
        }
    }, [isOpen]);

    const getAuthHeaders = useCallback(() => ({
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
    }), [session?.access_token]);

    const fetchCertificateTypes = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/certificate-types`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setCertificateTypes(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching certificate types:', error);
        }
        setLoading(false);
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/students?limit=100`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/classes?status=completed,ongoing`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setClasses(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchCenterInfo = async () => {
        try {
            const centerId = profile?.center_id;
            if (centerId) {
                const response = await fetch(`${API_URL}/api/admin/centers/${centerId}`, {
                    headers: getAuthHeaders()
                });
                if (response.ok) {
                    const data = await response.json();
                    setCenterInfo(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching center info:', error);
        }
    };

    // Navigation
    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return selectedType !== null;
            case 2:
                return selectedStudents.length > 0;
            case 3:
                // Check if all students have scores/grades
                return selectedStudents.every(s => {
                    const scores = studentScores[s.id];
                    if (!scores) return false;
                    if (selectedType?.is_external) {
                        return scores.total || scores.overall || scores.score;
                    }
                    return scores.grade;
                });
            case 4:
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (canProceed() && currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Submit certificates
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const certificates = selectedStudents.map(student => ({
                certificate_type_id: selectedType.id,
                student_id: student.id,
                student_name: student.full_name,
                course_name: selectedType.name,
                completion_date: new Date().toISOString().split('T')[0],
                grade: studentScores[student.id]?.grade,
                scores: studentScores[student.id] || {},
                external_id: studentScores[student.id]?.external_id,
                exam_date: studentScores[student.id]?.exam_date,
            }));

            const response = await fetch(`${API_URL}/api/admin/certificates/bulk`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ certificates })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                // API returns { data: { success: [...], failed: [...] } }
                const issuedCerts = data.data?.success || data.certificates || [];
                console.log('Issued certificates:', issuedCerts);
                setIssuedCertificates(issuedCerts);
                setShowSuccess(true);
                onSuccess?.(data);
            } else {
                const error = data;
                console.error('API Error:', error);
                alert(error.message || 'Có lỗi xảy ra khi cấp chứng chỉ');
            }
        } catch (error) {
            console.error('Error issuing certificates:', error);
            alert('Có lỗi xảy ra khi cấp chứng chỉ');
        }
        setIsSubmitting(false);
    };

    const handleClose = () => {
        setCurrentStep(1);
        setSelectedType(null);
        setSelectedStudents([]);
        setStudentScores({});
        setShowSuccess(false);
        setIssuedCertificates([]);
        onClose();
    };

    if (!isOpen) return null;

    // Handle view certificates after success
    const handleViewCertificates = () => {
        handleClose();
        // Navigate to certificates management page
        window.location.href = '/admin/certificates/list';
    };

    return (
        <>
            {/* Success Modal */}
            {showSuccess && (
                <SuccessModal
                    issuedCertificates={issuedCertificates}
                    onClose={handleClose}
                    onViewCertificates={handleViewCertificates}
                />
            )}

            {/* Main Wizard */}
            {!showSuccess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <div className="flex items-center gap-3">
                                <Award className="h-6 w-6" />
                                <h2 className="text-xl font-semibold">Cấp chứng chỉ</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="px-6 pt-6">
                            <StepIndicator steps={STEPS} currentStep={currentStep} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {currentStep === 1 && (
                                <Step1CertificateType
                                    certificateTypes={certificateTypes}
                                    selectedType={selectedType}
                                    onSelectType={setSelectedType}
                                    loading={loading}
                                />
                            )}

                            {currentStep === 2 && (
                                <Step2StudentSelection
                                    students={students}
                                    selectedStudents={selectedStudents}
                                    onSelectStudents={setSelectedStudents}
                                    classes={classes}
                                    loading={loading}
                                />
                            )}

                            {currentStep === 3 && (
                                <Step3ScoreInput
                                    certificateType={selectedType}
                                    selectedStudents={selectedStudents}
                                    studentScores={studentScores}
                                    onUpdateScores={setStudentScores}
                                />
                            )}

                            {currentStep === 4 && (
                                <Step4Preview
                                    certificateType={selectedType}
                                    selectedStudents={selectedStudents}
                                    studentScores={studentScores}
                                    centerInfo={centerInfo}
                                    onConfirm={handleSubmit}
                                    isSubmitting={isSubmitting}
                                    selectedTemplate={selectedTemplate}
                                    onTemplateChange={setSelectedTemplate}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Quay lại
                            </Button>

                            <div className="text-sm text-slate-500">
                                Bước {currentStep} / {STEPS.length}
                            </div>

                            {currentStep < 4 ? (
                                <Button
                                    onClick={nextStep}
                                    disabled={!canProceed()}
                                >
                                    Tiếp tục
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <div /> // Placeholder - submit button is in Step4
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CertificateIssuanceWizard;
