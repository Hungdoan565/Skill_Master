import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, ChevronDown, User, Settings, LayoutDashboard, Command } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';

// User Dropdown - Ported EXACTLY from Landing Page (header.jsx)
// With Z-Index adjustment for Admin Layout
const UserDropdown = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;
  const roleCode = profile?.roles?.code;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/', { replace: true });
  };

  const handleHome = () => {
    setIsOpen(false);
    navigate('/');
  };

  const getRoleLabel = () => {
    switch (roleCode) {
      case 'SUPER_ADMIN': return 'Admin';
      case 'CENTER_MANAGER': return 'Quản lý';
      case 'TEACHER': return 'Giáo viên';
      case 'STUDENT': return 'Học viên';
      default: return 'User';
    }
  };

  const getRoleColor = () => {
    switch (roleCode) {
      case 'SUPER_ADMIN':
      case 'CENTER_MANAGER': return 'bg-red-100 text-red-700';
      case 'TEACHER': return 'bg-blue-100 text-blue-700';
      case 'STUDENT': return 'bg-green-100 text-green-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 
          transition-all duration-200 cursor-pointer
          hover:bg-zinc-100 border border-transparent
          ${isOpen ? 'bg-zinc-100 border-zinc-200' : ''}
        `}
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white ring-2 ring-white shadow-sm">
            {getInitials(displayName)}
          </div>
        )}
        <span className="text-sm font-medium text-zinc-700 hidden sm:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-zinc-200/80 bg-white py-2 shadow-xl shadow-zinc-200/50 transition-all duration-200 ease-out z-[101] ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}>
        <div className="px-4 py-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {getInitials(displayName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          {roleCode && (
            <span className={`mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${getRoleColor()}`}>
              {getRoleLabel()}
            </span>
          )}
        </div>

        <div className="py-1">
          <button onClick={handleHome} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
            <LayoutDashboard className="h-4 w-4 text-zinc-400" />
            <span>Trang chủ</span>
          </button>
          <button onClick={() => { setIsOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
            <User className="h-4 w-4 text-zinc-400" />
            <span>Hồ sơ cá nhân</span>
          </button>
          <button onClick={() => { setIsOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
            <Settings className="h-4 w-4 text-zinc-400" />
            <span>Cài đặt</span>
          </button>
          <div className="my-1 mx-3 border-t border-zinc-100" />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4 text-red-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export function AdminHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
      {/* Search - Enhanced with glassmorphism feel */}
      <div className="relative w-96">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="search"
          placeholder="Tìm kiếm học viên, khóa học..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-input bg-muted/50 
                     text-sm text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                     transition-all duration-200"
        />
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted border border-border 
                         text-[10px] font-medium text-muted-foreground">
            <Command className="h-2.5 w-2.5" />
            K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications - Enhanced */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl 
                          bg-muted border border-border text-muted-foreground
                          hover:bg-accent hover:text-foreground hover:border-border
                          transition-all duration-200 group">
          <Bell className="h-5 w-5 transition-transform group-hover:scale-105" />
          {/* Notification badge - more prominent */}
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center 
                          rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground
                          ring-2 ring-card shadow-sm">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-border" />

        {/* User Info - Dropdown from Landing Page */}
        <UserDropdown />
      </div>
    </header>
  );
}
