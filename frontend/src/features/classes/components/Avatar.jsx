/**
 * Avatar Component
 * Displays user avatar with image or initials fallback
 */

import { getInitials, getAvatarColor } from '../utils';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

export function Avatar({ name, size = 'md', url, className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;
  
  if (url) {
    return (
      <img 
        src={url} 
        alt={name} 
        className={`${sizeClass} rounded-full object-cover ${className}`} 
      />
    );
  }
  
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);
  
  return (
    <div 
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-medium ${className}`}
    >
      {initials}
    </div>
  );
}
