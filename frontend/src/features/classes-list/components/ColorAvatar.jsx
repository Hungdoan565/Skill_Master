/**
 * ColorAvatar Component - Avatar với gradient màu
 */

const GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm'
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length === 1 
    ? parts[0][0].toUpperCase() 
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getGradient = (name) => {
  return GRADIENTS[(name?.charCodeAt(0) || 0) % GRADIENTS.length];
};

export function ColorAvatar({ name, avatarUrl, size = 'sm' }) {
  const sizeClass = SIZES[size] || SIZES.sm;
  const gradient = getGradient(name);

  if (avatarUrl) {
    return (
      <img 
        src={avatarUrl} 
        alt={name} 
        className={`${sizeClass} rounded-full object-cover`} 
      />
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-linear-to-br ${gradient} font-semibold text-white`}>
      {getInitials(name)}
    </div>
  );
}

export default ColorAvatar;
