import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ArrowUpRight, Clock, User, Tag, Search, 
  BookOpen, Lightbulb, Target, TrendingUp, ChevronRight,
  Calendar, Eye, Heart, MessageCircle, Phone
} from 'lucide-react';

// ============================================
// BLOG PAGE - Swiss Minimalist Design
// ============================================
// Design: Editorial layout with alternating image/content
// First 4 articles: Zigzag layout (image left/right alternating)
// Remaining: Grid layout
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
// SAMPLE BLOG DATA
// ============================================
const blogPosts = [
  {
    id: 1,
    title: 'Lộ trình tự học IELTS từ 5.0 lên 7.0 trong 6 tháng',
    excerpt: 'Chia sẻ chi tiết kế hoạch học tập, tài liệu và phương pháp giúp bạn đạt được mục tiêu IELTS 7.0 trong thời gian ngắn nhất có thể.',
    category: 'IELTS',
    author: 'Nguyễn Minh Anh',
    date: '28 Nov 2025',
    readTime: '12 phút đọc',
    views: 12500,
    likes: 892,
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
    featured: true,
    tags: ['IELTS', 'Lộ trình', 'Tự học'],
  },
  {
    id: 2,
    title: '10 mẹo Speaking Band 7+ mà ít người biết',
    excerpt: 'Những kỹ thuật nâng cao giúp bạn ghi điểm trong phần thi Speaking, từ cách paraphrase đến sử dụng idiomatic expressions tự nhiên.',
    category: 'Speaking',
    author: 'Trần Văn Hùng',
    date: '25 Nov 2025',
    readTime: '8 phút đọc',
    views: 8900,
    likes: 654,
    image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop',
    featured: true,
    tags: ['Speaking', 'Tips', 'Band 7+'],
  },
  {
    id: 3,
    title: 'Tổng hợp Vocabulary theo chủ đề cho IELTS Writing',
    excerpt: 'Danh sách từ vựng Academic theo 10 chủ đề phổ biến nhất trong IELTS Writing Task 2, kèm theo collocation và ví dụ.',
    category: 'Writing',
    author: 'Lê Thị Hương',
    date: '22 Nov 2025',
    readTime: '15 phút đọc',
    views: 15200,
    likes: 1203,
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
    featured: true,
    tags: ['Writing', 'Vocabulary', 'Academic'],
  },
  {
    id: 4,
    title: 'Excel nâng cao: Pivot Table từ A đến Z',
    excerpt: 'Hướng dẫn chi tiết cách sử dụng Pivot Table để phân tích dữ liệu, tạo báo cáo động và dashboard chuyên nghiệp.',
    category: 'Excel',
    author: 'Phạm Đức Minh',
    date: '20 Nov 2025',
    readTime: '20 phút đọc',
    views: 7800,
    likes: 567,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    featured: true,
    tags: ['Excel', 'Pivot Table', 'Data Analysis'],
  },
  {
    id: 5,
    title: 'Cách tránh 5 lỗi phổ biến trong IELTS Listening',
    excerpt: 'Phân tích những sai lầm thường gặp và cách khắc phục để cải thiện điểm Listening một cách đáng kể.',
    category: 'Listening',
    author: 'Nguyễn Hoàng Nam',
    date: '18 Nov 2025',
    readTime: '10 phút đọc',
    views: 6500,
    likes: 432,
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop',
    tags: ['Listening', 'Mistakes', 'Tips'],
  },
  {
    id: 6,
    title: 'TOEIC Reading: Chiến lược làm bài Part 7',
    excerpt: 'Phương pháp skimming, scanning và time management giúp bạn hoàn thành Part 7 đúng giờ với độ chính xác cao.',
    category: 'TOEIC',
    author: 'Trần Thị Mai',
    date: '15 Nov 2025',
    readTime: '12 phút đọc',
    views: 5400,
    likes: 321,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
    tags: ['TOEIC', 'Reading', 'Strategy'],
  },
  {
    id: 7,
    title: 'PowerPoint: Thiết kế slide chuyên nghiệp',
    excerpt: 'Nguyên tắc thiết kế, cách chọn font, màu sắc và bố cục để tạo ra những bài thuyết trình gây ấn tượng.',
    category: 'PowerPoint',
    author: 'Lê Văn Đức',
    date: '12 Nov 2025',
    readTime: '8 phút đọc',
    views: 4200,
    likes: 287,
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
    tags: ['PowerPoint', 'Design', 'Tips'],
  },
  {
    id: 8,
    title: 'Học tiếng Anh giao tiếp qua phim: Phương pháp hiệu quả',
    excerpt: 'Cách tận dụng Netflix và YouTube để cải thiện kỹ năng nghe nói một cách tự nhiên và thú vị.',
    category: 'Giao tiếp',
    author: 'Phạm Thị Lan',
    date: '10 Nov 2025',
    readTime: '7 phút đọc',
    views: 9800,
    likes: 756,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
    tags: ['Giao tiếp', 'Phim', 'Listening'],
  },
  {
    id: 9,
    title: 'Word: Tạo template văn bản chuyên nghiệp',
    excerpt: 'Hướng dẫn tạo template cho CV, báo cáo và các văn bản thường dùng trong công việc.',
    category: 'Word',
    author: 'Nguyễn Thanh Tùng',
    date: '08 Nov 2025',
    readTime: '10 phút đọc',
    views: 3500,
    likes: 234,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop',
    tags: ['Word', 'Template', 'Office'],
  },
];

const categories = [
  { name: 'Tất cả', icon: BookOpen, count: 45 },
  { name: 'IELTS', icon: Target, count: 18 },
  { name: 'TOEIC', icon: TrendingUp, count: 12 },
  { name: 'Tin học', icon: Lightbulb, count: 15 },
];

// ============================================
// HEADER COMPONENT
// ============================================
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
                      ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <nav className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center
                         group-hover:scale-105 transition-transform">
              <span className="font-display text-lg font-bold text-stone-50">S</span>
            </div>
            <span className="font-display text-xl font-semibold text-zinc-900">Skill Master</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link to="/courses" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Khóa học
            </Link>
            <Link to="/roadmap" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Lộ trình
            </Link>
            <Link to="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Về chúng tôi
            </Link>
            <Link to="/resources" className="text-sm font-medium text-zinc-900 border-b-2 border-red-600">
              Tài nguyên
            </Link>
            <Link to="/contact" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Liên hệ
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Đăng nhập
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full
                                          hover:bg-zinc-800 transition-colors">
              Đăng ký học
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

// ============================================
// HERO SECTION
// ============================================
const HeroSection = () => {
  const [ref, isInView] = useInView();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <section ref={ref} className="pt-32 pb-16 bg-stone-50 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl 
                     from-red-100 via-orange-50 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className={`transform transition-all duration-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full 
                          border border-stone-200 shadow-sm">
              <BookOpen className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-zinc-700">Blog & Tài nguyên</span>
            </span>
          </div>

          {/* Title */}
          <h1 className={`mt-8 font-display text-5xl lg:text-7xl font-bold text-zinc-900 
                       tracking-tight leading-[1.1] transform transition-all duration-700 delay-100
                       ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Kiến thức
            <br />
            <span className="text-zinc-400">không giới hạn</span>
          </h1>

          {/* Description */}
          <p className={`mt-6 text-xl text-zinc-500 leading-relaxed
                      transform transition-all duration-700 delay-200
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Tips học tập, lộ trình chi tiết, và tài liệu miễn phí giúp bạn 
            tiến bộ mỗi ngày trong hành trình chinh phục Anh ngữ & Tin học.
          </p>

          {/* Search Bar */}
          <div className={`mt-10 transform transition-all duration-700 delay-300
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-full
                        text-zinc-900 placeholder:text-zinc-400 focus:outline-none 
                        focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className={`mt-8 flex flex-wrap gap-3 transform transition-all duration-700 delay-400
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {categories.map((category, index) => (
              <button
                key={index}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all
                         ${index === 0 
                           ? 'bg-zinc-900 text-white border-zinc-900' 
                           : 'bg-white text-zinc-600 border-stone-200 hover:border-zinc-900 hover:text-zinc-900'
                         }`}
              >
                <category.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                              ${index === 0 ? 'bg-white/20' : 'bg-stone-100'}`}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// FEATURED ARTICLE - Zigzag Layout
// ============================================
const FeaturedArticle = ({ post, index }) => {
  const [ref, isInView] = useInView();
  const isEven = index % 2 === 0;

  return (
    <article 
      ref={ref}
      className={`py-16 ${index === 0 ? 'pt-8' : ''} border-b border-stone-200 last:border-b-0`}
    >
      <div className={`grid lg:grid-cols-2 gap-12 items-center
                    ${isEven ? '' : 'lg:flex-row-reverse'}`}>
        {/* Image */}
        <div className={`relative overflow-hidden rounded-3xl aspect-[4/3]
                      transform transition-all duration-1000
                      ${isInView ? 'opacity-100 translate-x-0' : `opacity-0 ${isEven ? '-translate-x-12' : 'translate-x-12'}`}
                      ${isEven ? '' : 'lg:order-2'}`}>
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
          {/* Category Badge */}
          <span className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 backdrop-blur-sm 
                        rounded-full text-sm font-medium text-zinc-900">
            {post.category}
          </span>
        </div>

        {/* Content */}
        <div className={`transform transition-all duration-1000 delay-200
                      ${isInView ? 'opacity-100 translate-x-0' : `opacity-0 ${isEven ? 'translate-x-12' : '-translate-x-12'}`}
                      ${isEven ? '' : 'lg:order-1'}`}>
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <span className="w-1 h-1 bg-zinc-300 rounded-full" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="mt-4 font-display text-3xl lg:text-4xl font-bold text-zinc-900 
                      leading-tight hover:text-zinc-600 transition-colors cursor-pointer">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="mt-4 text-lg text-zinc-500 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-stone-100 text-zinc-600 text-sm rounded-full">
                #{tag}
              </span>
            ))}
          </div>

          {/* Author & Stats */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-full
                           flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{post.author}</p>
                <p className="text-xs text-zinc-500">Tác giả</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{post.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                <span>{post.likes}</span>
              </div>
            </div>
          </div>

          {/* Read More */}
          <Link
            to={`/blog/${post.id}`}
            className="inline-flex items-center gap-2 mt-6 text-red-600 font-medium 
                     hover:gap-3 transition-all group"
          >
            Đọc tiếp
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};

// ============================================
// FEATURED SECTION (Zigzag)
// ============================================
const FeaturedSection = () => {
  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <section className="py-8 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="inline-block px-4 py-1.5 bg-red-600 text-white text-xs font-medium 
                          rounded-full uppercase tracking-wider mb-4">
              Bài viết nổi bật
            </span>
            <h2 className="font-display text-3xl font-bold text-zinc-900">
              Được đọc nhiều nhất
            </h2>
          </div>
        </div>

        {/* Zigzag Articles */}
        <div>
          {featuredPosts.map((post, index) => (
            <FeaturedArticle key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// ARTICLE CARD - Grid Layout
// ============================================
const ArticleCard = ({ post, index }) => {
  const [ref, isInView] = useInView();

  return (
    <article
      ref={ref}
      className={`group bg-white rounded-3xl border border-stone-200 overflow-hidden
               hover:shadow-xl hover:shadow-stone-200/50 hover:border-stone-300
               transition-all duration-500 cursor-pointer
               transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm 
                      rounded-full text-xs font-medium text-zinc-900">
          {post.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{post.date}</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>{post.readTime}</span>
        </div>

        {/* Title */}
        <h3 className="mt-3 font-semibold text-lg text-zinc-900 leading-snug
                    group-hover:text-zinc-600 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-full
                         flex items-center justify-center">
              <User className="w-3 h-3 text-zinc-500" />
            </div>
            <span className="text-xs text-zinc-600">{post.author}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{(post.views / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{post.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

// ============================================
// MORE ARTICLES SECTION (Grid)
// ============================================
const MoreArticlesSection = () => {
  const [ref, isInView] = useInView();
  const morePosts = blogPosts.filter(post => !post.featured);

  return (
    <section ref={ref} className="py-20 bg-stone-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className={`flex items-center justify-between mb-12 transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <span className="inline-block px-4 py-1.5 bg-zinc-900 text-white text-xs font-medium 
                          rounded-full uppercase tracking-wider mb-4">
              Tất cả bài viết
            </span>
            <h2 className="font-display text-3xl font-bold text-zinc-900">
              Khám phá thêm
            </h2>
          </div>

          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 
                     border border-stone-300 rounded-full text-sm font-medium text-zinc-700
                     hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {morePosts.map((post, index) => (
            <ArticleCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 text-center">
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-stone-300
                          rounded-full text-zinc-700 font-medium hover:bg-zinc-900 hover:text-white 
                          hover:border-zinc-900 transition-all">
            Tải thêm bài viết
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

// ============================================
// NEWSLETTER SECTION
// ============================================
const NewsletterSection = () => {
  const [ref, isInView] = useInView();

  return (
    <section ref={ref} className="py-20 bg-zinc-900">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className={`max-w-2xl mx-auto text-center transform transition-all duration-700
                      ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-xs font-medium 
                        rounded-full uppercase tracking-wider mb-6">
            Newsletter
          </span>
          <h2 className="font-display text-4xl font-bold text-white tracking-tight">
            Nhận bài viết mới
            <br />
            <span className="text-zinc-500">mỗi tuần</span>
          </h2>
          <p className="mt-4 text-zinc-400">
            Đăng ký để nhận tips học tập, tài liệu miễn phí và thông báo khóa học mới.
          </p>

          {/* Form */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-full
                      text-white placeholder:text-zinc-500 focus:outline-none 
                      focus:border-white/40 transition-colors"
            />
            <button className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold
                            rounded-full transition-colors">
              Đăng ký
            </button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
          </p>
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
    <footer className="bg-stone-100 border-t border-stone-200 py-12">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
              <span className="font-display text-lg font-bold text-stone-50">S</span>
            </div>
            <span className="font-display text-xl font-semibold text-zinc-900">Skill Master</span>
          </Link>
          <p className="text-sm text-zinc-500">© 2025 Skill Master. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN BLOG PAGE
// ============================================
export const BlogPage = () => {
  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased">
      <Header />
      <main>
        <HeroSection />
        <FeaturedSection />
        <MoreArticlesSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
