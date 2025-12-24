import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Globe, Award, MessageCircle, Users, FileText, Layers, Target, BarChart3,
    GraduationCap, BookMarked, ArrowRight, ChevronDown, LayoutDashboard, User,
    Settings, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import logoImage from '@/assets/logo.png';

// ============================================
// DROPDOWN COMPONENTS
// ============================================
const DropdownSection = ({ title, children }) => (
    <div className="py-2">
        {title && (
            <p className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                {title}
            </p>
        )}
        <div className="px-2">{children}</div>
    </div>
);

const DropdownItem = ({ icon: Icon, title, description, href = '#', onClick }) => {
    const content = (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group">
            <div className="flex-shrink-0 w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center
                    group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                <Icon className="w-5 h-5 text-zinc-500 group-hover:text-red-600 transition-colors" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 group-hover:text-red-600 transition-colors">
                    {title}
                </p>
                {description && (
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{description}</p>
                )}
            </div>
        </div>
    );

    if (onClick) {
        return <button onClick={onClick} className="w-full text-left" role="menuitem">{content}</button>;
    }

    return (
        <Link to={href} className="block" role="menuitem">
            {content}
        </Link>
    );
};

const NavDropdown = ({ label, children, isOpen, onToggle, onClose }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 group
                  ${isOpen ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {label}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {/* Dropdown Panel */}
            <div
                className={`absolute top-full left-0 mt-4 min-w-[280px] origin-top-left
                  bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/50
                  transition-all duration-200 ease-out z-50
                  ${isOpen
                        ? 'opacity-100 scale-100 translate-y-0 visible'
                        : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
                    }`}
                role="menu"
                aria-hidden={!isOpen}
            >
                {children}
            </div>
        </div>
    );
};

// ============================================
// USER DROPDOWN
// ============================================
const UserDropdown = () => {
    const { user, profile, signOut, getRedirectPath } = useAuth();
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

    const handleDashboard = () => {
        setIsOpen(false);
        navigate(getRedirectPath());
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

            <div className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-zinc-200/80 bg-white py-2 shadow-xl shadow-zinc-200/50 transition-all duration-200 ease-out z-50 ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}>
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
                    <button onClick={handleDashboard} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                        <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                        <span>Vào Dashboard</span>
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

// ============================================
// MAIN HEADER COMPONENT
// ============================================
export const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDropdownToggle = (name) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const closeDropdown = () => setOpenDropdown(null);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/50 shadow-sm' : 'bg-transparent'
            }`}>
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <nav className="flex items-center justify-between h-24">
                    {/* Logo */}
                    <Link to="/" className="group flex items-center gap-2">
                        <img src={logoImage} alt="Skill Master Logo" className="h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        <NavDropdown label="Khóa học" isOpen={openDropdown === 'courses'} onToggle={() => handleDropdownToggle('courses')} onClose={closeDropdown}>
                            <div className="w-[520px] p-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <DropdownSection title="Tiếng Anh">
                                        <DropdownItem icon={Globe} title="IELTS Academic" description="Luyện thi IELTS từ 5.0 - 8.0+" href="/courses" />
                                        <DropdownItem icon={Award} title="TOEIC 4 kỹ năng" description="Đạt 650+ với giáo trình ETS" href="/courses" />
                                        <DropdownItem icon={MessageCircle} title="Giao tiếp thực chiến" description="Tự tin nói tiếng Anh trong 3 tháng" href="/courses" />
                                        <DropdownItem icon={Users} title="Tiếng Anh cho trẻ em" description="Chương trình Cambridge Kids" href="/courses" />
                                    </DropdownSection>
                                    <DropdownSection title="Tin học">
                                        <DropdownItem icon={FileText} title="Tin học văn phòng" description="Word, Excel, PowerPoint chuẩn MOS" href="/courses" />
                                        <DropdownItem icon={Layers} title="IC3 Digital Literacy" description="Chứng chỉ quốc tế về CNTT" href="/courses" />
                                        <DropdownItem icon={Target} title="Excel nâng cao" description="Pivot, VBA, Dashboard chuyên sâu" href="/courses" />
                                        <DropdownItem icon={BarChart3} title="Phân tích dữ liệu" description="Power BI, SQL cơ bản" href="/courses" />
                                    </DropdownSection>
                                </div>
                                <Link to="/courses" className="block mt-2 mx-2 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">Xem tất cả khóa học</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">20+ khóa học đa dạng trình độ</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-red-600" />
                                    </div>
                                </Link>
                            </div>
                        </NavDropdown>

                        <NavDropdown label="Lộ trình" isOpen={openDropdown === 'roadmap'} onToggle={() => handleDropdownToggle('roadmap')} onClose={closeDropdown}>
                            <div className="w-[320px] p-2">
                                <DropdownSection title="Theo mục tiêu">
                                    <DropdownItem icon={GraduationCap} title="Du học & Định cư" description="IELTS 6.5+ trong 6 tháng" href="/roadmap/study-abroad" />
                                    <DropdownItem icon={Target} title="Việc làm & Thăng tiến" description="TOEIC + Tin học văn phòng" href="/roadmap/career" />
                                    <DropdownItem icon={BookMarked} title="Mất gốc tiếng Anh" description="Lấy lại căn bản sau 2 tháng" href="/roadmap/basic" />
                                </DropdownSection>
                            </div>
                        </NavDropdown>

                        <Link to="/blog" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Tin tức</Link>
                        <Link to="/about" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Về chúng tôi</Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden lg:flex items-center gap-4">
                        {isAuthenticated ? (
                            <UserDropdown />
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-4 py-2 transition-colors">Đăng nhập</Link>
                                <Link to="/register" className="inline-flex items-center justify-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:shadow-zinc-900/30">Đăng ký ngay</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="lg:hidden p-2 text-zinc-600 hover:bg-stone-100 rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </nav>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden absolute top-24 left-0 right-0 bg-white border-t border-stone-200 p-6 shadow-xl animate-fade-in-down">
                    <div className="flex flex-col gap-4">
                        <Link to="/courses" className="font-medium text-lg text-zinc-900">Khóa học</Link>
                        <Link to="/roadmap" className="font-medium text-lg text-zinc-900">Lộ trình</Link>
                        <Link to="/blog" className="font-medium text-lg text-zinc-900">Tin tức</Link>
                        <Link to="/about" className="font-medium text-lg text-zinc-900">Về chúng tôi</Link>
                        <hr className="border-stone-100" />
                        {isAuthenticated ? (
                            <div className="flex flex-col gap-2">
                                <Link to="/dashboard" className="px-4 py-3 bg-zinc-50 rounded-xl font-medium text-zinc-900">Vào Dashboard</Link>
                                <Link to="/profile" className="px-4 py-3 bg-zinc-50 rounded-xl font-medium text-zinc-900">Hồ sơ cá nhân</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/login" className="flex items-center justify-center px-4 py-3 border border-stone-200 rounded-xl font-semibold text-zinc-700">Đăng nhập</Link>
                                <Link to="/register" className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl font-semibold">Đăng ký</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};
