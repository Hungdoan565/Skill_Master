/**
 * Dashboard Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Accent color configurations
export const ACCENT_CLASSES = {
  red: {
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    iconShadow: 'shadow-red-500/25',
    trendUp: 'text-emerald-600 bg-emerald-50',
    trendDown: 'text-red-600 bg-red-50',
  },
  emerald: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    iconShadow: 'shadow-emerald-500/25',
    trendUp: 'text-emerald-600 bg-emerald-50',
    trendDown: 'text-red-600 bg-red-50',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    iconShadow: 'shadow-amber-500/25',
    trendUp: 'text-emerald-600 bg-emerald-50',
    trendDown: 'text-amber-600 bg-amber-50',
  },
};

// Chart colors
export const CHART_COLORS = [
  'bg-red-500', 
  'bg-orange-500', 
  'bg-amber-500', 
  'bg-emerald-500', 
  'bg-cyan-500', 
  'bg-indigo-500'
];
