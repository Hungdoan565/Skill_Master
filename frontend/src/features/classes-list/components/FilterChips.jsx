/**
 * FilterChips Component
 * Display active filters as removable chips
 */

import { X, Filter } from 'lucide-react';

export function FilterChips({
    filters,
    onRemoveFilter,
    onClearAll,
    courses = [],
    teachers = [],
    centers = [],
    statusConfig = {}
}) {
    // Helper to get display name for filter values
    const getDisplayValue = (key, value) => {
        switch (key) {
            case 'courseId': {
                const course = courses.find(c => c.id === value);
                return course ? `Khóa: ${course.title}` : value;
            }
            case 'teacherId': {
                const teacher = teachers.find(t => t.id === value);
                return teacher ? `GV: ${teacher.full_name}` : value;
            }
            case 'centerId': {
                const center = centers.find(c => c.id === value);
                return center ? `TT: ${center.name}` : value;
            }
            case 'status': {
                return statusConfig[value]?.label || value;
            }
            case 'capacity': {
                const labels = {
                    available: 'Còn chỗ',
                    full: 'Đã đầy',
                    nearly_full: 'Gần đầy',
                    low: 'Ít học viên'
                };
                return labels[value] || value;
            }
            case 'dateStart':
                return `Từ: ${formatDate(value)}`;
            case 'dateEnd':
                return `Đến: ${formatDate(value)}`;
            default:
                return value;
        }
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Get active filters (exclude search and 'all' values)
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (!value) return false;
        if (key === 'search') return false; // Search has its own input
        if (key === 'capacity' && value === 'all') return false;
        return true;
    });

    if (activeFilters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 py-2">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Filter className="w-4 h-4" />
                <span>Đang lọc:</span>
            </div>

            {activeFilters.map(([key, value]) => (
                <FilterChip
                    key={key}
                    label={getDisplayValue(key, value)}
                    onRemove={() => onRemoveFilter(key)}
                />
            ))}

            {activeFilters.length > 1 && (
                <button
                    onClick={onClearAll}
                    className="text-sm text-red-600 hover:text-red-700 font-medium ml-2 hover:underline"
                >
                    Xóa tất cả
                </button>
            )}
        </div>
    );
}

function FilterChip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-200">
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </span>
    );
}

export default FilterChips;
