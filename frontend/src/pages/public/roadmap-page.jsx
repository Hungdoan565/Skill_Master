import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ArrowDown, GraduationCap, Briefcase, BookOpen, 
  Target, Award, Users, CheckCircle, Clock, Star, Play, TrendingUp
} from 'lucide-react';

// ============================================
// ROADMAP PAGE - SWISS MINIMALISM
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
            <NavLink to="/roadmap" active>Lộ trình</NavLink>
            <NavLink to="/about">Về chúng tôi</NavLink>
            <NavLink to="/contact">Liên hệ</NavLink>
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
              Đăng ký tư vấn
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
// PAGE HEADER
// ============================================
const PageHeader = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="pt-16 border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12">
          {/* Left - Title */}
          <div className="lg:col-span-5 p-6 lg:p-12 lg:border-r border-neutral-900">
            <div className={`transform transition-all duration-500
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-neutral-500 mb-6">
                <span className="w-8 h-px bg-neutral-400" />
                Lộ trình học tập
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
                Đích đến của bạn?
              </h1>
            </div>
          </div>

          {/* Right - Description */}
          <div className="lg:col-span-7 flex flex-col">
            <div className={`p-6 lg:p-12 transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                Mỗi người có một mục tiêu riêng. Hãy cho chúng tôi biết bạn muốn 
                đi đâu, và chúng tôi sẽ vẽ ra con đường ngắn nhất để bạn đến được đó.
              </p>
              
              <a href="#goals" className="mt-8 inline-flex items-center gap-3 text-neutral-900 font-medium
                                        hover:opacity-60 transition-opacity">
                <span className="w-10 h-10 border border-neutral-900 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4" />
                </span>
                Chọn mục tiêu
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// GOALS SECTION
// ============================================
const GoalsSection = () => {
  const [ref, isInView] = useInView();
  const [selectedGoal, setSelectedGoal] = useState(null);

  const goals = [
    {
      id: 'study-abroad',
      num: '01',
      icon: GraduationCap,
      title: 'Du học & Định cư',
      subtitle: 'IELTS 6.5+ trong 6 tháng',
      description: 'Chinh phục IELTS để mở cánh cửa du học Úc, Canada, UK hoặc định cư tại các quốc gia phát triển.',
      stats: { duration: '6 tháng', target: 'IELTS 6.5+', students: '2,000+' },
      courses: ['IELTS Foundation', 'IELTS Intensive', 'Speaking Workshop']
    },
    {
      id: 'career',
      num: '02',
      icon: Briefcase,
      title: 'Thăng tiến công việc',
      subtitle: 'TOEIC 700+ & Excel Expert',
      description: 'Nâng cao năng lực Anh ngữ và Tin học để đạt được vị trí mơ ước trong sự nghiệp.',
      stats: { duration: '4 tháng', target: 'TOEIC 700+', students: '3,500+' },
      courses: ['TOEIC 4 Skills', 'Business English', 'Excel Advanced']
    },
    {
      id: 'student',
      num: '03',
      icon: BookOpen,
      title: 'Học sinh - Sinh viên',
      subtitle: 'Nền tảng vững, điểm cao',
      description: 'Xây dựng nền tảng Anh ngữ vững chắc, tự tin với các kỳ thi và giao tiếp hàng ngày.',
      stats: { duration: '3 tháng', target: 'VSTEP B2+', students: '4,000+' },
      courses: ['English Foundation', 'Grammar Master', 'Listening & Speaking']
    },
  ];

  return (
    <section id="goals" ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Bước 1
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Chọn mục tiêu của bạn
            </h2>
          </div>
        </div>

        {/* Goals List */}
        {goals.map((goal, i) => (
          <div 
            key={goal.id}
            className={`border-b border-neutral-200 last:border-b-0
                     transform transition-all duration-500
                     ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${100 + i * 100}ms` }}
          >
            {/* Main Row */}
            <div 
              onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
              className="grid lg:grid-cols-12 cursor-pointer hover:bg-neutral-50 transition-colors duration-150"
            >
              <div className="lg:col-span-1 p-6 lg:p-8 lg:border-r border-neutral-200">
                <span className="text-sm font-medium text-neutral-400">{goal.num}</span>
              </div>
              <div className="lg:col-span-1 p-6 lg:p-8 lg:border-r border-neutral-200 flex items-center">
                <goal.icon className="w-6 h-6 text-neutral-900" />
              </div>
              <div className="lg:col-span-3 p-6 lg:p-8 lg:border-r border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900">{goal.title}</h3>
                <p className="text-sm text-[#FF4D00] font-medium mt-1">{goal.subtitle}</p>
              </div>
              <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200">
                <p className="text-neutral-600 leading-relaxed">{goal.description}</p>
              </div>
              <div className="lg:col-span-2 p-6 lg:p-8 flex items-center justify-end">
                <span className={`text-sm font-medium transition-transform duration-200
                              ${selectedGoal === goal.id ? 'rotate-45' : ''}`}>
                  +
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            <div className={`overflow-hidden transition-all duration-300
                          ${selectedGoal === goal.id ? 'max-h-[500px]' : 'max-h-0'}`}>
              <div className="grid lg:grid-cols-12 bg-neutral-50 border-t border-neutral-200">
                {/* Stats */}
                <div className="lg:col-span-4 p-6 lg:p-8 lg:border-r border-neutral-200">
                  <h4 className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-6">
                    Thông tin khóa học
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">
                        Thời lượng: <span className="font-semibold text-neutral-900">{goal.stats.duration}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">
                        Mục tiêu: <span className="font-semibold text-neutral-900">{goal.stats.target}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">
                        Đã đạt: <span className="font-semibold text-neutral-900">{goal.stats.students} học viên</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Courses */}
                <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200">
                  <h4 className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-6">
                    Khóa học đề xuất
                  </h4>
                  <div className="space-y-3">
                    {goal.courses.map((course, j) => (
                      <div key={j} className="flex items-center gap-3 p-4 bg-white border border-neutral-200">
                        <CheckCircle className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900">{course}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="lg:col-span-3 p-6 lg:p-8 flex flex-col justify-center">
                  <Link to="/courses"
                        className="w-full py-4 bg-neutral-900 text-white text-sm font-semibold uppercase tracking-wider
                                 text-center hover:bg-neutral-800 transition-colors duration-150">
                    Xem chi tiết
                  </Link>
                  <Link to="/contact"
                        className="w-full py-4 mt-3 border border-neutral-900 text-neutral-900 text-sm font-semibold 
                                 uppercase tracking-wider text-center hover:bg-neutral-50 transition-colors duration-150">
                    Tư vấn miễn phí
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============================================
// LEVELS SECTION
// ============================================
const LevelsSection = () => {
  const [ref, isInView] = useInView();

  const levels = [
    {
      level: 'Beginner',
      title: 'Nền tảng',
      subtitle: 'Từ 0 đến giao tiếp cơ bản',
      duration: '3 tháng',
      features: ['Ngữ pháp căn bản', 'Từ vựng 2000 từ', 'Nghe hiểu cơ bản'],
      target: 'A2 - B1'
    },
    {
      level: 'Intermediate',
      title: 'Bứt phá',
      subtitle: 'Tự tin trong công việc',
      duration: '4 tháng',
      features: ['TOEIC 500-700', 'Business English', 'Thuyết trình'],
      target: 'B1 - B2'
    },
    {
      level: 'Advanced',
      title: 'Chinh phục',
      subtitle: 'Đạt chuẩn quốc tế',
      duration: '6 tháng',
      features: ['IELTS 6.5+', 'Academic Writing', 'Native-like Speaking'],
      target: 'B2 - C1'
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Bước 2
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Xác định trình độ hiện tại
            </h2>
            <p className="mt-4 text-neutral-500">
              Chúng tôi sẽ test miễn phí và xếp bạn vào đúng level phù hợp
            </p>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="grid lg:grid-cols-3">
          {levels.map((level, i) => (
            <div 
              key={i}
              className={`p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200 last:border-r-0
                       hover:bg-neutral-50 transition-colors duration-150
                       transform transition-all duration-500
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 150}ms` }}
            >
              {/* Level Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="px-3 py-1 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
                  {level.level}
                </span>
                <span className="text-sm text-neutral-400">{level.duration}</span>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">{level.title}</h3>
              <p className="text-neutral-500 mb-6">{level.subtitle}</p>

              {/* Target */}
              <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 mb-6 w-fit">
                <Target className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-semibold text-neutral-900">
                  Đạt chuẩn {level.target}
                </span>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {level.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Arrow indicator for next level */}
              {i < levels.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <div className="w-6 h-6 bg-neutral-900 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Row */}
        <div className="grid lg:grid-cols-12 border-t border-neutral-200">
          <div className="lg:col-span-8 p-6 lg:p-8 lg:border-r border-neutral-200">
            <p className="text-neutral-600">
              Chưa biết trình độ của mình? Làm bài test nhanh để được xếp lớp chính xác.
            </p>
          </div>
          <div className={`lg:col-span-4 p-6 lg:p-8
                        transform transition-all duration-500 delay-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link to="/contact"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-neutral-900 text-white 
                           text-sm font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors">
              <Play className="w-4 h-4" />
              Làm bài test miễn phí
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// WHY SECTION
// ============================================
const WhySection = () => {
  const [ref, isInView] = useInView();

  const features = [
    { 
      num: '01',
      icon: Target, 
      title: 'Cá nhân hóa', 
      desc: 'Lộ trình được điều chỉnh theo mục tiêu và thời gian của bạn'
    },
    { 
      num: '02',
      icon: Users, 
      title: 'Mentor 1-1', 
      desc: 'Được theo dõi và hỗ trợ bởi mentor riêng suốt quá trình học'
    },
    { 
      num: '03',
      icon: TrendingUp, 
      title: 'Đo lường tiến độ', 
      desc: 'Test định kỳ để theo dõi sự tiến bộ và điều chỉnh kịp thời'
    },
    { 
      num: '04',
      icon: Award, 
      title: 'Cam kết đầu ra', 
      desc: 'Học lại miễn phí nếu không đạt mục tiêu cam kết'
    },
  ];

  return (
    <section ref={ref} className="bg-neutral-900 border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-800">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-800">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Tại sao chọn chúng tôi
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Lộ trình được thiết kế riêng cho bạn
            </h2>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-4">
          {features.map((feature, i) => (
            <div 
              key={i}
              className={`p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-neutral-800 last:border-r-0
                       hover:bg-neutral-800 transition-colors duration-150
                       transform transition-all duration-500
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-neutral-800 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-neutral-600">{feature.num}</span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid lg:grid-cols-3 border-t border-neutral-800">
          <div className={`p-6 lg:p-8 lg:border-r border-neutral-800
                        transform transition-all duration-500 delay-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-4xl font-bold text-white">95%</p>
            <p className="text-sm text-neutral-400 mt-2">Đạt mục tiêu cam kết</p>
          </div>
          <div className={`p-6 lg:p-8 lg:border-r border-neutral-800
                        transform transition-all duration-500 delay-600
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-4xl font-bold text-white">4.9</p>
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 text-[#FF4D00] fill-[#FF4D00]" />
              ))}
            </div>
          </div>
          <div className={`p-6 lg:p-8
                        transform transition-all duration-500 delay-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-4xl font-bold text-white">10K+</p>
            <p className="text-sm text-neutral-400 mt-2">Học viên tin tưởng</p>
          </div>
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
    <section ref={ref} className="bg-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2">
          {/* Left */}
          <div className="p-8 lg:p-16 lg:border-r border-neutral-200">
            <h2 className={`text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Bắt đầu hành trình ngay hôm nay
            </h2>
            <p className={`mt-4 text-neutral-500 leading-relaxed
                        transform transition-all duration-500 delay-100
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Đăng ký tư vấn miễn phí để nhận lộ trình học tập được thiết kế riêng cho bạn.
            </p>
          </div>

          {/* Right */}
          <div className={`p-8 lg:p-16 flex items-center gap-4
                        transform transition-all duration-500 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              to="/register"
              className="px-8 py-4 bg-[#FF4D00] text-white text-sm font-semibold uppercase tracking-wider
                       hover:bg-[#E64500] transition-colors duration-150 flex items-center gap-2"
            >
              Đăng ký tư vấn
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/courses"
              className="px-8 py-4 border border-neutral-900 text-neutral-900 text-sm font-semibold uppercase tracking-wider
                       hover:bg-neutral-50 transition-colors duration-150"
            >
              Xem khóa học
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FOOTER
// ============================================
const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-900">
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
export const RoadmapPage = () => {
  return (
    <div className="min-h-screen bg-white antialiased">
      <Header />
      <main>
        <PageHeader />
        <GoalsSection />
        <LevelsSection />
        <WhySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default RoadmapPage;
