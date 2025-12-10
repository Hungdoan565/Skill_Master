/**
 * AdvancedFiltersDrawer Component
 * Slide-in panel with all advanced filters for classes
 */

import { useState, useEffect } from 'react';
import {
    X,
    Filter,
    RotateCcw,
    Check,
    Calendar,
    Users,
    BookOpen,
    Building2,
    User,
    ChevronDown,
    ChevronUp,
    Save,
    Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Capacity options
const CAPACITY_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'available', label: 'Còn chỗ' },
    { value: 'full', label: 'Đã đầy' },
    { value: 'nearly_full', label: 'Gần đầy (>80%)' },
    { value: 'low', label: 'Ít học viên (<30%)' }
];

// Filter sections for collapse/expand
const FILTER_SECTIONS = {
    basic: 'Lọc cơ bản',
    advanced: 'Lọc nâng cao',
    dateRange: 'Khoảng thời gian'
};

export function AdvancedFiltersDrawer({
    isOpen,
    onClose,
    filters,
    onApplyFilters,
    onResetFilters,
    courses = [],
    teachers = [],
    centers = [],
    savedFilters = [],
    onSaveFilter,
    onLoadFilter,
    onDeleteFilter,
    showCenterFilter = true // Only show for SUPER_ADMIN
}) {
    // Local state for filters (before applying)
    const [localFilters, setLocalFilters] = useState(filters);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        advanced: true,
        dateRange: false
    });
    const [saveFilterName, setSaveFilterName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    // Sync local filters when drawer opens
    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    // Update local filter value
    const updateLocalFilter = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    // Toggle section expand/collapse
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Apply filters
    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    // Reset all filters
    const handleReset = () => {
        const resetFilters = {
            search: '',
            status: '',
            courseId: '',
            teacherId: '',
            centerId: '',
            dateStart: '',
            dateEnd: '',
            capacity: 'all'
        };
        setLocalFilters(resetFilters);
        onResetFilters();
    };

    // Save current filter preset
    const handleSaveFilter = () => {
        if (saveFilterName.trim()) {
            onSaveFilter?.(saveFilterName.trim(), localFilters);
            setSaveFilterName('');
            setShowSaveInput(false);
        }
    };

    // Count active filters
    const getActiveFilterCount = () => {
        let count = 0;
        if (localFilters.courseId) count++;
        if (localFilters.teacherId) count++;
        if (localFilters.centerId) count++;
        if (localFilters.dateStart) count++;
        if (localFilters.dateEnd) count++;
        if (localFilters.capacity && localFilters.capacity !== 'all') count++;
        return count;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-semibold">Bộ lọc nâng cao</h2>
                        {getActiveFilterCount() > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                                {getActiveFilterCount()}
                            </span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Saved Filters Quick Access */}
                {savedFilters.length > 0 && (
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-slate-700">Bộ lọc đã lưu</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {savedFilters.map((sf, index) => (
                                <button
                                    key={index}
                                    onClick={() => onLoadFilter?.(sf.filters)}
                                    className="group flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-full hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                >
                                    <span>{sf.name}</span>
                                    <X
                                        className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteFilter?.(index);
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Basic Filters Section */}
                    <FilterSection
                        title={FILTER_SECTIONS.basic}
                        icon={<BookOpen className="w-4 h-4" />}
                        isExpanded={expandedSections.basic}
                        onToggle={() => toggleSection('basic')}
                    >
                        {/* Course Filter */}
                        <FilterField label="Khóa học" icon={<BookOpen className="w-4 h-4" />}>
                            <select
                                value={localFilters.courseId}
                                onChange={(e) => updateLocalFilter('courseId', e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Tất cả khóa học</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.title} ({course.code})
                                    </option>
                                ))}
                            </select>
                        </FilterField>

                        {/* Teacher Filter */}
                        <FilterField label="Giáo viên" icon={<User className="w-4 h-4" />}>
                            <select
                                value={localFilters.teacherId}
                                onChange={(e) => updateLocalFilter('teacherId', e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Tất cả giáo viên</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.full_name}
                                    </option>
                                ))}
                            </select>
                        </FilterField>

                        {/* Center Filter - Only for SUPER_ADMIN */}
                        {showCenterFilter && (
                            <FilterField label="Trung tâm" icon={<Building2 className="w-4 h-4" />}>
                                <select
                                    value={localFilters.centerId}
                                    onChange={(e) => updateLocalFilter('centerId', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Tất cả trung tâm</option>
                                    {centers.map(center => (
                                        <option key={center.id} value={center.id}>
                                            {center.name}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>
                        )}
                    </FilterSection>

                    {/* Advanced Filters Section */}
                    <FilterSection
                        title={FILTER_SECTIONS.advanced}
                        icon={<Users className="w-4 h-4" />}
                        isExpanded={expandedSections.advanced}
                        onToggle={() => toggleSection('advanced')}
                    >
                        {/* Capacity Filter */}
                        <FilterField label="Sức chứa" icon={<Users className="w-4 h-4" />}>
                            <div className="grid grid-cols-2 gap-2">
                                {CAPACITY_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => updateLocalFilter('capacity', option.value)}
                                        className={`
                      px-3 py-2 text-sm rounded-lg border transition-all
                      ${localFilters.capacity === option.value
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }
                    `}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </FilterField>
                    </FilterSection>

                    {/* Date Range Section */}
                    <FilterSection
                        title={FILTER_SECTIONS.dateRange}
                        icon={<Calendar className="w-4 h-4" />}
                        isExpanded={expandedSections.dateRange}
                        onToggle={() => toggleSection('dateRange')}
                    >
                        {/* Start Date */}
                        <FilterField label="Ngày bắt đầu từ">
                            <Input
                                type="date"
                                value={localFilters.dateStart}
                                onChange={(e) => updateLocalFilter('dateStart', e.target.value)}
                                className="w-full"
                            />
                        </FilterField>

                        {/* End Date */}
                        <FilterField label="Ngày bắt đầu đến">
                            <Input
                                type="date"
                                value={localFilters.dateEnd}
                                onChange={(e) => updateLocalFilter('dateEnd', e.target.value)}
                                className="w-full"
                            />
                        </FilterField>

                        {/* Quick Date Presets */}
                        <div className="flex flex-wrap gap-2">
                            <QuickDateButton
                                label="Tuần này"
                                onClick={() => {
                                    const today = new Date();
                                    const startOfWeek = new Date(today);
                                    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                                    const endOfWeek = new Date(startOfWeek);
                                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                                    updateLocalFilter('dateStart', startOfWeek.toISOString().split('T')[0]);
                                    updateLocalFilter('dateEnd', endOfWeek.toISOString().split('T')[0]);
                                }}
                            />
                            <QuickDateButton
                                label="Tháng này"
                                onClick={() => {
                                    const today = new Date();
                                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                    updateLocalFilter('dateStart', startOfMonth.toISOString().split('T')[0]);
                                    updateLocalFilter('dateEnd', endOfMonth.toISOString().split('T')[0]);
                                }}
                            />
                            <QuickDateButton
                                label="Quý này"
                                onClick={() => {
                                    const today = new Date();
                                    const quarter = Math.floor(today.getMonth() / 3);
                                    const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
                                    const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0);
                                    updateLocalFilter('dateStart', startOfQuarter.toISOString().split('T')[0]);
                                    updateLocalFilter('dateEnd', endOfQuarter.toISOString().split('T')[0]);
                                }}
                            />
                        </div>
                    </FilterSection>

                    {/* Save Filter Section */}
                    <div className="border-t border-slate-200 pt-4">
                        {showSaveInput ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Tên bộ lọc..."
                                    value={saveFilterName}
                                    onChange={(e) => setSaveFilterName(e.target.value)}
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                                />
                                <Button size="sm" onClick={handleSaveFilter}>
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setShowSaveInput(false);
                                        setSaveFilterName('');
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowSaveInput(true)}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Lưu bộ lọc hiện tại
                            </Button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleReset}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Đặt lại
                        </Button>
                        <Button className="flex-1" onClick={handleApply}>
                            <Check className="w-4 h-4 mr-2" />
                            Áp dụng
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

// Sub-components
function FilterSection({ title, icon, isExpanded, onToggle, children }) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2 text-slate-700">
                    {icon}
                    <span className="font-medium">{title}</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </button>
            {isExpanded && (
                <div className="p-4 space-y-4 bg-white">
                    {children}
                </div>
            )}
        </div>
    );
}

function FilterField({ label, icon, children }) {
    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {icon}
                {label}
            </Label>
            {children}
        </div>
    );
}

function QuickDateButton({ label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
        >
            {label}
        </button>
    );
}

export default AdvancedFiltersDrawer;
