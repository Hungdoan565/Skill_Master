/**
 * Courses Formatters - Format và helper functions
 */

import { CATEGORY_CONFIG, GRADE_TEMPLATES } from './constants';

// ============================================================
// PRICE FORMATTERS
// ============================================================

/**
 * Format giá tiền khi nhập - thêm dấu chấm ngăn cách
 * @param {string} value - Giá trị cần format
 * @returns {string} - Giá trị đã format
 */
export const formatPriceInput = (value) => {
  // Chỉ giữ số
  const numbers = value.replace(/\D/g, '');
  // Format với dấu chấm
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parse giá tiền từ string về number
 * @param {string} formatted - Giá trị đã format
 * @returns {number} - Số tiền
 */
export const parsePriceValue = (formatted) => {
  return parseInt(formatted.replace(/\./g, '')) || 0;
};

/**
 * Format giá tiền hiển thị VND
 * @param {number} price - Giá tiền
 * @returns {string} - Chuỗi đã format (VD: "5.000.000 ₫")
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

// ============================================================
// CATEGORY HELPERS
// ============================================================

/**
 * Lấy config màu sắc cho danh mục
 * @param {string} category - Mã danh mục
 * @returns {Object} - Config với label và color
 */
export const getCategoryConfig = (category) => {
  return CATEGORY_CONFIG[category?.toLowerCase()] || CATEGORY_CONFIG.default;
};

// ============================================================
// GRADE STRUCTURE HELPERS
// ============================================================

/**
 * Tìm template phù hợp dựa trên category của khóa học
 * @param {string} category - Danh mục khóa học
 * @returns {string} - Key của template
 */
export const getTemplateByCategory = (category) => {
  if (!category) return 'programming';
  const cat = category.toLowerCase();
  for (const [key, template] of Object.entries(GRADE_TEMPLATES)) {
    if (template.categories.includes(cat)) return key;
  }
  return 'programming'; // Mặc định
};

/**
 * Tính tổng trọng số
 * @param {Array} structures - Danh sách cột điểm
 * @returns {number} - Tổng trọng số (0-1)
 */
export const calculateTotalWeight = (structures) => {
  return structures.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
};

/**
 * Kiểm tra trọng số hợp lệ (tổng = 100%)
 * @param {Array} structures - Danh sách cột điểm
 * @param {string} calculationType - Loại tính điểm ('weighted' | 'sum')
 * @returns {boolean}
 */
export const isWeightValid = (structures, calculationType) => {
  if (calculationType === 'sum') return true;
  const total = calculateTotalWeight(structures);
  return Math.abs(total - 1) <= 0.01; // tolerance 1%
};

/**
 * Tính tổng điểm tối đa (cho mode sum)
 * @param {Array} structures - Danh sách cột điểm
 * @returns {number}
 */
export const calculateTotalMaxScore = (structures) => {
  return structures.reduce((sum, s) => sum + (parseFloat(s.max_score) || 0), 0);
};

// ============================================================
// FORM VALIDATION
// ============================================================

/**
 * Validate form tạo/sửa khóa học
 * @param {Object} formData - Dữ liệu form
 * @returns {string|null} - Thông báo lỗi hoặc null nếu hợp lệ
 */
export const validateCourseForm = (formData) => {
  if (!formData.code?.trim()) {
    return 'Vui lòng nhập mã khóa học';
  }
  if (!formData.title?.trim()) {
    return 'Vui lòng nhập tên khóa học';
  }
  if (!formData.price) {
    return 'Vui lòng nhập học phí';
  }
  return null;
};

/**
 * Validate cấu trúc điểm
 * @param {Array} structures - Danh sách cột điểm
 * @param {Object} config - Cấu hình điểm
 * @returns {string|null} - Thông báo lỗi hoặc null nếu hợp lệ
 */
export const validateGradeStructure = (structures, config) => {
  if (structures.length === 0) {
    return 'Vui lòng thêm ít nhất 1 cột điểm';
  }

  const emptyNames = structures.some(s => !s.name?.trim());
  if (emptyNames) {
    return 'Tên cột điểm không được để trống';
  }

  if (config.calculationType === 'weighted') {
    const totalWeight = calculateTotalWeight(structures);
    const totalPercent = Math.round(totalWeight * 100);
    if (Math.abs(totalWeight - 1) > 0.01) {
      return `Tổng trọng số phải bằng 100%. Hiện tại: ${totalPercent}%`;
    }
  }

  return null;
};
