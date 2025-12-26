import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { useInView } from '../hooks/useBlogHooks';
import { formatDate } from '../constants/blog-data';

// ============================================
// BENTO FEATURED SECTION - MAGAZINE GRID
// ============================================
// Layout:
// ┌────────────────┬──────────┐
// │                │  Post 2  │
// │   Main Post    ├──────────┤
// │    (Large)     │  Post 3  │
// ├────────────────┴──────────┤
// │    Horizontal Wide Card   │
// └───────────────────────────┘
// ============================================

export const BentoFeaturedSection = ({ posts }) => {
    const [ref, isInView] = useInView();

    if (!posts || posts.length < 3) return null;

    const mainPost = posts[0];
    const sidePosts = posts.slice(1, 3);
    const widePost = posts[3];

    return (
        <section className="py-16 lg:py-24 bg-gradient-to-b from-stone-50 to-white overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div
                    ref={ref}
                    className={`flex items-center justify-between mb-12 transition-all duration-700
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-full">
                            <TrendingUp className="w-4 h-4 text-white" />
                            <span className="text-sm font-semibold text-white uppercase tracking-wide">
                                Nổi bật
                            </span>
                        </div>
                        <div className="hidden sm:block w-24 h-px bg-gradient-to-r from-stone-300 to-transparent" />
                    </div>
                    <Link
                        to="/blog?filter=featured"
                        className="group flex items-center gap-2 text-sm font-medium text-zinc-500 
                            hover:text-red-600 transition-colors"
                    >
                        Xem tất cả
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Bento Grid */}
                <div className={`grid lg:grid-cols-3 gap-6 transition-all duration-1000 delay-200
                    ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {/* Main Large Card - Spans 2 columns and 2 rows */}
                    <MainFeaturedCard post={mainPost} />

                    {/* Side Stack - 2 Medium Cards */}
                    <div className="flex flex-col gap-6">
                        {sidePosts.map((post, idx) => (
                            <SideFeaturedCard key={post.id} post={post} index={idx} />
                        ))}
                    </div>
                </div>

                {/* Wide Horizontal Card */}
                {widePost && (
                    <div className={`mt-6 transition-all duration-1000 delay-400
                        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <WideCard post={widePost} />
                    </div>
                )}
            </div>
        </section>
    );
};

// ============================================
// MAIN FEATURED CARD (Large, 2x2)
// ============================================
const MainFeaturedCard = ({ post }) => {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="group relative lg:col-span-2 lg:row-span-2 rounded-3xl overflow-hidden 
                min-h-[400px] lg:min-h-[500px] bg-zinc-900"
        >
            {/* Background Image */}
            <img
                src={post.thumbnail}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover 
                    group-hover:scale-105 transition-transform duration-700 ease-out"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

            {/* Noise Texture */}
            <div
                className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />

            {/* Content */}
            <div className="absolute inset-0 p-8 lg:p-10 flex flex-col justify-end">
                {/* Category Badge */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 
                        text-white text-xs font-semibold uppercase tracking-wider rounded-full">
                        {post.category}
                    </span>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 
                        text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Nổi bật
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl lg:text-4xl font-bold text-white mb-4 
                    group-hover:text-red-400 transition-colors duration-300 
                    leading-tight tracking-tight">
                    {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-white/70 text-base lg:text-lg leading-relaxed mb-6 line-clamp-2 max-w-2xl">
                    {post.excerpt}
                </p>

                {/* Author & Meta */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-12 h-12 rounded-full border-2 border-white/30 
                                group-hover:border-red-500/50 transition-colors"
                        />
                        <div>
                            <p className="text-white font-semibold">{post.author.name}</p>
                            <p className="text-white/60 text-sm">{post.author.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span>{formatDate(post.date)}</span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {post.readTime} min
                        </span>
                    </div>
                </div>

                {/* Hover Indicator */}
                <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm
                    flex items-center justify-center opacity-0 group-hover:opacity-100 
                    translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
            </div>
        </Link>
    );
};

// ============================================
// SIDE FEATURED CARD (Medium)
// ============================================
const SideFeaturedCard = ({ post, index }) => {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="group relative flex-1 min-h-[200px] rounded-2xl overflow-hidden bg-zinc-100"
            style={{ transitionDelay: `${index * 100}ms` }}
        >
            {/* Background Image */}
            <img
                src={post.thumbnail}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover 
                    group-hover:scale-105 transition-transform duration-500"
            />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <span className="inline-block w-fit px-2.5 py-1 bg-white/10 backdrop-blur-sm 
                    text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-3">
                    {post.category}
                </span>
                <h3 className="text-lg font-bold text-white mb-2 
                    group-hover:text-red-400 transition-colors leading-tight line-clamp-2">
                    {post.title}
                </h3>
                <div className="flex items-center gap-3 text-white/60 text-xs">
                    <span>{formatDate(post.date)}</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min
                    </span>
                </div>
            </div>

            {/* Hover Arrow */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm
                flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-white" />
            </div>
        </Link>
    );
};

// ============================================
// WIDE HORIZONTAL CARD
// ============================================
const WideCard = ({ post }) => {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="group relative flex flex-col lg:flex-row rounded-2xl overflow-hidden 
                bg-gradient-to-r from-stone-100 to-stone-50 border border-stone-200
                hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500"
        >
            {/* Image */}
            <div className="lg:w-1/3 aspect-[16/9] lg:aspect-auto overflow-hidden">
                <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Content */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-semibold 
                        uppercase tracking-wider rounded-full">
                        {post.category}
                    </span>
                    <span className="text-zinc-400 text-sm">{formatDate(post.date)}</span>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-zinc-900 mb-3 
                    group-hover:text-red-600 transition-colors leading-tight">
                    {post.title}
                </h3>
                <p className="text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                    {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                        />
                        <div>
                            <p className="text-sm font-semibold text-zinc-900">{post.author.name}</p>
                            <p className="text-xs text-zinc-400">{post.readTime} phút đọc</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center
                        group-hover:bg-red-600 transition-colors duration-300">
                        <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BentoFeaturedSection;
