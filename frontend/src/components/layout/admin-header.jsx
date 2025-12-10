import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, ChevronDown, User, Settings, HelpCircle, Home, Command } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

// Component Avatar với fallback chữ cái đầu
function UserAvatar({ name, avatarUrl, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  // Lấy 2 chữ cái đầu của tên
  const getInitials = (fullName) => {
    if (!fullName) return '??';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Tạo màu gradient dựa trên tên - Updated to warmer palette
  const getGradient = (name) => {
    const gradients = [
      'from-red-500 to-orange-500',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-red-600',
      'from-orange-500 to-amber-500',
      'from-red-600 to-rose-500',
      'from-amber-600 to-yellow-500',
    ];
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-xl object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-xl bg-gradient-to-br ${getGradient(name)} font-semibold text-white ring-2 ring-white shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

// Badge hiển thị role - Enhanced styling
function RoleBadge({ roleCode }) {
  const roleConfig = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-50 text-red-700 ring-1 ring-red-600/20' },
    CENTER_MANAGER: { label: 'Quản lý', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' },
    TEACHER: { label: 'Giáo viên', color: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20' },
    STUDENT: { label: 'Học viên', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' },
  };

  const config = roleConfig[roleCode] || { label: roleCode, color: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-600/20' };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

export function AdminHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  // Lấy thông tin từ profile (bảng users) hoặc fallback từ user metadata
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const roleCode = profile?.roles?.code || (user?.email?.includes('admin') ? 'SUPER_ADMIN' : null);
  const userEmail = user?.email || '';
  
  // Debug avatar
  console.log('[AdminHeader] Avatar URL:', avatarUrl, '| Profile:', profile?.full_name);

  const dropdownItems = [
    { 
      label: 'Trang chủ', 
      icon: Home, 
      action: () => { setIsDropdownOpen(false); navigate('/'); },
      divider: false 
    },
    { 
      label: 'Hồ sơ cá nhân', 
      icon: User, 
      action: () => { setIsDropdownOpen(false); navigate('/admin/profile'); },
      divider: false 
    },
    { 
      label: 'Cài đặt', 
      icon: Settings, 
      action: () => { setIsDropdownOpen(false); navigate('/admin/settings'); },
      divider: false 
    },
    { 
      label: 'Trợ giúp', 
      icon: HelpCircle, 
      action: () => { setIsDropdownOpen(false); navigate('/help'); },
      divider: true 
    },
    { 
      label: 'Đăng xuất', 
      icon: LogOut, 
      action: handleLogout,
      divider: false,
      danger: true 
    },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-stone-200/60 bg-white/80 backdrop-blur-sm px-6">
      {/* Search - Enhanced with glassmorphism feel */}
      <div className="relative w-96">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-zinc-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="search"
          placeholder="Tìm kiếm học viên, khóa học..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-stone-200 bg-stone-50/50 
                     text-sm text-zinc-900 placeholder:text-zinc-400
                     focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30
                     transition-all duration-200"
        />
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 
                         text-[10px] font-medium text-zinc-500">
            <Command className="h-2.5 w-2.5" />
            K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications - Enhanced */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl 
                          bg-stone-50 border border-stone-200/60 text-zinc-600
                          hover:bg-stone-100 hover:text-zinc-900 hover:border-stone-300
                          transition-all duration-200 group">
          <Bell className="h-5 w-5 transition-transform group-hover:scale-105" />
          {/* Notification badge - more prominent */}
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center 
                          rounded-full bg-red-500 text-[10px] font-bold text-white
                          ring-2 ring-white shadow-sm">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-stone-200" />

        {/* User Info - Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Trigger */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all duration-200
              hover:bg-stone-100 cursor-pointer border border-transparent
              ${isDropdownOpen ? 'bg-stone-100 border-stone-200' : ''}
            `}
          >
            <UserAvatar name={displayName} avatarUrl={avatarUrl} />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-zinc-900">{displayName}</p>
              <div className="flex items-center gap-1.5">
                {roleCode && <RoleBadge roleCode={roleCode} />}
              </div>
            </div>
            <ChevronDown 
              className={`
                h-4 w-4 text-zinc-400 hidden sm:block transition-transform duration-200
                ${isDropdownOpen ? 'rotate-180' : ''}
              `} 
            />
          </button>

          {/* Dropdown Menu - Enhanced with better shadows and animations */}
          <div
            className={`
              absolute right-0 top-full mt-2 w-72 origin-top-right
              rounded-2xl border border-stone-200/80 bg-white py-2 
              shadow-xl shadow-stone-900/5
              transition-all duration-200 ease-out z-50
              ${isDropdownOpen 
                ? 'opacity-100 scale-100 translate-y-0 visible' 
                : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
              }
            `}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <UserAvatar name={displayName} avatarUrl={avatarUrl} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">{displayName}</p>
                  <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
                  <div className="mt-1.5">
                    {roleCode && <RoleBadge roleCode={roleCode} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1 px-2">
              {dropdownItems.map((item, index) => (
                <div key={item.label}>
                  {item.divider && <div className="my-2 mx-2 border-t border-stone-100" />}
                  <button
                    onClick={item.action}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150
                      ${item.danger 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-zinc-700 hover:bg-stone-50'
                      }
                    `}
                  >
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-lg transition-colors
                      ${item.danger ? 'bg-red-50' : 'bg-stone-100'}
                    `}>
                      <item.icon className={`h-4 w-4 ${item.danger ? 'text-red-500' : 'text-zinc-500'}`} />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
