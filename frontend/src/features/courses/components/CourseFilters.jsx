/**
 * CourseFilters Component - Thanh tìm kiếm và lọc nâng cao
 * Updated: Added dynamic price presets, improved styling
 */

import { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X, DollarSign } from 'lucide-react';
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

// Default price ranges
const DEFAULT_PRICE_RANGES = [
    { label: 'Tất cả mức giá', min: '', max: '' },
    { label: 'Dưới 5 triệu', min: 0, max: 5000000 },
    { label: '5 - 8 triệu', min: 5000000, max: 8000000 },
    { label: '8 - 10 triệu', min: 8000000, max: 10000000 },
    { label: 'Trên 10 triệu', min: 10000000, max: '' },
];

// Styled Select Component
function StyledSelect({ value, onChange, options, icon: Icon, className = '' }) {
    return (
        <div className="relative">
            {Icon && (
                <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            )}
            <select
                value={value}
                onChange={onChange}
                className={`
                    h-10 rounded-lg border border-input bg-card text-sm 
                    font-medium text-foreground
                    shadow-sm transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    hover:border-primary/50 hover:bg-accent/50
                    appearance-none cursor-pointer
                    ${Icon ? 'pl-10 pr-8' : 'px-3 pr-8'}
                    ${className}
                `}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                }}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

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
    courses = [] // Accept courses for dynamic price extraction
}) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedPricePreset, setSelectedPricePreset] = useState('');

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
        const midPrice = Math.floor((minPrice + maxPrice) / 2);

        // Create smart ranges based on actual data
        const ranges = [
            { label: 'Tất cả mức giá', min: '', max: '' },
        ];

        // Add unique price points as quick filters
        const uniquePrices = [...new Set(prices)];
        if (uniquePrices.length <= 5) {
            // If few unique prices, show them directly
            uniquePrices.forEach(price => {
                ranges.push({
                    label: formatPrice(price),
                    min: price,
                    max: price
                });
            });
        } else {
            // Generate ranges
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
    const handlePricePresetChange = (e) => {
        const presetIndex = e.target.value;
        setSelectedPricePreset(presetIndex);

        if (presetIndex === '' || presetIndex === '0') {
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
                            className="pl-10 bg-card"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <StyledSelect
                        value={statusFilter}
                        onChange={(e) => onStatusChange?.(e.target.value)}
                        options={STATUS_OPTIONS}
                        icon={Filter}
                    />

                    {/* Sort */}
                    <StyledSelect
                        value={sortBy}
                        onChange={(e) => onSortChange?.(e.target.value)}
                        options={SORT_OPTIONS}
                        icon={ArrowUpDown}
                    />

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
                                setSelectedPricePreset('');
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
                <div className="p-4 bg-muted/50 rounded-xl border animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Danh mục</label>
                            <StyledSelect
                                value={categoryFilter}
                                onChange={(e) => onCategoryChange?.(e.target.value)}
                                options={[
                                    { value: '', label: 'Tất cả danh mục' },
                                    ...CATEGORIES
                                ]}
                                className="w-full"
                            />
                        </div>

                        {/* Price Range Preset */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Mức học phí</label>
                            <StyledSelect
                                value={selectedPricePreset}
                                onChange={handlePricePresetChange}
                                options={priceRanges.map((range, idx) => ({
                                    value: idx.toString(),
                                    label: range.label
                                }))}
                                icon={DollarSign}
                                className="w-full"
                            />
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
                                        setSelectedPricePreset(''); // Clear preset when manual input
                                        onPriceRangeChange?.({ ...priceRange, min: e.target.value });
                                    }}
                                    className="pl-10 bg-card"
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
                                        setSelectedPricePreset(''); // Clear preset when manual input
                                        onPriceRangeChange?.({ ...priceRange, max: e.target.value });
                                    }}
                                    className="pl-10 bg-card"
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
