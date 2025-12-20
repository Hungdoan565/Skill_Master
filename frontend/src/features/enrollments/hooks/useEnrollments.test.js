/**
 * Integration Tests for Pagination
 * Test pagination logic đầy đủ
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Mock data generator
 */
const generateMockEnrollments = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `enrollment-${i + 1}`,
        student_id: `student-${i + 1}`,
        class_id: `class-${i % 5 + 1}`,
        tuition_fee: 5000000,
        discount_amount: 0,
        paid_amount: Math.random() > 0.5 ? 5000000 : 0,
        status: ['active', 'completed', 'dropped'][i % 3],
        enrolled_at: new Date(2025, 0, i + 1).toISOString(),
        student: {
            full_name: `Student ${i + 1}`,
            email: `student${i + 1}@example.com`
        },
        class: {
            name: `Class ${i % 5 + 1}`,
            teacher: { full_name: `Teacher ${i % 3 + 1}` }
        }
    }));
};

/**
 * Pagination calculator
 */
const calculatePagination = (totalItems, page, limit) => {
    return {
        total: totalItems,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalItems / limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(totalItems / limit),
        hasPreviousPage: parseInt(page) > 1
    };
};

/**
 * Paginate data
 */
const paginateData = (items, page, limit) => {
    const pagination = calculatePagination(items.length, page, limit);
    const start = pagination.offset;
    const end = start + parseInt(limit);
    const data = items.slice(start, end);

    return {
        success: true,
        data,
        pagination
    };
};

describe('Pagination Integration Tests', () => {
    let mockEnrollments;

    beforeEach(() => {
        mockEnrollments = generateMockEnrollments(150);
    });

    // ==================== Pagination Calculation ====================
    describe('Pagination Calculation', () => {
        it('should calculate pagination correctly with 150 items and limit 20', () => {
            const pagination = calculatePagination(150, 1, 20);
            expect(pagination.total).toBe(150);
            expect(pagination.totalPages).toBe(8);
            expect(pagination.offset).toBe(0);
            expect(pagination.hasNextPage).toBe(true);
            expect(pagination.hasPreviousPage).toBe(false);
        });

        it('should calculate pagination for middle page', () => {
            const pagination = calculatePagination(150, 4, 20);
            expect(pagination.page).toBe(4);
            expect(pagination.offset).toBe(60);
            expect(pagination.hasNextPage).toBe(true);
            expect(pagination.hasPreviousPage).toBe(true);
        });

        it('should calculate pagination for last page', () => {
            const pagination = calculatePagination(150, 8, 20);
            expect(pagination.page).toBe(8);
            expect(pagination.offset).toBe(140);
            expect(pagination.hasNextPage).toBe(false);
            expect(pagination.hasPreviousPage).toBe(true);
        });

        it('should handle partial last page', () => {
            const pagination = calculatePagination(155, 8, 20);
            expect(pagination.total).toBe(155);
            expect(pagination.totalPages).toBe(8);
            expect(pagination.offset).toBe(140);
        });

        it('should handle single page scenario', () => {
            const pagination = calculatePagination(15, 1, 20);
            expect(pagination.totalPages).toBe(1);
            expect(pagination.hasNextPage).toBe(false);
            expect(pagination.hasPreviousPage).toBe(false);
        });

        it('should handle zero items', () => {
            const pagination = calculatePagination(0, 1, 20);
            expect(pagination.totalPages).toBe(0);
            expect(pagination.hasNextPage).toBe(false);
        });
    });

    // ==================== Data Pagination ====================
    describe('Data Pagination', () => {
        it('should paginate data correctly for first page', () => {
            const result = paginateData(mockEnrollments, 1, 20);
            expect(result.data.length).toBe(20);
            expect(result.data[0].id).toBe('enrollment-1');
            expect(result.data[19].id).toBe('enrollment-20');
        });

        it('should paginate data correctly for middle page', () => {
            const result = paginateData(mockEnrollments, 4, 20);
            expect(result.data.length).toBe(20);
            expect(result.data[0].id).toBe('enrollment-61');
            expect(result.data[19].id).toBe('enrollment-80');
        });

        it('should paginate data correctly for last page', () => {
            const result = paginateData(mockEnrollments, 8, 20);
            expect(result.data.length).toBe(10); // 150 - 140 = 10
            expect(result.data[0].id).toBe('enrollment-141');
            expect(result.data[9].id).toBe('enrollment-150');
        });

        it('should include complete pagination info', () => {
            const result = paginateData(mockEnrollments, 1, 20);
            expect(result.pagination).toHaveProperty('total');
            expect(result.pagination).toHaveProperty('page');
            expect(result.pagination).toHaveProperty('limit');
            expect(result.pagination).toHaveProperty('totalPages');
            expect(result.pagination).toHaveProperty('offset');
            expect(result.pagination).toHaveProperty('hasNextPage');
            expect(result.pagination).toHaveProperty('hasPreviousPage');
        });

        it('should maintain data integrity across pages', () => {
            const allItems = [];
            for (let page = 1; page <= 8; page++) {
                const result = paginateData(mockEnrollments, page, 20);
                allItems.push(...result.data);
            }
            expect(allItems.length).toBe(150);
            expect(allItems[0].id).toBe('enrollment-1');
            expect(allItems[149].id).toBe('enrollment-150');
        });
    });

    // ==================== Filter + Pagination ====================
    describe('Filter + Pagination', () => {
        it('should paginate filtered data', () => {
            const filtered = mockEnrollments.filter(e => e.status === 'active');
            const result = paginateData(filtered, 1, 20);

            expect(result.data.every(e => e.status === 'active')).toBe(true);
            expect(result.pagination.total).toBe(filtered.length);
        });

        it('should handle empty filter results', () => {
            const filtered = mockEnrollments.filter(e => e.status === 'nonexistent');
            const result = paginateData(filtered, 1, 20);

            expect(result.data.length).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
        });

        it('should paginate filtered data with correct totals', () => {
            const filtered = mockEnrollments.filter(e => e.paid_amount === 5000000);
            const pagination = calculatePagination(filtered.length, 1, 20);

            expect(pagination.total).toBeLessThanOrEqual(150);
            expect(pagination.totalPages).toBeGreaterThan(0);
        });
    });

    // ==================== Edge Cases ====================
    describe('Edge Cases', () => {
        it('should handle limit larger than total items', () => {
            const result = paginateData(mockEnrollments, 1, 1000);
            expect(result.data.length).toBe(150);
            expect(result.pagination.totalPages).toBe(1);
        });

        it('should handle page number greater than total pages', () => {
            const pagination = calculatePagination(150, 100, 20);
            expect(pagination.offset).toBe(1980);
        });

        it('should handle limit of 1', () => {
            const result = paginateData(mockEnrollments, 1, 1);
            expect(result.data.length).toBe(1);
            expect(result.pagination.totalPages).toBe(150);
        });

        it('should handle different limit sizes', () => {
            const limits = [5, 10, 20, 50, 100];
            limits.forEach(limit => {
                const pagination = calculatePagination(150, 1, limit);
                expect(pagination.totalPages).toBe(Math.ceil(150 / limit));
            });
        });
    });

    // ==================== Navigation Logic ====================
    describe('Navigation Logic', () => {
        it('should determine next page correctly', () => {
            const pagination = calculatePagination(150, 3, 20);
            const nextPage = pagination.hasNextPage ? pagination.page + 1 : pagination.page;
            expect(nextPage).toBe(4);
        });

        it('should determine previous page correctly', () => {
            const pagination = calculatePagination(150, 3, 20);
            const prevPage = pagination.hasPreviousPage ? pagination.page - 1 : pagination.page;
            expect(prevPage).toBe(2);
        });

        it('should prevent next page on last page', () => {
            const pagination = calculatePagination(150, 8, 20);
            const nextPage = pagination.hasNextPage ? pagination.page + 1 : pagination.page;
            expect(nextPage).toBe(8);
        });

        it('should prevent previous page on first page', () => {
            const pagination = calculatePagination(150, 1, 20);
            const prevPage = pagination.hasPreviousPage ? pagination.page - 1 : pagination.page;
            expect(prevPage).toBe(1);
        });
    });

    // ==================== Performance Tests ====================
    describe('Performance', () => {
        it('should paginate large dataset efficiently', () => {
            const largeDataset = generateMockEnrollments(10000);
            const startTime = performance.now();
            const result = paginateData(largeDataset, 1, 20);
            const endTime = performance.now();

            expect(result.data.length).toBe(20);
            expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
        });

        it('should calculate pagination for large dataset efficiently', () => {
            const startTime = performance.now();
            const pagination = calculatePagination(100000, 50, 20);
            const endTime = performance.now();

            expect(pagination.totalPages).toBe(5000);
            expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
        });
    });

    // ==================== UI State Tests ====================
    describe('UI State Management', () => {
        it('should generate correct UI state for first page', () => {
            const result = paginateData(mockEnrollments, 1, 20);
            const pagination = result.pagination;

            const uiState = {
                isFirstPage: !pagination.hasPreviousPage,
                isLastPage: !pagination.hasNextPage,
                canGoPrevious: pagination.hasPreviousPage,
                canGoNext: pagination.hasNextPage,
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                itemsInfo: `Hiển thị ${pagination.offset + 1}-${Math.min(pagination.offset + 20, pagination.total)} trong tổng số ${pagination.total}`
            };

            expect(uiState.isFirstPage).toBe(true);
            expect(uiState.canGoPrevious).toBe(false);
            expect(uiState.canGoNext).toBe(true);
            expect(uiState.itemsInfo).toContain('1-20');
        });

        it('should generate correct UI state for last page', () => {
            const result = paginateData(mockEnrollments, 8, 20);
            const pagination = result.pagination;

            const uiState = {
                isFirstPage: !pagination.hasPreviousPage,
                isLastPage: !pagination.hasNextPage,
                canGoPrevious: pagination.hasPreviousPage,
                canGoNext: pagination.hasNextPage
            };

            expect(uiState.isLastPage).toBe(true);
            expect(uiState.canGoPrevious).toBe(true);
            expect(uiState.canGoNext).toBe(false);
        });
    });
});
