/**
 * Classes List Formatters - Utility functions
 */

import { DAY_NAMES } from './constants';

/**
 * Parse schedule safely (có thể là null, string hoặc array)
 * @param {*} schedule - Lịch học từ API
 * @returns {Array} - Mảng schedule objects
 */
export const parseSchedule = (schedule) => {
  if (!schedule) return [];
  if (Array.isArray(schedule)) return schedule;
  if (typeof schedule === 'string') {
    try {
      const parsed = JSON.parse(schedule);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Format schedule để hiển thị
 * @param {*} schedule - Lịch học
 * @returns {string} - Chuỗi hiển thị VD: "Thứ 2, Thứ 4 | 18:00-20:00"
 */
export const formatScheduleDisplay = (schedule) => {
  const parsed = parseSchedule(schedule);
  if (parsed.length === 0) return '-';
  
  const days = parsed.map(s => DAY_NAMES[s.day]).join(', ');
  const time = parsed[0] ? `${parsed[0].start}-${parsed[0].end}` : '';
  return `${days} | ${time}`;
};

/**
 * Format date theo locale Việt Nam
 * @param {string} dateString - Chuỗi ngày
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

/**
 * Auto-generate class name based on course code
 * Format: [MÃ KHÓA]-[MM][YY]-01  (VD: IELTS-BASIC-1125-01)
 * @param {string} courseCode - Mã khóa học
 * @param {string} startDate - Ngày khai giảng
 * @returns {string}
 */
export const generateClassName = (courseCode, startDate) => {
  if (!courseCode) return '';
  
  // Dùng start_date nếu có, không thì dùng ngày hiện tại
  const date = startDate ? new Date(startDate) : new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2); // Lấy 2 số cuối năm
  
  return `${courseCode}-${month}${year}-01`;
};

/**
 * Auto-generate class code - giống tên lớp
 * @param {string} courseCode - Mã khóa học
 * @param {string} startDate - Ngày khai giảng
 * @returns {string}
 */
export const generateClassCode = (courseCode, startDate) => {
  return generateClassName(courseCode, startDate);
};

/**
 * Get category color config
 * @param {string} category - Category key
 * @param {Object} colors - CATEGORY_COLORS object
 * @returns {string}
 */
export const getCategoryColor = (category, colors) => {
  return colors[category] || colors.default;
};

/**
 * Build schedule array từ selected days và time
 * @param {Array} selectedDays - Các thứ đã chọn
 * @param {string} startTime - Giờ bắt đầu
 * @param {string} endTime - Giờ kết thúc
 * @returns {Array}
 */
export const buildScheduleArray = (selectedDays, startTime, endTime) => {
  if (selectedDays.length === 0 || !startTime || !endTime) return [];
  
  return selectedDays.map(day => ({
    day,
    start: startTime,
    end: endTime
  }));
};
