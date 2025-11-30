import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, MapPin, Phone, Award
} from 'lucide-react';

// ============================================
// ABOUT PAGE - SWISS MINIMALISM
// ============================================
// Design Philosophy:
// - STRICT grid system with border separations
// - Monochromatic palette (Black & White) + One accent (#FF4D00)
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

// Animated Counter
const Counter = ({ end, suffix = '', duration = 2000 }) => {
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
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-900 transition-all duration-200 ${
      scrolled ? 'bg-white/95 backdrop-blur-sm' : ''
    }`}>
      <div className="max-w-[1600px] mx-auto">
        <nav className="flex items-center justify-between h-16 px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
              <span className="text-sm font-bold text-white tracking-tighter">SM</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              Skill Master
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/courses">Khóa học</NavLink>
            <NavLink to="/roadmap">Lộ trình</NavLink>
            <NavLink to="/about" active>Về chúng tôi</NavLink>
            <NavLink to="/contact">Liên hệ</NavLink>
          </div>

          {/* CTA Buttons */}
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
              Bắt đầu ngay
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
// PAGE HEADER SECTION
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
                Về chúng tôi
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
                Skill Master
              </h1>
            </div>
          </div>

          {/* Right - Description & Stats */}
          <div className="lg:col-span-7 flex flex-col">
            <div className={`p-6 lg:p-12 border-b border-neutral-200 lg:border-b-0
                          transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                Hệ thống đào tạo Anh ngữ và Tin học hàng đầu, 
                cam kết mang đến chất lượng giáo dục chuẩn quốc tế từ năm 2016.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-4 border-t border-neutral-200">
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-200
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">
                  <Counter end={8} />
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Năm</p>
              </div>
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-300
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">
                  <Counter end={10} suffix="K+" />
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Học viên</p>
              </div>
              <div className={`p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-400
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">
                  <Counter end={50} suffix="+" />
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Giảng viên</p>
              </div>
              <div className={`p-6 lg:p-8
                           transform transition-all duration-500 delay-500
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-3xl lg:text-4xl font-bold text-neutral-900">
                  <Counter end={95} suffix="%" />
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">Hài lòng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// STORY SECTION
// ============================================
const StorySection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12">
          
          {/* Left - Quote */}
          <div className="lg:col-span-5 p-6 lg:p-12 lg:border-r border-neutral-900 bg-neutral-900">
            <div className={`transform transition-all duration-500
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-8 block">
                Tầm nhìn
              </span>
              <blockquote className="text-2xl lg:text-3xl font-light text-white leading-relaxed">
                "Mỗi học viên đến với chúng tôi đều mang theo một ước mơ. 
                Sứ mệnh của Skill Master là biến những ước mơ ấy thành hiện thực."
              </blockquote>
              <div className="mt-10">
                <p className="font-semibold text-white">Nguyễn Văn Minh</p>
                <p className="text-sm text-neutral-400">Founder & CEO</p>
              </div>
            </div>
          </div>

          {/* Right - Timeline */}
          <div className="lg:col-span-7 p-6 lg:p-12">
            <div className={`transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-8 block">
                Hành trình
              </span>
              
              <div className="space-y-0">
                {[
                  { year: '2016', title: 'Khởi đầu', desc: '12 học viên đầu tiên tại cơ sở Quận 1' },
                  { year: '2018', title: 'Mở rộng', desc: 'Khai trương cơ sở thứ 2 tại Quận 7' },
                  { year: '2020', title: 'Chuyển đổi số', desc: 'Ra mắt platform học trực tuyến' },
                  { year: '2023', title: 'Đối tác Cambridge', desc: 'Trở thành trung tâm ủy quyền chính thức' },
                  { year: '2025', title: 'Hiện tại', desc: '3 cơ sở, 50+ giảng viên, 10,000+ học viên' },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className={`grid grid-cols-12 border-t border-neutral-200 py-6
                             transform transition-all duration-500
                             ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${200 + i * 100}ms` }}
                  >
                    <div className="col-span-2">
                      <span className="text-sm font-bold text-neutral-900">{item.year}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm font-medium text-neutral-900">{item.title}</span>
                    </div>
                    <div className="col-span-7">
                      <span className="text-sm text-neutral-500">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// VALUES SECTION
// ============================================
const ValuesSection = () => {
  const [ref, isInView] = useInView();

  const values = [
    { 
      num: '01',
      title: 'Tận tâm', 
      desc: 'Mỗi học viên là một cá nhân riêng biệt. Chúng tôi lắng nghe, thấu hiểu và đồng hành cùng từng bước tiến.',
    },
    { 
      num: '02',
      title: 'Cam kết', 
      desc: 'Đồng hành đến khi đạt mục tiêu. Cam kết đầu ra bằng văn bản, học lại miễn phí nếu chưa đạt.',
    },
    { 
      num: '03',
      title: 'Đổi mới', 
      desc: 'Phương pháp hiện đại, hiệu quả. Ứng dụng công nghệ và giáo trình quốc tế vào giảng dạy.',
    },
    { 
      num: '04',
      title: 'Cộng đồng', 
      desc: 'Môi trường học tập tích cực. 10,000+ học viên, cộng đồng hỗ trợ lẫn nhau cùng tiến bộ.',
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Giá trị cốt lõi
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Những điều chúng tôi tin tưởng
            </h2>
          </div>
        </div>

        {/* Values List */}
        {values.map((value, i) => (
          <div 
            key={i}
            className={`grid lg:grid-cols-12 border-b border-neutral-200 last:border-b-0
                     hover:bg-neutral-50 transition-colors duration-150
                     transform transition-all duration-500
                     ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${100 + i * 100}ms` }}
          >
            <div className="lg:col-span-1 p-6 lg:p-8 lg:border-r border-neutral-200">
              <span className="text-sm font-medium text-neutral-400">{value.num}</span>
            </div>
            <div className="lg:col-span-3 p-6 lg:p-8 lg:border-r border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">{value.title}</h3>
            </div>
            <div className="lg:col-span-8 p-6 lg:p-8">
              <p className="text-neutral-600 leading-relaxed">{value.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ============================================
// TEAM SECTION - IMPRESSIVE CARD DESIGN
// ============================================
const TeamSection = () => {
  const [ref, isInView] = useInView();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const team = [
    { 
      name: 'Nguyễn Văn Minh', 
      role: 'Founder & CEO',
      department: 'Leadership',
      years: 12,
      image: null, // Placeholder - will use initials
      certifications: ['IELTS 8.5', 'Thạc sĩ TESOL', 'Cambridge CELTA'],
      specialties: ['IELTS Writing', 'Academic English'],
      students: '3,000+',
      quote: 'Giáo dục là con đường ngắn nhất đến thành công.'
    },
    { 
      name: 'Trần Thị Hương', 
      role: 'Academic Director',
      department: 'English',
      years: 10,
      image: null,
      certifications: ['DELTA Cambridge', 'IELTS 8.0', 'MA in Education'],
      specialties: ['Curriculum Design', 'Teacher Training'],
      students: '2,500+',
      quote: 'Mỗi học viên đều có tiềm năng riêng cần được khơi dậy.'
    },
    { 
      name: 'Lê Hoàng Nam', 
      role: 'IT Program Lead',
      department: 'IT',
      years: 8,
      image: null,
      certifications: ['MOS Master', 'MCT', 'IC3 Certified'],
      specialties: ['Microsoft Office', 'Data Analysis'],
      students: '2,000+',
      quote: 'Tin học là kỹ năng sống còn trong thời đại số.'
    },
    { 
      name: 'Phạm Thị Lan', 
      role: 'Head of Training',
      department: 'English',
      years: 10,
      image: null,
      certifications: ['CELTA', 'TKT Modules 1-3', 'IELTS 7.5'],
      specialties: ['TOEIC', 'Business English'],
      students: '2,800+',
      quote: 'Học ngôn ngữ là mở ra cánh cửa đến thế giới.'
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Đội ngũ giảng viên
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              Những người dẫn dắt
            </h2>
            <p className="mt-4 text-neutral-500 max-w-xl">
              Đội ngũ giảng viên được tuyển chọn khắt khe với 100% có chứng chỉ quốc tế 
              và trung bình 8+ năm kinh nghiệm giảng dạy.
            </p>
          </div>
        </div>

        {/* Team Cards - Editorial Grid */}
        <div className="grid lg:grid-cols-2">
          {team.map((member, i) => (
            <div 
              key={i}
              className={`group border-b lg:border-b border-neutral-200 
                       ${i % 2 === 0 ? 'lg:border-r' : ''} 
                       last:border-b-0 lg:last:border-b
                       transform transition-all duration-500
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 100}ms` }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="grid lg:grid-cols-12">
                {/* Image Section */}
                <div className="lg:col-span-5 relative overflow-hidden bg-neutral-100">
                  <div className="aspect-[4/5] lg:aspect-auto lg:h-full flex items-center justify-center relative">
                    {/* Placeholder with stylized initials */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-[0.03]"
                           style={{
                             backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%),
                                              linear-gradient(-45deg, #000 25%, transparent 25%),
                                              linear-gradient(45deg, transparent 75%, #000 75%),
                                              linear-gradient(-45deg, transparent 75%, #000 75%)`,
                             backgroundSize: '20px 20px',
                             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                           }} />
                      
                      {/* Large Initials */}
                      <span className="text-[120px] lg:text-[160px] font-black text-neutral-200 select-none
                                     group-hover:text-neutral-300 transition-colors duration-300">
                        {member.name.split(' ').slice(-1)[0][0]}
                      </span>
                      
                      {/* Years Badge */}
                      <div className="absolute bottom-6 left-6">
                        <div className="bg-neutral-900 text-white px-4 py-2">
                          <span className="text-2xl font-bold">{member.years}</span>
                          <span className="text-xs uppercase tracking-wider ml-1">năm</span>
                        </div>
                      </div>

                      {/* Department Tag */}
                      <div className="absolute top-6 right-6">
                        <span className="bg-[#FF4D00] text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                          {member.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                          {member.name}
                        </h3>
                        <p className="text-[#FF4D00] font-semibold mt-1">{member.role}</p>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="mb-6">
                    <p className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-3">
                      Chứng chỉ
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.certifications.map((cert, j) => (
                        <span 
                          key={j} 
                          className="px-3 py-1.5 bg-neutral-100 text-xs font-medium text-neutral-700
                                   group-hover:bg-neutral-900 group-hover:text-white
                                   transition-colors duration-200"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-6">
                    <p className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-3">
                      Chuyên môn
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {member.specialties.map((spec, j) => (
                        <span key={j} className="text-sm text-neutral-600">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex-1" />

                  {/* Stats & Quote */}
                  <div className="pt-6 border-t border-neutral-200">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider">Học viên đã đào tạo</p>
                        <p className="text-3xl font-bold text-neutral-900 mt-1">{member.students}</p>
                      </div>
                      
                      {/* Quote on hover */}
                      <div className={`max-w-[200px] text-right transition-all duration-300
                                    ${hoveredIndex === i ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                        <p className="text-xs text-neutral-500 italic leading-relaxed">
                          "{member.quote}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats Row */}
        <div className="grid lg:grid-cols-4 border-t border-neutral-900 bg-neutral-900">
          <div className={`p-6 lg:p-8 lg:border-r border-neutral-800
                        transform transition-all duration-500 delay-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-4xl font-bold text-white"><Counter end={50} />+</p>
            <p className="text-sm text-neutral-400 mt-2">Giảng viên toàn hệ thống</p>
          </div>
          <div className={`p-6 lg:p-8 lg:border-r border-neutral-800
                        transform transition-all duration-500 delay-600
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-4xl font-bold text-white"><Counter end={100} />%</p>
            <p className="text-sm text-neutral-400 mt-2">Có chứng chỉ quốc tế</p>
          </div>
          <div className={`p-6 lg:p-8 lg:border-r border-neutral-800
                        transform transition-all duration-500 delay-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-4xl font-bold text-white"><Counter end={8} />+</p>
            <p className="text-sm text-neutral-400 mt-2">Năm kinh nghiệm TB</p>
          </div>
          <div className={`p-6 lg:p-8
                        transform transition-all duration-500 delay-800
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF4D00]" />
              <span className="text-sm font-medium text-white">Đối tác Cambridge</span>
            </div>
            <p className="text-sm text-neutral-400 mt-2">Trung tâm ủy quyền chính thức</p>
          </div>
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

  const locations = [
    { 
      name: 'Quận 1', 
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '028 1234 5678',
      features: ['20 phòng học', 'Lab 40 máy', 'Thư viện']
    },
    { 
      name: 'Quận 7', 
      address: '456 Nguyễn Thị Thập, Quận 7, TP.HCM',
      phone: '028 2345 6789',
      features: ['15 phòng học', 'Lab 30 máy', 'Canteen']
    },
    { 
      name: 'Bình Thạnh', 
      address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
      phone: '028 3456 7890',
      features: ['18 phòng học', 'Lab 35 máy', 'Parking']
    },
  ];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
              Cơ sở
            </span>
          </div>
          <div className={`lg:col-span-8 p-6 lg:p-12
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
              3 địa điểm tại TP.HCM
            </h2>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid lg:grid-cols-3">
          {locations.map((loc, i) => (
            <div 
              key={i}
              className={`p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200 last:border-r-0
                       transform transition-all duration-500
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${100 + i * 100}ms` }}
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Cơ sở {loc.name}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-neutral-600">{loc.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">{loc.phone}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {loc.features.map((f, j) => (
                  <span key={j} className="px-3 py-1 bg-neutral-100 text-xs text-neutral-600">
                    {f}
                  </span>
                ))}
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
    <section ref={ref} className="bg-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2">
          {/* Left */}
          <div className="p-8 lg:p-16 lg:border-r border-neutral-800">
            <h2 className={`text-3xl lg:text-4xl font-bold text-white tracking-tight
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Sẵn sàng bắt đầu?
            </h2>
            <p className={`mt-4 text-neutral-400 leading-relaxed
                        transform transition-all duration-500 delay-100
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Đăng ký học thử miễn phí và khám phá tiềm năng của bạn cùng Skill Master.
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
              Đăng ký ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border border-neutral-700 text-white text-sm font-semibold uppercase tracking-wider
                       hover:bg-neutral-800 transition-colors duration-150"
            >
              Tư vấn miễn phí
            </Link>
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
// MAIN ABOUT PAGE COMPONENT
// ============================================
export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white antialiased">
      <Header />
      <main>
        <PageHeader />
        <StorySection />
        <ValuesSection />
        <TeamSection />
        <LocationsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
