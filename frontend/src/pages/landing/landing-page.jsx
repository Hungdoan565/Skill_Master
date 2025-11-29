import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Play, CheckCircle2, Users, BookOpen, Award, Clock } from 'lucide-react';

// ============================================
// SWISS MINIMALISM LANDING PAGE
// ============================================
// Design Philosophy:
// - Strong typographic hierarchy with Space Grotesk
// - Grid-based asymmetric layouts
// - Generous whitespace ("air" as luxury)
// - Swiss red accent (#DC2626) for CTAs
// - Off-white background (#FAFAF9) for warmth
// - Subtle entrance animations with stagger
// ============================================

// Intersection Observer hook for scroll animations
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

// Animated counter component
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
// HEADER COMPONENT
// ============================================
const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/50' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center
                           group-hover:scale-105 transition-transform duration-300">
                <span className="font-display text-lg font-bold text-stone-50">S</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-600 rounded-full
                           group-hover:scale-125 transition-transform duration-300" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-zinc-900">
              Skill Master
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="#programs">Chương trình</NavLink>
            <NavLink href="#method">Phương pháp</NavLink>
            <NavLink href="#results">Kết quả</NavLink>
            <NavLink href="#testimonials">Đánh giá</NavLink>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
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
                Bắt đầu ngay
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

const NavLink = ({ href, children }) => (
  <a 
    href={href}
    className="relative text-sm font-medium text-zinc-500 hover:text-zinc-900 
             transition-colors duration-200 group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 
                   group-hover:w-full transition-all duration-300" />
  </a>
);

// ============================================
// HERO SECTION
// ============================================
const HeroSection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-stone-50">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: `linear-gradient(#18181B 1px, transparent 1px),
                                linear-gradient(90deg, #18181B 1px, transparent 1px)`,
               backgroundSize: '60px 60px'
             }} />
        {/* Gradient Orb */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] 
                      bg-gradient-to-br from-red-100 via-orange-50 to-transparent 
                      rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] 
                      bg-gradient-to-tr from-zinc-100 to-transparent 
                      rounded-full blur-3xl opacity-80" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur
                          border border-stone-200 rounded-full shadow-sm
                          transform transition-all duration-700 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
              </span>
              <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">
                Đăng ký khóa mới — Giảm 30%
              </span>
            </div>

            {/* Main Headline */}
            <h1 className={`transform transition-all duration-700 delay-200
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                           text-zinc-900 tracking-tight leading-[1.1]">
                Chinh phục
              </span>
              <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                           tracking-tight leading-[1.1] mt-2">
                <span className="text-zinc-900">Anh ngữ</span>
                <span className="text-red-600"> & </span>
                <span className="text-zinc-900">Tin học</span>
              </span>
              <span className="block font-display text-5xl sm:text-6xl lg:text-7xl font-bold 
                           text-zinc-400 tracking-tight leading-[1.1] mt-2">
                một cách bài bản.
              </span>
            </h1>

            {/* Description */}
            <p className={`max-w-lg text-lg text-zinc-500 leading-relaxed
                        transform transition-all duration-700 delay-300
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Hệ thống đào tạo chuẩn quốc tế, phương pháp học hiện đại, 
              cam kết đầu ra với lộ trình cá nhân hóa cho từng học viên.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-wrap items-center gap-4
                          transform transition-all duration-700 delay-400
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Link
                to="/register"
                className="group inline-flex items-center gap-3 px-8 py-4 
                         bg-red-600 text-white text-base font-semibold rounded-full
                         shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30
                         hover:bg-red-700 active:scale-[0.98] transition-all duration-300"
              >
                Đăng ký học thử miễn phí
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="group inline-flex items-center gap-3 px-6 py-4 
                               text-zinc-700 font-medium hover:text-zinc-900 transition-colors">
                <span className="flex items-center justify-center w-12 h-12 rounded-full 
                              bg-white border border-stone-200 shadow-sm
                              group-hover:shadow-md group-hover:border-stone-300 transition-all">
                  <Play className="w-5 h-5 text-zinc-700 ml-0.5" fill="currentColor" />
                </span>
                Xem video giới thiệu
              </button>
            </div>

            {/* Trust Indicators */}
            <div className={`flex items-center gap-8 pt-8 border-t border-stone-200
                          transform transition-all duration-700 delay-500
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex -space-x-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-50 
                                       bg-gradient-to-br from-zinc-200 to-zinc-300" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">2,400+ học viên</p>
                <p className="text-sm text-zinc-500">đã tin tưởng đăng ký</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className={`lg:col-span-5 transform transition-all duration-1000 delay-300
                        ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative">
              {/* Main Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-zinc-900/10 
                           border border-stone-100 overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-stone-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 
                                   flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">IELTS Intensive</p>
                        <p className="text-xs text-zinc-500">Khóa học phổ biến</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      Đang mở
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-600">Tiến độ học</span>
                      <span className="font-semibold text-zinc-900">68%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full w-[68%] bg-gradient-to-r from-red-500 to-orange-500 
                                   rounded-full transition-all duration-1000" />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-stone-50 rounded-2xl">
                      <p className="text-2xl font-bold text-zinc-900">7.5</p>
                      <p className="text-xs text-zinc-500 mt-1">Điểm mục tiêu</p>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-2xl">
                      <p className="text-2xl font-bold text-zinc-900">24</p>
                      <p className="text-xs text-zinc-500 mt-1">Buổi học</p>
                    </div>
                  </div>

                  {/* Upcoming */}
                  <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl 
                                 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">Buổi học tiếp theo</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Thứ 2, 19:00 - Writing Task 2</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 p-4 bg-white rounded-2xl shadow-xl 
                           border border-stone-100 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">+0.5 band</p>
                    <p className="text-xs text-zinc-500">tuần này</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 p-4 bg-white rounded-2xl shadow-xl 
                           border border-stone-100 animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Top 10%</p>
                    <p className="text-xs text-zinc-500">trong lớp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-300 to-transparent" />
        </div>
      </div>
    </section>
  );
};

// ============================================
// STATS SECTION
// ============================================
const StatsSection = () => {
  const [ref, isInView] = useInView();

  const stats = [
    { value: 2400, suffix: '+', label: 'Học viên', sublabel: 'đã đào tạo' },
    { value: 98, suffix: '%', label: 'Tỉ lệ đạt', sublabel: 'mục tiêu đầu ra' },
    { value: 50, suffix: '+', label: 'Giáo viên', sublabel: 'chứng chỉ quốc tế' },
    { value: 8, suffix: '', label: 'Năm kinh nghiệm', sublabel: 'đào tạo chuyên sâu' },
  ];

  return (
    <section ref={ref} className="relative py-24 bg-zinc-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
             backgroundSize: '40px 40px'
           }} />

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`text-center transform transition-all duration-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <p className="font-display text-5xl lg:text-6xl font-bold text-white">
                <Counter end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-base font-medium text-stone-300">{stat.label}</p>
              <p className="text-sm text-stone-500">{stat.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// PROGRAMS SECTION
// ============================================
const ProgramsSection = () => {
  const [ref, isInView] = useInView();

  const programs = [
    {
      category: 'Tiếng Anh',
      title: 'IELTS Academic',
      description: 'Lộ trình chinh phục IELTS từ 5.0 đến 8.0+ với phương pháp học chuẩn Cambridge.',
      features: ['Lớp 8-12 học viên', 'Cam kết đầu ra', 'Giáo viên 8.0+'],
      duration: '3-6 tháng',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-50',
    },
    {
      category: 'Tiếng Anh',
      title: 'TOEIC 4 Kỹ năng',
      description: 'Đạt mục tiêu TOEIC nhanh chóng với giáo trình ETS chính hãng.',
      features: ['Thi thử hàng tuần', 'Phòng tự học', 'Tài liệu ETS'],
      duration: '2-4 tháng',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
    },
    {
      category: 'Tin học',
      title: 'Tin học Văn phòng',
      description: 'Thành thạo Word, Excel, PowerPoint theo chuẩn MOS International.',
      features: ['Chứng chỉ MOS', 'Thực hành 70%', 'Học 1 kèm 1'],
      duration: '1-2 tháng',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
    },
    {
      category: 'Tin học',
      title: 'IC3 Digital Literacy',
      description: 'Nền tảng công nghệ số toàn diện, được công nhận toàn cầu.',
      features: ['Quốc tế công nhận', 'Online/Offline', 'Hỗ trợ thi'],
      duration: '2-3 tháng',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50',
    },
  ];

  return (
    <section id="programs" ref={ref} className="py-32 bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className={`max-w-2xl transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
            Chương trình đào tạo
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

        {/* Programs Grid */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {programs.map((program, index) => (
            <div
              key={index}
              className={`group relative p-8 bg-white rounded-3xl border border-stone-200
                       hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                       transition-all duration-500 cursor-pointer
                       transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Category Badge */}
              <span className={`inline-block px-3 py-1 ${program.bgColor} text-xs font-medium 
                            rounded-full mb-4`}>
                {program.category}
              </span>

              {/* Content */}
              <h3 className="font-display text-2xl font-bold text-zinc-900 
                          group-hover:text-zinc-700 transition-colors">
                {program.title}
              </h3>
              <p className="mt-3 text-zinc-500 leading-relaxed">
                {program.description}
              </p>

              {/* Features */}
              <div className="mt-6 flex flex-wrap gap-2">
                {program.features.map((feature, i) => (
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
                  <p className="font-semibold text-zinc-900">{program.duration}</p>
                </div>
                <button className={`flex items-center justify-center w-12 h-12 rounded-full
                                bg-gradient-to-br ${program.color} text-white
                                group-hover:scale-110 transition-transform duration-300`}>
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>

              {/* Hover Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${program.color} opacity-0 
                           group-hover:opacity-[0.03] rounded-3xl transition-opacity duration-500`} />
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
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ============================================
// METHOD SECTION
// ============================================
const MethodSection = () => {
  const [ref, isInView] = useInView();

  const steps = [
    {
      number: '01',
      title: 'Đánh giá năng lực',
      description: 'Kiểm tra đầu vào miễn phí để xác định trình độ và mục tiêu học tập.',
    },
    {
      number: '02',
      title: 'Lộ trình cá nhân',
      description: 'Thiết kế chương trình học riêng phù hợp với thời gian và mục tiêu.',
    },
    {
      number: '03',
      title: 'Học & Thực hành',
      description: 'Kết hợp học lý thuyết với thực hành chuyên sâu mỗi buổi học.',
    },
    {
      number: '04',
      title: 'Đánh giá & Cải thiện',
      description: 'Kiểm tra định kỳ và điều chỉnh phương pháp để đạt kết quả tốt nhất.',
    },
  ];

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
                           rounded-full" />
              
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-zinc-900 rounded-3xl flex items-center justify-center
                             shadow-2xl shadow-zinc-900/30">
                  <span className="font-display text-5xl font-bold text-white">SM</span>
                </div>
              </div>

              {/* Orbiting Elements */}
              {steps.map((step, index) => {
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
                  >
                    <span className="font-display text-lg font-bold text-red-600">{step.number}</span>
                  </div>
                );
              })}

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
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
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-6 transform transition-all duration-500
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-14 h-14 bg-stone-100 rounded-2xl
                               flex items-center justify-center">
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
// TESTIMONIALS SECTION
// ============================================
const TestimonialsSection = () => {
  const [ref, isInView] = useInView();

  const testimonials = [
    {
      content: 'Sau 4 tháng học, mình đã đạt IELTS 7.5 từ mức 5.5. Phương pháp học rất hiệu quả và giáo viên rất tận tâm.',
      author: 'Nguyễn Minh Anh',
      role: 'Sinh viên ĐH Bách Khoa',
      result: 'IELTS 5.5 → 7.5',
      avatar: null,
    },
    {
      content: 'Khóa tin học văn phòng giúp mình tự tin hơn rất nhiều trong công việc. Đã đạt chứng chỉ MOS Excel Expert.',
      author: 'Trần Văn Hùng',
      role: 'Nhân viên văn phòng',
      result: 'MOS Expert',
      avatar: null,
    },
    {
      content: 'Lớp học ít người nên được quan tâm sát sao. Giáo viên chỉnh sửa từng lỗi nhỏ trong bài viết.',
      author: 'Lê Thị Hương',
      role: 'Giáo viên cấp 3',
      result: 'IELTS 6.0 → 7.0',
      avatar: null,
    },
  ];

  return (
    <section id="testimonials" ref={ref} className="py-32 bg-stone-50">
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
              className={`group p-8 bg-white rounded-3xl border border-stone-200
                       hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50
                       transition-all duration-500
                       transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Quote */}
              <div className="relative">
                <span className="absolute -top-4 -left-2 font-display text-6xl text-stone-200 
                              select-none">"</span>
                <p className="relative text-zinc-600 leading-relaxed">
                  {testimonial.content}
                </p>
              </div>

              {/* Result Badge */}
              <div className="mt-6">
                <span className="inline-block px-3 py-1.5 bg-green-50 text-green-700 
                              text-sm font-medium rounded-full">
                  {testimonial.result}
                </span>
              </div>

              {/* Author */}
              <div className="mt-6 pt-6 border-t border-stone-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
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
// CTA SECTION
// ============================================
const CTASection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="py-32 bg-zinc-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
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
            Đăng ký ngay để nhận buổi học thử miễn phí và tư vấn lộ trình học tập phù hợp.
          </p>

          {/* CTA Form */}
          <div className={`mt-12 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto
                        transform transition-all duration-700 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-full
                       text-white placeholder:text-stone-500 focus:outline-none focus:border-white/40
                       transition-colors"
            />
            <button className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold
                            rounded-full shadow-lg shadow-red-600/30 hover:shadow-xl 
                            hover:shadow-red-600/40 active:scale-[0.98] transition-all">
              Đăng ký ngay
            </button>
          </div>

          {/* Trust Note */}
          <p className="mt-6 text-sm text-stone-500">
            Miễn phí hoàn toàn • Không cần thẻ tín dụng • Bắt đầu trong 2 phút
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
  const footerLinks = {
    'Khóa học': ['IELTS', 'TOEIC', 'Tin học VP', 'IC3'],
    'Hỗ trợ': ['Liên hệ', 'FAQ', 'Chính sách', 'Điều khoản'],
    'Về chúng tôi': ['Giới thiệu', 'Đội ngũ', 'Tuyển dụng', 'Blog'],
  };

  return (
    <footer className="bg-stone-100 border-t border-stone-200">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                <span className="font-display text-lg font-bold text-stone-50">S</span>
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-zinc-900">
                Skill Master
              </span>
            </Link>
            <p className="mt-4 text-zinc-500 max-w-sm leading-relaxed">
              Hệ thống đào tạo Anh ngữ và Tin học hàng đầu, cam kết đồng hành cùng bạn 
              trên con đường chinh phục mục tiêu.
            </p>
            <div className="mt-6 flex gap-4">
              {['Facebook', 'YouTube', 'TikTok'].map(social => (
                <a key={social} href="#" className="w-10 h-10 bg-white rounded-full border border-stone-200
                                                  flex items-center justify-center text-zinc-600
                                                  hover:bg-zinc-900 hover:text-white hover:border-zinc-900
                                                  transition-all">
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
// MAIN LANDING PAGE COMPONENT
// ============================================
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <ProgramsSection />
        <MethodSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
