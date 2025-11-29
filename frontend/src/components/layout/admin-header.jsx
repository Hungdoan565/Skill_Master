import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, ChevronDown, User, Settings, HelpCircle, Home } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  // Tạo màu gradient dựa trên tên
  const getGradient = (name) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-cyan-500 to-blue-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-purple-600',
    ];
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${getGradient(name)} font-semibold text-white ring-2 ring-white shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

// Badge hiển thị role
function RoleBadge({ roleCode }) {
  const roleConfig = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
    CENTER_MANAGER: { label: 'Quản lý', color: 'bg-purple-100 text-purple-700' },
    TEACHER: { label: 'Giáo viên', color: 'bg-blue-100 text-blue-700' },
    STUDENT: { label: 'Học viên', color: 'bg-green-100 text-green-700' },
  };

  const config = roleConfig[roleCode] || { label: roleCode, color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
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
  const avatarUrl = profile?.avatar_url;
  const roleCode = profile?.roles?.code || (user?.email?.includes('admin') ? 'SUPER_ADMIN' : null);
  const userEmail = user?.email || '';

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
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          className="pl-10"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
            3
          </span>
        </Button>

        {/* User Info - Dropdown */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Trigger */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200
              hover:bg-slate-100 cursor-pointer
              ${isDropdownOpen ? 'bg-slate-100' : ''}
            `}
          >
            <UserAvatar name={displayName} avatarUrl={avatarUrl} />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <div className="flex items-center gap-1.5">
                {roleCode && <RoleBadge roleCode={roleCode} />}
              </div>
            </div>
            <ChevronDown 
              className={`
                h-4 w-4 text-slate-400 hidden sm:block transition-transform duration-200
                ${isDropdownOpen ? 'rotate-180' : ''}
              `} 
            />
          </button>

          {/* Dropdown Menu */}
          <div
            className={`
              absolute right-0 top-full mt-2 w-72 origin-top-right
              rounded-xl border border-slate-200 bg-white py-2 shadow-lg shadow-slate-200/50
              transition-all duration-200 ease-out z-50
              ${isDropdownOpen 
                ? 'opacity-100 scale-100 translate-y-0 visible' 
                : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
              }
            `}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <UserAvatar name={displayName} avatarUrl={avatarUrl} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  <div className="mt-1">
                    {roleCode && <RoleBadge roleCode={roleCode} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {dropdownItems.map((item, index) => (
                <div key={item.label}>
                  {item.divider && <div className="my-1 border-t border-slate-100" />}
                  <button
                    onClick={item.action}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                      ${item.danger 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <item.icon className={`h-4 w-4 ${item.danger ? 'text-red-500' : 'text-slate-400'}`} />
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
