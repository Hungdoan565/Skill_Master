/**
 * Formatters & Helpers for Class Detail module
 */

import { DAY_NAMES, AVATAR_COLORS } from './constants';

/**
 * Parse schedule from various formats safely
 * @param {string|array|null} schedule - Schedule data
 * @returns {array} - Parsed schedule array
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
 * Format schedule for display
 * @param {string|array|null} schedule - Schedule data
 * @returns {string} - Formatted schedule string
 */
export const formatScheduleDisplay = (schedule) => {
  const parsed = parseSchedule(schedule);
  if (parsed.length === 0) return 'Chưa có lịch';
  
  const days = parsed.map(s => DAY_NAMES[s.day]).join(', ');
  const time = parsed[0] ? `${parsed[0].start} - ${parsed[0].end}` : '';
  return `${days} | ${time}`;
};

/**
 * Get payment status for a student
 * @param {object} student - Student object with payment info
 * @returns {object} - { label, color }
 */
export const getPaymentStatus = (student) => {
  if (!student.tuition_fee || student.tuition_fee === 0) {
    return { label: 'Chưa có học phí', color: 'bg-slate-100 text-slate-600' };
  }
  if (student.remaining <= 0) {
    return { label: 'Đã đóng đủ', color: 'bg-green-100 text-green-700' };
  }
  if (student.paid_amount > 0) {
    return { label: `Còn nợ ${student.remaining.toLocaleString()}đ`, color: 'bg-yellow-100 text-yellow-700' };
  }
  return { label: 'Chưa đóng', color: 'bg-red-100 text-red-700' };
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(-2)
    .toUpperCase();
};

/**
 * Get avatar color based on name
 * @param {string} name - Name to generate color for
 * @returns {string} - Tailwind color class
 */
export const getAvatarColor = (name) => {
  const index = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[index];
};

/**
 * Format currency for input
 * @param {string} value - Input value
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  const num = value.replace(/[^0-9]/g, '');
  return num ? parseInt(num).toLocaleString('vi-VN') : '';
};

/**
 * Parse currency string to number
 * @param {string} value - Currency string
 * @returns {number} - Parsed number
 */
export const parseCurrency = (value) => {
  const num = value.replace(/[^0-9]/g, '');
  return num ? parseInt(num) : 0;
};

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @param {string} format - Format type ('short' | 'long' | 'full')
 * @returns {string} - Formatted date
 */
export const formatDate = (dateStr, format = 'short') => {
  const date = new Date(dateStr);
  
  switch (format) {
    case 'long':
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    case 'full':
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    default:
      return date.toLocaleDateString('vi-VN');
  }
};

/**
 * Calculate weighted average for grades
 * @param {array} structures - Grade structures with weights
 * @param {object} grades - Student grades object { structure_id: { score } }
 * @param {function} getScore - Function to get score for a structure
 * @returns {number|null} - Weighted average or null if no scores
 */
export const calculateWeightedAverage = (structures, grades, getScore) => {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  structures.forEach(structure => {
    const score = getScore(structure.id);
    if (score !== '' && score !== null && !isNaN(score)) {
      totalWeightedScore += parseFloat(score) * structure.weight;
      totalWeight += structure.weight;
    }
  });

  return totalWeight > 0 
    ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 
    : null;
};

/**
 * Generate VietQR URL
 * @param {object} config - Bank config
 * @param {number} amount - Payment amount
 * @param {string} content - Transfer content
 * @returns {string} - VietQR image URL
 */
export const generateVietQRUrl = (config, amount, content) => {
  const { bankId, accountNo, template, accountName } = config;
  const encodedContent = encodeURIComponent(content);
  const encodedName = encodeURIComponent(accountName);
  
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedName}`;
};

/**
 * Generate payment transfer content
 * @param {string} studentName - Student's full name
 * @param {string} classCode - Class code
 * @returns {string} - Transfer content
 */
export const generateTransferContent = (studentName, classCode) => {
  const lastName = studentName?.split(' ').pop() || '';
  return `HP ${lastName} ${classCode || ''}`.trim();
};

/**
 * Validate grade score
 * @param {string|number} value - Score value
 * @param {number} maxScore - Maximum allowed score
 * @returns {{ valid: boolean, value: number|null, message?: string }}
 */
export const validateGradeScore = (value, maxScore) => {
  const trimmed = String(value).trim();
  
  if (trimmed === '') {
    return { valid: true, value: null };
  }
  
  const numVal = parseFloat(trimmed);
  
  if (isNaN(numVal)) {
    return { valid: false, value: null, message: 'Vui lòng nhập số hợp lệ' };
  }
  
  if (numVal < 0) {
    return { valid: true, value: 0, message: 'Đã sửa thành 0 (không được âm)' };
  }
  
  if (numVal > maxScore) {
    return { valid: true, value: maxScore, message: `Đã sửa thành ${maxScore} (điểm tối đa)` };
  }
  
  return { valid: true, value: Math.round(numVal * 100) / 100 };
};
