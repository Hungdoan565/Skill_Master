/**
 * ColorAvatar Component
 * Avatar với màu gradient dựa trên tên
 */

import { getInitials, getGradient } from '../utils';

export function ColorAvatar({ name, avatarUrl, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={name} 
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${getGradient(name)} font-semibold text-white ring-2 ring-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

export default ColorAvatar;
