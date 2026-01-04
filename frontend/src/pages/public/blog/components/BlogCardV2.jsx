import React from 'react';
import { SmartImage } from '@/components/common';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, ArrowUpRight, Sparkles, Bookmark } from 'lucide-react';
import { useInView, useReducedMotion } from '../hooks/useBlogHooks';
import { formatDate, formatViews } from '../constants/blog-data';

// ============================================
// BLOG CARD V2 - WITH SIZE VARIANTS
// ============================================
// Supports: 'standard' | 'large' | 'compact'
// Features: Enhanced hover effects, gradients, micro-interactions
// ============================================

export const BlogCardV2 = ({ post, index, size = 'standard' }) => {
    const [ref, isInView] = useInView();
    const prefersReducedMotion = useReducedMotion();

    if (size === 'large') return <LargeCard ref={ref} post={post} index={index} isInView={isInView} prefersReducedMotion={prefersReducedMotion} />;
    if (size === 'compact') return <CompactCard ref={ref} post={post} index={index} isInView={isInView} prefersReducedMotion={prefersReducedMotion} />;
    return <StandardCard ref={ref} post={post} index={index} isInView={isInView} prefersReducedMotion={prefersReducedMotion} />;
};

// ============================================
// STANDARD CARD (Default)
// ============================================
const StandardCard = React.forwardRef(({ post, index, isInView, prefersReducedMotion }, ref) => (
    <article
        ref={ref}
        className={`group bg-white rounded-2xl border border-stone-200 overflow-hidden
            hover:shadow-2xl hover:shadow-stone-200/60 hover:border-stone-300
            hover:-translate-y-2 transition-all duration-500 ease-out
            ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${Math.min(index * 100, 400)}ms` }}
    >
        <Link to={`/blog/${post.slug}`} className="block">
            {/* Image Container */}
            <div className="relative aspect-[16/10] overflow-hidden">
                <SmartImage
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover 
                        group-hover:scale-110 group-hover:rotate-1 
                        transition-transform duration-700 ease-out"
                    containerClassName="w-full h-full"
                    aspectRatio="aspect-video"
                />

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-zinc-900 
                        text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm
                        group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-orange-500 
                        group-hover:text-white transition-all duration-300">
                        {post.category}
                    </span>
                </div>

                {/* Featured Badge */}
                {post.featured && (
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 
                            text-white text-xs font-semibold rounded-full shadow-lg shadow-red-500/30
                            flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Nổi bật
                        </span>
                    </div>
                )}

                {/* Read Time Overlay (appears on hover) */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                    translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-zinc-700 
                        text-xs font-medium rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {post.readTime} phút
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-zinc-900 mb-3 
                    group-hover:text-transparent group-hover:bg-clip-text 
                    group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-orange-500
                    transition-all duration-300 leading-tight line-clamp-2">
                    {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                    {post.excerpt}
                </p>

                {/* Tags */}
                {post.tags && (
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                        {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-1 
                                bg-gradient-to-r from-stone-100 to-stone-50 
                                text-zinc-500 rounded-full 
                                hover:from-red-50 hover:to-orange-50 hover:text-red-600 
                                transition-colors cursor-pointer">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Author + Arrow */}
                <div className="flex items-center justify-between pt-5 border-t border-stone-100">
                    <div className="flex items-center gap-3 
                        group-hover:-translate-x-1 transition-transform duration-300">
                        <SmartImage
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-full h-full object-cover"
                            containerClassName="w-10 h-10 rounded-full border-2 border-white shadow-sm
                                group-hover:border-red-500/50 transition-colors bg-white shrink-0"
                            aspectRatio="aspect-square"
                        />
                        <div>
                            <p className="text-sm font-semibold text-zinc-900">{post.author.name}</p>
                            <p className="text-xs text-zinc-400">{formatDate(post.date)}</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center
                        group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:to-orange-500 
                        group-hover:shadow-lg group-hover:shadow-red-500/25
                        transition-all duration-300">
                        <ArrowUpRight className="w-5 h-5 text-zinc-400 
                            group-hover:text-white group-hover:rotate-12 transition-all" />
                    </div>
                </div>
            </div>
        </Link>
    </article>
));

// ============================================
// LARGE CARD (Featured in grid)
// ============================================
const LargeCard = React.forwardRef(({ post, index, isInView, prefersReducedMotion }, ref) => (
    <article
        ref={ref}
        className={`group col-span-2 bg-white rounded-3xl border border-stone-200 overflow-hidden
            hover:shadow-2xl hover:shadow-stone-200/60 transition-all duration-500
            ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${Math.min(index * 100, 400)}ms` }}
    >
        <Link to={`/blog/${post.slug}`} className="flex flex-col lg:flex-row">
            {/* Image - 60% width on desktop */}
            <div className="lg:w-3/5 aspect-[16/10] lg:aspect-auto overflow-hidden">
                <SmartImage
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover 
                        group-hover:scale-105 transition-transform duration-700"
                    containerClassName="w-full h-full"
                    aspectRatio="aspect-video"
                />
            </div>

            {/* Content - 40% */}
            <div className="lg:w-2/5 p-8 lg:p-10 flex flex-col justify-center">
                {/* Badges */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1.5 bg-zinc-900 text-white 
                        text-xs font-semibold uppercase tracking-wider rounded-full">
                        {post.category}
                    </span>
                    {post.featured && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 
                            text-white text-xs font-semibold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-2xl lg:text-3xl font-bold text-zinc-900 mb-4 
                    group-hover:text-red-600 transition-colors leading-tight tracking-tight">
                    {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-zinc-500 leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-6">
                    <time className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.date)}
                    </time>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {post.readTime} phút đọc
                    </span>
                    {post.views && (
                        <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            {formatViews(post.views)}
                        </span>
                    )}
                </div>

                {/* Author */}
                <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                    <div className="flex items-center gap-3">
                        <SmartImage
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-full h-full object-cover"
                            containerClassName="w-12 h-12 rounded-full border-2 border-white shadow-md bg-white shrink-0"
                            aspectRatio="aspect-square"
                        />
                        <div>
                            <p className="font-semibold text-zinc-900">{post.author.name}</p>
                            <p className="text-sm text-zinc-400">{post.author.role}</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-500 
                        flex items-center justify-center shadow-lg shadow-red-500/25
                        group-hover:scale-110 transition-transform">
                        <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>
        </Link>
    </article>
));

// ============================================
// COMPACT CARD (Smaller, for dense layouts)
// ============================================
const CompactCard = React.forwardRef(({ post, index, isInView, prefersReducedMotion }, ref) => (
    <article
        ref={ref}
        className={`group flex gap-4 p-4 bg-white rounded-xl border border-stone-200
            hover:shadow-lg hover:shadow-stone-200/50 hover:border-stone-300
            transition-all duration-300
            ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${Math.min(index * 75, 300)}ms` }}
    >
        <Link to={`/blog/${post.slug}`} className="flex gap-4 w-full">
            {/* Thumbnail */}
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                <SmartImage
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover 
                        group-hover:scale-110 transition-transform duration-500"
                    containerClassName="w-full h-full rounded-lg"
                    aspectRatio="aspect-square"
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                    {post.category}
                </span>
                <h3 className="text-base font-bold text-zinc-900 mb-2 
                    group-hover:text-red-600 transition-colors leading-tight line-clamp-2">
                    {post.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{formatDate(post.date)}</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min
                    </span>
                </div>
            </div>

            {/* Bookmark Icon */}
            <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Bookmark className="w-5 h-5 text-zinc-300 hover:text-red-500 cursor-pointer transition-colors" />
            </div>
        </Link>
    </article>
));

// ============================================
// CARD SKELETON V2
// ============================================
export const CardSkeletonV2 = ({ size = 'standard' }) => {
    if (size === 'large') {
        return (
            <div className="col-span-2 bg-white rounded-3xl border border-stone-200 overflow-hidden animate-pulse">
                <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-3/5 aspect-[16/10] lg:aspect-[4/3] bg-stone-200" />
                    <div className="lg:w-2/5 p-8 lg:p-10 space-y-4">
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-stone-200 rounded-full" />
                            <div className="h-6 w-6 bg-stone-200 rounded-full" />
                        </div>
                        <div className="h-8 bg-stone-200 rounded w-full" />
                        <div className="h-8 bg-stone-200 rounded w-3/4" />
                        <div className="h-4 bg-stone-200 rounded w-full" />
                        <div className="h-4 bg-stone-200 rounded w-2/3" />
                        <div className="flex items-center gap-3 pt-4">
                            <div className="w-12 h-12 bg-stone-200 rounded-full" />
                            <div className="space-y-2">
                                <div className="h-4 w-28 bg-stone-200 rounded" />
                                <div className="h-3 w-20 bg-stone-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-stone-200" />
            <div className="p-6 space-y-4">
                <div className="h-6 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-full" />
                <div className="h-4 bg-stone-200 rounded w-2/3" />
                <div className="flex items-center gap-2">
                    <div className="h-5 w-14 bg-stone-200 rounded-full" />
                    <div className="h-5 w-14 bg-stone-200 rounded-full" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                    <div className="w-10 h-10 bg-stone-200 rounded-full" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-stone-200 rounded" />
                        <div className="h-3 w-16 bg-stone-200 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogCardV2;
