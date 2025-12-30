import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown, ArrowRight, LogOut, User, Settings,
  LayoutDashboard, Globe, Award, MessageCircle, Users,
  FileText, Layers, Target, BarChart3, GraduationCap,
  Building2, BookOpen, Zap, Heart, School, Star,
  Newspaper, Video, BookMarked, HelpCircle, Phone,
  Mail, Calendar, MapPin, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import logoImage from '@/assets/logo.png';
import { SearchOverlay } from '@/pages/public/blog/components/SearchOverlay';
import { ConsultationModal, BookingModal } from '@/components/common';

// ============================================
// USER DROPDOWN
// ============================================
const UserDropdown = () => {
  const { user, profile, signOut, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const roleCode = profile?.roles?.code;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      <div className={`
          absolute right-0 top-full mt-2 w-64 origin-top-right
          rounded-2xl border border-zinc-200/80 bg-white py-2 
          shadow-xl shadow-zinc-200/50
          transition-all duration-200 ease-out z-50
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}
        `}>
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
          <button onClick={() => { setIsOpen(false); navigate(getRedirectPath()); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
            <LayoutDashboard className="h-4 w-4 text-zinc-400" /> <span>Vào Dashboard</span>
          </button>
          <button onClick={() => { setIsOpen(false); navigate('/profile'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
            <User className="h-4 w-4 text-zinc-400" /> <span>Hồ sơ cá nhân</span>
          </button>
          <button onClick={() => { setIsOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
            <Settings className="h-4 w-4 text-zinc-400" /> <span>Cài đặt</span>
          </button>
          <div className="my-1 mx-3 border-t border-zinc-100" />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4 text-red-500" /> <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// NAV DROPDOWN
// ============================================
const NavDropdown = ({ label, children, isOpen, onToggle, onClose, className }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 group ${className || 'text-zinc-500 hover:text-zinc-900'}`}
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`
          absolute top-full left-0 mt-4 min-w-[280px] origin-top-left
          bg-white rounded-2xl border border-stone-200/80 shadow-xl shadow-stone-200/50
          transition-all duration-200 ease-out z-50
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}
        `}>
        {children}
      </div>
    </div>
  );
};

const DropdownSection = ({ title, children }) => (
  <div className="py-2">
    {title && <p className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{title}</p>}
    <div className="px-2">{children}</div>
  </div>
);

const DropdownItem = ({ icon: Icon, title, description, href = '#', onClick }) => {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer group">
      <div className="flex-shrink-0 w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
        <Icon className="w-5 h-5 text-zinc-500 group-hover:text-red-600 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 group-hover:text-red-600 transition-colors">{title}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{description}</p>}
      </div>
    </div>
  );
  return onClick ? <button onClick={onClick} className="w-full text-left">{content}</button> : <Link to={href} className="block">{content}</Link>;
};

const MobileNavItem = ({ label, href, onClick }) => (
  <Link to={href} onClick={onClick} className="block px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-stone-50">
    {label}
  </Link>
);

// ============================================
// MAIN HEADER
// ============================================
const PublicHeader = ({ transparent = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  const handleDropdownToggle = (name) => setOpenDropdown(openDropdown === name ? null : name);
  const closeDropdown = () => setOpenDropdown(null);

  const isTransparent = transparent && !scrolled && !mobileMenuOpen;

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isTransparent
    ? 'bg-transparent border-transparent text-white'
    : 'bg-white/90 backdrop-blur-xl border-stone-200/50 text-zinc-900 shadow-sm'
    }`;

  const navLinkClasses = `text-sm font-medium transition-colors duration-200 ${isTransparent ? 'text-white/80 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
    }`;

  return (
    <>
      <header className={headerClasses}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <nav className="flex items-center justify-between h-24">
            <Link to="/" className="group flex items-center gap-2">
              <img
                src={logoImage}
                alt="Skill Master"
                className={`h-24 w-auto object-contain group-hover:scale-105 transition-transform duration-300 ${isTransparent ? 'brightness-0 invert opacity-90' : ''}`}
              />
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <NavDropdown label="Khóa học" className={navLinkClasses} isOpen={openDropdown === 'courses'} onToggle={() => handleDropdownToggle('courses')} onClose={closeDropdown}>
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
                  <Link to="/courses" onClick={closeDropdown} className="block mt-2 mx-2 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-semibold text-zinc-900">Xem tất cả khóa học</p><p className="text-xs text-zinc-500 mt-0.5">20+ khóa học đa dạng trình độ</p></div>
                      <ArrowRight className="w-5 h-5 text-red-600" />
                    </div>
                  </Link>
                </div>
              </NavDropdown>

              <NavDropdown label="Lộ trình" className={navLinkClasses} isOpen={openDropdown === 'roadmap'} onToggle={() => handleDropdownToggle('roadmap')} onClose={closeDropdown}>
                <div className="w-[320px] p-2">
                  <DropdownSection title="Theo mục tiêu">
                    <DropdownItem icon={GraduationCap} title="Du học & Định cư" description="IELTS 6.5+ trong 6 tháng" href="/roadmap#du-hoc" />
                    <DropdownItem icon={Building2} title="Thăng tiến công việc" description="TOEIC 700+ & Excel Expert" href="/roadmap#cong-viec" />
                    <DropdownItem icon={BookOpen} title="Học sinh - Sinh viên" description="Nền tảng vững, điểm cao" href="/roadmap#hoc-sinh" />
                  </DropdownSection>
                  <div className="border-t border-stone-100 my-1" />
                  <DropdownSection title="Theo trình độ">
                    <DropdownItem icon={Zap} title="Người mới bắt đầu" description="Từ zero đến hero" href="/roadmap#beginner" />
                    <DropdownItem icon={Target} title="Trình độ trung cấp" description="Bứt phá giới hạn" href="/roadmap#intermediate" />
                    <DropdownItem icon={Award} title="Nâng cao & Chuyên sâu" description="Chinh phục đỉnh cao" href="/roadmap#advanced" />
                  </DropdownSection>
                </div>
              </NavDropdown>

              <NavDropdown label="Về chúng tôi" className={navLinkClasses} isOpen={openDropdown === 'about'} onToggle={() => handleDropdownToggle('about')} onClose={closeDropdown}>
                <div className="w-[280px] p-2">
                  <DropdownSection title="Giới thiệu">
                    <DropdownItem icon={Heart} title="Câu chuyện Skill Master" description="Sứ mệnh & giá trị cốt lõi" href="/about#story" />
                    <DropdownItem icon={GraduationCap} title="Đội ngũ giảng viên" description="100% có chứng chỉ quốc tế" href="/about#team" />
                    <DropdownItem icon={School} title="Cơ sở vật chất" description="Phòng học hiện đại, tiện nghi" href="/about#facilities" />
                  </DropdownSection>
                  <div className="border-t border-stone-100 my-1" />
                  <DropdownSection title="Thành tựu">
                    <DropdownItem icon={Star} title="Học viên tiêu biểu" description="Câu chuyện thành công" href="/about#success" />
                    <DropdownItem icon={Award} title="Chứng nhận & Giải thưởng" description="Đối tác Cambridge, ETS" href="/about#achievements" />
                  </DropdownSection>
                </div>
              </NavDropdown>

              <NavDropdown label="Tài nguyên" className={navLinkClasses} isOpen={openDropdown === 'resources'} onToggle={() => handleDropdownToggle('resources')} onClose={closeDropdown}>
                <div className="w-[280px] p-2">
                  <DropdownSection title="Học miễn phí">
                    <DropdownItem icon={Newspaper} title="Blog chia sẻ" description="Tips học hiệu quả mỗi ngày" href="/blog" />
                    <DropdownItem icon={Video} title="Video bài giảng" description="Kho video 500+ bài học" href="/resources#videos" />
                    <DropdownItem icon={BookMarked} title="Tài liệu miễn phí" description="Đề thi, flashcard, ebook" href="/resources#materials" />
                  </DropdownSection>
                  <div className="border-t border-stone-100 my-1" />
                  <DropdownSection title="Kiểm tra">
                    <DropdownItem icon={Target} title="Test trình độ" description="Đánh giá năng lực miễn phí" href="/assessment" />
                    <DropdownItem icon={HelpCircle} title="Tư vấn lộ trình" description="Chuyên gia tư vấn 1-1 miễn phí" onClick={() => { closeDropdown(); setShowConsultationModal(true); }} />
                  </DropdownSection>
                </div>
              </NavDropdown>

              <NavDropdown label="Liên hệ" className={navLinkClasses} isOpen={openDropdown === 'contact'} onToggle={() => handleDropdownToggle('contact')} onClose={closeDropdown}>
                <div className="w-[280px] p-2">
                  <DropdownSection>
                    <DropdownItem icon={MessageCircle} title="Chat tư vấn" description="Hỗ trợ 8:00 - 21:00 hàng ngày" href="https://zalo.me/skillmaster" />
                    <DropdownItem icon={Phone} title="Hotline: 1900 xxxx" description="Gọi ngay để được tư vấn" href="tel:1900xxxx" />
                    <DropdownItem icon={Mail} title="Email" description="info@skillmaster.edu.vn" href="mailto:info@skillmaster.edu.vn" />
                    <DropdownItem icon={Calendar} title="Đặt lịch học thử" description="Trải nghiệm miễn phí 1 buổi" onClick={() => { closeDropdown(); setShowBookingModal(true); }} />
                  </DropdownSection>
                  <div className="mx-2 mt-2 p-3 bg-stone-50 rounded-xl">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-zinc-500">Tầng 5, Tòa nhà ABC, 123 Nguyễn Văn Linh, Quận 7, TP.HCM</p>
                    </div>
                  </div>
                </div>
              </NavDropdown>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Button */}
              <button
                className={`p-2 rounded-full transition-all duration-200 ${isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-stone-100'}`}
                aria-label="Tìm kiếm"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </button>

              {isAuthenticated ? (
                <UserDropdown />
              ) : (
                <>
                  <Link to="/login" className={`hidden sm:block text-sm font-medium transition-colors duration-200 ${isTransparent ? 'text-white/80 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className={`group relative px-5 py-2.5 text-sm font-medium rounded-full overflow-hidden transition-all duration-300 hover:bg-zinc-800 active:scale-95 ${isTransparent ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-stone-50'}`}>
                    <span className="relative z-10 flex items-center gap-2">
                      Đăng ký học thử <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`lg:hidden p-2 ${isTransparent ? 'text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </nav>

          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-stone-200 bg-white/95 backdrop-blur-xl">
              <div className="py-4 space-y-2">
                <MobileNavItem label="Khóa học" href="/courses" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem label="Lộ trình" href="/roadmap" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem label="Về chúng tôi" href="/about" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem label="Tài nguyên" href="/blog" onClick={() => setMobileMenuOpen(false)} />
                <MobileNavItem label="Liên hệ" href="/contact" onClick={() => setMobileMenuOpen(false)} />
                {!isAuthenticated && (
                  <div className="pt-4 px-4 space-y-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full py-3 text-center text-sm font-medium text-zinc-700 border border-stone-200 rounded-full hover:bg-stone-50">Đăng nhập</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full py-3 text-center text-sm font-medium text-white bg-zinc-900 rounded-full hover:bg-zinc-800">Đăng ký học thử</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Global Search Overlay */}
          <SearchOverlay
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
        </div>

      </header>

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        source="public_header"
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        source="public_header"
      />
    </>
  );
};

export default PublicHeader;
