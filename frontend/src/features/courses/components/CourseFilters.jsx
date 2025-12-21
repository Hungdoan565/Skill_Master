/**
 * CourseFilters Component - Thanh tìm kiếm và lọc nâng cao
 */

import { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '../utils';

// Status options for dropdown
const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang tuyển sinh' },
    { value: 'inactive', label: 'Tạm ngưng' },
    { value: 'draft', label: 'Nháp' },
];

// Sort options
const SORT_OPTIONS = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'name_asc', label: 'Tên A-Z' },
    { value: 'name_desc', label: 'Tên Z-A' },
    { value: 'price_asc', label: 'Giá thấp → cao' },
    { value: 'price_desc', label: 'Giá cao → thấp' },
    { value: 'sessions_asc', label: 'Ít buổi nhất' },
    { value: 'sessions_desc', label: 'Nhiều buổi nhất' },
];

export function CourseFilters({
    searchTerm,
    onSearchChange,
    statusFilter = '',
    onStatusChange,
    categoryFilter = '',
    onCategoryChange,
    sortBy = 'newest',
    onSortChange,
    priceRange = { min: '', max: '' },
    onPriceRangeChange,
    totalCount,
    onClearFilters
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const hasActiveFilters = statusFilter || categoryFilter || priceRange.min || priceRange.max;

    return (
        <div className="space-y-4">
            {/* Main Filters Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Tìm theo tên hoặc mã khóa học..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange?.(e.target.value)}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange?.(e.target.value)}
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <Button
                        variant={showAdvanced ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="gap-1"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Lọc nâng cao
                        {hasActiveFilters && (
                            <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </Button>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Xóa bộ lọc
                        </Button>
                    )}
                </div>

                <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Hiển thị: <strong>{totalCount}</strong> khóa học
                </p>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvanced && (
                <div className="p-4 bg-slate-50 rounded-lg border animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Category Filter */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Danh mục</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => onCategoryChange?.(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Tất cả danh mục</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Học phí từ</label>
                            <Input
                                type="number"
                                placeholder="VD: 5000000"
                                value={priceRange.min}
                                onChange={(e) => onPriceRangeChange?.({ ...priceRange, min: e.target.value })}
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Học phí đến</label>
                            <Input
                                type="number"
                                placeholder="VD: 15000000"
                                value={priceRange.max}
                                onChange={(e) => onPriceRangeChange?.({ ...priceRange, max: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CourseFilters;
