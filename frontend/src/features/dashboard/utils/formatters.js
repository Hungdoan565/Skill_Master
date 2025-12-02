/**
 * Dashboard Formatters
 */

/**
 * Get greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng!';
  if (hour < 18) return 'Chào buổi chiều!';
  return 'Chào buổi tối!';
};

/**
 * Format current date
 */
export const getCurrentDate = () => {
  const now = new Date();
  return `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
};

/**
 * Format Y-axis values for charts
 */
export const formatYAxis = (value) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(0)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

/**
 * Format trend value with + sign
 */
export const formatTrend = (trend) => {
  if (!trend) return null;
  return `${trend > 0 ? '+' : ''}${trend}%`;
};
