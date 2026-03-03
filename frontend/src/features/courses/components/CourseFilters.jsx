/**
 * CourseFilters Component - Thanh tìm kiếm và lọc nâng cao
 * Updated: Migrated to Shadcn Select for Dark Mode support
 */

import { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CATEGORIES } from '../utils';

// Status options for dropdown
const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả trạng thái' },
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

// Default price ranges
const DEFAULT_PRICE_RANGES = [
    { label: 'Tất cả mức giá', min: '', max: '' },
    { label: 'Dưới 5 triệu', min: 0, max: 5000000 },
    { label: '5 - 8 triệu', min: 5000000, max: 8000000 },
    { label: '8 - 10 triệu', min: 8000000, max: 10000000 },
    { label: 'Trên 10 triệu', min: 10000000, max: '' },
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
    onClearFilters,
    courses = []
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedPricePreset, setSelectedPricePreset] = useState('0');

    // Generate dynamic price ranges from actual course data
    const priceRanges = useMemo(() => {
        if (!courses || courses.length === 0) return DEFAULT_PRICE_RANGES;

        const prices = courses
            .map(c => parseInt(c.price) || 0)
            .filter(p => p > 0)
            .sort((a, b) => a - b);

        if (prices.length === 0) return DEFAULT_PRICE_RANGES;

        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];

        // Create smart ranges based on actual data
        const ranges = [
            { label: 'Tất cả mức giá', min: '', max: '' },
        ];

        // Add unique price points as quick filters
        const uniquePrices = [...new Set(prices)];
        if (uniquePrices.length <= 5) {
            uniquePrices.forEach(price => {
                ranges.push({
                    label: formatPrice(price),
                    min: price,
                    max: price
                });
            });
        } else {
            if (minPrice < 5000000) {
                ranges.push({ label: 'Dưới 5 triệu', min: 0, max: 5000000 });
            }
            if (minPrice < 8000000 && maxPrice > 5000000) {
                ranges.push({ label: '5 - 8 triệu', min: 5000000, max: 8000000 });
            }
            if (minPrice < 10000000 && maxPrice > 8000000) {
                ranges.push({ label: '8 - 10 triệu', min: 8000000, max: 10000000 });
            }
            if (maxPrice > 10000000) {
                ranges.push({ label: 'Trên 10 triệu', min: 10000000, max: '' });
            }
        }

        return ranges;
    }, [courses]);

    const hasActiveFilters = statusFilter || categoryFilter || priceRange.min || priceRange.max;

    // Format price for display
    function formatPrice(price) {
        if (!price && price !== 0) return '';
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    }

    // Handle price preset change
    const handlePricePresetChange = (presetIndex) => {
        setSelectedPricePreset(presetIndex);

        if (presetIndex === '0') {
            onPriceRangeChange?.({ min: '', max: '' });
        } else {
            const preset = priceRanges[parseInt(presetIndex)];
            if (preset) {
                onPriceRangeChange?.({
                    min: preset.min?.toString() || '',
                    max: preset.max?.toString() || ''
                });
            }
        }
    };

    // Handle status change - convert 'all' to empty string for filter logic
    const handleStatusChange = (value) => {
        onStatusChange?.(value === 'all' ? '' : value);
    };

    // Get display value for status - convert empty to 'all' for Select
    const statusDisplayValue = statusFilter || 'all';

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
                            className="pl-10 bg-white"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Select value={statusDisplayValue} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <Select value={sortBy} onValueChange={(v) => onSortChange?.(v)}>
                            <SelectTrigger className="w-[180px]">
                                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Sắp xếp" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            onClick={() => {
                                setSelectedPricePreset('0');
                                onClearFilters?.();
                            }}
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
                <div className="p-4 bg-slate-50 rounded-xl border animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Category Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Danh mục</label>
                            <div className="relative">
                                <Select
                                    value={categoryFilter || 'all'}
                                    onValueChange={(v) => onCategoryChange?.(v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tất cả danh mục" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả danh mục</SelectItem>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Price Range Preset */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Mức học phí</label>
                            <div className="relative">
                                <Select value={selectedPricePreset} onValueChange={handlePricePresetChange}>
                                    <SelectTrigger className="w-full">
                                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Chọn mức giá" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priceRanges.map((range, idx) => (
                                            <SelectItem key={idx} value={idx.toString()}>
                                                {range.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Custom Price Min */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Học phí từ</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="VD: 5000000"
                                    value={priceRange.min}
                                    onChange={(e) => {
                                        setSelectedPricePreset('0');
                                        onPriceRangeChange?.({ ...priceRange, min: e.target.value });
                                    }}
                                    className="pl-10 bg-white"
                                />
                            </div>
                        </div>

                        {/* Custom Price Max */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Học phí đến</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="VD: 15000000"
                                    value={priceRange.max}
                                    onChange={(e) => {
                                        setSelectedPricePreset('0');
                                        onPriceRangeChange?.({ ...priceRange, max: e.target.value });
                                    }}
                                    className="pl-10 bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CourseFilters;
