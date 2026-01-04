import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { SmartImage } from '@/components/common';
import { useInView, useReducedMotion } from '../hooks/useBlogHooks';
import { formatDate, formatViews } from '../constants/blog-data';
import { useViewCounter } from '../hooks/useStats';

// ============================================
// ARTICLE HERO SECTION
// ============================================
// Full-width hero with gradient overlay, title, and meta info
// ============================================

export const ArticleHero = ({ post }) => {
    const [ref, isInView] = useInView();
    const prefersReducedMotion = useReducedMotion();
    const { viewCount, isLoading: viewLoading } = useViewCounter(post?.slug);

    if (!post) return null;

    return (
        <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-end overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <SmartImage
                    src={post.thumbnail}
                    alt={post.title}
                    className={`transition-transform duration-1000
                        ${isInView && !prefersReducedMotion ? 'scale-100' : 'scale-105'}`}
                    fit="cover"
                    priority
                />
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/30 to-transparent" />

                {/* Noise Texture */}
                <div
                    className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                    }}
                />
            </div>

            {/* Content */}
            <div
                ref={ref}
                className={`relative max-w-[1400px] mx-auto px-6 lg:px-12 pb-16 lg:pb-24 w-full
                    transition-all duration-700
                    ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
                {/* Back Link */}
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-white/70 hover:text-white 
                        transition-colors mb-8 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Quay lại Blog</span>
                </Link>

                {/* Category + Featured Badge */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 
                        text-white text-sm font-semibold uppercase tracking-wider rounded-full">
                        {post.category}
                    </span>
                    {post.featured && (
                        <span className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 
                            text-white text-sm font-semibold rounded-full flex items-center gap-2
                            shadow-lg shadow-red-500/30">
                            <Sparkles className="w-4 h-4" />
                            Nổi bật
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white 
                    leading-[1.1] tracking-tight max-w-4xl mb-8">
                    {post.title}
                </h1>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                    {/* Author */}
                    <div className="flex items-center gap-4">
                        <SmartImage
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="rounded-full border-2 border-white/30"
                            containerClassName="w-14 h-14"
                            fit="cover"
                        />
                        <div>
                            <p className="text-white font-semibold text-lg">{post.author.name}</p>
                            <p className="text-white/60 text-sm">{post.author.role}</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-12 bg-white/20" />

                    {/* Date, Read Time, Views */}
                    <div className="flex items-center gap-6 text-white/70 text-sm">
                        <time className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.date)}
                        </time>
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {post.readTime} phút đọc
                        </span>
                        {/* Dynamic View Counter */}
                        <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {viewLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <span className="tabular-nums">
                                    {formatViews(viewCount || post.views || 0)} lượt xem
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ArticleHero;
