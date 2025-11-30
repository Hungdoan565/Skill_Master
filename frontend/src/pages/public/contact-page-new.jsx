import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ArrowUpRight, Phone, Mail, MapPin, Clock, 
  MessageCircle, Send, CheckCircle, Calendar, Users, ChevronDown
} from 'lucide-react';

// ============================================
// CONTACT PAGE - SWISS MINIMALISM
// ============================================
// Design Philosophy:
// - STRICT grid system with border separations
// - Monochromatic palette (Black & White) + One accent (#FF4D00)
// - Typography hierarchy through weight/size, NOT color
// - No shadows, sharp corners, flat and honest
// - Subtle hover states (underline, opacity)
// ============================================

// Intersection Observer Hook
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

// ============================================
// HEADER
// ============================================
const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-900 transition-all duration-200 ${
      scrolled ? 'bg-white/95 backdrop-blur-sm' : ''
    }`}>
      <div className="max-w-[1600px] mx-auto">
        <nav className="flex items-center justify-between h-16 px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
              <span className="text-sm font-bold text-white tracking-tighter">SM</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              Skill Master
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/courses">Khóa học</NavLink>
            <NavLink to="/roadmap">Lộ trình</NavLink>
            <NavLink to="/about">Về chúng tôi</NavLink>
            <NavLink to="/contact" active>Liên hệ</NavLink>
          </div>

          <div className="flex items-center gap-6">
            <Link 
              to="/login"
              className="text-sm font-medium text-neutral-900 hover:opacity-60 transition-opacity duration-150"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 bg-neutral-900 text-white text-sm font-medium
                       hover:bg-neutral-800 active:bg-neutral-700 transition-colors duration-150"
            >
              Đăng ký học
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

const NavLink = ({ to, children, active }) => {
  const baseClasses = `text-sm font-medium transition-opacity duration-150 relative group ${
    active ? 'text-neutral-900' : 'text-neutral-900 hover:opacity-60'
  }`;
  
  return (
    <Link to={to} className={baseClasses}>
      {children}
      <span className={`absolute -bottom-1 left-0 h-px bg-neutral-900 transition-all duration-200 ${
        active ? 'w-full' : 'w-0 group-hover:w-full'
      }`} />
    </Link>
  );
};

// ============================================
// PAGE HEADER + FORM SECTION
// ============================================
const HeroSection = () => {
  const [ref, isInView] = useInView();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section ref={ref} className="pt-16 border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12">
          
          {/* Left - Title & Quick Contact */}
          <div className="lg:col-span-5 lg:border-r border-neutral-900">
            {/* Header */}
            <div className={`p-6 lg:p-12 border-b border-neutral-200
                          transform transition-all duration-500
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-neutral-500 mb-6">
                <span className="w-8 h-px bg-neutral-400" />
                Liên hệ
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
                Chúng tôi luôn sẵn sàng
              </h1>
              <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
                Có câu hỏi về khóa học? Cần tư vấn lộ trình phù hợp? 
                Hãy để lại thông tin, chúng tôi sẽ liên hệ trong 24 giờ.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 border-b border-neutral-200">
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-200
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-2xl lg:text-3xl font-bold text-neutral-900">&lt;24h</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Phản hồi</p>
              </div>
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-300
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-2xl lg:text-3xl font-bold text-neutral-900">3</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Cơ sở</p>
              </div>
              <div className={`p-6 lg:p-8
                           transform transition-all duration-500 delay-400
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-2xl lg:text-3xl font-bold text-neutral-900">8-21h</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Hỗ trợ</p>
              </div>
            </div>

            {/* Quick Contact Links */}
            <div className={`transform transition-all duration-500 delay-500
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <a href="tel:19001234" 
                 className="flex items-center gap-4 p-6 lg:p-8 border-b border-neutral-200
                          hover:bg-neutral-50 transition-colors group">
                <div className="w-12 h-12 bg-[#FF4D00] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Hotline</p>
                  <p className="text-lg font-semibold text-neutral-900">1900 1234</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </a>

              <a href="mailto:info@skillmaster.edu.vn"
                 className="flex items-center gap-4 p-6 lg:p-8
                          hover:bg-neutral-50 transition-colors group">
                <div className="w-12 h-12 bg-neutral-900 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider">Email</p>
                  <p className="text-lg font-semibold text-neutral-900">info@skillmaster.edu.vn</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </a>
            </div>
          </div>

          {/* Right - Form */}
          <div className="lg:col-span-7 p-6 lg:p-12">
            <div className={`transform transition-all duration-500 delay-200
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              
              {submitted ? (
                /* Success State */
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-neutral-900 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Gửi thành công!</h3>
                  <p className="text-neutral-500 mb-8">
                    Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-[#FF4D00] font-medium hover:underline">
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Gửi tin nhắn</h2>
                    <p className="text-neutral-500">Điền thông tin bên dưới để được hỗ trợ nhanh nhất.</p>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-4 bg-white border border-neutral-200
                                 focus:outline-none focus:border-neutral-900 transition-colors duration-150"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-4 bg-white border border-neutral-200
                                 focus:outline-none focus:border-neutral-900 transition-colors duration-150"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-4 bg-white border border-neutral-200
                               focus:outline-none focus:border-neutral-900 transition-colors duration-150"
                      placeholder="0901 234 567"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                      Chủ đề
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-4 py-4 bg-white border border-neutral-200
                               focus:outline-none focus:border-neutral-900 transition-colors duration-150
                               appearance-none cursor-pointer"
                    >
                      <option value="">Chọn chủ đề</option>
                      <option value="tuvan">Tư vấn khóa học</option>
                      <option value="dangky">Đăng ký học thử</option>
                      <option value="lotrinh">Tư vấn lộ trình</option>
                      <option value="hotro">Hỗ trợ kỹ thuật</option>
                      <option value="khac">Khác</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                      Tin nhắn
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-4 py-4 bg-white border border-neutral-200
                               focus:outline-none focus:border-neutral-900 transition-colors duration-150
                               resize-none"
                      placeholder="Nội dung tin nhắn..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-neutral-900 text-white text-sm font-semibold uppercase tracking-wider
                             flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors
                             disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi tin nhắn
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-neutral-500">
                    Bằng việc gửi form, bạn đồng ý với{' '}
                    <Link to="/privacy" className="text-neutral-900 underline hover:opacity-60">
                      Chính sách bảo mật
                    </Link>{' '}
                    của chúng tôi.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// QUICK ACTIONS SECTION
// ============================================
const QuickActionsSection = () => {
  const [ref, isInView] = useInView();

  const actions = [
    {
      icon: Calendar,
      title: 'Đặt lịch học thử',
      desc: 'Trải nghiệm 1 buổi học miễn phí',
      link: '/register',
      primary: true
    },
    {
      icon: MessageCircle,
      title: 'Chat tư vấn viên',
      desc: 'Hỗ trợ 8:00 - 21:00',
      link: '#'
    },
    {
      icon: Users,
      title: 'Cộng đồng học viên',
      desc: '10,000+ thành viên',
      link: '#'
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Kết nối nhanh
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Chọn cách liên hệ
            </h2>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid lg:grid-cols-3">
          {actions.map((action, i) => (
            <Link 
              key={i}
              to={action.link}
              className={`p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200 last:border-r-0
                       hover:bg-neutral-50 transition-colors duration-150 group
                       ${action.primary ? 'bg-neutral-900 hover:bg-neutral-800' : ''}
                       transform transition-all duration-500
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 flex items-center justify-center
                              ${action.primary ? 'bg-[#FF4D00]' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                  <action.icon className={`w-5 h-5 ${action.primary ? 'text-white' : 'text-neutral-900'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-1
                               ${action.primary ? 'text-white' : 'text-neutral-900'}`}>
                    {action.title}
                  </h3>
                  <p className={`text-sm ${action.primary ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {action.desc}
                  </p>
                </div>
                <ArrowUpRight className={`w-5 h-5 
                                        ${action.primary ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-900'}
                                        transition-colors`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// LOCATIONS SECTION
// ============================================
const LocationsSection = () => {
  const [ref, isInView] = useInView();
  const [activeLocation, setActiveLocation] = useState(0);

  const locations = [
    {
      name: 'Quận 1',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      phone: '028 1234 5678',
      hours: '8:00 - 21:00'
    },
    {
      name: 'Quận 7',
      address: '456 Nguyễn Thị Thập, Phường Tân Phong, Quận 7, TP.HCM',
      phone: '028 2345 6789',
      hours: '8:00 - 21:00'
    },
    {
      name: 'Bình Thạnh',
      address: '789 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
      phone: '028 3456 7890',
      hours: '8:00 - 21:00'
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Địa điểm
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Ghé thăm cơ sở gần nhất
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-12">
          {/* Left - Location Tabs */}
          <div className="lg:col-span-4 lg:border-r border-neutral-200">
            {locations.map((loc, i) => (
              <button
                key={i}
                onClick={() => setActiveLocation(i)}
                className={`w-full text-left p-6 lg:p-8 border-b border-neutral-200 last:border-b-0
                         transition-colors duration-150
                         ${activeLocation === i ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}
                         transform transition-all duration-500
                         ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${100 + i * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${activeLocation === i ? 'text-white' : 'text-neutral-900'}`}>
                    Cơ sở {loc.name}
                  </span>
                  <ArrowRight className={`w-4 h-4 transition-transform
                                        ${activeLocation === i ? 'text-white' : 'text-neutral-400'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Right - Location Details */}
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500 delay-300
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            
            {/* Map Placeholder */}
            <div className="aspect-video bg-neutral-100 mb-8 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-neutral-300" />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Địa chỉ</p>
                <p className="text-neutral-900">{locations[activeLocation].address}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Điện thoại</p>
                <p className="text-neutral-900">{locations[activeLocation].phone}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Giờ làm việc</p>
                <p className="text-neutral-900">{locations[activeLocation].hours}</p>
              </div>
              <div>
                <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white
                                     text-sm font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors">
                  Chỉ đường
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FAQ SECTION
// ============================================
const FAQSection = () => {
  const [ref, isInView] = useInView();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Làm sao để đăng ký học thử?',
      a: 'Bạn có thể đăng ký qua form trên website, gọi hotline 1900 1234, hoặc đến trực tiếp cơ sở gần nhất. Chúng tôi sẽ liên hệ để xếp lịch trong 24h.'
    },
    {
      q: 'Học phí các khóa học như thế nào?',
      a: 'Học phí dao động từ 3-8 triệu/khóa tùy theo chương trình và thời lượng. Chúng tôi hỗ trợ trả góp 0% và nhiều ưu đãi cho học viên đăng ký sớm.'
    },
    {
      q: 'Có cam kết đầu ra không?',
      a: 'Có. Skill Master cam kết đầu ra bằng văn bản. Nếu không đạt mục tiêu, học viên được học lại miễn phí cho đến khi đạt.'
    },
    {
      q: 'Lịch học như thế nào?',
      a: 'Lịch học linh hoạt với nhiều ca trong ngày: sáng (8-10h), chiều (14-16h), tối (18-20h). Học viên có thể đổi ca khi cần.'
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Hỗ trợ
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Câu hỏi thường gặp
            </h2>
          </div>
        </div>

        {/* FAQ List */}
        {faqs.map((faq, i) => (
          <div 
            key={i}
            className={`border-b border-neutral-200 last:border-b-0
                     transform transition-all duration-500
                     ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${100 + i * 100}ms` }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              className="w-full grid lg:grid-cols-12 hover:bg-neutral-50 transition-colors"
            >
              <div className="lg:col-span-1 p-6 lg:p-8 lg:border-r border-neutral-200 text-left">
                <span className="text-sm font-medium text-neutral-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="lg:col-span-9 p-6 lg:p-8 lg:border-r border-neutral-200 text-left">
                <span className="font-semibold text-neutral-900">{faq.q}</span>
              </div>
              <div className="lg:col-span-2 p-6 lg:p-8 flex items-center justify-end">
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-200
                                       ${openIndex === i ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300
                          ${openIndex === i ? 'max-h-48' : 'max-h-0'}`}>
              <div className="grid lg:grid-cols-12 bg-neutral-50">
                <div className="lg:col-span-1 lg:border-r border-neutral-200" />
                <div className="lg:col-span-9 p-6 lg:p-8 lg:border-r border-neutral-200">
                  <p className="text-neutral-600 leading-relaxed">{faq.a}</p>
                </div>
                <div className="lg:col-span-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============================================
// FOOTER
// ============================================
const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200">
          <div className="p-6 lg:p-8 md:border-r border-neutral-200">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
                <span className="text-sm font-bold text-white tracking-tighter">SM</span>
              </div>
              <span className="text-base font-semibold tracking-tight text-neutral-900">
                Skill Master
              </span>
            </Link>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Hệ thống đào tạo Anh ngữ và Tin học hàng đầu.
            </p>
          </div>

          <div className="p-6 lg:p-8 md:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Khóa học</h4>
            <ul className="space-y-2">
              {['IELTS Academic', 'TOEIC 4 Kỹ năng', 'Tin học Văn phòng', 'IC3 Digital'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-900 hover:opacity-60 transition-opacity">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 lg:p-8 md:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Về chúng tôi</h4>
            <ul className="space-y-2">
              {['Giới thiệu', 'Đội ngũ', 'Blog', 'Tuyển dụng'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-900 hover:opacity-60 transition-opacity">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 lg:p-8">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>123 Nguyễn Văn Linh, Q.7, TP.HCM</li>
              <li>contact@skillmaster.vn</li>
              <li>0909 123 456</li>
            </ul>
          </div>
        </div>

        <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">© 2025 Skill Master. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">Điều khoản</a>
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">Bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN PAGE
// ============================================
export const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white antialiased">
      <Header />
      <main>
        <HeroSection />
        <QuickActionsSection />
        <LocationsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
