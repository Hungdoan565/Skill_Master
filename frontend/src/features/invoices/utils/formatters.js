/**
 * Formatter Utilities
 * 
 * Tách riêng các hàm format để:
 * 1. Dễ test đơn vị (Unit Test)
 * 2. Tái sử dụng ở nhiều nơi
 * 3. Thay đổi format một chỗ, áp dụng toàn app
 */

/**
 * Format số thành chuỗi tiền tệ VNĐ
 * @param {number|string} value - Giá trị cần format
 * @returns {string} - Chuỗi đã format (vd: "1,500,000")
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const number = value.toString().replace(/[^0-9]/g, '');
  return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format số thành chuỗi tiền tệ VNĐ có đơn vị
 * @param {number} value - Giá trị cần format
 * @returns {string} - Chuỗi đã format (vd: "1,500,000đ")
 */
export const formatMoney = (value) => {
  if (!value && value !== 0) return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
};

/**
 * Format ngày tháng theo chuẩn Việt Nam
 * @param {string|Date} dateString - Ngày cần format
 * @returns {string} - Chuỗi đã format (vd: "25/12/2024")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format ngày tháng thủ công (tránh Excel auto-format sai)
 * @param {string|Date} dateString - Ngày cần format
 * @returns {string|null} - Chuỗi dd/mm/yyyy hoặc null
 */
export const formatDateVN = (dateStr) => {
  if (!dateStr) return null;
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Parse chuỗi tiền tệ thành số
 * @param {string} value - Chuỗi tiền tệ (vd: "1,500,000")
 * @returns {number} - Số đã parse
 */
export const parseCurrency = (value) => {
  if (!value) return 0;
  return parseInt(value.toString().replace(/[^0-9]/g, ''), 10) || 0;
};
