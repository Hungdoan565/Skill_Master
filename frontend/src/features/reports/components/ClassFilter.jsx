/**
 * ClassFilter Component - Reusable class selector for reports
 * 
 * Features:
 * - Search by class name
 * - Filter by course
 * - Show class status and student count
 * - Support pre-selection via URL params
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ChevronDown, GraduationCap, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ClassFilter({
    classes = [],
    courses = [],
    value,
    onChange,
    placeholder = 'Tất cả lớp học',
    showDetails = true,
    className,
    disabled = false
}) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('');

    // Get classId from URL params on mount
    useEffect(() => {
        const classIdFromUrl = searchParams.get('classId');
        if (classIdFromUrl && !value && classes.length > 0) {
            const foundClass = classes.find(c => c.id === classIdFromUrl);
            if (foundClass) {
                onChange?.(classIdFromUrl);
            }
        }
    }, [searchParams, classes, value, onChange]);

    // Filter classes based on search and course
    const filteredClasses = useMemo(() => {
        return classes.filter(cls => {
            const matchesSearch = !search ||
                cls.name?.toLowerCase().includes(search.toLowerCase()) ||
                cls.course_title?.toLowerCase().includes(search.toLowerCase());
            const matchesCourse = !courseFilter || cls.course_id === courseFilter;
            return matchesSearch && matchesCourse;
        });
    }, [classes, search, courseFilter]);

    // Get selected class details
    const selectedClass = useMemo(() => {
        if (!value) return null;
        return classes.find(c => c.id === value);
    }, [value, classes]);

    // Handle selection
    const handleSelect = (classId) => {
        onChange?.(classId);
        setIsOpen(false);
        setSearch('');

        // Update URL params
        const newParams = new URLSearchParams(searchParams);
        if (classId) {
            newParams.set('classId', classId);
        } else {
            newParams.delete('classId');
        }
        setSearchParams(newParams, { replace: true });
    };

    // Clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        handleSelect('');
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'upcoming': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Đang học';
            case 'upcoming': return 'Sắp mở';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className={cn('relative', className)}>
            <Label className="text-xs text-gray-500 mb-1 block">Lớp học</Label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'flex items-center justify-between w-full min-w-[200px] px-3 py-2',
                    'rounded-md border border-gray-300 bg-white text-sm',
                    'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    'transition-colors',
                    disabled && 'opacity-50 cursor-not-allowed',
                    isOpen && 'border-blue-500 ring-2 ring-blue-500'
                )}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GraduationCap className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {selectedClass ? (
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate font-medium">{selectedClass.name}</span>
                            {showDetails && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                    {selectedClass.student_count || 0} HV
                                </Badge>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {value && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
                            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                        >
                            <X className="h-3 w-3 text-gray-400" />
                        </span>
                    )}
                    <ChevronDown className={cn(
                        'h-4 w-4 text-gray-400 transition-transform',
                        isOpen && 'rotate-180'
                    )} />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute z-50 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        {/* Search & Course Filter */}
                        <div className="p-3 border-b space-y-2 bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm lớp học..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9"
                                    autoFocus
                                />
                            </div>
                            {courses.length > 0 && (
                                <select
                                    value={courseFilter}
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border rounded-md"
                                >
                                    <option value="">Tất cả khóa học</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Options List */}
                        <div className="max-h-64 overflow-y-auto">
                            {/* All Classes Option */}
                            <button
                                onClick={() => handleSelect('')}
                                className={cn(
                                    'w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50',
                                    'flex items-center justify-between',
                                    !value && 'bg-blue-50'
                                )}
                            >
                                <span className="text-gray-600">Tất cả lớp học</span>
                                {!value && <Check className="h-4 w-4 text-blue-600" />}
                            </button>

                            {/* Class Items */}
                            {filteredClasses.length === 0 ? (
                                <div className="px-3 py-8 text-center text-gray-500 text-sm">
                                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>Không tìm thấy lớp học</p>
                                </div>
                            ) : (
                                filteredClasses.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleSelect(cls.id)}
                                        className={cn(
                                            'w-full px-3 py-2.5 text-left hover:bg-gray-50',
                                            'flex items-center justify-between gap-2',
                                            value === cls.id && 'bg-blue-50'
                                        )}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm truncate">
                                                    {cls.name}
                                                </span>
                                                <span className={cn(
                                                    'px-1.5 py-0.5 text-xs rounded',
                                                    getStatusColor(cls.status)
                                                )}>
                                                    {getStatusLabel(cls.status)}
                                                </span>
                                            </div>
                                            {showDetails && (
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span>{cls.course_title || 'Chưa có khóa'}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {cls.student_count || 0} học viên
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {value === cls.id && (
                                            <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {filteredClasses.length > 0 && (
                            <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
                                {filteredClasses.length} lớp học
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
