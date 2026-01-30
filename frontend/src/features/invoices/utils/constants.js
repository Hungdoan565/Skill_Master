/**
 * Invoice Constants
 * 
 * Tập trung tất cả các hằng số liên quan đến module Invoices.
 */

// ============================================
// BANK CONFIG - MOVED TO DATABASE
// ============================================
// IMPORTANT: Bank configuration is now stored in system_settings table
// and fetched via API endpoints:
// - GET /api/payment-config (for any authenticated user)
// - GET /api/settings/bank-config (for admin view)
// - PUT /api/settings/bank-config (for admin update)
// - GET /api/student/payment-config (for student self-payment)
//
// See: database/17_system_settings.sql for table schema
// ============================================

// ============================================
// INVOICE STATUS OPTIONS
// ============================================
export const INVOICE_STATUS = {
  ALL: 'all',
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'partial', label: 'Thanh toán một phần' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'cancelled', label: 'Đã hủy' },
];

// ============================================
// PAYMENT METHODS
// ============================================
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  MOMO: 'momo'
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  card: 'Thẻ',
  momo: 'MoMo'
};

// ============================================
// INVOICE TYPES
// ============================================
export const INVOICE_TYPES = {
  TUITION: 'tuition',
  BOOK: 'book',
  UNIFORM: 'uniform',
  EXAM: 'exam',
  OTHER: 'other'
};

export const INVOICE_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'tuition', label: 'Học phí' },
  { value: 'book', label: 'Giáo trình/Sách' },
  { value: 'uniform', label: 'Đồng phục' },
  { value: 'exam', label: 'Phí thi' },
  { value: 'other', label: 'Phí khác' }
];

// ============================================
// PAGINATION DEFAULTS
// ============================================
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================
// API ENDPOINTS
// ============================================
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
