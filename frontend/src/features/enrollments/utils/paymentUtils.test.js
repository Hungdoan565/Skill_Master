/**
 * Unit Tests for Payment Utilities
 * Test các hàm tính toán thanh toán
 */

import { describe, it, expect } from 'vitest';
import {
    calculateRemaining,
    getPaymentStatusType,
    getPaymentStatusConfig,
    formatCurrency,
    calculatePaymentPercentage,
    isFullyPaid,
    hasOutstanding,
    calculateNetTuition,
    getEnrollmentPaymentStatus
} from '../utils/paymentUtils';

describe('Payment Utilities', () => {
    // ==================== calculateRemaining ====================
    describe('calculateRemaining', () => {
        it('should return 0 when fully paid', () => {
            const result = calculateRemaining(5000000, 0, 5000000);
            expect(result).toBe(0);
        });

        it('should calculate remaining correctly', () => {
            const result = calculateRemaining(5000000, 0, 3000000);
            expect(result).toBe(2000000);
        });

        it('should deduct discount from remaining calculation', () => {
            const result = calculateRemaining(5000000, 500000, 4000000);
            expect(result).toBe(500000);
        });

        it('should return 0 when remaining is negative', () => {
            const result = calculateRemaining(5000000, 0, 6000000);
            expect(result).toBe(0);
        });

        it('should handle null/undefined values', () => {
            expect(calculateRemaining(null, null, null)).toBe(0);
            expect(calculateRemaining(undefined, undefined, undefined)).toBe(0);
        });

        it('should handle mixed null/number values', () => {
            const result = calculateRemaining(5000000, null, 3000000);
            expect(result).toBe(2000000);
        });
    });

    // ==================== getPaymentStatusType ====================
    describe('getPaymentStatusType', () => {
        it('should return "paid" when fully paid', () => {
            const result = getPaymentStatusType(5000000, 0, 5000000);
            expect(result).toBe('paid');
        });

        it('should return "partial" when partially paid', () => {
            const result = getPaymentStatusType(5000000, 0, 3000000);
            expect(result).toBe('partial');
        });

        it('should return "unpaid" when not paid', () => {
            const result = getPaymentStatusType(5000000, 0, 0);
            expect(result).toBe('unpaid');
        });

        it('should consider discount in payment status', () => {
            // Tuition 5M, discount 1M, paid 4M = fully paid
            const result = getPaymentStatusType(5000000, 1000000, 4000000);
            expect(result).toBe('paid');
        });
    });

    // ==================== getPaymentStatusConfig ====================
    describe('getPaymentStatusConfig', () => {
        it('should return correct config for "paid" status', () => {
            const config = getPaymentStatusConfig('paid');
            expect(config.label).toBe('Đã đóng');
            expect(config.color).toContain('green');
        });

        it('should return correct config for "partial" status', () => {
            const config = getPaymentStatusConfig('partial');
            expect(config.label).toBe('Nợ một phần');
            expect(config.color).toContain('yellow');
        });

        it('should return correct config for "unpaid" status', () => {
            const config = getPaymentStatusConfig('unpaid');
            expect(config.label).toBe('Chưa đóng');
            expect(config.color).toContain('red');
        });

        it('should return unpaid config for unknown status', () => {
            const config = getPaymentStatusConfig('unknown');
            expect(config.label).toBe('Chưa đóng');
        });
    });

    // ==================== formatCurrency ====================
    describe('formatCurrency', () => {
        it('should format currency correctly', () => {
            const result = formatCurrency(5000000);
            expect(result).toContain('5');
            expect(result).toContain('₫');
        });

        it('should handle 0', () => {
            const result = formatCurrency(0);
            expect(result).toContain('₫');
        });

        it('should handle null/undefined', () => {
            expect(formatCurrency(null)).toContain('₫');
            expect(formatCurrency(undefined)).toContain('₫');
        });

        it('should not include decimal places', () => {
            const result = formatCurrency(5000000);
            // Vietnamese currency format typically doesn't show decimals for VND
            expect(result).not.toContain(',');
        });
    });

    // ==================== calculatePaymentPercentage ====================
    describe('calculatePaymentPercentage', () => {
        it('should calculate 100% when fully paid', () => {
            const result = calculatePaymentPercentage(5000000, 0, 5000000);
            expect(result).toBe(100);
        });

        it('should calculate 50% when half paid', () => {
            const result = calculatePaymentPercentage(4000000, 0, 2000000);
            expect(result).toBe(50);
        });

        it('should consider discount in percentage', () => {
            // Net tuition = 5M - 1M = 4M, paid 2M = 50%
            const result = calculatePaymentPercentage(5000000, 1000000, 2000000);
            expect(result).toBe(50);
        });

        it('should return 0 when no tuition', () => {
            const result = calculatePaymentPercentage(0, 0, 0);
            expect(result).toBe(0);
        });

        it('should cap at 100% when overpaid', () => {
            const result = calculatePaymentPercentage(5000000, 0, 6000000);
            expect(result).toBe(100);
        });
    });

    // ==================== isFullyPaid ====================
    describe('isFullyPaid', () => {
        it('should return true when fully paid', () => {
            expect(isFullyPaid(5000000, 0, 5000000)).toBe(true);
        });

        it('should return false when partially paid', () => {
            expect(isFullyPaid(5000000, 0, 3000000)).toBe(false);
        });

        it('should return false when unpaid', () => {
            expect(isFullyPaid(5000000, 0, 0)).toBe(false);
        });

        it('should return true when overpaid', () => {
            expect(isFullyPaid(5000000, 0, 6000000)).toBe(true);
        });
    });

    // ==================== hasOutstanding ====================
    describe('hasOutstanding', () => {
        it('should return false when fully paid', () => {
            expect(hasOutstanding(5000000, 0, 5000000)).toBe(false);
        });

        it('should return true when partially paid', () => {
            expect(hasOutstanding(5000000, 0, 3000000)).toBe(true);
        });

        it('should return true when unpaid', () => {
            expect(hasOutstanding(5000000, 0, 0)).toBe(true);
        });
    });

    // ==================== calculateNetTuition ====================
    describe('calculateNetTuition', () => {
        it('should calculate net tuition without discount', () => {
            const result = calculateNetTuition(5000000, 0);
            expect(result).toBe(5000000);
        });

        it('should deduct discount correctly', () => {
            const result = calculateNetTuition(5000000, 500000);
            expect(result).toBe(4500000);
        });

        it('should return 0 when discount equals tuition', () => {
            const result = calculateNetTuition(5000000, 5000000);
            expect(result).toBe(0);
        });

        it('should return 0 when discount exceeds tuition', () => {
            const result = calculateNetTuition(5000000, 6000000);
            expect(result).toBe(0);
        });

        it('should handle null values', () => {
            expect(calculateNetTuition(null, null)).toBe(0);
        });
    });

    // ==================== getEnrollmentPaymentStatus ====================
    describe('getEnrollmentPaymentStatus', () => {
        it('should return correct config for enrollment object', () => {
            const enrollment = {
                tuition_fee: 5000000,
                discount_amount: 0,
                paid_amount: 5000000
            };
            const config = getEnrollmentPaymentStatus(enrollment);
            expect(config.label).toBe('Đã đóng');
        });

        it('should handle partial payment', () => {
            const enrollment = {
                tuition_fee: 5000000,
                discount_amount: 0,
                paid_amount: 3000000
            };
            const config = getEnrollmentPaymentStatus(enrollment);
            expect(config.label).toBe('Nợ một phần');
        });

        it('should handle unpaid enrollment', () => {
            const enrollment = {
                tuition_fee: 5000000,
                discount_amount: 0,
                paid_amount: 0
            };
            const config = getEnrollmentPaymentStatus(enrollment);
            expect(config.label).toBe('Chưa đóng');
        });

        it('should handle null enrollment', () => {
            const config = getEnrollmentPaymentStatus(null);
            expect(config.label).toBe('Chưa đóng');
        });
    });

    // ==================== Integration Tests ====================
    describe('Integration Tests', () => {
        it('should handle complex payment scenario', () => {
            const enrollment = {
                tuition_fee: 10000000,
                discount_amount: 2000000,
                paid_amount: 6000000
            };

            const remaining = calculateRemaining(
                enrollment.tuition_fee,
                enrollment.discount_amount,
                enrollment.paid_amount
            );
            expect(remaining).toBe(2000000);

            const statusType = getPaymentStatusType(
                enrollment.tuition_fee,
                enrollment.discount_amount,
                enrollment.paid_amount
            );
            expect(statusType).toBe('partial');

            const percentage = calculatePaymentPercentage(
                enrollment.tuition_fee,
                enrollment.discount_amount,
                enrollment.paid_amount
            );
            expect(percentage).toBe(75);

            const isFullyPaidResult = isFullyPaid(
                enrollment.tuition_fee,
                enrollment.discount_amount,
                enrollment.paid_amount
            );
            expect(isFullyPaidResult).toBe(false);

            const hasOutstandingResult = hasOutstanding(
                enrollment.tuition_fee,
                enrollment.discount_amount,
                enrollment.paid_amount
            );
            expect(hasOutstandingResult).toBe(true);
        });

        it('should handle realistic enrollment data', () => {
            const enrollments = [
                {
                    id: 1,
                    student_name: 'Nguyễn Văn A',
                    tuition_fee: 5000000,
                    discount_amount: 0,
                    paid_amount: 5000000
                },
                {
                    id: 2,
                    student_name: 'Trần Thị B',
                    tuition_fee: 4500000,
                    discount_amount: 500000,
                    paid_amount: 2000000
                },
                {
                    id: 3,
                    student_name: 'Lê Văn C',
                    tuition_fee: 6000000,
                    discount_amount: 1000000,
                    paid_amount: 0
                }
            ];

            const results = enrollments.map(e => ({
                student: e.student_name,
                status: getPaymentStatusType(
                    e.tuition_fee,
                    e.discount_amount,
                    e.paid_amount
                ),
                remaining: calculateRemaining(
                    e.tuition_fee,
                    e.discount_amount,
                    e.paid_amount
                ),
                percentage: calculatePaymentPercentage(
                    e.tuition_fee,
                    e.discount_amount,
                    e.paid_amount
                )
            }));

            // Verify student A (fully paid)
            expect(results[0].status).toBe('paid');
            expect(results[0].remaining).toBe(0);
            expect(results[0].percentage).toBe(100);

            // Verify student B (partially paid)
            expect(results[1].status).toBe('partial');
            expect(results[1].remaining).toBe(2000000);
            expect(results[1].percentage).toBe(50);

            // Verify student C (unpaid)
            expect(results[2].status).toBe('unpaid');
            expect(results[2].remaining).toBe(5000000);
            expect(results[2].percentage).toBe(0);
        });
    });
});
