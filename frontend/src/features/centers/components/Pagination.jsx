/**
 * Pagination Component for Centers
 * Hiển thị phân trang với style consistent
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pagination({
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 12,
    onPageChange,
    disabled = false,
    showSummary = true
}) {
    // Calculate display range
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);

            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handlePageChange = (page) => {
        if (page !== currentPage && page >= 1 && page <= totalPages && !disabled) {
            onPageChange?.(page);
        }
    };

    if (totalPages <= 1 && !showSummary) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            {/* Summary */}
            {showSummary && (
                <p className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> trong số <span className="font-medium">{totalItems}</span> kết quả
                </p>
            )}

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    {/* First page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(1)}
                        disabled={disabled || currentPage === 1}
                        className="h-8 w-8 hidden sm:flex"
                        title="Trang đầu"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Previous page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={disabled || currentPage === 1}
                        className="h-8 w-8"
                        title="Trang trước"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1 mx-1">
                        {getPageNumbers().map((page, idx) => (
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                                    ...
                                </span>
                            ) : (
                                <Button
                                    key={page}
                                    variant={page === currentPage ? 'default' : 'outline'}
                                    size="icon"
                                    onClick={() => handlePageChange(page)}
                                    disabled={disabled}
                                    className={`h-8 w-8 ${page === currentPage
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            : 'hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </Button>
                            )
                        ))}
                    </div>

                    {/* Next page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={disabled || currentPage === totalPages}
                        className="h-8 w-8"
                        title="Trang sau"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last page */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={disabled || currentPage === totalPages}
                        className="h-8 w-8 hidden sm:flex"
                        title="Trang cuối"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default Pagination;
