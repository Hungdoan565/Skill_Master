import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/common';
import { Footer } from '@/pages/landing/components/footer';
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
import PublicHeader from '@/components/layout/public-header';

import { supabase } from '@/lib/supabaseClient';
import logoImage from '@/assets/logo.png';

// Helper to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Helper to map categories
const getCategoryLabel = (cat) => {
  const map = { english: 'Tiếng Anh', it: 'Tin học', office: 'Tin học', softskill: 'Kỹ năng mềm' };
  return map[cat] || cat;
};

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
// Data fetched from Supabase now

// ============================================
// PAGE HEADER SECTION
// ============================================
const PageHeader = ({ totalCourses, totalCategories }) => {
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
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">{totalCourses}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Khóa học</p>
              </div>
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-300
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">{totalCategories}</p>
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
const FilterSection = ({ activeFilter, setActiveFilter, searchTerm, setSearchTerm, dynamicCategories }) => {
  const filters = [
    { id: 'all', label: 'Tất cả' },
    ...dynamicCategories
  ];

  return (
    <section className="border-b border-neutral-200 sticky top-16 bg-white/80 backdrop-blur-md z-40 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:px-8">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setSearchTerm(''); // Reset search when changing filter
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap rounded-full md:rounded-none ${activeFilter === filter.id
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
const CourseCard = ({ course, index, isExpanded, onToggle }) => {
  const [ref, isInView] = useInView();

  if (!course) {
    console.warn('CourseCard received null course at index', index);
    return null;
  }

  const courseUrl = `/courses/${course.slug || course.id}`;

  return (
    <div
      ref={ref}
      className={`border-b border-neutral-200 last:border-b-0
               transform transition-all duration-500
               ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Main Card Content */}
      <div
        className="group relative grid lg:grid-cols-12 hover:bg-neutral-50 transition-all duration-300 ease-out overflow-hidden"
      >
        {/* HOVER WATERMARK ART */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-32 group-hover:translate-x-12 opacity-0 group-hover:opacity-5 pointer-events-none transition-all duration-700 ease-out">
          <span className="text-[10rem] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
            {course.category}
          </span>
        </div>

        {/* HOVER ACCENT LINE */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF4D00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />

        {/* Number & Category */}
        <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-transparent lg:group-hover:border-neutral-200 transaction-colors flex lg:flex-col justify-between lg:justify-start gap-4 z-10">
          <span className="text-xl font-mono font-bold text-neutral-300 group-hover:text-neutral-900 transition-colors duration-300">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-neutral-900 text-white text-xs font-medium uppercase tracking-wider group-hover:bg-[#FF4D00] transition-colors duration-300">
              {course.categoryLabel}
            </span>
            {course.popular && (
              <span className="px-2 py-1 border border-[#FF4D00] text-[#FF4D00] text-xs font-medium uppercase tracking-wider">
                Hot
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-transparent lg:group-hover:border-neutral-200 z-10">
          <Link to={courseUrl} className="block group/title">
            <h3 className="text-xl lg:text-3xl font-black text-neutral-900 mb-2 group-hover/title:text-[#FF4D00] group-hover:translate-x-2 transition-all duration-300">
              {course.title}
            </h3>
          </Link>
          <p className="text-sm font-mono text-[#FF4D00] mb-4 opacity-0 group-hover:opacity-100 transform -translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">
            {course.subtitle} ///
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-md group-hover:text-neutral-900 transition-colors">
            {course.description}
          </p>
        </div>

        {/* Quick Info */}
        <div className="lg:col-span-3 p-6 lg:p-8 lg:border-r border-transparent lg:group-hover:border-neutral-200 z-10 flex items-center">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 group-hover:text-neutral-500">Thời lượng</p>
              <p className="text-sm font-bold text-neutral-900 font-mono">
                {course.duration}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 group-hover:text-neutral-500">Số buổi</p>
              <p className="text-sm font-bold text-neutral-900 font-mono">
                {course.sessions}
              </p>
            </div>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-between z-10">
          <div className="text-right lg:text-left group-hover:scale-110 transition-transform duration-300 origin-left">
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 group-hover:text-[#FF4D00]">Học phí</p>
            <p className="text-xl font-black text-neutral-900">{formatCurrency(course.price || 0)}</p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-bold text-neutral-900 justify-end lg:justify-start">
            <Link to={courseUrl} className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:text-[#FF4D00]">
              Chi tiết
            </Link>
            <button
              onClick={onToggle}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Thu gọn chi tiết" : "Xem nhanh chi tiết"}
              className={`w-8 h-8 rounded-full border border-neutral-900 flex items-center justify-center transition-all duration-300 hover:bg-neutral-900 hover:text-white ${isExpanded ? 'rotate-180 bg-neutral-900 text-white' : ''}`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid lg:grid-cols-12 bg-neutral-50 border-t border-neutral-200">
          {/* Features */}
          <div className="lg:col-span-4 p-6 lg:p-8 lg:border-r border-neutral-200">
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Đặc điểm khóa học
            </h4>
            <ul className="space-y-3">
              {Array.isArray(course.features) && course.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <CheckCircle className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Levels - Shown only if available */}
          {course.levels && course.levels.length > 0 && (
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
          )}

          {/* Schedule & CTA */}
          <div className={`${(course.levels && course.levels.length > 0) ? 'lg:col-span-3' : 'lg:col-span-8'} p-6 lg:p-8`}>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-widest mb-4">
              Lịch học
            </h4>
            <p className="text-sm text-neutral-700 mb-6">{course.schedule}</p>

            <div className="space-y-3">
              <Link
                to={courseUrl}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 
                         bg-[#FF4D00] text-white text-sm font-semibold uppercase tracking-wider
                         hover:bg-[#E64500] transition-colors duration-150"
              >
                Xem chi tiết
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
// COURSE SKELETON COMPONENT
// ============================================
const CourseSkeleton = () => (
  <div className="border-b border-neutral-200 p-8 animate-pulse text-transparent select-none bg-neutral-50/50">
    <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-2">
        <div className="w-12 h-6 bg-neutral-200 rounded mb-4" />
        <div className="w-20 h-4 bg-neutral-200 rounded" />
      </div>
      <div className="lg:col-span-5">
        <div className="w-3/4 h-10 bg-neutral-200 rounded mb-4" />
        <div className="w-1/2 h-4 bg-neutral-200 rounded mb-2" />
        <div className="w-full h-4 bg-neutral-200 rounded" />
      </div>
      <div className="lg:col-span-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-neutral-200 rounded" />
          <div className="h-12 bg-neutral-200 rounded" />
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="h-16 bg-neutral-200 rounded" />
      </div>
    </div>
  </div>
);

// ============================================
// COURSES LIST SECTION
// ============================================
const CoursesList = ({ courses, loading, openCardIndex, setOpenCardIndex }) => {
  if (loading) {
    return (
      <section className="border-b border-neutral-900">
        <div className="divide-y divide-neutral-200">
          {[1, 2, 3].map((i) => (
            <CourseSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              isExpanded={openCardIndex === index}
              onToggle={() => setOpenCardIndex(openCardIndex === index ? null : index)}
            />
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
// MAIN COURSES PAGE COMPONENT
// ============================================
export const CoursesPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCardIndex, setOpenCardIndex] = useState(null); // Single-open interaction

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[Supabase] fetchCourses took ${duration}ms`);

      if (error) throw error;

      // Transform data to match UI needs
      const transformed = data.map(c => ({
        ...c,
        categoryLabel: getCategoryLabel(c.category),
        subtitle: c.code, // Fallback
        duration: c.duration_weeks ? `${c.duration_weeks} tuần` : 'Liên hệ',
        sessions: c.total_sessions ? `${c.total_sessions} buổi` : 'Liên hệ',
        classSize: '8-12 học viên',
        schedule: 'Linh hoạt',
        features: (() => {
          try {
            return typeof c.features === 'string' ? JSON.parse(c.features) : (c.features || []);
          } catch (e) {
            console.warn('Parsing features error:', c.id, e);
            return [];
          }
        })(),
        levels: [] // No levels in DB yet
      }));

      setCourses(transformed);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesFilter = activeFilter === 'all' || course.category === activeFilter;
    const matchesSearch = (course.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate unique categories for dynamic filters
  const dynamicCategories = Array.from(new Set(courses.map(c => c.category)))
    .filter(cat => cat) // Remove null/undefined
    .map(cat => ({
      id: cat,
      label: getCategoryLabel(cat)
    }));

  return (
    <div className="min-h-screen bg-white antialiased">
      <SEOHead
        title="Lộ trình học tiếng Anh & Tin học chuẩn quốc tế"
        description="Khám phá các khóa học Tiếng Anh (IELTS, TOEIC) và Tin học văn phòng chuẩn quốc tế tại Skill Master. Đào tạo chất lượng cao, cam kết đầu ra bằng văn bản."
        keywords="khóa học ielts, luyện thi toeic, tin học văn phòng, skill master, học tiếng anh, học tin học, lộ trình học tập"
        canonical="https://skillmaster.vn/courses"
      />
      <PublicHeader />
      <main>
        <PageHeader
          totalCourses={courses.length}
          totalCategories={new Set(courses.map(c => c.category)).size}
        />
        <FilterSection
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dynamicCategories={dynamicCategories}
        />
        <CoursesList
          courses={filteredCourses}
          loading={loading}
          openCardIndex={openCardIndex}
          setOpenCardIndex={setOpenCardIndex}
        />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default CoursesPage;
