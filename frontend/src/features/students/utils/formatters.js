/**
 * Students Formatters
 */

import { AVATAR_GRADIENTS } from './constants';

/**
 * Format date to Vietnamese locale
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Get gradient based on name
 */
export const getGradient = (name) => {
  if (!name) return AVATAR_GRADIENTS[0];
  const charCode = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
  return AVATAR_GRADIENTS[charCode % AVATAR_GRADIENTS.length];
};
