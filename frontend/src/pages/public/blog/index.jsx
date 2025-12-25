import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    Search, Calendar, Clock, ArrowRight, BookOpen, Users, TrendingUp,
    Mail, ChevronLeft, ChevronRight, SortAsc, Eye, Heart, Tag,
    Loader2, X
} from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';

// ============================================
// BLOG PAGE - SWISS MINIMALISM (ENHANCED)
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
// MOCK DATA - Extended for realistic display
// ============================================
const CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: BookOpen },
    { id: 'ielts', label: 'IELTS', icon: TrendingUp },
    { id: 'toeic', label: 'TOEIC', icon: Users },
    { id: 'it', label: 'Tin học', icon: BookOpen },
];

const POPULAR_TAGS = [
    { name: 'IELTS Writing', count: 12 },
    { name: 'Speaking Tips', count: 8 },
    { name: 'TOEIC Grammar', count: 15 },
    { name: 'Excel', count: 10 },
    { name: 'Vocabulary', count: 18 },
    { name: 'Listening', count: 11 },
    { name: 'PowerPoint', count: 6 },
    { name: 'Reading', count: 9 },
];

const SORT_OPTIONS = [
    { id: 'newest', label: 'Mới nhất' },
    { id: 'oldest', label: 'Cũ nhất' },
    { id: 'popular', label: 'Phổ biến' },
    { id: 'readTime', label: 'Thời gian đọc' },
];

const MOCK_POSTS = [
    {
        id: 1, slug: 'lo-trinh-tu-hoc-ielts-5-len-7',
        title: 'Lộ trình tự học IELTS từ 5.0 lên 7.0 trong 6 tháng',
        excerpt: 'Bộ hướng dẫn chi tiết giúp bạn cải thiện band IELTS một cách hiệu quả với phương pháp học tập khoa học và lịch trình cụ thể từng tuần.',
        category: 'ielts', date: '2024-12-21', readTime: 12, views: 2340,
        thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor' },
        featured: true, tags: ['IELTS', 'Lộ trình', 'Tự học']
    },
    {
        id: 2, slug: 'cach-lam-bai-thi-toeic-listening',
        title: 'Chiến thuật làm bài TOEIC Listening đạt 400+ điểm',
        excerpt: 'Những kỹ thuật và mẹo hay giúp bạn tối ưu điểm số Listening trong kỳ thi TOEIC với các phương pháp đã được kiểm chứng.',
        category: 'toeic', date: '2024-12-19', readTime: 8, views: 1850,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert' },
        featured: true, tags: ['TOEIC', 'Listening', 'Tips']
    },
    {
        id: 3, slug: 'excel-cong-thuc-can-biet',
        title: '50 công thức Excel cần biết cho dân văn phòng',
        excerpt: 'Tổng hợp các công thức Excel từ cơ bản đến nâng cao, giúp bạn làm việc hiệu quả hơn và tiết kiệm thời gian đáng kể.',
        category: 'it', date: '2024-12-18', readTime: 15, views: 3200,
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist' },
        featured: true, tags: ['Excel', 'Công thức', 'Văn phòng']
    },
    {
        id: 4, slug: 'ielts-writing-task-2-template',
        title: 'Template viết IELTS Writing Task 2 Band 7+',
        excerpt: 'Cấu trúc bài viết chi tiết kèm các cụm từ academic giúp bạn đạt band điểm cao trong phần thi Writing Task 2.',
        category: 'ielts', date: '2024-12-15', readTime: 10, views: 1920,
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor' },
        tags: ['IELTS Writing', 'Template', 'Band 7']
    },
    {
        id: 5, slug: 'toeic-part-5-grammar',
        title: 'Tổng hợp ngữ pháp TOEIC Part 5 thường gặp',
        excerpt: 'Các điểm ngữ pháp quan trọng xuất hiện với tần suất cao trong Part 5 và cách nhận biết đáp án đúng nhanh chóng.',
        category: 'toeic', date: '2024-12-12', readTime: 7, views: 1650,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert' },
        tags: ['TOEIC', 'Grammar', 'Part 5']
    },
    {
        id: 6, slug: 'powerpoint-thiet-ke-chuyen-nghiep',
        title: 'Bí quyết thiết kế PowerPoint chuyên nghiệp',
        excerpt: 'Hướng dẫn tạo slide thuyết trình đẹp mắt, thu hút với các nguyên tắc thiết kế cơ bản và template miễn phí.',
        category: 'it', date: '2024-12-10', readTime: 9, views: 980,
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist' },
        tags: ['PowerPoint', 'Thiết kế', 'Thuyết trình']
    },
    {
        id: 7, slug: 'ielts-speaking-part-1',
        title: 'Các câu hỏi IELTS Speaking Part 1 thường gặp & mẫu trả lời',
        excerpt: 'Tổng hợp 50+ câu hỏi Speaking Part 1 kèm ideas và cách triển khai câu trả lời tự nhiên, ghi điểm.',
        category: 'ielts', date: '2024-12-08', readTime: 11, views: 2100,
        thumbnail: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor' },
        tags: ['IELTS Speaking', 'Part 1', 'Mẫu câu']
    },
    {
        id: 8, slug: 'toeic-reading-strategies',
        title: '7 chiến lược đọc hiểu TOEIC Reading Part 7 hiệu quả',
        excerpt: 'Phương pháp làm bài Reading nhanh và chính xác, tối ưu thời gian cho các dạng bài Single và Multiple Passages.',
        category: 'toeic', date: '2024-12-05', readTime: 13, views: 1420,
        thumbnail: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert' },
        tags: ['TOEIC Reading', 'Part 7', 'Strategies']
    },
    {
        id: 9, slug: 'word-mail-merge',
        title: 'Hướng dẫn Mail Merge trong Word: Tạo thư hàng loạt',
        excerpt: 'Từng bước tạo thư mời, chứng nhận, phong bì hàng loạt với tính năng Mail Merge của Microsoft Word.',
        category: 'it', date: '2024-12-03', readTime: 8, views: 760,
        thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist' },
        tags: ['Word', 'Mail Merge', 'Tự động hóa']
    },
    {
        id: 10, slug: 'ielts-vocabulary-academic',
        title: '500 từ vựng IELTS Academic thường gặp nhất',
        excerpt: 'Danh sách từ vựng Academic Word List với ví dụ và cách sử dụng trong Writing và Speaking.',
        category: 'ielts', date: '2024-12-01', readTime: 20, views: 2890,
        thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
        author: { name: 'Nguyễn Văn A', initials: 'NA', role: 'IELTS Instructor' },
        tags: ['IELTS', 'Vocabulary', 'Academic']
    },
    {
        id: 11, slug: 'toeic-part-2-tips',
        title: 'Mẹo nghe TOEIC Part 2: Nhận diện bẫy thường gặp',
        excerpt: 'Các loại bẫy trong Part 2 và cách loại trừ đáp án sai một cách nhanh chóng.',
        category: 'toeic', date: '2024-11-28', readTime: 6, views: 1280,
        thumbnail: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
        author: { name: 'Trần Thị B', initials: 'TB', role: 'TOEIC Expert' },
        tags: ['TOEIC', 'Part 2', 'Listening']
    },
    {
        id: 12, slug: 'google-sheets-formulas',
        title: 'Google Sheets: Công thức và hàm cần biết',
        excerpt: 'So sánh Google Sheets với Excel và các hàm độc quyền của Sheets mà bạn nên biết.',
        category: 'it', date: '2024-11-25', readTime: 12, views: 890,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        author: { name: 'Lê Văn C', initials: 'LC', role: 'IT Specialist' },
        tags: ['Google Sheets', 'Formulas', 'Cloud']
    },
];

// Format helpers
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatViews = (views) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
    return views.toString();
};

// ============================================
// SKELETON LOADING COMPONENT
// ============================================
const CardSkeleton = () => (
    <div className="border-b border-neutral-200 animate-pulse">
        <div className="grid lg:grid-cols-12">
            <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200">
                <div className="h-8 w-12 bg-neutral-200 mb-4" />
                <div className="h-6 w-16 bg-neutral-200" />
            </div>
            <div className="lg:col-span-3 lg:border-r border-neutral-200 aspect-[16/10] lg:aspect-auto bg-neutral-200" />
            <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200">
                <div className="h-8 bg-neutral-200 mb-3 w-3/4" />
                <div className="h-4 bg-neutral-200 mb-2 w-full" />
                <div className="h-4 bg-neutral-200 mb-4 w-2/3" />
                <div className="flex gap-4">
                    <div className="h-4 w-24 bg-neutral-200" />
                    <div className="h-4 w-20 bg-neutral-200" />
                </div>
            </div>
            <div className="lg:col-span-2 p-6 lg:p-8">
                <div className="w-10 h-10 bg-neutral-200 mb-2" />
                <div className="h-4 w-20 bg-neutral-200 mb-1" />
                <div className="h-3 w-16 bg-neutral-200" />
            </div>
        </div>
    </div>
);

// ============================================
// HERO SECTION - ASYMMETRIC GRID
// ============================================
const HeroSection = ({ totalPosts, totalCategories, searchTerm, onSearchChange, onClearSearch }) => {
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
                        <span className="inline-flex items-center gap-2 text-xs font-medium 
                           tracking-widest uppercase text-neutral-500 mb-6">
                            <span className="w-8 h-px bg-neutral-400" />
                            Blog & Tài nguyên
                        </span>

                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold 
                         text-neutral-900 tracking-tight leading-[1.1]">
                            Kiến thức<br />không giới hạn
                        </h1>

                        <div className="flex gap-8 mt-10 pt-8 border-t border-neutral-200">
                            <div>
                                <span className="text-3xl font-bold text-neutral-900 font-mono">{totalPosts}</span>
                                <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Bài viết</p>
                            </div>
                            <div>
                                <span className="text-3xl font-bold text-neutral-900 font-mono">{totalCategories}</span>
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
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Tìm kiếm bài viết..."
                                    aria-label="Tìm kiếm bài viết"
                                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-neutral-200
                           focus:border-neutral-900 focus:outline-none transition-colors
                           placeholder:text-neutral-400"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={onClearSearch}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 
                             text-neutral-400 hover:text-neutral-900 transition-colors"
                                        aria-label="Xóa tìm kiếm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
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
const FilterSection = ({ categories, activeFilter, onFilterChange, sortBy, onSortChange, resultCount }) => {
    return (
        <section className="border-b border-neutral-200 sticky top-16 bg-white/95 backdrop-blur-sm z-40">
            <div className="max-w-[1600px] mx-auto">
                <div className="grid lg:grid-cols-12">
                    {/* Filter Label */}
                    <div className="lg:col-span-2 p-4 lg:p-6 lg:border-r border-neutral-200 flex items-center">
                        <span className="text-xs font-medium tracking-widest uppercase text-neutral-500">
                            Danh mục
                        </span>
                    </div>

                    {/* Filter Buttons */}
                    <div className="lg:col-span-7 p-4 lg:p-6 flex items-center gap-2 overflow-x-auto scrollbar-hide lg:border-r border-neutral-200">
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
                                <span className={`text-xs font-mono ${activeFilter === cat.id ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {cat.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Sort + Result Count */}
                    <div className="lg:col-span-3 p-4 lg:p-6 flex items-center justify-between gap-4">
                        <span className="text-xs text-neutral-500 hidden lg:block">
                            {resultCount} kết quả
                        </span>
                        <div className="flex items-center gap-2">
                            <SortAsc className="w-4 h-4 text-neutral-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value)}
                                className="text-sm text-neutral-600 bg-transparent border-0 focus:outline-none cursor-pointer"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
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
            className={`border-b border-neutral-200 last:border-b-0 transition-all duration-500
                ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${Math.min(index * 50, 200)}ms` }}
        >
            <Link to={`/blog/${post.slug}`} className="group grid lg:grid-cols-12 hover:bg-neutral-50 transition-colors">
                {/* Number + Category (2 cols) */}
                <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200 flex lg:flex-col items-center lg:items-start gap-4">
                    <span className="text-2xl font-mono font-bold text-neutral-200 group-hover:text-neutral-900 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-wider group-hover:bg-[#FF4D00] transition-colors">
                        {post.category.toUpperCase()}
                    </span>
                </div>

                {/* Image (3 cols) */}
                <div className="lg:col-span-3 lg:border-r border-neutral-200 relative overflow-hidden aspect-[16/10] lg:aspect-auto">
                    <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                </div>

                {/* Content (5 cols) */}
                <div className="lg:col-span-5 p-6 lg:p-8 lg:border-r border-neutral-200 flex flex-col justify-center">
                    <h3 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-3 group-hover:text-[#FF4D00] transition-colors leading-tight">
                        {post.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <time className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.date)}
                        </time>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {post.readTime} min
                        </span>
                        {post.views && (
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-3 h-3" />
                                {formatViews(post.views)}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {post.tags && (
                        <div className="flex items-center gap-2 mt-3">
                            {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 border border-neutral-200 text-neutral-500">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Author + Arrow (2 cols) */}
                <div className="lg:col-span-2 p-6 lg:p-8 flex items-center justify-between">
                    <div>
                        <div className="w-10 h-10 bg-neutral-200 flex items-center justify-center mb-2">
                            <span className="text-sm font-bold text-neutral-600">{post.author.initials}</span>
                        </div>
                        <p className="text-xs font-medium text-neutral-900">{post.author.name}</p>
                        <p className="text-[10px] text-neutral-500">{post.author.role}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-[#FF4D00] group-hover:translate-x-1 transition-all" />
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
                    <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200">
                        <span className="text-xs font-medium tracking-widest uppercase text-neutral-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#FF4D00]" />
                            Nổi bật
                        </span>
                    </div>

                    <div
                        ref={ref}
                        className={`lg:col-span-10 p-6 lg:p-8 grid md:grid-cols-3 gap-6 transition-all duration-700
                      ${isInView ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {posts.slice(0, 3).map((post) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group border-2 border-neutral-200 hover:border-neutral-900 transition-colors"
                            >
                                <div className="aspect-[16/10] overflow-hidden">
                                    <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                </div>
                                <div className="p-4">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">{post.category}</span>
                                    <h3 className="text-lg font-bold text-neutral-900 mt-2 mb-2 group-hover:text-[#FF4D00] transition-colors line-clamp-2">{post.title}</h3>
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
// POPULAR TAGS SIDEBAR
// ============================================
const PopularTagsSection = ({ tags, onTagClick }) => (
    <section className="border-b border-neutral-200">
        <div className="max-w-[1600px] mx-auto">
            <div className="grid lg:grid-cols-12">
                <div className="lg:col-span-2 p-6 lg:p-8 lg:border-r border-neutral-200">
                    <span className="text-xs font-medium tracking-widest uppercase text-neutral-500 flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        Tags
                    </span>
                </div>
                <div className="lg:col-span-10 p-6 lg:p-8 flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <button
                            key={tag.name}
                            onClick={() => onTagClick(tag.name)}
                            className="px-3 py-1.5 border-2 border-neutral-200 text-sm text-neutral-600 
                       hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all"
                        >
                            {tag.name}
                            <span className="ml-1.5 text-xs text-neutral-400">{tag.count}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

// ============================================
// NEWSLETTER CTA SECTION
// ============================================
const NewsletterSection = () => {
    const [email, setEmail] = useState('');
    const [ref, isInView] = useInView();

    return (
        <section className="border-b border-neutral-900 bg-neutral-900">
            <div className="max-w-[1600px] mx-auto">
                <div
                    ref={ref}
                    className={`grid lg:grid-cols-12 transition-all duration-700
                    ${isInView ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="lg:col-span-5 p-8 lg:p-12 lg:border-r border-neutral-700">
                        <span className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-neutral-400 mb-4">
                            <Mail className="w-4 h-4" />
                            Newsletter
                        </span>
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                            Đăng ký nhận bài viết mới
                        </h2>
                        <p className="text-neutral-400">
                            Nhận thông báo khi có bài viết mới qua email. Không spam, hủy bất cứ lúc nào.
                        </p>
                    </div>

                    <div className="lg:col-span-7 p-8 lg:p-12 flex items-center">
                        <form className="flex w-full max-w-lg gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email của bạn..."
                                className="flex-1 px-4 py-3 bg-neutral-800 border-2 border-neutral-700 text-white
                         placeholder:text-neutral-500 focus:border-[#FF4D00] focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#FF4D00] text-white font-medium hover:bg-white hover:text-neutral-900 transition-colors whitespace-nowrap"
                            >
                                Đăng ký
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ============================================
// PAGINATION COMPONENT
// ============================================
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <section className="max-w-[1600px] mx-auto border-t border-neutral-200">
            <div className="p-8 flex items-center justify-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border-2 border-neutral-200 text-neutral-600 disabled:opacity-50 
                   disabled:cursor-not-allowed hover:border-neutral-900 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {pages.map((page, i) => (
                    page === '...' ? (
                        <span key={i} className="px-3 py-2 text-neutral-400">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`min-w-[40px] py-2 font-mono font-medium transition-colors
                        ${currentPage === page
                                    ? 'bg-neutral-900 text-white'
                                    : 'border-2 border-neutral-200 text-neutral-600 hover:border-neutral-900'
                                }`}
                        >
                            {page}
                        </button>
                    )
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border-2 border-neutral-200 text-neutral-600 disabled:opacity-50 
                   disabled:cursor-not-allowed hover:border-neutral-900 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
};

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = ({ searchTerm, activeFilter, onClear }) => (
    <div className="py-20 text-center">
        <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center mx-auto mb-6">
            <Search className="w-6 h-6 text-neutral-400" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Không tìm thấy bài viết</h3>
        <p className="text-neutral-600 max-w-md mx-auto mb-6">
            {searchTerm
                ? `Không có kết quả cho "${searchTerm}"`
                : `Chưa có bài viết trong danh mục này`
            }
        </p>
        <button
            onClick={onClear}
            className="px-6 py-2 border-2 border-neutral-900 text-neutral-900 font-medium hover:bg-neutral-900 hover:text-white transition-colors"
        >
            Xóa bộ lọc
        </button>
    </div>
);

// ============================================
// MAIN BLOG PAGE
// ============================================
export const BlogPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const postsPerPage = 6;

    // Sort + Filter + Search logic
    const processedPosts = useMemo(() => {
        let result = [...MOCK_POSTS];

        // Filter
        if (activeFilter !== 'all') {
            result = result.filter(post => post.category === activeFilter);
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.excerpt.toLowerCase().includes(term) ||
                post.tags?.some(tag => tag.toLowerCase().includes(term))
            );
        }

        // Sort
        switch (sortBy) {
            case 'oldest':
                result.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'popular':
                result.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'readTime':
                result.sort((a, b) => a.readTime - b.readTime);
                break;
            default: // newest
                result.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return result;
    }, [activeFilter, searchTerm, sortBy]);

    // Pagination
    const totalPages = Math.ceil(processedPosts.length / postsPerPage);
    const paginatedPosts = processedPosts.slice(
        (currentPage - 1) * postsPerPage,
        currentPage * postsPerPage
    );

    const featuredPosts = MOCK_POSTS.filter(p => p.featured);

    // Category counts
    const categoriesWithCounts = CATEGORIES.map(cat => ({
        ...cat,
        count: cat.id === 'all'
            ? MOCK_POSTS.length
            : MOCK_POSTS.filter(p => p.category === cat.id).length
    }));

    // Handlers
    const handleFilterChange = (filterId) => {
        setActiveFilter(filterId);
        setCurrentPage(1);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleTagClick = (tagName) => {
        setSearchTerm(tagName);
        setCurrentPage(1);
    };

    const handleClear = () => {
        setActiveFilter('all');
        setSearchTerm('');
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Blog & Tài nguyên | Skill Master</title>
                <meta name="description" content="Kiến thức không giới hạn - Tips học tập, ôn thi IELTS, TOEIC và Tin học từ đội ngũ giảng viên Skill Master." />
            </Helmet>

            <PublicHeader />

            <main>
                {/* Hero Section */}
                <HeroSection
                    totalPosts={MOCK_POSTS.length}
                    totalCategories={CATEGORIES.length - 1}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClearSearch={() => setSearchTerm('')}
                />

                {/* Filter Section */}
                <FilterSection
                    categories={categoriesWithCounts}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    resultCount={processedPosts.length}
                />

                {/* Featured Section (only when not filtering/searching) */}
                {!searchTerm && activeFilter === 'all' && currentPage === 1 && (
                    <FeaturedSection posts={featuredPosts} />
                )}

                {/* Popular Tags */}
                {!searchTerm && activeFilter === 'all' && currentPage === 1 && (
                    <PopularTagsSection tags={POPULAR_TAGS} onTagClick={handleTagClick} />
                )}

                {/* Blog List */}
                <section className="max-w-[1600px] mx-auto">
                    {isLoading ? (
                        <div>
                            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
                        </div>
                    ) : paginatedPosts.length > 0 ? (
                        <div>
                            {paginatedPosts.map((post, index) => (
                                <BlogCard key={post.id} post={post} index={index} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            searchTerm={searchTerm}
                            activeFilter={activeFilter}
                            onClear={handleClear}
                        />
                    )}
                </section>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                {/* Newsletter CTA */}
                <NewsletterSection />
            </main>

            <Footer />
        </div>
    );
};

export default BlogPage;
