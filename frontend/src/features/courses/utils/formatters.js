/**
 * Courses Formatters - Format và helper functions
 */

import { CATEGORY_CONFIG, GRADE_TEMPLATES } from './constants';

// ============================================================
// ERROR HANDLING HELPERS
// ============================================================

/**
 * Parse API error thành user-friendly message
 * @param {Error} error - Error từ axios
 * @param {string} action - Hành động đang thực hiện (VD: 'tạo khóa học')
 * @returns {string} - Thông báo lỗi cho user
 */
export const parseApiError = (error, action = 'thực hiện') => {
  // Network error
  if (!error.response) {
    return 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  const status = error.response?.status;
  const message = error.response?.data?.message || error.response?.data?.error;

  // Duplicate entry
  if (status === 409 || message?.includes('đã tồn tại') || message?.includes('duplicate')) {
    return 'Mã khóa học đã tồn tại. Vui lòng chọn mã khác.';
  }

  // Validation error từ server
  if (status === 400) {
    return message || `Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.`;
  }

  // Unauthorized
  if (status === 401) {
    return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  }

  // Forbidden
  if (status === 403) {
    return `Bạn không có quyền ${action}.`;
  }

  // Not found
  if (status === 404) {
    return 'Không tìm thấy khóa học.';
  }

  // Server error
  if (status >= 500) {
    return 'Lỗi máy chủ. Vui lòng thử lại sau.';
  }

  // Default
  return message || `Có lỗi xảy ra khi ${action}. Vui lòng thử lại.`;
};

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
  // Required: Mã khóa học
  if (!formData.code?.trim()) {
    return 'Vui lòng nhập mã khóa học';
  }

  // Mã khóa học phải hợp lệ (chỉ chữ cái, số, gạch ngang)
  const codePattern = /^[A-Z0-9][A-Z0-9\-_]*$/;
  if (!codePattern.test(formData.code.trim())) {
    return 'Mã khóa học chỉ được chứa chữ cái in hoa, số và gạch ngang';
  }

  // Mã khóa học tối đa 20 ký tự
  if (formData.code.trim().length > 20) {
    return 'Mã khóa học tối đa 20 ký tự';
  }

  // Required: Tên khóa học
  if (!formData.title?.trim()) {
    return 'Vui lòng nhập tên khóa học';
  }

  // Tên khóa học tối đa 150 ký tự
  if (formData.title.trim().length > 150) {
    return 'Tên khóa học tối đa 150 ký tự';
  }

  // Required: Học phí
  if (!formData.price) {
    return 'Vui lòng nhập học phí';
  }

  // Học phí phải lớn hơn 0
  const price = parsePriceValue(String(formData.price));
  if (price <= 0) {
    return 'Học phí phải lớn hơn 0';
  }

  // Học phí tối đa 999,999,999
  if (price > 999999999) {
    return 'Học phí tối đa 999,999,999đ';
  }

  // Mô tả tối đa 1000 ký tự
  if (formData.description && formData.description.length > 1000) {
    return 'Mô tả tối đa 1000 ký tự';
  }

  // Số buổi học phải hợp lệ
  if (formData.total_sessions && (formData.total_sessions < 1 || formData.total_sessions > 365)) {
    return 'Số buổi học phải từ 1 đến 365';
  }

  // Thời lượng phải hợp lệ
  if (formData.duration_weeks && (formData.duration_weeks < 1 || formData.duration_weeks > 104)) {
    return 'Thời lượng tối đa 104 tuần (2 năm)';
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
