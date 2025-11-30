import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowUpRight, 
  Clock, 
  Users, 
  BookOpen,
  CheckCircle,
  Filter,
  Search,
  ChevronDown,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import PublicHeader from '../../components/layout/public-header';

// ============================================
// SWISS MINIMALISM COURSES PAGE
// ============================================
// Design Philosophy:
// - STRICT grid system with border separations
// - Monochromatic palette (Black & White) + One accent (International Orange #FF4D00)
// - Typography hierarchy through weight/size, NOT color
// - No shadows, sharp corners, flat and honest
// - Subtle hover states (underline, opacity)
// ============================================

// Intersection Observer hook
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
// COURSES DATA
// ============================================
const coursesData = [
  {
    id: 'ielts-academic',
    category: 'english',
    categoryLabel: 'Tiếng Anh',
    title: 'IELTS Academic',
    subtitle: 'Chinh phục IELTS từ 5.0 đến 8.0+',
    description: 'Chương trình luyện thi IELTS toàn diện với phương pháp Cambridge, được thiết kế cho học viên muốn du học hoặc định cư. Cam kết đầu ra rõ ràng.',
    duration: '3-6 tháng',
    sessions: '24-48 buổi',
    classSize: '8-12 học viên',
    level: 'Từ 5.0+',
    schedule: 'T2-T4-T6 hoặc T3-T5-T7',
    features: [
      'Giáo viên IELTS 8.0+',
      'Cam kết đầu ra',
      'Thi thử hàng tuần',
      'Chấm Writing miễn phí',
      'Phòng tự học 24/7',
      'Tài liệu Cambridge'
    ],
    levels: [
      { name: 'Foundation', target: '5.0 - 5.5', duration: '2 tháng' },
      { name: 'Intermediate', target: '6.0 - 6.5', duration: '3 tháng' },
      { name: 'Advanced', target: '7.0 - 7.5', duration: '4 tháng' },
      { name: 'Master', target: '8.0+', duration: '6 tháng' },
    ],
    price: '8.500.000đ',
    popular: true,
  },
  {
    id: 'toeic-4skills',
    category: 'english',
    categoryLabel: 'Tiếng Anh',
    title: 'TOEIC 4 Kỹ năng',
    subtitle: 'Đạt mục tiêu TOEIC nhanh chóng',
    description: 'Khóa học TOEIC toàn diện với giáo trình ETS chính hãng, phù hợp cho sinh viên và người đi làm cần chứng chỉ TOEIC để tốt nghiệp hoặc thăng tiến.',
    duration: '2-4 tháng',
    sessions: '16-32 buổi',
    classSize: '10-15 học viên',
    level: 'Từ 300+',
    schedule: 'T2-T4-T6 hoặc T3-T5-T7',
    features: [
      'Giáo trình ETS chính hãng',
      'Thi thử mỗi tuần',
      'Phân tích đề chi tiết',
      'Tips & Tricks hiệu quả',
      'Học nhóm nhỏ',
      'Cam kết tăng 150+ điểm'
    ],
    levels: [
      { name: 'Starter', target: '450+', duration: '2 tháng' },
      { name: 'Target', target: '650+', duration: '3 tháng' },
      { name: 'Achiever', target: '850+', duration: '4 tháng' },
    ],
    price: '5.500.000đ',
    popular: false,
  },
  {
    id: 'business-english',
    category: 'english',
    categoryLabel: 'Tiếng Anh',
    title: 'Business English',
    subtitle: 'Tiếng Anh cho môi trường công sở',
    description: 'Khóa học Tiếng Anh thương mại dành cho người đi làm, tập trung vào giao tiếp, email, thuyết trình và đàm phán trong môi trường doanh nghiệp.',
    duration: '2-3 tháng',
    sessions: '20 buổi',
    classSize: '6-8 học viên',
    level: 'Intermediate+',
    schedule: 'T3-T5 tối hoặc Thứ 7',
    features: [
      'Giáo viên bản ngữ',
      'Tình huống thực tế',
      'Email & Report Writing',
      'Presentation Skills',
      'Meeting & Negotiation',
      'Chứng chỉ hoàn thành'
    ],
    levels: [
      { name: 'Essential', target: 'Giao tiếp cơ bản', duration: '2 tháng' },
      { name: 'Professional', target: 'Thành thạo công việc', duration: '3 tháng' },
    ],
    price: '6.500.000đ',
    popular: false,
  },
  {
    id: 'mos-office',
    category: 'it',
    categoryLabel: 'Tin học',
    title: 'MOS - Tin học Văn phòng',
    subtitle: 'Chứng chỉ MOS quốc tế',
    description: 'Khóa học Tin học Văn phòng chuẩn MOS (Microsoft Office Specialist), bao gồm Word, Excel, PowerPoint. Phù hợp cho sinh viên và người đi làm.',
    duration: '1-2 tháng',
    sessions: '12-20 buổi',
    classSize: '1-1 hoặc nhóm nhỏ',
    level: 'Từ cơ bản',
    schedule: 'Linh hoạt',
    features: [
      'Chứng chỉ MOS quốc tế',
      'Thực hành 70%',
      'Học 1 kèm 1',
      'Giáo trình Microsoft',
      'Thi thử trước kỳ thi',
      'Hỗ trợ đăng ký thi'
    ],
    levels: [
      { name: 'Word', target: 'MOS Word', duration: '1 tháng' },
      { name: 'Excel', target: 'MOS Excel', duration: '1 tháng' },
      { name: 'PowerPoint', target: 'MOS PowerPoint', duration: '1 tháng' },
      { name: 'Expert', target: 'MOS Expert', duration: '2 tháng' },
    ],
    price: '2.500.000đ',
    popular: true,
  },
  {
    id: 'ic3',
    category: 'it',
    categoryLabel: 'Tin học',
    title: 'IC3 Digital Literacy',
    subtitle: 'Chứng chỉ Tin học quốc tế',
    description: 'Chương trình IC3 (Internet and Computing Core Certification) cung cấp nền tảng công nghệ số toàn diện, được công nhận toàn cầu.',
    duration: '2-3 tháng',
    sessions: '24 buổi',
    classSize: '8-12 học viên',
    level: 'Từ cơ bản',
    schedule: 'T2-T4-T6 hoặc Thứ 7-CN',
    features: [
      'Chứng chỉ quốc tế',
      'Computing Fundamentals',
      'Key Applications',
      'Living Online',
      'Giáo trình Certiport',
      'Thi online tại trung tâm'
    ],
    levels: [
      { name: 'GS5 Level 1', target: 'Cơ bản', duration: '2 tháng' },
      { name: 'GS5 Level 2', target: 'Nâng cao', duration: '3 tháng' },
    ],
    price: '3.500.000đ',
    popular: false,
  },
  {
    id: 'excel-advanced',
    category: 'it',
    categoryLabel: 'Tin học',
    title: 'Excel Nâng cao',
    subtitle: 'Làm chủ Excel cho công việc',
    description: 'Khóa học Excel chuyên sâu với các hàm nâng cao, Pivot Table, Dashboard, VBA Macro. Dành cho người đã có nền tảng Excel cơ bản.',
    duration: '1.5 tháng',
    sessions: '12 buổi',
    classSize: '8-10 học viên',
    level: 'Đã biết Excel cơ bản',
    schedule: 'T3-T5 tối hoặc Thứ 7',
    features: [
      'Hàm nâng cao (INDEX, MATCH...)',
      'Pivot Table & Chart',
      'Dashboard & Báo cáo',
      'Power Query',
      'VBA Macro cơ bản',
      'Case study thực tế'
    ],
    levels: [
      { name: 'Advanced', target: 'Thành thạo', duration: '1.5 tháng' },
    ],
    price: '2.000.000đ',
    popular: false,
  },
];

// ============================================
// PAGE HEADER SECTION
// ============================================
const PageHeader = () => {
  const [ref, isInView] = useInView();

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
                Danh mục khóa học
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
                Khóa học
              </h1>
            </div>
          </div>

          {/* Right - Description & Stats */}
          <div className="lg:col-span-7 flex flex-col">
            <div className={`p-6 lg:p-12 border-b border-neutral-200 lg:border-b-0
                          transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                Khám phá các chương trình đào tạo Anh ngữ và Tin học được thiết kế 
                theo chuẩn quốc tế, phù hợp với mọi mục tiêu học tập.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 border-t border-neutral-200">
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-200
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">6</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Khóa học</p>
              </div>
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-300
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">2</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Lĩnh vực</p>
              </div>
              <div className={`p-6 lg:p-8
                           transform transition-all duration-500 delay-400
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">100%</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Cam kết</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FILTER SECTION
// ============================================
const FilterSection = ({ activeFilter, setActiveFilter, searchTerm, setSearchTerm }) => {
  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'english', label: 'Tiếng Anh' },
    { id: 'it', label: 'Tin học' },
  ];

  return (
    <section className="border-b border-neutral-200 sticky top-16 bg-white z-40">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:px-8">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  activeFilter === filter.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm khóa học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-neutral-200 text-sm
                       placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900
                       transition-colors duration-150"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// COURSE CARD COMPONENT
// ============================================
const CourseCard = ({ course, index }) => {
  const [ref, isInView] = useInView();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      ref={ref}
      className={`border-b border-neutral-200 last:border-b-0
               transform transition-all duration-500
               ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Main Card Content */}
      <div className="grid lg:grid-cols-12 hover:bg-neutral-50 transition-colors duration-150">
        {/* Number & Category */}
        <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200 flex lg:flex-col justify-between lg:justify-start gap-4">
          <span className="text-sm font-medium text-neutral-400">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-neutral-900 text-white text-xs font-medium uppercase tracking-wider">
              {course.categoryLabel}
            </span>
            {course.popular && (
              <span className="px-2 py-1 bg-[#FF4D00] text-white text-xs font-medium uppercase tracking-wider">
                Hot
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200">
          <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-2">
            {course.title}
          </h3>
          <p className="text-sm text-neutral-500 mb-4">{course.subtitle}</p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Quick Info */}
        <div className="lg:col-span-3 p-6 lg:p-8 lg:border-r border-neutral-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Thời lượng</p>
              <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.duration}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Số buổi</p>
              <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {course.sessions}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Sĩ số</p>
              <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {course.classSize}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Trình độ</p>
              <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {course.level}
              </p>
            </div>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Học phí từ</p>
            <p className="text-xl font-bold text-neutral-900">{course.price}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-neutral-900 
                     hover:opacity-60 transition-opacity duration-150"
          >
            {expanded ? 'Thu gọn' : 'Xem chi tiết'}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[800px]' : 'max-h-0'}`}>
        <div className="grid lg:grid-cols-12 bg-neutral-50 border-t border-neutral-200">
          {/* Features */}
          <div className="lg:col-span-4 p-6 lg:p-8 lg:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Đặc điểm khóa học
            </h4>
            <ul className="space-y-3">
              {course.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <CheckCircle className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Levels */}
          <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Các cấp độ
            </h4>
            <div className="space-y-3">
              {course.levels.map((level, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-neutral-200">
                  <div>
                    <p className="font-medium text-neutral-900">{level.name}</p>
                    <p className="text-xs text-neutral-500">Mục tiêu: {level.target}</p>
                  </div>
                  <span className="text-xs text-neutral-500">{level.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule & CTA */}
          <div className="lg:col-span-3 p-6 lg:p-8">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Lịch học
            </h4>
            <p className="text-sm text-neutral-700 mb-6">{course.schedule}</p>
            
            <div className="space-y-3">
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 
                         bg-[#FF4D00] text-white text-sm font-semibold uppercase tracking-wider
                         hover:bg-[#E64500] transition-colors duration-150"
              >
                Đăng ký ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="w-full px-6 py-3 border border-neutral-900 text-neutral-900 
                              text-sm font-semibold uppercase tracking-wider
                              hover:bg-neutral-900 hover:text-white transition-colors duration-150">
                Tư vấn miễn phí
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COURSES LIST SECTION
// ============================================
const CoursesList = ({ courses }) => {
  return (
    <section className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))
        ) : (
          <div className="p-12 text-center">
            <p className="text-neutral-500">Không tìm thấy khóa học phù hợp.</p>
          </div>
        )}
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
    <section ref={ref} className="bg-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2">
          {/* Left */}
          <div className="p-8 lg:p-16 lg:border-r border-neutral-800">
            <h2 className={`text-3xl lg:text-4xl font-bold text-white tracking-tight
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Chưa biết chọn khóa nào?
            </h2>
            <p className={`mt-4 text-neutral-400 leading-relaxed
                        transform transition-all duration-500 delay-100
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Đăng ký tư vấn miễn phí để được hỗ trợ chọn khóa học phù hợp với mục tiêu và trình độ của bạn.
            </p>
          </div>

          {/* Right */}
          <div className={`p-8 lg:p-16 flex items-center
                        transform transition-all duration-500 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <input
                type="tel"
                placeholder="Số điện thoại của bạn"
                className="flex-1 px-4 py-4 bg-transparent border border-neutral-700 text-white
                         placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500
                         transition-colors duration-150"
              />
              <button className="px-8 py-4 bg-[#FF4D00] text-white text-sm font-semibold 
                              uppercase tracking-wider hover:bg-[#E64500] transition-colors duration-150
                              whitespace-nowrap">
                Gọi cho tôi
              </button>
            </div>
          </div>
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
    <footer className="bg-white">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Footer */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 border-b border-neutral-200">
          {/* Brand */}
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

          {/* Courses */}
          <div className="p-6 lg:p-8 md:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Khóa học</h4>
            <ul className="space-y-2">
              {['IELTS Academic', 'TOEIC 4 Kỹ năng', 'Tin học Văn phòng', 'IC3 Digital'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-900 hover:opacity-60 transition-opacity">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="p-6 lg:p-8 md:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Về chúng tôi</h4>
            <ul className="space-y-2">
              {['Giới thiệu', 'Đội ngũ giáo viên', 'Blog', 'Tuyển dụng'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-900 hover:opacity-60 transition-opacity">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="p-6 lg:p-8">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>123 Nguyễn Văn Linh, Q.7, TP.HCM</li>
              <li>contact@skillmaster.vn</li>
              <li>0909 123 456</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">
            © 2025 Skill Master. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
              Điều khoản
            </a>
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors">
              Bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN COURSES PAGE COMPONENT
// ============================================
export const CoursesPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter courses
  const filteredCourses = coursesData.filter(course => {
    const matchesFilter = activeFilter === 'all' || course.category === activeFilter;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white antialiased">
      <PublicHeader />
      <main>
        <PageHeader />
        <FilterSection 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <CoursesList courses={filteredCourses} />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default CoursesPage;
