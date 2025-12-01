import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, MapPin, Phone, Award
} from 'lucide-react';
import PublicHeader from '../../components/layout/public-header';

// Import logo
import logoImage from '@/assets/logo.png';

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
// PAGE HEADER SECTION - RHYTHM VARIATION
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
                Về chúng tôi
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1]">
                Skill Master
              </h1>
            </div>
          </div>

          {/* Right - Description & Stats with RHYTHM VARIATION */}
          <div className="lg:col-span-7 flex flex-col">
            <div className={`p-6 lg:p-12
                          transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <p className="text-lg text-neutral-600 leading-relaxed max-w-xl">
                Hệ thống đào tạo Anh ngữ và Tin học hàng đầu, 
                cam kết mang đến chất lượng giáo dục chuẩn quốc tế từ năm 2016.
              </p>
            </div>
            
            {/* Quick Stats - ASYMMETRIC RHYTHM */}
            <div className="grid grid-cols-12 border-t border-neutral-200">
              {/* Big stat 1 - Years (anchor) */}
              <div className={`col-span-5 p-6 lg:p-8 border-r border-neutral-200 bg-neutral-50
                           transform transition-all duration-500 delay-200
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-5xl lg:text-6xl font-black text-neutral-900">
                  <Counter end={8} />
                </p>
                <p className="text-sm text-neutral-600 mt-2">Năm kinh nghiệm</p>
                <p className="text-xs text-neutral-400 mt-1">Từ 2016 đến nay</p>
              </div>
              
              {/* Big stat 2 - Students */}
              <div className={`col-span-4 p-6 lg:p-8 border-r border-neutral-200
                           transform transition-all duration-500 delay-300
                           ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-4xl lg:text-5xl font-bold text-neutral-900">
                  <Counter end={10} suffix="K" />
                </p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mt-2">Học viên</p>
              </div>
              
              {/* Small stats stacked */}
              <div className="col-span-3 flex flex-col">
                <div className={`flex-1 p-4 lg:p-6 border-b border-neutral-200
                             transform transition-all duration-500 delay-400
                             ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <p className="text-2xl font-bold text-neutral-900">
                    <Counter end={50} suffix="+" />
                  </p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Giảng viên</p>
                </div>
                <div className={`flex-1 p-4 lg:p-6 bg-[#FF4D00]
                             transform transition-all duration-500 delay-500
                             ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <p className="text-2xl font-bold text-white">
                    <Counter end={95} suffix="%" />
                  </p>
                  <p className="text-[10px] text-white/80 uppercase tracking-wider mt-1">Hài lòng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// STORY SECTION - WITH MILESTONE HIGHLIGHT
// ============================================
const StorySection = () => {
  const [ref, isInView] = useInView();

  const timeline = [
    { year: '2016', title: 'Khởi đầu', desc: '12 học viên đầu tiên tại cơ sở Quận 1', highlight: false },
    { year: '2018', title: 'Mở rộng', desc: 'Khai trương cơ sở thứ 2 tại Quận 7', highlight: false },
    { year: '2020', title: 'Chuyển đổi số', desc: 'Ra mắt platform học trực tuyến', highlight: false },
    { year: '2023', title: 'Đối tác Cambridge', desc: 'Trở thành trung tâm ủy quyền chính thức', highlight: true },
    { year: '2025', title: 'Hiện tại', desc: '3 cơ sở, 50+ giảng viên, 10,000+ học viên', highlight: false },
  ];

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

          {/* Right - Timeline with MILESTONE HIGHLIGHT */}
          <div className="lg:col-span-7 p-6 lg:p-12">
            <div className={`transform transition-all duration-500 delay-100
                          ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-8 block">
                Hành trình
              </span>
              
              <div className="space-y-0">
                {timeline.map((item, i) => (
                  <div 
                    key={i} 
                    className={`grid grid-cols-12 border-t py-6 transition-all duration-500
                             ${item.highlight 
                               ? 'border-t-2 border-[#FF4D00] bg-gradient-to-r from-orange-50 to-transparent -mx-6 px-6 lg:-mx-12 lg:px-12' 
                               : 'border-neutral-200'}
                             transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${200 + i * 100}ms` }}
                  >
                    <div className="col-span-2">
                      <span className={`text-sm font-bold ${item.highlight ? 'text-[#FF4D00]' : 'text-neutral-900'}`}>
                        {item.year}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      {item.highlight && <Award className="w-4 h-4 text-[#FF4D00]" />}
                      <span className={`text-sm font-medium ${item.highlight ? 'text-[#FF4D00]' : 'text-neutral-900'}`}>
                        {item.title}
                      </span>
                    </div>
                    <div className="col-span-7">
                      <span className={`text-sm ${item.highlight ? 'text-neutral-700 font-medium' : 'text-neutral-500'}`}>
                        {item.desc}
                      </span>
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
// VALUES SECTION - FEATURED CORE VALUE
// ============================================
const ValuesSection = () => {
  const [ref, isInView] = useInView();

  const values = [
    { 
      num: '01',
      title: 'Tận tâm', 
      desc: 'Mỗi học viên là một cá nhân riêng biệt. Chúng tôi lắng nghe, thấu hiểu và đồng hành cùng từng bước tiến.',
      featured: true,
      quote: '"Thành công của học viên là thành công của chúng tôi"'
    },
    { 
      num: '02',
      title: 'Cam kết', 
      desc: 'Đồng hành đến khi đạt mục tiêu. Cam kết đầu ra bằng văn bản, học lại miễn phí nếu chưa đạt.',
      featured: false
    },
    { 
      num: '03',
      title: 'Đổi mới', 
      desc: 'Phương pháp hiện đại, hiệu quả. Ứng dụng công nghệ và giáo trình quốc tế vào giảng dạy.',
      featured: false
    },
    { 
      num: '04',
      title: 'Cộng đồng', 
      desc: 'Môi trường học tập tích cực. 10,000+ học viên, cộng đồng hỗ trợ lẫn nhau cùng tiến bộ.',
      featured: false
    },
  ];

  const featuredValue = values[0];
  const otherValues = values.slice(1);

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

        {/* FEATURED VALUE - Expanded */}
        <div className={`grid lg:grid-cols-12 border-b border-neutral-200 bg-neutral-50
                      transform transition-all duration-500
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="lg:col-span-1 p-6 lg:p-8 lg:border-r border-neutral-200 flex items-start">
            <span className="text-4xl font-black text-[#FF4D00]">{featuredValue.num}</span>
          </div>
          <div className="lg:col-span-4 p-6 lg:p-8 lg:border-r border-neutral-200">
            <h3 className="text-3xl font-bold text-neutral-900 mb-4">{featuredValue.title}</h3>
            <p className="text-neutral-600 leading-relaxed">{featuredValue.desc}</p>
          </div>
          <div className="lg:col-span-7 p-6 lg:p-8 flex items-center">
            <blockquote className="text-xl lg:text-2xl font-light text-neutral-700 italic border-l-4 border-[#FF4D00] pl-6">
              {featuredValue.quote}
            </blockquote>
          </div>
        </div>

        {/* Other Values - Compact row */}
        <div className="grid lg:grid-cols-3">
          {otherValues.map((value, i) => (
            <div 
              key={i}
              className={`p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200 last:border-r-0
                       hover:bg-neutral-50 transition-colors duration-150
                       transform transition-all duration-500
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <span className="text-sm font-medium text-neutral-400 mb-3 block">{value.num}</span>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{value.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// TEAM SECTION - STRIP + MARQUEE DESIGN
// ============================================
const TeamSection = () => {
  const [ref, isInView] = useInView();
  const [activeStrip, setActiveStrip] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Full team data - Vietnamese + International
  const team = [
    { 
      name: 'Nguyễn Văn Minh', 
      role: 'Founder & CEO',
      department: 'Leadership',
      nationality: 'VN',
      years: 12,
      certifications: ['IELTS 8.5', 'Thạc sĩ TESOL', 'Cambridge CELTA'],
      specialties: ['IELTS Writing', 'Academic English'],
      students: '3,000+',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'Sarah Johnson', 
      role: 'Senior ELT Trainer',
      department: 'English',
      nationality: 'US',
      years: 9,
      certifications: ['CELTA', 'DELTA Module 1', 'MA TESOL'],
      specialties: ['Speaking', 'Pronunciation'],
      students: '1,800+',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'Trần Thị Hương', 
      role: 'Academic Director',
      department: 'English',
      nationality: 'VN',
      years: 10,
      certifications: ['DELTA Cambridge', 'IELTS 8.0', 'MA Education'],
      specialties: ['Curriculum Design', 'Teacher Training'],
      students: '2,500+',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'Lê Hoàng Nam', 
      role: 'IT Program Lead',
      department: 'IT',
      nationality: 'VN',
      years: 8,
      certifications: ['MOS Master', 'MCT', 'IC3 Certified'],
      specialties: ['Microsoft Office', 'Data Analysis'],
      students: '2,000+',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'David Lee', 
      role: 'IELTS Specialist',
      department: 'English',
      nationality: 'SG',
      years: 7,
      certifications: ['IELTS 8.5', 'CELTA'],
      specialties: ['IELTS Speaking', 'IELTS Listening'],
      students: '1,500+',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'Phạm Thị Lan', 
      role: 'Head of Training',
      department: 'English',
      nationality: 'VN',
      years: 10,
      certifications: ['CELTA', 'TKT 1-3', 'IELTS 7.5'],
      specialties: ['TOEIC', 'Business English'],
      students: '2,800+',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'Emily Chen', 
      role: 'Kids English Lead',
      department: 'English',
      nationality: 'TW',
      years: 6,
      certifications: ['CELTA YL', 'TKT YL'],
      specialties: ['Kids English', 'Phonics'],
      students: '1,200+',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face'
    },
    { 
      name: 'Võ Minh Tuấn', 
      role: 'IT Instructor',
      department: 'IT',
      nationality: 'VN',
      years: 5,
      certifications: ['MOS Expert', 'IC3'],
      specialties: ['Excel Advanced', 'PowerPoint'],
      students: '1,000+',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face'
    },
  ];

  // Strip members (first 3 - leadership)
  const stripMembers = team.slice(0, 3);
  // Marquee members (all)
  const marqueeMembers = [...team, ...team]; // duplicate for seamless loop

  const activeTeacher = stripMembers[activeStrip];

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
              Đội ngũ giảng viên Việt Nam và quốc tế, 100% có chứng chỉ quốc tế,
              trung bình 8+ năm kinh nghiệm giảng dạy.
            </p>
          </div>
        </div>

        {/* ========== STRIP: 3 LEADERSHIP AVATARS ========== */}
        <div className={`grid lg:grid-cols-12 border-b border-neutral-200
                      transform transition-all duration-500 delay-100
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Left: 3 Avatars */}
          <div className="lg:col-span-5 p-6 lg:p-10 lg:border-r border-neutral-200 bg-neutral-50">
            <p className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-6">
              Ban lãnh đạo
            </p>
            
            <div className="flex items-center gap-4">
              {stripMembers.map((member, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStrip(i)}
                  onMouseEnter={() => setActiveStrip(i)}
                  className={`relative w-20 h-20 lg:w-24 lg:h-24 overflow-hidden transition-all duration-300
                            ${activeStrip === i 
                              ? 'ring-2 ring-[#FF4D00] ring-offset-2 scale-110 z-10' 
                              : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'}`}
                >
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Nationality badge */}
                  <span className={`absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5
                                  ${member.nationality === 'VN' ? 'bg-neutral-900 text-white' : 'bg-[#FF4D00] text-white'}`}>
                    {member.nationality}
                  </span>
                </button>
              ))}
            </div>

            {/* Active indicator */}
            <div className="flex gap-2 mt-6">
              {stripMembers.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 transition-all duration-300 ${
                    activeStrip === i ? 'w-8 bg-[#FF4D00]' : 'w-4 bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: Active Teacher Info */}
          <div className="lg:col-span-7 p-6 lg:p-10 relative min-h-[320px]">
            {stripMembers.map((member, i) => (
              <div 
                key={i}
                className={`absolute inset-0 p-6 lg:p-10 transition-all duration-400
                          ${activeStrip === i 
                            ? 'opacity-100 translate-y-0' 
                            : 'opacity-0 translate-y-4 pointer-events-none'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider mb-3
                                   ${member.nationality === 'VN' ? 'bg-neutral-900 text-white' : 'bg-[#FF4D00] text-white'}`}>
                      {member.nationality === 'VN' ? 'Vietnam' : 'International'}
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight">
                      {member.name}
                    </h3>
                    <p className="text-[#FF4D00] font-semibold mt-1">{member.role}</p>
                  </div>
                  <span className="text-xs text-neutral-400">{String(i + 1).padStart(2, '0')}</span>
                </div>

                {/* Certifications */}
                <div className="mb-6">
                  <p className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-3">
                    Chứng chỉ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {member.certifications.map((cert, j) => (
                      <span key={j} className="px-3 py-1.5 bg-neutral-100 text-xs font-medium text-neutral-700">
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
                  <div className="flex flex-wrap gap-3">
                    {member.specialties.map((spec, j) => (
                      <span key={j} className="text-sm text-neutral-600">{spec}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-6 border-t border-neutral-200">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Kinh nghiệm</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{member.years}<span className="text-sm font-medium ml-1">năm</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">Học viên</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">{member.students}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========== MARQUEE: ALL TEACHERS CAROUSEL ========== */}
        <div className="border-b border-neutral-200 py-6 overflow-hidden">
          <p className="text-xs font-medium tracking-widest uppercase text-neutral-500 px-6 lg:px-10 mb-6">
            Toàn bộ đội ngũ · Hover để xem chi tiết
          </p>
          
          <div 
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div 
              className="flex gap-4 px-6"
              style={{
                animation: 'marquee 40s linear infinite',
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {marqueeMembers.map((member, i) => (
                <MarqueeCard key={i} member={member} index={i} />
              ))}
            </div>
          </div>

          {/* CSS Animation */}
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
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
// MARQUEE CARD COMPONENT - WITH SPOTLIGHT VARIATION
// ============================================
const MarqueeCard = ({ member, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isInternational = member.nationality !== 'VN';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex-shrink-0 border bg-white transition-all duration-300 cursor-pointer
                ${isInternational 
                  ? 'w-[300px] lg:w-[360px] border-[#FF4D00]/30 hover:border-[#FF4D00]' 
                  : 'w-[260px] lg:w-[300px] border-neutral-200'}
                ${isHovered ? 'bg-neutral-50 -translate-y-1' : ''}`}
    >
      <div className="flex">
        {/* Avatar */}
        <div className={`flex-shrink-0 relative overflow-hidden bg-neutral-100
                      ${isInternational ? 'w-28 h-32' : 'w-24 h-28'}`}>
          <img 
            src={member.image} 
            alt={member.name}
            className={`w-full h-full object-cover transition-all duration-300
                      ${isHovered ? 'scale-105' : isInternational ? '' : 'grayscale'}`}
          />
          {/* Nationality */}
          <span className={`absolute bottom-1 left-1 text-[10px] font-bold px-1.5 py-0.5
                         ${member.nationality === 'VN' ? 'bg-neutral-900 text-white' : 'bg-[#FF4D00] text-white'}`}>
            {member.nationality}
          </span>
          {/* International badge */}
          {isInternational && (
            <span className="absolute top-1 right-1 text-[8px] font-bold px-1 py-0.5 bg-white/90 text-[#FF4D00] uppercase">
              Native
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h4 className={`font-bold text-neutral-900 leading-tight
                         ${isInternational ? 'text-base' : 'text-sm'}`}>
              {member.name}
            </h4>
            <p className="text-[#FF4D00] text-xs font-medium mt-0.5">{member.role}</p>
          </div>

          {/* Expandable info on hover */}
          <div className={`transition-all duration-300 overflow-hidden
                        ${isHovered ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="flex gap-3 text-xs text-neutral-500">
              <span>{member.years} năm</span>
              <span>·</span>
              <span>{member.students} HV</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {member.certifications.slice(0, isInternational ? 3 : 2).map((cert, j) => (
                <span key={j} className={`px-1.5 py-0.5 text-[10px]
                                       ${isInternational 
                                         ? 'bg-[#FF4D00]/10 text-[#FF4D00]' 
                                         : 'bg-neutral-100 text-neutral-600'}`}>
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Default mini stats */}
          <div className={`flex gap-4 text-xs text-neutral-500 transition-all duration-300
                        ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <span className="font-medium">{member.years}y</span>
            <span>{member.department}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LOCATIONS SECTION - INTERACTIVE TABS + MAPS
// ============================================
const LocationsSection = () => {
  const [ref, isInView] = useInView();
  const [activeLocation, setActiveLocation] = useState(0);

  const locations = [
    { 
      name: 'Quận 1', 
      label: 'Flagship',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '028 1234 5678',
      features: ['20 phòng học', 'Lab 40 máy', 'Thư viện'],
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
      mapUrl: 'https://maps.google.com/?q=123+Nguyen+Hue+Quan+1+HCMC',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4!2d106.7!3d10.77!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzEyLjAiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1sen!2s!4v1234567890'
    },
    { 
      name: 'Quận 7', 
      label: 'PMH Center',
      address: '456 Nguyễn Thị Thập, Quận 7, TP.HCM',
      phone: '028 2345 6789',
      features: ['15 phòng học', 'Lab 30 máy', 'Canteen'],
      image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=500&fit=crop',
      mapUrl: 'https://maps.google.com/?q=456+Nguyen+Thi+Thap+Quan+7+HCMC',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.0!2d106.7!3d10.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQzJzQ4LjAiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1sen!2s!4v1234567890'
    },
    { 
      name: 'Bình Thạnh', 
      label: 'BT Campus',
      address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
      phone: '028 3456 7890',
      features: ['18 phòng học', 'Lab 35 máy', 'Parking'],
      image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=500&fit=crop',
      mapUrl: 'https://maps.google.com/?q=789+Dien+Bien+Phu+Binh+Thanh+HCMC',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2!2d106.7!3d10.80!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDA0JzQ4LjAiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1sen!2s!4v1234567890'
    },
  ];

  const current = locations[activeLocation];

  return (
    <section ref={ref} className="border-b border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Section Header with Tabs */}
        <div className="grid lg:grid-cols-12 border-b border-neutral-200">
          <div className="lg:col-span-4 p-6 lg:p-12 lg:border-r border-neutral-200">
            <span className="text-xs font-medium tracking-widest uppercase text-neutral-500 mb-4 block">
              Cơ sở
            </span>
            <h2 className={`text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              3 địa điểm
            </h2>
          </div>
          
          {/* Location Tabs */}
          <div className="lg:col-span-8 flex flex-col justify-end">
            <div className="flex border-t lg:border-t-0">
              {locations.map((loc, i) => (
                <button
                  key={i}
                  onClick={() => setActiveLocation(i)}
                  className={`flex-1 p-4 lg:p-6 text-left transition-all duration-300 border-b-2
                            ${activeLocation === i 
                              ? 'bg-neutral-900 text-white border-[#FF4D00]' 
                              : 'bg-white text-neutral-600 border-transparent hover:bg-neutral-50'}`}
                >
                  <span className="text-xs text-neutral-400 block mb-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`font-bold block ${activeLocation === i ? 'text-white' : 'text-neutral-900'}`}>
                    {loc.name}
                  </span>
                  <span className={`text-xs mt-1 block ${activeLocation === i ? 'text-[#FF4D00]' : 'text-neutral-500'}`}>
                    {loc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Location Content */}
        <div className={`grid lg:grid-cols-12 transform transition-all duration-500
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Left: Image */}
          <div className="lg:col-span-5 lg:border-r border-neutral-200 relative overflow-hidden bg-neutral-100">
            {locations.map((loc, i) => (
              <div 
                key={i}
                className={`absolute inset-0 transition-all duration-500
                          ${activeLocation === i ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
              >
                <img 
                  src={loc.image} 
                  alt={`Cơ sở ${loc.name}`}
                  className="w-full h-full object-cover min-h-[350px]"
                />
                {i === 0 && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-[#FF4D00] text-white text-xs font-bold uppercase tracking-wider">
                    Flagship
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Middle: Info */}
          <div className="lg:col-span-4 p-6 lg:p-8 lg:border-r border-neutral-200 flex flex-col justify-between relative min-h-[350px]">
            {locations.map((loc, i) => (
              <div 
                key={i}
                className={`absolute inset-0 p-6 lg:p-8 flex flex-col justify-between transition-all duration-400
                          ${activeLocation === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
              >
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-6">
                    Cơ sở {loc.name}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#FF4D00] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Địa chỉ</p>
                        <p className="text-neutral-700">{loc.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#FF4D00] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Hotline</p>
                        <p className="text-neutral-900 font-semibold">{loc.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Cơ sở vật chất</p>
                  <div className="flex flex-wrap gap-2">
                    {loc.features.map((f, j) => (
                      <span key={j} className="px-3 py-1.5 bg-neutral-100 text-sm text-neutral-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Map Preview + Link */}
          <div className="lg:col-span-3 bg-neutral-100 relative min-h-[350px] flex flex-col">
            {/* Map Placeholder / Embed Area */}
            <div className="flex-1 relative overflow-hidden">
              {locations.map((loc, i) => (
                <div 
                  key={i}
                  className={`absolute inset-0 transition-all duration-500
                            ${activeLocation === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  {/* Static Map Preview */}
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center relative">
                    <div 
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/106.7,10.77,13,0/400x350?access_token=placeholder')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    {/* Overlay pattern */}
                    <div className="absolute inset-0 bg-neutral-900/5" />
                    {/* Pin icon */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-12 h-12 bg-[#FF4D00] rounded-full flex items-center justify-center shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="w-1 h-4 bg-[#FF4D00]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Google Maps Link Button */}
            <a
              href={current.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-4 bg-neutral-900 text-white
                       hover:bg-neutral-800 transition-colors duration-150"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Xem trên Google Maps</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Navigation Dots */}
        <div className="flex justify-center gap-2 py-4 border-t border-neutral-200">
          {locations.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveLocation(i)}
              className={`transition-all duration-300 ${
                activeLocation === i 
                  ? 'w-8 h-2 bg-[#FF4D00]' 
                  : 'w-2 h-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA SECTION - CLEAR BUTTON HIERARCHY
// ============================================
const CTASection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="bg-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12">
          {/* Left - Message */}
          <div className="lg:col-span-7 p-8 lg:p-16 lg:border-r border-neutral-800">
            <h2 className={`text-3xl lg:text-4xl font-bold text-white tracking-tight
                        transform transition-all duration-500
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Sẵn sàng bắt đầu?
            </h2>
            <p className={`mt-4 text-neutral-400 leading-relaxed max-w-md
                        transform transition-all duration-500 delay-100
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Đăng ký học thử miễn phí và khám phá tiềm năng của bạn cùng Skill Master.
            </p>
          </div>

          {/* Right - Buttons with CLEAR HIERARCHY */}
          <div className={`lg:col-span-5 p-8 lg:p-16 flex flex-col justify-center gap-4
                        transform transition-all duration-500 delay-200
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* PRIMARY - Large, full width */}
            <Link
              to="/register"
              className="w-full px-8 py-5 bg-[#FF4D00] text-white text-center text-base font-bold uppercase tracking-wider
                       hover:bg-[#E64500] transition-colors duration-150 flex items-center justify-center gap-3"
            >
              Đăng ký học thử miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            {/* SECONDARY - Text link style */}
            <Link
              to="/contact"
              className="text-center text-sm text-neutral-400 hover:text-white transition-colors duration-150 py-2"
            >
              Hoặc liên hệ tư vấn trực tiếp →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FOOTER COMPONENT - CLEANER WITH GAP NOT BORDERS
// ============================================
const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Footer - Using gap instead of borders */}
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-0 p-8 lg:p-12">
          {/* Brand - Takes more space */}
          <div className="lg:col-span-5 lg:pr-12">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img 
                src={logoImage} 
                alt="Skill Master" 
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-neutral-600 leading-relaxed mb-6 max-w-sm">
              Hệ thống đào tạo Anh ngữ và Tin học hàng đầu, đồng hành cùng 10,000+ học viên đạt mục tiêu.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-500 uppercase tracking-wider">Đối tác</span>
              <div className="flex items-center gap-2 px-3 py-1 border border-neutral-200">
                <Award className="w-4 h-4 text-[#FF4D00]" />
                <span className="text-xs font-medium text-neutral-700">Cambridge</span>
              </div>
            </div>
          </div>

          {/* Links - Compact columns */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4">Khóa học</h4>
            <ul className="space-y-3">
              {['IELTS Academic', 'TOEIC 4 Kỹ năng', 'Tin học VP', 'IC3 Digital'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4">Về chúng tôi</h4>
            <ul className="space-y-3">
              {['Giới thiệu', 'Đội ngũ', 'Blog', 'Tuyển dụng'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Highlighted */}
          <div className="lg:col-span-3 lg:pl-8 lg:border-l border-neutral-200">
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <span className="text-neutral-600">123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-900 font-medium">0909 123 456</span>
              </li>
              <li className="text-neutral-600">contact@skillmaster.vn</li>
            </ul>
          </div>
        </div>

        {/* Bottom - Minimal */}
        <div className="border-t border-neutral-100 px-8 lg:px-12 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-400">
            © 2025 Skill Master. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors">
              Điều khoản
            </a>
            <a href="#" className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors">
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
      <PublicHeader />
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
