import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Play, CheckCircle2, Users, BookOpen, Award, Clock,
  ChevronDown, LogOut, User, Settings, LayoutDashboard, Building2, GraduationCap,
  CalendarDays, BarChart3, Shield, Headphones, FileText, MessageCircle, Mail,
  Phone, MapPin, Zap, Globe, CreditCard, PieChart, UserCheck, School, Layers,
  BookMarked, Video, HelpCircle, Newspaper, Calendar, Heart, Star, Target
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// Import logo
import logoImage from '@/assets/logo.png';

// Import modular components
import { SEOHead } from './components/seo-head';
import { HeroSection, StatsSection, FAQSection, TeacherCarousel } from './sections';
import { useInView } from './hooks/use-in-view';
import { courses, testimonials, methodSteps, footerLinks } from './constants/landing-data';

// ============================================
// SWISS MINIMALISM LANDING PAGE - REFACTORED
// ============================================
// Modular architecture with separated components
// SEO optimized with meta tags and structured data
// Accessibility improved with ARIA labels
// ============================================

// Animated counter component (kept here temporarily for other sections)
const Counter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, isInView] = useInView();

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ============================================
// USER DROPDOWN - Thay thế nút đăng nhập khi đã login
// ============================================
const UserDropdown = () => {
  const { user, profile, signOut, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;
  const roleCode = profile?.roles?.code;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 
          transition-all duration-200 cursor-pointer
          hover:bg-zinc-100 border border-transparent
          ${isOpen ? 'bg-zinc-100 border-zinc-200' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
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
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute right-0 top-full mt-2 w-64 origin-top-right
          rounded-2xl border border-zinc-200/80 bg-white py-2 
          shadow-xl shadow-zinc-200/50
          transition-all duration-200 ease-out z-50
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 visible'
            : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
          }
        `}
        role="menu"
        aria-hidden={!isOpen}
      >
        {/* User Info Header */}
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

        {/* Menu Items */}
        <div className="py-1">
          <button
            onClick={handleDashboard}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            role="menuitem"
          >
            <LayoutDashboard className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Vào Dashboard</span>
          </button>
          <button
            onClick={() => { setIsOpen(false); navigate('/profile'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            role="menuitem"
          >
            <User className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Hồ sơ cá nhân</span>
          </button>
          <button
            onClick={() => { setIsOpen(false); navigate('/settings'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            role="menuitem"
          >
            <Settings className="h-4 w-4 text-zinc-400" aria-hidden="true" />
            <span>Cài đặt</span>
          </button>

          <div className="my-1 mx-3 border-t border-zinc-100" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            role="menuitem"
          >
            <LogOut className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// NAVBAR DROPDOWN COMPONENT
// ============================================
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

// Dropdown Menu Item
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

// Dropdown Section Header
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

// ============================================
// HEADER COMPONENT - With Dropdowns for Students
// ============================================
const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
      ? 'bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/50'
      : 'bg-transparent'
      }`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <nav className="flex items-center justify-between h-24" role="navigation" aria-label="Main navigation">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2" aria-label="Skill Master Home">
            <img
              src={logoImage}
              alt="Skill Master Logo"
              className="h-24 w-auto object-contain
                       group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Navigation Links with Dropdowns - Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Khóa học Dropdown */}
            <NavDropdown
              label="Khóa học"
              isOpen={openDropdown === 'courses'}
              onToggle={() => handleDropdownToggle('courses')}
              onClose={closeDropdown}
            >
              <div className="w-[520px] p-2">
                <div className="grid grid-cols-2 gap-1">
                  <DropdownSection title="Tiếng Anh">
                    <DropdownItem
                      icon={Globe}
                      title="IELTS Academic"
                      description="Luyện thi IELTS từ 5.0 - 8.0+"
                      href="/courses"
                    />
                    <DropdownItem
                      icon={Award}
                      title="TOEIC 4 kỹ năng"
                      description="Đạt 650+ với giáo trình ETS"
                      href="/courses"
                    />
                    <DropdownItem
                      icon={MessageCircle}
                      title="Giao tiếp thực chiến"
                      description="Tự tin nói tiếng Anh trong 3 tháng"
                      href="/courses"
                    />
                    <DropdownItem
                      icon={Users}
                      title="Tiếng Anh cho trẻ em"
                      description="Chương trình Cambridge Kids"
                      href="/courses"
                    />
                  </DropdownSection>
                  <DropdownSection title="Tin học">
                    <DropdownItem
                      icon={FileText}
                      title="Tin học văn phòng"
                      description="Word, Excel, PowerPoint chuẩn MOS"
                      href="/courses"
                    />
                    <DropdownItem
                      icon={Layers}
                      title="IC3 Digital Literacy"
                      description="Chứng chỉ quốc tế về CNTT"
                      href="/courses"
                    />
                    <DropdownItem
                      icon={Target}
                      title="Excel nâng cao"
                      description="Pivot, VBA, Dashboard chuyên sâu"
                      href="/courses"
                    />
                    <DropdownItem
                      icon={BarChart3}
                      title="Phân tích dữ liệu"
                      description="Power BI, SQL cơ bản"
                      href="/courses"
                    />
                  </DropdownSection>
                </div>
                {/* View All CTA */}
                <Link to="/courses" className="block mt-2 mx-2 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Xem tất cả khóa học</p>
                      <p className="text-xs text-zinc-500 mt-0.5">20+ khóa học đa dạng trình độ</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-red-600" aria-hidden="true" />
                  </div>
                </Link>
              </div>
            </NavDropdown>

            {/* Lộ trình Dropdown */}
            <NavDropdown
              label="Lộ trình"
              isOpen={openDropdown === 'roadmap'}
              onToggle={() => handleDropdownToggle('roadmap')}
              onClose={closeDropdown}
            >
              <div className="w-[320px] p-2">
                <DropdownSection title="Theo mục tiêu">
                  <DropdownItem
                    icon={GraduationCap}
                    title="Du học & Định cư"
                    description="IELTS 6.5+ trong 6 tháng"
                    href="/roadmap#du-hoc"
                  />
                  <DropdownItem
                    icon={Building2}
                    title="Thăng tiến công việc"
                    description="TOEIC 700+ & Excel Expert"
                    href="/roadmap#cong-viec"
                  />
                  <DropdownItem
                    icon={BookOpen}
                    title="Học sinh - Sinh viên"
                    description="Nền tảng vững, điểm cao"
                    href="/roadmap#hoc-sinh"
                  />
                </DropdownSection>
                <div className="border-t border-stone-100 my-1" />
                <DropdownSection title="Theo trình độ">
                  <DropdownItem
                    icon={Zap}
                    title="Người mới bắt đầu"
                    description="Từ zero đến hero"
                    href="/roadmap#beginner"
                  />
                  <DropdownItem
                    icon={Target}
                    title="Trình độ trung cấp"
                    description="Bứt phá giới hạn"
                    href="/roadmap#intermediate"
                  />
                  <DropdownItem
                    icon={Award}
                    title="Nâng cao & Chuyên sâu"
                    description="Chinh phục đỉnh cao"
                    href="/roadmap#advanced"
                  />
                </DropdownSection>
              </div>
            </NavDropdown>

            {/* Về chúng tôi Dropdown */}
            <NavDropdown
              label="Về chúng tôi"
              isOpen={openDropdown === 'about'}
              onToggle={() => handleDropdownToggle('about')}
              onClose={closeDropdown}
            >
              <div className="w-[280px] p-2">
                <DropdownSection title="Giới thiệu">
                  <DropdownItem
                    icon={Heart}
                    title="Câu chuyện Skill Master"
                    description="Sứ mệnh & giá trị cốt lõi"
                    href="/about#story"
                  />
                  <DropdownItem
                    icon={GraduationCap}
                    title="Đội ngũ giảng viên"
                    description="100% có chứng chỉ quốc tế"
                    href="/about#team"
                  />
                  <DropdownItem
                    icon={School}
                    title="Cơ sở vật chất"
                    description="Phòng học hiện đại, tiện nghi"
                    href="/about#facilities"
                  />
                </DropdownSection>
                <div className="border-t border-stone-100 my-1" />
                <DropdownSection title="Thành tựu">
                  <DropdownItem
                    icon={Star}
                    title="Học viên tiêu biểu"
                    description="Câu chuyện thành công"
                    href="/about#success"
                  />
                  <DropdownItem
                    icon={Award}
                    title="Chứng nhận & Giải thưởng"
                    description="Đối tác Cambridge, ETS"
                    href="/about#achievements"
                  />
                </DropdownSection>
              </div>
            </NavDropdown>

            {/* Tài nguyên Dropdown */}
            <NavDropdown
              label="Tài nguyên"
              isOpen={openDropdown === 'resources'}
              onToggle={() => handleDropdownToggle('resources')}
              onClose={closeDropdown}
            >
              <div className="w-[280px] p-2">
                <DropdownSection title="Học miễn phí">
                  <DropdownItem
                    icon={Newspaper}
                    title="Blog chia sẻ"
                    description="Tips học hiệu quả mỗi ngày"
                    href="/blog"
                  />
                  <DropdownItem
                    icon={Video}
                    title="Video bài giảng"
                    description="Kho video 500+ bài học"
                    href="/resources#videos"
                  />
                  <DropdownItem
                    icon={BookMarked}
                    title="Tài liệu miễn phí"
                    description="Đề thi, flashcard, ebook"
                    href="/resources#materials"
                  />
                </DropdownSection>
                <div className="border-t border-stone-100 my-1" />
                <DropdownSection title="Kiểm tra">
                  <DropdownItem
                    icon={Target}
                    title="Test trình độ"
                    description="Đánh giá năng lực miễn phí"
                    href="/resources#test"
                  />
                  <DropdownItem
                    icon={HelpCircle}
                    title="Tư vấn lộ trình"
                    description="1-1 với chuyên gia"
                    href="/contact"
                  />
                </DropdownSection>
              </div>
            </NavDropdown>

            {/* Liên hệ Dropdown */}
            <NavDropdown
              label="Liên hệ"
              isOpen={openDropdown === 'contact'}
              onToggle={() => handleDropdownToggle('contact')}
              onClose={closeDropdown}
            >
              <div className="w-[280px] p-2">
                <DropdownSection>
                  <DropdownItem
                    icon={MessageCircle}
                    title="Chat tư vấn"
                    description="Hỗ trợ 8:00 - 21:00 hàng ngày"
                    href="/contact"
                  />
                  <DropdownItem
                    icon={Phone}
                    title="Hotline: 1900 xxxx"
                    description="Gọi ngay để được tư vấn"
                    href="tel:1900xxxx"
                  />
                  <DropdownItem
                    icon={Mail}
                    title="Email"
                    description="info@skillmaster.edu.vn"
                    href="mailto:info@skillmaster.edu.vn"
                  />
                  <DropdownItem
                    icon={Calendar}
                    title="Đặt lịch học thử"
                    description="Trải nghiệm miễn phí 1 buổi"
                    href="/contact#booking"
                  />
                </DropdownSection>
                {/* Address */}
                <div className="mx-2 mt-2 p-3 bg-stone-50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <p className="text-xs text-zinc-500">
                      Tầng 5, Tòa nhà ABC, 123 Nguyễn Văn Linh, Quận 7, TP.HCM
                    </p>
                  </div>
                </div>
              </div>
            </NavDropdown>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:block text-sm font-medium text-zinc-600 hover:text-zinc-900 
                           transition-colors duration-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="group relative px-5 py-2.5 bg-zinc-900 text-stone-50 text-sm font-medium
                           rounded-full overflow-hidden transition-all duration-300
                           hover:bg-zinc-800 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Đăng ký học thử
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </span>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-600 hover:text-zinc-900"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white/95 backdrop-blur-xl" role="menu">
            <div className="py-4 space-y-2">
              <MobileNavItem label="Khóa học" href="/courses" />
              <MobileNavItem label="Lộ trình" href="/roadmap" />
              <MobileNavItem label="Về chúng tôi" href="/about" />
              <MobileNavItem label="Tài nguyên" href="/blog" />
              <MobileNavItem label="Liên hệ" href="/contact" />
              {!isAuthenticated && (
                <div className="pt-4 px-4 space-y-2">
                  <Link to="/login" className="block w-full py-3 text-center text-sm font-medium text-zinc-700 
                                           border border-stone-200 rounded-full hover:bg-stone-50">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="block w-full py-3 text-center text-sm font-medium text-white 
                                              bg-zinc-900 rounded-full hover:bg-zinc-800">
                    Đăng ký học thử
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const MobileNavItem = ({ label, href }) => (
  <Link to={href} className="block px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-stone-50" role="menuitem">
    {label}
  </Link>
);

// ============================================
// COURSES SECTION - Training Programs
// ============================================
const CoursesSection = () => {
  const [ref, isInView] = useInView();

  return (
    <section id="courses" ref={ref} className="py-32 bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className={`max-w-2xl transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
            Chương trình đ ào tạo
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
            Lộ trình học tập
            <br />
            <span className="text-zinc-400">được thiết kế riêng</span>
          </h2>
          <p className="mt-6 text-lg text-zinc-500 leading-relaxed">
            Mỗi chương trình được xây dựng dựa trên phương pháp giảng dạy hiện đại,
            kết hợp lý thuyết và thực hành để đảm bảo hiệu quả tối đa.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {courses.map((course, index) => (
            <div
              key={index}
              className={`group relative p-8 bg-white rounded-3xl border border-stone-200
                       hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                       transition-all duration-500 cursor-pointer
                       transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Category Badge */}
              <span className={`inline-block px-3 py-1 ${course.bgColor} text-xs font-medium 
                            rounded-full mb-4`}>
                {course.category}
              </span>

              {/* Content */}
              <h3 className="font-display text-2xl font-bold text-zinc-900 
                          group-hover:text-zinc-700 transition-colors">
                {course.title}
              </h3>
              <p className="mt-3 text-zinc-500 leading-relaxed">
                {course.description}
              </p>

              {/* Features */}
              <div className="mt-6 flex flex-wrap gap-2">
                {course.features.map((feature, i) => (
                  <span key={i} className="px-3 py-1.5 bg-stone-100 text-zinc-600 
                                        text-sm rounded-lg">
                    {feature}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Thời lượng</p>
                  <p className="font-semibold text-zinc-900">{course.duration}</p>
                </div>
                <button
                  className={`flex items-center justify-center w-12 h-12 rounded-full
                              bg-gradient-to-br ${course.color} text-white
                              group-hover:scale-110 transition-transform duration-300`}
                  aria-label={`Xem chi tiết khóa ${course.title}`}
                >
                  <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Hover Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-0 
                           group-hover:opacity-[0.03] rounded-3xl transition-opacity duration-500`}
                aria-hidden="true" />
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className={`mt-12 text-center transform transition-all duration-700 delay-500
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 
                     font-medium transition-colors group"
          >
            Xem tất cả khóa học
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ============================================
// METHOD SECTION - Learning Approach
// ============================================
const MethodSection = () => {
  const [ref, isInView] = useInView();

  return (
    <section id="method" ref={ref} className="py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Visual */}
          <div className={`relative transform transition-all duration-1000
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Background Circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-50 
                           rounded-full" aria-hidden="true" />

              {/* Center Icon - Logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center
                             shadow-2xl shadow-zinc-900/20 border border-stone-100">
                  <img
                    src={logoImage}
                    alt="Skill Master Method"
                    className="h-20 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Orbiting Elements */}
              {methodSteps.map((step, index) => {
                const angle = (index * 90 - 45) * (Math.PI / 180);
                const radius = 42;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                return (
                  <div
                    key={index}
                    className="absolute w-16 h-16 bg-white rounded-2xl shadow-lg border border-stone-100
                             flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2
                             hover:scale-110 transition-transform cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    aria-label={`Step ${step.number}`}
                  >
                    <span className="font-display text-lg font-bold text-red-600">{step.number}</span>
                  </div>
                );
              })}

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#E7E5E4"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>

          {/* Right - Content */}
          <div className={`transform transition-all duration-1000 delay-200
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <span className="inline-block px-4 py-1.5 bg-red-600 text-white text-xs font-medium 
                          rounded-full uppercase tracking-wider mb-6">
              Phương pháp học
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
              4 bước đến thành công
            </h2>
            <p className="mt-6 text-lg text-zinc-500 leading-relaxed">
              Quy trình học tập khoa học, được chứng minh hiệu quả qua hàng nghìn học viên.
            </p>

            {/* Steps */}
            <div className="mt-12 space-y-8">
              {methodSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-6 transform transition-all duration-500
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-14 h-14 bg-stone-100 rounded-2xl
                               flex items-center justify-center"
                    aria-hidden="true">
                    <span className="font-display text-lg font-bold text-zinc-900">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-zinc-900">{step.title}</h3>
                    <p className="mt-1 text-zinc-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// TEACHERS SECTION - Our Instructors
// ============================================
const TeachersSection = () => {
  const [ref, isInView] = useInView();

  return (
    <section id="teachers" ref={ref} className="py-32 bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className={`text-center max-w-2xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
            Đội ngũ giảng viên
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
            Học từ những người
            <br />
            <span className="text-zinc-400">giỏi nhất trong ngành</span>
          </h2>
          <p className="mt-6 text-lg text-zinc-500">
            100% giảng viên có chứng chỉ quốc tế và kinh nghiệm giảng dạy chuyên sâu.
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teachers.map((teacher, index) => (
            <div
              key={index}
              className={`group p-6 bg-white rounded-3xl border border-stone-200
                       hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                       transition-all duration-500 text-center
                       transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300
                           flex items-center justify-center group-hover:scale-105 transition-transform"
                aria-hidden="true">
                <GraduationCap className="w-10 h-10 text-zinc-500" />
              </div>

              {/* Badge */}
              <span className="inline-block mt-4 px-3 py-1 bg-red-50 text-red-700 
                            text-xs font-semibold rounded-full">
                {teacher.badge}
              </span>

              {/* Info */}
              <h3 className="mt-4 font-semibold text-lg text-zinc-900">{teacher.name}</h3>
              <p className="text-sm text-zinc-500">{teacher.role}</p>

              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-zinc-400">{teacher.experience}</p>
                <p className="text-sm font-medium text-zinc-700 mt-1">{teacher.specialty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// TESTIMONIALS SECTION - Student Reviews
// ============================================
const TestimonialsSection = () => {
  const [ref, isInView] = useInView();

  return (
    <section id="testimonials" ref={ref} className="py-32 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className={`text-center max-w-2xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
            Đánh giá từ học viên
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
            Họ đã thành công
            <br />
            <span className="text-zinc-400">cùng Skill Master</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`group p-8 bg-stone-50 rounded-3xl border border-stone-200
                       hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                       transition-all duration-500
                       transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Quote */}
              <div className="relative">
                <span className="absolute -top-4 -left-2 font-display text-6xl text-stone-300 
                              select-none" aria-hidden="true">"</span>
                <p className="relative text-zinc-600 leading-relaxed">
                  {testimonial.content}
                </p>
              </div>

              {/* Result Badge */}
              <div className="mt-6">
                <span className="inline-block px-3 py-1.5 bg-green-100 text-green-700 
                              text-sm font-medium rounded-full">
                  {testimonial.result}
                </span>
              </div>

              {/* Author */}
              <div className="mt-6 pt-6 border-t border-stone-200 flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold text-zinc-900">{testimonial.author}</p>
                  <p className="text-sm text-zinc-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA SECTION - Student Registration
// ============================================
const CTASection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="py-32 bg-zinc-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
        <div className={`max-w-3xl mx-auto transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-display text-4xl lg:text-6xl font-bold text-white tracking-tight">
            Sẵn sàng bắt đầu
            <br />
            hành trình của bạn?
          </h2>
          <p className="mt-6 text-lg text-stone-400 leading-relaxed">
            Đăng ký học thử miễn phí ngay hôm nay.
            Trải nghiệm phương pháp học tập hiệu quả cùng giáo viên chuyên nghiệp.
          </p>

          {/* CTA Buttons */}
          <div className={`mt-12 flex flex-col sm:flex-row gap-4 justify-center
                        transform transition-all duration-700 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 
                      bg-white text-zinc-900 rounded-full font-semibold
                      hover:bg-zinc-100 transition-colors shadow-lg shadow-white/20"
            >
              Đăng ký học thử miễn phí
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 
                      border border-white/30 text-white rounded-full font-semibold
                      hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
              Tư vấn lộ trình
            </Link>
          </div>

          {/* Trust Note */}
          <p className="mt-8 text-sm text-stone-500">
            ✓ Cam kết đầu ra  •  ✓ Lớp học 8-12 học viên  •  ✓ Học lại miễn phí
          </p>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FOOTER COMPONENT
// ============================================
const Footer = () => {
  return (
    <footer className="bg-stone-100 border-t border-stone-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logoImage}
                alt="Skill Master Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-zinc-500 max-w-sm leading-relaxed">
              Trung tâm đào tạo Anh ngữ & Tin học uy tín.
              Cam kết đầu ra - Lộ trình cá nhân - Giáo viên chuyên nghiệp.
            </p>
            <div className="mt-6 flex gap-4">
              {['Facebook', 'YouTube', 'Zalo'].map(social => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 bg-white rounded-full border border-stone-200
                           flex items-center justify-center text-zinc-600
                           hover:bg-zinc-900 hover:text-white hover:border-zinc-900
                           transition-all"
                  aria-label={social}
                >
                  <span className="text-xs font-medium">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-zinc-900 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row 
                      justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            © 2025 Skill Master. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Điều khoản sử dụng
            </a>
            <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN LANDING PAGE COMPONENT - NOW MODULAR!
// ============================================
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased">
      <SEOHead />
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <CoursesSection />
        <MethodSection />
        <TeacherCarousel />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};
