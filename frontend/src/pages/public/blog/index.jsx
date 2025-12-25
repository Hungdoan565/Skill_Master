import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Calendar, Clock, ArrowRight, BookOpen, Users, TrendingUp } from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';

// ============================================
// BLOG PAGE - SWISS MINIMALISM
// ============================================
// Design Philosophy:
// - STRICT 12-column grid system
// - Monochromatic (Black/White/Gray) + #FF4D00 accent
// - Typography hierarchy through weight/size
// - No shadows, sharp corners, flat design
// - Border separations, not shadows
// - Subtle hover states (opacity, underline)
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

// Reduced Motion Hook
const useReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        const handler = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return prefersReducedMotion;
};

// ============================================
// MOCK DATA - Replace with API later
// ============================================
const CATEGORIES = [
    { id: 'all', label: 'Tất cả', count: 38, icon: BookOpen },
    { id: 'ielts', label: 'IELTS', count: 18, icon: TrendingUp },
    { id: 'toeic', label: 'TOEIC', count: 15, icon: Users },
    { id: 'it', label: 'Tin học', count: 15, icon: BookOpen },
];

const MOCK_POSTS = [
    {
        id: 1,
        slug: 'lo-trinh-tu-hoc-ielts-5-len-7',
        title: 'Lộ trình tự học IELTS từ 5.0 lên 7.0 trong 6 tháng',
        excerpt: 'Bộ hướng dẫn chi tiết giúp bạn cải thiện band IELTS một cách hiệu quả với phương pháp học tập khoa học và lịch trình cụ thể từng tuần.',
        category: 'ielts',
        date: '2024-12-21',
        readTime: 12,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor' },
        featured: true,
    },
    {
        id: 2,
        slug: 'cach-lam-bai-thi-toeic-listening',
        title: 'Chiến thuật làm bài TOEIC Listening đạt 400+ điểm',
        excerpt: 'Những kỹ thuật và mẹo hay giúp bạn tối ưu điểm số Listening trong kỳ thi TOEIC với các phương pháp đã được kiểm chứng.',
        category: 'toeic',
        date: '2024-12-19',
        readTime: 8,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert' },
        featured: true,
    },
    {
        id: 3,
        slug: 'excel-cong-thuc-can-biet',
        title: '50 công thức Excel cần biết cho dân văn phòng',
        excerpt: 'Tổng hợp các công thức Excel từ cơ bản đến nâng cao, giúp bạn làm việc hiệu quả hơn và tiết kiệm thời gian đáng kể.',
        category: 'it',
        date: '2024-12-18',
        readTime: 15,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist' },
        featured: true,
    },
    {
        id: 4,
        slug: 'ielts-writing-task-2-template',
        title: 'Template viết IELTS Writing Task 2 Band 7+',
        excerpt: 'Cấu trúc bài viết chi tiết kèm các cụm từ academic giúp bạn đạt band điểm cao trong phần thi Writing Task 2.',
        category: 'ielts',
        date: '2024-12-15',
        readTime: 10,
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor' },
    },
    {
        id: 5,
        slug: 'toeic-part-5-grammar',
        title: 'Tổng hợp ngữ pháp TOEIC Part 5 thường gặp',
        excerpt: 'Các điểm ngữ pháp quan trọng xuất hiện với tần suất cao trong Part 5 và cách nhận biết đáp án đúng nhanh chóng.',
        category: 'toeic',
        date: '2024-12-12',
        readTime: 7,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert' },
    },
    {
        id: 6,
        slug: 'powerpoint-thiet-ke-chuyen-nghiep',
        title: 'Bí quyết thiết kế PowerPoint chuyên nghiệp',
        excerpt: 'Hướng dẫn tạo slide thuyết trình đẹp mắt, thu hút với các nguyên tắc thiết kế cơ bản và template miễn phí.',
        category: 'it',
        date: '2024-12-10',
        readTime: 9,
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist' },
    },
];

// Format date helper
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ============================================
// HERO SECTION - ASYMMETRIC GRID
// ============================================
const HeroSection = ({ totalPosts, totalCategories, searchTerm, onSearchChange }) => {
    const [ref, isInView] = useInView();
    const prefersReducedMotion = useReducedMotion();

    return (
        <section className="pt-20 border-b border-neutral-900">
            <div className="max-w-[1600px] mx-auto">
                <div
                    ref={ref}
                    className={`grid lg:grid-cols-12 transition-all duration-700
                    ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {/* LEFT: Label + Stats (5 cols) */}
                    <div className="lg:col-span-5 p-6 lg:p-12 lg:border-r border-neutral-900">
                        {/* Breadcrumb Label */}
                        <span className="inline-flex items-center gap-2 text-xs font-medium 
                           tracking-widest uppercase text-neutral-500 mb-6">
                            <span className="w-8 h-px bg-neutral-400" />
                            Blog & Tài nguyên
                        </span>

                        {/* Title */}
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold 
                         text-neutral-900 tracking-tight leading-[1.1]">
                            Kiến thức<br />không giới hạn
                        </h1>

                        {/* Quick Stats */}
                        <div className="flex gap-8 mt-10 pt-8 border-t border-neutral-200">
                            <div>
                                <span className="text-3xl font-bold text-neutral-900 font-mono">
                                    {totalPosts}
                                </span>
                                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Bài viết</p>
                            </div>
                            <div>
                                <span className="text-3xl font-bold text-neutral-900 font-mono">
                                    {totalCategories}
                                </span>
                                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Chủ đề</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Description + Search (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col">
                        <div className="p-6 lg:p-12 flex-1 flex flex-col justify-center">
                            <p className="text-lg lg:text-xl text-neutral-600 leading-relaxed max-w-xl mb-8">
                                Tips học tập, ôn thi IELTS, TOEIC và Tin học.
                                Chia sẻ kiến thức từ đội ngũ giảng viên Skill Master.
                            </p>

                            {/* Search - SHARP CORNERS */}
                            <div className="relative max-w-xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 
                                 w-5 h-5 text-neutral-400" />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Tìm kiếm bài viết..."
                                    aria-label="Tìm kiếm bài viết"
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-neutral-200
                           focus:border-neutral-900 focus:outline-none transition-colors
                           placeholder:text-neutral-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ============================================
// FILTER SECTION - STICKY, SHARP
// ============================================
const FilterSection = ({ categories, activeFilter, onFilterChange }) => {
    return (
        <section className="border-b border-neutral-200 sticky top-16 bg-white/95 
                      backdrop-blur-sm z-40">
            <div className="max-w-[1600px] mx-auto">
                <div className="grid lg:grid-cols-12">
                    {/* Filter Label */}
                    <div className="lg:col-span-2 p-4 lg:p-6 lg:border-r border-neutral-200 
                        flex items-center">
                        <span className="text-xs font-medium tracking-widest uppercase 
                           text-neutral-500">
                            Danh mục
                        </span>
                    </div>

                    {/* Filter Buttons - SHARP RECTANGLES */}
                    <div className="lg:col-span-10 p-4 lg:p-6 flex items-center gap-2 
                        overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => onFilterChange(cat.id)}
                                aria-pressed={activeFilter === cat.id}
                                className={`px-4 py-2 text-sm font-medium transition-all duration-200
                          whitespace-nowrap flex items-center gap-2
                          ${activeFilter === cat.id
                                        ? 'bg-neutral-900 text-white'
                                        : 'border-2 border-neutral-200 text-neutral-600 hover:border-neutral-900'
                                    }`}
                            >
                                {cat.label}
                                <span className={`text-xs font-mono
                               ${activeFilter === cat.id
                                        ? 'text-neutral-400'
                                        : 'text-neutral-500'}`}>
                                    {cat.count}
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
// BLOG CARD - HORIZONTAL, SWISS GRID
// ============================================
const BlogCard = ({ post, index }) => {
    const [ref, isInView] = useInView();
    const prefersReducedMotion = useReducedMotion();

    return (
        <article
            ref={ref}
            className={`border-b border-neutral-200 last:border-b-0
                transition-all duration-500
                ${isInView && !prefersReducedMotion
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${index * 50}ms` }}
        >
            <Link
                to={`/blog/${post.slug}`}
                className="group grid lg:grid-cols-12 hover:bg-neutral-50 transition-colors"
            >
                {/* Number + Category (2 cols) */}
                <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200 
                      flex lg:flex-col items-center lg:items-start gap-4">
                    <span className="text-2xl font-mono font-bold text-neutral-200 
                         group-hover:text-neutral-900 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] 
                         font-medium uppercase tracking-wider
                         group-hover:bg-[#FF4D00] transition-colors">
                        {post.category.toUpperCase()}
                    </span>
                </div>

                {/* Image (3 cols) */}
                <div className="lg:col-span-3 lg:border-r border-neutral-200 
                      relative overflow-hidden aspect-[16/10] lg:aspect-auto">
                    <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 
                     transition-transform duration-500"
                        loading="lazy"
                    />
                </div>

                {/* Content (5 cols) */}
                <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200 
                      flex flex-col justify-center">
                    <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-3 
                       group-hover:text-[#FF4D00] transition-colors leading-tight">
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-2">
                        {post.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <time className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.date)}
                        </time>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {post.readTime} min đọc
                        </span>
                    </div>
                </div>

                {/* Author + Arrow (2 cols) */}
                <div className="lg:col-span-2 p-6 lg:p-8 flex items-center justify-between">
                    <div>
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-neutral-200 flex items-center 
                          justify-center mb-2">
                            <span className="text-sm font-bold text-neutral-600">
                                {post.author.initials}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-neutral-900">
                            {post.author.name}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                            {post.author.role}
                        </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-neutral-300 
                               group-hover:text-[#FF4D00] group-hover:translate-x-1
                               transition-all" />
                </div>
            </Link>
        </article>
    );
};

// ============================================
// FEATURED SECTION
// ============================================
const FeaturedSection = ({ posts }) => {
    const [ref, isInView] = useInView();

    if (posts.length === 0) return null;

    return (
        <section className="border-b border-neutral-200">
            <div className="max-w-[1600px] mx-auto">
                <div className="grid lg:grid-cols-12">
                    {/* Label */}
                    <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200">
                        <span className="text-xs font-medium tracking-widest uppercase 
                           text-neutral-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#FF4D00]" />
                            Nổi bật
                        </span>
                    </div>

                    {/* Featured Cards */}
                    <div
                        ref={ref}
                        className={`lg:col-span-10 p-6 lg:p-8 grid md:grid-cols-3 gap-6
                      transition-all duration-700
                      ${isInView ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {posts.slice(0, 3).map((post, i) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group border-2 border-neutral-200 hover:border-neutral-900
                         transition-colors"
                            >
                                {/* Image */}
                                <div className="aspect-[16/10] overflow-hidden">
                                    <img
                                        src={post.thumbnail}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105
                             transition-transform duration-500"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <span className="text-[10px] font-medium uppercase tracking-wider
                                 text-neutral-500">
                                        {post.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-neutral-900 mt-2 mb-2
                               group-hover:text-[#FF4D00] transition-colors
                               line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                                        <span>{formatDate(post.date)}</span>
                                        <span>{post.readTime} min</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = ({ searchTerm, activeFilter }) => (
    <div className="py-20 text-center">
        <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center 
                  mx-auto mb-6">
            <Search className="w-6 h-6 text-neutral-400" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
            Không tìm thấy bài viết
        </h3>
        <p className="text-neutral-600 max-w-md mx-auto">
            {searchTerm
                ? `Không có kết quả cho "${searchTerm}"`
                : `Chưa có bài viết trong danh mục ${activeFilter}`
            }
        </p>
    </div>
);

// ============================================
// MAIN BLOG PAGE
// ============================================
export const BlogPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [posts, setPosts] = useState(MOCK_POSTS);

    // Filter & Search logic
    const filteredPosts = posts.filter(post => {
        const matchesFilter = activeFilter === 'all' || post.category === activeFilter;
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const featuredPosts = posts.filter(p => p.featured);

    // Update category counts based on current posts
    const categoriesWithCounts = CATEGORIES.map(cat => ({
        ...cat,
        count: cat.id === 'all'
            ? posts.length
            : posts.filter(p => p.category === cat.id).length
    }));

    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Blog & Tài nguyên | Skill Master</title>
                <meta
                    name="description"
                    content="Kiến thức không giới hạn - Tips học tập, ôn thi IELTS, TOEIC và Tin học từ đội ngũ giảng viên Skill Master."
                />
            </Helmet>

            <PublicHeader />

            <main>
                {/* Hero Section */}
                <HeroSection
                    totalPosts={posts.length}
                    totalCategories={CATEGORIES.length - 1}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

                {/* Filter Section */}
                <FilterSection
                    categories={categoriesWithCounts}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />

                {/* Featured Section (only show when not filtering/searching) */}
                {!searchTerm && activeFilter === 'all' && (
                    <FeaturedSection posts={featuredPosts} />
                )}

                {/* Blog List */}
                <section className="max-w-[1600px] mx-auto">
                    {filteredPosts.length > 0 ? (
                        <div>
                            {filteredPosts.map((post, index) => (
                                <BlogCard key={post.id} post={post} index={index} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState searchTerm={searchTerm} activeFilter={activeFilter} />
                    )}
                </section>

                {/* Load More */}
                {filteredPosts.length > 0 && (
                    <section className="max-w-[1600px] mx-auto border-t border-neutral-200">
                        <div className="p-8 text-center">
                            <button
                                className="px-8 py-3 bg-neutral-900 text-white font-medium
                         hover:bg-[#FF4D00] transition-colors"
                            >
                                Xem thêm bài viết
                            </button>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BlogPage;
