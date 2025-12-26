import React from 'react';
import { Search, SortAsc, Tag, X } from 'lucide-react';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';

// Modular imports
import {
    CATEGORIES, POPULAR_TAGS, SORT_OPTIONS, MOCK_POSTS
} from './constants/blog-data';
import {
    useInView, useReducedMotion, useReadingProgress, useBlogFilters
} from './hooks/useBlogHooks';
import {
    BlogCard, BlogCardV2, CardSkeletonV2, BentoFeaturedSection, NewsletterSection,
    BackToTopButton, ReadingProgressBar, Pagination, EmptyState,
    Breadcrumbs, SkipToContent, BlogListSEO
} from './components';

// ============================================
// BLOG PAGE - MODERN PREMIUM DESIGN
// ============================================
// Modular architecture with separated components
// Design Philosophy synced with Landing Page
// ============================================

// ============================================
// HERO SECTION
// ============================================
const HeroSection = ({ totalPosts, totalCategories, searchTerm, onSearchChange, onClearSearch }) => {
    const [ref, isInView] = useInView();
    const prefersReducedMotion = useReducedMotion();

    return (
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-50 to-white">
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#18181B 1px, transparent 1px),
                              linear-gradient(90deg, #18181B 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                    aria-hidden="true" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] 
                    bg-gradient-to-br from-red-100 via-orange-50 to-transparent 
                    rounded-full blur-3xl opacity-60"
                    aria-hidden="true" />
            </div>

            <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
                <div
                    ref={ref}
                    className={`max-w-3xl mx-auto text-center transition-all duration-700
                        ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur
                        border border-stone-200 rounded-full shadow-sm mb-8">
                        <span className="flex h-2 w-2" aria-hidden="true">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                        </span>
                        <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">
                            Blog & Tài nguyên
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold 
                        text-zinc-900 tracking-tight leading-[1.1] mb-6">
                        Kiến thức{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                            không giới hạn
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-lg lg:text-xl text-zinc-500 leading-relaxed max-w-2xl mx-auto mb-10">
                        Tips học tập, ôn thi IELTS, TOEIC và Tin học.
                        Chia sẻ kiến thức từ đội ngũ giảng viên Skill Master.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" aria-hidden="true" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Tìm kiếm bài viết..."
                            aria-label="Tìm kiếm bài viết"
                            className="w-full pl-14 pr-14 py-4 bg-white border border-stone-200 rounded-2xl
                                shadow-lg shadow-stone-200/50
                                focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none 
                                transition-all duration-300 placeholder:text-stone-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={onClearSearch}
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                                    text-stone-400 hover:text-zinc-900 hover:bg-stone-100 transition-all"
                                aria-label="Xóa tìm kiếm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 lg:gap-12 mt-12 pt-8 border-t border-stone-200">
                        <div className="text-center">
                            <span className="block text-3xl lg:text-4xl font-bold text-zinc-900">{totalPosts}</span>
                            <span className="text-sm text-zinc-500">Bài viết</span>
                        </div>
                        <div className="w-px h-12 bg-stone-200" aria-hidden="true" />
                        <div className="text-center">
                            <span className="block text-3xl lg:text-4xl font-bold text-zinc-900">{totalCategories}</span>
                            <span className="text-sm text-zinc-500">Chủ đề</span>
                        </div>
                        <div className="w-px h-12 bg-stone-200" aria-hidden="true" />
                        <div className="text-center">
                            <span className="block text-3xl lg:text-4xl font-bold text-zinc-900">15k+</span>
                            <span className="text-sm text-zinc-500">Lượt đọc</span>
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
const FilterSection = ({ categories, activeFilter, onFilterChange, sortBy, onSortChange, resultCount }) => {
    return (
        <section className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-y border-stone-200">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4">
                    {/* Filter Buttons */}
                    <div
                        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 lg:pb-0"
                        role="group"
                        aria-label="Lọc theo danh mục"
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => onFilterChange(cat.id)}
                                aria-pressed={activeFilter === cat.id}
                                className={`px-5 py-2.5 text-sm font-medium transition-all duration-300
                                    whitespace-nowrap flex items-center gap-2 rounded-full
                                    ${activeFilter === cat.id
                                        ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/25'
                                        : 'bg-stone-100 text-zinc-600 hover:bg-stone-200 hover:text-zinc-900'
                                    }`}
                            >
                                {cat.label}
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full
                                    ${activeFilter === cat.id
                                        ? 'bg-white/20 text-white/80'
                                        : 'bg-stone-200 text-zinc-500'}`}>
                                    {cat.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Sort + Result Count */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-500" aria-live="polite">
                            {resultCount} kết quả
                        </span>
                        <div className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl">
                            <SortAsc className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                            <label htmlFor="sort-select" className="sr-only">Sắp xếp theo</label>
                            <select
                                id="sort-select"
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value)}
                                className="text-sm text-zinc-600 bg-transparent border-0 focus:outline-none cursor-pointer"
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
// POPULAR TAGS SECTION
// ============================================
const PopularTagsSection = ({ tags, onTagClick }) => (
    <section className="py-12 bg-stone-50" aria-labelledby="popular-tags-heading">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-4 mb-6">
                <Tag className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                <h2 id="popular-tags-heading" className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                    Chủ đề phổ biến
                </h2>
            </div>
            <div className="flex flex-wrap gap-3" role="list">
                {tags.map(tag => (
                    <button
                        key={tag.name}
                        onClick={() => onTagClick(tag.name)}
                        className="group px-4 py-2.5 bg-white border border-stone-200 rounded-full
                            hover:border-red-500 hover:bg-red-50 transition-all duration-300
                            flex items-center gap-2"
                        role="listitem"
                    >
                        <span className="text-sm font-medium text-zinc-700 group-hover:text-red-600 transition-colors">
                            {tag.name}
                        </span>
                        <span className="text-xs text-zinc-400 bg-stone-100 px-2 py-0.5 rounded-full
                            group-hover:bg-red-100 group-hover:text-red-500 transition-colors"
                            aria-label={`${tag.count} bài viết`}
                        >
                            {tag.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    </section>
);

// ============================================
// MAIN BLOG PAGE
// ============================================
export const BlogPage = () => {
    const readingProgress = useReadingProgress();
    const {
        activeFilter,
        searchTerm,
        sortBy,
        currentPage,
        processedPosts,
        paginatedPosts,
        totalPages,
        setActiveFilter,
        setSearchTerm,
        setSortBy,
        setCurrentPage,
        clearFilters,
    } = useBlogFilters(MOCK_POSTS, 6);

    const featuredPosts = MOCK_POSTS.filter(p => p.featured);

    // Category counts
    const categoriesWithCounts = CATEGORIES.map(cat => ({
        ...cat,
        count: cat.id === 'all'
            ? MOCK_POSTS.length
            : MOCK_POSTS.filter(p => p.category === cat.id).length
    }));

    const handleTagClick = (tagName) => {
        setSearchTerm(tagName);
    };

    const isDefaultView = !searchTerm && activeFilter === 'all' && currentPage === 1;

    return (
        <div className="min-h-screen bg-white">
            {/* Accessibility: Skip to content */}
            <SkipToContent />

            {/* Reading Progress Bar */}
            <ReadingProgressBar progress={readingProgress} />

            {/* SEO */}
            <BlogListSEO
                totalPosts={MOCK_POSTS.length}
                currentCategory={activeFilter}
            />

            {/* Header */}
            <PublicHeader />

            {/* Breadcrumbs */}
            <Breadcrumbs items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Blog' }
            ]} />

            <main id="main-content">
                {/* Hero Section */}
                <HeroSection
                    totalPosts={MOCK_POSTS.length}
                    totalCategories={CATEGORIES.length - 1}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClearSearch={() => setSearchTerm('')}
                />

                {/* Filter Section */}
                <FilterSection
                    categories={categoriesWithCounts}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    resultCount={processedPosts.length}
                />

                {/* Bento Featured Section (only on default view) */}
                {isDefaultView && <BentoFeaturedSection posts={featuredPosts} />}

                {/* Popular Tags (only on default view) */}
                {isDefaultView && (
                    <PopularTagsSection tags={POPULAR_TAGS} onTagClick={handleTagClick} />
                )}

                {/* Blog List */}
                <section className="py-16 bg-white" aria-labelledby="all-posts-heading">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        {/* Section Header */}
                        {isDefaultView && (
                            <div className="flex items-center gap-4 mb-10">
                                <h2 id="all-posts-heading" className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                                    Tất cả bài viết
                                </h2>
                                <div className="flex-1 h-px bg-stone-200" aria-hidden="true" />
                            </div>
                        )}

                        {paginatedPosts.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedPosts.map((post, index) => {
                                    // Mixed sizes: every 6 posts pattern
                                    // Index 0: large (spans 2 cols)
                                    // Index 1,2: standard
                                    // Index 3,4,5: standard
                                    const isLarge = index % 6 === 0;
                                    return (
                                        <BlogCardV2
                                            key={post.id}
                                            post={post}
                                            index={index}
                                            size={isLarge ? 'large' : 'standard'}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                searchTerm={searchTerm}
                                activeFilter={activeFilter}
                                onClear={clearFilters}
                            />
                        )}

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </section>

                {/* Newsletter CTA */}
                <NewsletterSection />
            </main>

            {/* Footer */}
            <Footer />

            {/* Back to Top Button */}
            <BackToTopButton />
        </div>
    );
};

export default BlogPage;
