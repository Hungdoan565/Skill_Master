/**
 * Invoice Constants
 * 
 * Tập trung tất cả các hằng số liên quan đến module Invoices.
 * Khi cần thay đổi (ví dụ: đổi ngân hàng), chỉ sửa ở đây.
 */

// ============================================
// BANK CONFIG - VietQR
// ============================================
export const BANK_CONFIG = {
  bankId: 'VCB',  // Vietcombank
  accountNo: '1029849106',
  accountName: 'DOAN VINH HUNG',
  template: 'compact2'
};

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
// PAGINATION DEFAULTS
// ============================================
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================
// API ENDPOINTS
// ============================================
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
