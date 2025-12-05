/**
 * CenterFilters Component - Bộ lọc và tìm kiếm trung tâm
 */

import React from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_OPTIONS } from '../utils';

export function CenterFilters({
    filters,
    onFilterChange,
    onClearFilters,
    totalResults = 0
}) {
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    const handleSearchChange = (e) => {
        onFilterChange({ ...filters, search: e.target.value });
    };

    const handleStatusChange = (status) => {
        onFilterChange({ ...filters, status });
    };

    const activeFiltersCount = [
        filters.search,
        filters.status && filters.status !== 'all'
    ].filter(Boolean).length;

    return (
        <div className="space-y-4">
            {/* Main search bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={filters.search || ''}
                        onChange={handleSearchChange}
                        placeholder="Tìm theo tên, mã, địa chỉ..."
                        className="pl-10 pr-10"
                    />
                    {filters.search && (
                        <button
                            onClick={() => onFilterChange({ ...filters, search: '' })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="h-4 w-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Status filter buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleStatusChange('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!filters.status || filters.status === 'all'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Tất cả
                    </button>
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleStatusChange(opt.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filters.status === opt.value
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Advanced filter toggle */}
                <Button
                    variant="outline"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`gap-2 ${showAdvanced ? 'bg-indigo-50 border-indigo-200' : ''}`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Lọc nâng cao
                    {activeFiltersCount > 0 && (
                        <Badge className="ml-1 bg-indigo-600">{activeFiltersCount}</Badge>
                    )}
                </Button>
            </div>

            {/* Advanced filters panel */}
            {showAdvanced && (
                <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-700">Bộ lọc nâng cao</h4>
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearFilters}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Có thể thêm các filter khác ở đây */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sắp xếp theo
                            </label>
                            <select
                                value={filters.sortBy || 'name'}
                                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="name">Tên A-Z</option>
                                <option value="-name">Tên Z-A</option>
                                <option value="-created_at">Mới nhất</option>
                                <option value="created_at">Cũ nhất</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Có quản lý
                            </label>
                            <select
                                value={filters.hasManager || 'all'}
                                onChange={(e) => onFilterChange({ ...filters, hasManager: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">Tất cả</option>
                                <option value="yes">Có quản lý</option>
                                <option value="no">Chưa có quản lý</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                    Tìm thấy <strong className="text-gray-700">{totalResults}</strong> trung tâm
                </span>
                {activeFiltersCount > 0 && (
                    <button
                        onClick={onClearFilters}
                        className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <X className="h-3 w-3" />
                        Xóa bộ lọc
                    </button>
                )}
            </div>
        </div>
    );
}

export default CenterFilters;
