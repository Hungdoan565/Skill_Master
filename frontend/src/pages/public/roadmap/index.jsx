import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowDown, GraduationCap, Briefcase, BookOpen,
  Target, Award, Users, CheckCircle, Clock, Star, Play, TrendingUp
} from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';
import { Helmet } from 'react-helmet-async';
import { Footer } from '@/pages/landing/components/footer';

// Import logo
import logoImage from '@/assets/logo.png';

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
// PAGE HEADER - ENHANCED WITH STATS
// ============================================
const PageHeader = () => {
  const [ref, isInView] = useInView();

  const quickStats = [
    { value: '3', label: 'Mục tiêu' },
    { value: '3', label: 'Cấp độ' },
    { value: '15+', label: 'Khóa học' },
  ];

  return (
    <section ref={ref} className="pt-20 border-b border-neutral-900">
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

              {/* Quick Stats - Below Title */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-neutral-200">
                {quickStats.map((stat, i) => (
                  <div
                    key={i}
                    className={`transform transition-all duration-500
                             ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${200 + i * 100}ms` }}
                  >
                    <span className="text-3xl font-bold text-neutral-900">{stat.value}</span>
                    <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Description & CTA */}
          <div className="lg:col-span-7 flex flex-col">
            <div className={`flex-1 p-6 lg:p-12 transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                Mỗi người có một mục tiêu riêng. Hãy cho chúng tôi biết bạn muốn
                đi đâu, và chúng tôi sẽ vẽ ra con đường ngắn nhất để bạn đến được đó.
              </p>

              {/* Journey Steps Preview */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-neutral-600">Chọn mục tiêu</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-neutral-400">Xác định level</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-300" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-neutral-400">Bắt đầu học</span>
                </div>
              </div>
            </div>

            {/* Scroll CTA */}
            <div className="p-6 lg:px-12 lg:pb-12 border-t border-neutral-200">
              <a href="#goals" className="inline-flex items-center gap-3 text-neutral-900 font-medium
                                        hover:opacity-60 transition-opacity group">
                <span className="w-10 h-10 border border-neutral-900 flex items-center justify-center
                              group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                  <ArrowDown className="w-4 h-4" />
                </span>
                Bắt đầu chọn mục tiêu
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// GOALS SECTION - VISUAL CARDS WITH RECOMMENDATION
// ============================================
const GoalsSection = () => {
  const [ref, isInView] = useInView();
  const [hoveredGoal, setHoveredGoal] = useState(null);

  const goals = [
    {
      id: 'study-abroad',
      num: '01',
      icon: GraduationCap,
      title: 'Du học & Định cư',
      subtitle: 'IELTS 6.5+ trong 6 tháng',
      description: 'Chinh phục IELTS để mở cánh cửa du học Úc, Canada, UK hoặc định cư tại các quốc gia phát triển.',
      stats: { duration: '6 tháng', target: 'IELTS 6.5+', students: '2,000+' },
      courses: ['IELTS Foundation', 'IELTS Intensive', 'Speaking Workshop'],
      popular: false,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'career',
      num: '02',
      icon: Briefcase,
      title: 'Thăng tiến công việc',
      subtitle: 'TOEIC 700+ & Excel Expert',
      description: 'Nâng cao năng lực Anh ngữ và Tin học để đạt được vị trí mơ ước trong sự nghiệp.',
      stats: { duration: '4 tháng', target: 'TOEIC 700+', students: '3,500+' },
      courses: ['TOEIC 4 Skills', 'Business English', 'Excel Advanced'],
      popular: true,
      color: 'bg-orange-50 border-[#FF4D00]/30'
    },
    {
      id: 'student',
      num: '03',
      icon: BookOpen,
      title: 'Học sinh - Sinh viên',
      subtitle: 'Nền tảng vững, điểm cao',
      description: 'Xây dựng nền tảng Anh ngữ vững chắc, tự tin với các kỳ thi và giao tiếp hàng ngày.',
      stats: { duration: '3 tháng', target: 'VSTEP B2+', students: '4,000+' },
      courses: ['English Foundation', 'Grammar Master', 'Listening & Speaking'],
      popular: false,
      color: 'bg-green-50 border-green-200'
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
            <p className="mt-4 text-neutral-500">
              Click vào mục tiêu phù hợp để xem lộ trình chi tiết
            </p>
          </div>
        </div>

        {/* Goals Cards - Horizontal with Visual Differentiation */}
        <div className="grid lg:grid-cols-3">
          {goals.map((goal, i) => (
            <div
              key={goal.id}
              className={`relative border-b lg:border-b-0 lg:border-r border-neutral-200 last:border-r-0
                       transform transition-all duration-500 cursor-pointer
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 100}ms` }}
              onMouseEnter={() => setHoveredGoal(goal.id)}
              onMouseLeave={() => setHoveredGoal(null)}
              onClick={() => setHoveredGoal(hoveredGoal === goal.id ? null : goal.id)}
            >
              {/* Popular Badge */}
              {goal.popular && (
                <div className="absolute -top-px left-0 right-0 h-1 bg-[#FF4D00]" />
              )}

              {/* Card Header */}
              <div className={`p-6 lg:p-8 transition-colors duration-300
                           ${hoveredGoal === goal.id ? goal.color : 'bg-white'}`}>

                {/* Top row */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 flex items-center justify-center transition-colors duration-300
                               ${goal.popular ? 'bg-[#FF4D00] text-white' : 'bg-neutral-100 text-neutral-900'}`}>
                    <goal.icon className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-400 block">{goal.num}</span>
                    {goal.popular && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#FF4D00] text-white text-[10px] font-bold uppercase tracking-wider">
                        Phổ biến
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{goal.title}</h3>
                <p className={`text-sm font-semibold mb-4 ${goal.popular ? 'text-[#FF4D00]' : 'text-neutral-500'}`}>
                  {goal.subtitle}
                </p>
                <p className="text-neutral-600 leading-relaxed mb-6">{goal.description}</p>

                {/* Quick Stats */}
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">{goal.stats.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">{goal.stats.students}</span>
                  </div>
                </div>

                {/* Target Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 mb-6
                             ${goal.popular ? 'bg-[#FF4D00]/10 text-[#FF4D00]' : 'bg-neutral-100 text-neutral-700'}`}>
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-semibold">Mục tiêu: {goal.stats.target}</span>
                </div>
              </div>

              {/* Expandable Courses on Hover */}
              <div className={`overflow-hidden transition-all duration-300 border-t border-neutral-200
                           ${hoveredGoal === goal.id ? 'max-h-[300px]' : 'max-h-0'}`}>
                <div className="p-6 lg:p-8 bg-neutral-50">
                  <p className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-4">
                    Khóa học đề xuất
                  </p>
                  <div className="space-y-2 mb-6">
                    {goal.courses.map((course, j) => (
                      <div key={j} className="flex items-center gap-3 p-3 bg-white border border-neutral-200">
                        <CheckCircle className={`w-4 h-4 ${goal.popular ? 'text-[#FF4D00]' : 'text-neutral-400'}`} />
                        <span className="text-sm font-medium text-neutral-900">{course}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Link to="/courses"
                      className={`flex-1 py-3 text-center text-sm font-semibold uppercase tracking-wider
                                   transition-colors duration-150
                                   ${goal.popular
                          ? 'bg-[#FF4D00] text-white hover:bg-[#E64500]'
                          : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
                      Xem chi tiết
                    </Link>
                    <Link to="/contact"
                      className="flex-1 py-3 border border-neutral-300 text-neutral-700 text-center text-sm 
                                   font-semibold uppercase tracking-wider hover:bg-white transition-colors duration-150">
                      Tư vấn
                    </Link>
                  </div>
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
// LEVELS SECTION - TIMELINE PROGRESSION
// ============================================
const LevelsSection = () => {
  const [ref, isInView] = useInView();
  const [activeLevel, setActiveLevel] = useState(null);

  const levels = [
    {
      id: 'beginner',
      level: 'Beginner',
      title: 'Nền tảng',
      subtitle: 'Từ 0 đến giao tiếp cơ bản',
      duration: '3 tháng',
      features: ['Ngữ pháp căn bản', 'Từ vựng 2000 từ', 'Nghe hiểu cơ bản'],
      target: 'A2 - B1',
      color: 'beginner'
    },
    {
      id: 'intermediate',
      level: 'Intermediate',
      title: 'Bứt phá',
      subtitle: 'Tự tin trong công việc',
      duration: '4 tháng',
      features: ['TOEIC 500-700', 'Business English', 'Thuyết trình'],
      target: 'B1 - B2',
      color: 'intermediate'
    },
    {
      id: 'advanced',
      level: 'Advanced',
      title: 'Chinh phục',
      subtitle: 'Đạt chuẩn quốc tế',
      duration: '6 tháng',
      features: ['IELTS 6.5+', 'Academic Writing', 'Native-like Speaking'],
      target: 'B2 - C1',
      color: 'advanced'
    },
  ];

  const getColorClasses = (color, type) => {
    const colors = {
      beginner: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        accent: 'bg-emerald-500',
        text: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
        dot: 'bg-emerald-500',
      },
      intermediate: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        accent: 'bg-blue-500',
        text: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
      },
      advanced: {
        bg: 'bg-[#FF4D00]/5',
        border: 'border-[#FF4D00]/30',
        accent: 'bg-[#FF4D00]',
        text: 'text-[#FF4D00]',
        badge: 'bg-[#FF4D00]/10 text-[#FF4D00]',
        dot: 'bg-[#FF4D00]',
      }
    };
    return colors[color][type];
  };

  return (
    <section ref={ref} className="border-b border-neutral-900 bg-neutral-50">
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
              Hover để xem chi tiết • Mỗi level có màu sắc riêng biệt
            </p>
          </div>
        </div>

        {/* Timeline Progression - Desktop */}
        <div className="hidden lg:block p-12 pb-0">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-[15%] right-[15%] h-1 bg-neutral-200 rounded-full">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-[#FF4D00] rounded-full opacity-40" />
            </div>

            {/* Timeline Dots */}
            <div className="flex justify-between px-[10%]">
              {levels.map((level, i) => (
                <div
                  key={level.id}
                  className={`flex flex-col items-center transform transition-all duration-500
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${200 + i * 150}ms` }}
                >
                  <div
                    onClick={() => setActiveLevel(activeLevel === level.id ? null : level.id)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer
                             transition-all duration-300 relative z-10 text-white font-bold
                             ${getColorClasses(level.color, 'dot')}
                             ${activeLevel === level.id ? 'scale-125 ring-4 ring-offset-2 ring-neutral-200' : 'hover:scale-110'}`}
                  >
                    {i + 1}
                  </div>
                  <div className="mt-4 text-center">
                    <span className={`text-sm font-bold ${getColorClasses(level.color, 'text')}`}>
                      {level.level}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1">{level.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level Cards Grid */}
        <div className="grid lg:grid-cols-3 p-6 lg:p-12 gap-6">
          {levels.map((level, i) => (
            <div
              key={level.id}
              className={`relative transition-all duration-500 cursor-pointer
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                       ${activeLevel === level.id ? 'lg:scale-105 z-10' : 'hover:scale-[1.02]'}`}
              style={{ transitionDelay: `${300 + i * 100}ms` }}
              onMouseEnter={() => setActiveLevel(level.id)}
              onMouseLeave={() => setActiveLevel(null)}
            >
              <div className={`bg-white border-2 transition-all duration-300 overflow-hidden
                           ${activeLevel === level.id
                  ? getColorClasses(level.color, 'border') + ' shadow-lg'
                  : 'border-neutral-200'}`}>

                {/* Color Bar */}
                <div className={`h-1.5 ${getColorClasses(level.color, 'accent')}`} />

                <div className="p-6">
                  {/* Mobile Number */}
                  <div className="lg:hidden mb-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white
                                   ${getColorClasses(level.color, 'dot')}`}>
                      {i + 1}
                    </span>
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider
                                     ${getColorClasses(level.color, 'badge')}`}>
                        {level.level}
                      </span>
                      <h3 className="text-2xl font-bold text-neutral-900 mt-3">{level.title}</h3>
                      <p className="text-neutral-500 mt-1">{level.subtitle}</p>
                    </div>
                    <span className="text-sm text-neutral-400">{level.duration}</span>
                  </div>

                  {/* Target */}
                  <div className={`inline-flex items-center gap-2 px-3 py-2 mb-6
                               ${getColorClasses(level.color, 'bg')}`}>
                    <Target className={`w-4 h-4 ${getColorClasses(level.color, 'text')}`} />
                    <span className="text-sm font-semibold text-neutral-700">Đạt chuẩn {level.target}</span>
                  </div>

                  {/* Features - Always visible */}
                  <div className="space-y-2 mb-4">
                    {level.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${getColorClasses(level.color, 'text')}`} />
                        <span className="text-sm text-neutral-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA - Expandable */}
                  <div className={`overflow-hidden transition-all duration-300 pt-4 border-t border-neutral-100
                               ${activeLevel === level.id ? 'max-h-[80px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <Link to="/resources/assessment"
                      className={`w-full py-3 text-center text-sm font-semibold uppercase tracking-wider
                                   block transition-colors duration-150
                                   ${level.color === 'advanced'
                          ? 'bg-[#FF4D00] text-white hover:bg-[#E64500]'
                          : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
                      Kiểm tra trình độ
                    </Link>
                  </div>
                </div>
              </div>

              {/* Arrow to next - Desktop */}
              {i < levels.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                  <ArrowRight className="w-6 h-6 text-neutral-300" />
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
            <Link to="/resources/assessment"
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
// WHY SECTION - FEATURED BENEFIT LAYOUT
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
      desc: 'Học lại miễn phí nếu không đạt mục tiêu cam kết',
      featured: true
    },
  ];

  const stats = [
    { value: '95%', label: 'Đạt mục tiêu cam kết' },
    { value: '4.9', label: 'Đánh giá trung bình', hasStars: true },
    { value: '10K+', label: 'Học viên tin tưởng' },
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

        {/* Featured Benefit - Full Width */}
        <div className={`grid lg:grid-cols-12 border-b border-neutral-800
                      transform transition-all duration-500
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="lg:col-span-5 p-6 lg:p-12 lg:border-r border-neutral-800 bg-[#FF4D00]">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-white/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <span className="text-white/50 text-sm">04</span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Cam kết đầu ra
            </h3>
            <p className="text-white/80 leading-relaxed text-lg">
              Học lại miễn phí nếu không đạt mục tiêu cam kết. Chúng tôi tin tưởng vào chất lượng đào tạo của mình.
            </p>
            <div className="mt-8 pt-6 border-t border-white/20">
              <span className="text-5xl font-bold text-white">95%</span>
              <p className="text-white/60 mt-2">Học viên đạt mục tiêu cam kết</p>
            </div>
          </div>

          {/* Other 3 Features */}
          <div className="lg:col-span-7 grid lg:grid-cols-3">
            {features.filter(f => !f.featured).map((feature, i) => (
              <div
                key={i}
                className={`p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-neutral-800 last:border-r-0
                         hover:bg-neutral-800 transition-colors duration-150
                         transform transition-all duration-500
                         ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-neutral-800 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-neutral-600">{feature.num}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid lg:grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`p-6 lg:p-8 lg:border-r border-neutral-800 last:border-r-0 text-center
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${500 + i * 100}ms` }}
            >
              <p className="text-3xl lg:text-4xl font-bold text-white">{stat.value}</p>
              {stat.hasStars ? (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-[#FF4D00] fill-[#FF4D00]" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 mt-2">{stat.label}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA SECTION - CLEAR HIERARCHY
// ============================================
const CTASection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="bg-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12">
          {/* Left - Main Message */}
          <div className="lg:col-span-7 p-8 lg:p-16 lg:border-r border-neutral-200">
            <h2 className={`text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Bắt đầu hành trình ngay hôm nay
            </h2>
            <p className={`mt-4 text-neutral-500 leading-relaxed max-w-xl
                        transform transition-all duration-500 delay-100
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Đăng ký tư vấn miễn phí để nhận lộ trình học tập được thiết kế riêng cho bạn.
              Chuyên gia của chúng tôi sẽ liên hệ trong vòng 24h.
            </p>
          </div>

          {/* Right - CTA Buttons with Hierarchy */}
          <div className={`lg:col-span-5 p-8 lg:p-16 flex flex-col justify-center
                        transform transition-all duration-500 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Primary CTA */}
            <Link
              to="/register"
              className="w-full py-4 bg-[#FF4D00] text-white text-sm font-semibold uppercase tracking-wider
                       hover:bg-[#E64500] transition-colors duration-150 flex items-center justify-center gap-2"
            >
              Đăng ký tư vấn miễn phí
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary CTA */}
            <Link
              to="/courses"
              className="w-full py-4 mt-3 border border-neutral-300 text-neutral-700 text-sm font-semibold uppercase tracking-wider
                       hover:bg-neutral-50 transition-colors duration-150 text-center"
            >
              Xem danh sách khóa học
            </Link>

            {/* Trust Signal */}
            <p className="mt-6 text-xs text-neutral-400 text-center">
              ✓ Tư vấn miễn phí &nbsp; ✓ Test trình độ miễn phí &nbsp; ✓ Không ràng buộc
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};


// ============================================
// MAIN PAGE
// ============================================
export const RoadmapPage = () => {
  return (
    <div className="min-h-screen bg-white antialiased">
      <Helmet>
        <title>Lộ trình học tập | Skill Master - Định hướng thành công</title>
        <meta name="description" content="Khám phá lộ trình học tập tối ưu cho IELTS, TOEIC và Tin học quốc tế tại Skill Master. Từ mất gốc đến thành thạo với phương pháp học hiện đại." />
      </Helmet>
      <PublicHeader />
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
