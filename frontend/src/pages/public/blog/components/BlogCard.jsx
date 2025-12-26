import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { useInView, useReducedMotion } from '../hooks/useBlogHooks';
import { formatDate, formatViews } from '../constants/blog-data';

// ============================================
// BLOG CARD - MODERN VERTICAL CARD DESIGN
// ============================================
export const BlogCard = ({ post, index }) => {
    const [ref, isInView] = useInView();
    const prefersReducedMotion = useReducedMotion();

    return (
        <article
            ref={ref}
            className={`group bg-white rounded-2xl border border-stone-200 overflow-hidden
                hover:shadow-xl hover:shadow-stone-200/50 hover:border-stone-300
                hover:-translate-y-1 transition-all duration-500
                ${isInView && !prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${Math.min(index * 75, 300)}ms` }}
        >
            <Link to={`/blog/${post.slug}`} className="block">
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                    />
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-zinc-900 
                            text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm">
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
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-zinc-900 mb-3 
                        group-hover:text-red-600 transition-colors duration-300 
                        leading-tight line-clamp-2">
                        {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-zinc-500 leading-relaxed mb-4 line-clamp-2">
                        {post.excerpt}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-zinc-400 mb-4">
                        <time className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.date)}
                        </time>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readTime} phút đọc
                        </span>
                        {post.views && (
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                {formatViews(post.views)}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {post.tags && (
                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                            {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-xs px-2.5 py-1 bg-stone-100 
                                    text-zinc-500 rounded-full hover:bg-stone-200 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Author + Arrow */}
                    <div className="flex items-center justify-between pt-5 border-t border-stone-100">
                        <div className="flex items-center gap-3">
                            <img
                                src={post.author.avatar}
                                alt={post.author.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <div>
                                <p className="text-sm font-semibold text-zinc-900">{post.author.name}</p>
                                <p className="text-xs text-zinc-400">{post.author.role}</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center
                            group-hover:bg-red-600 transition-colors duration-300">
                            <ArrowRight className="w-5 h-5 text-zinc-400 
                                group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
};

// ============================================
// CARD SKELETON LOADING
// ============================================
export const CardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
        <div className="aspect-[16/10] bg-stone-200" />
        <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-stone-200 rounded-full" />
                <div className="h-4 w-20 bg-stone-200 rounded" />
            </div>
            <div className="h-6 bg-stone-200 rounded w-3/4" />
            <div className="h-4 bg-stone-200 rounded w-full" />
            <div className="h-4 bg-stone-200 rounded w-2/3" />
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

export default BlogCard;
