import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { POPULAR_TAGS, formatDate } from '../constants/blog-data';

// ============================================
// TAG CLOUD WIDGET
// ============================================
export const TagCloudWidget = ({ currentTags = [] }) => {
    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Tag className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                    Chủ đề phổ biến
                </h3>
            </div>

            <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map(tag => {
                    const isActive = currentTags.includes(tag.name);
                    return (
                        <Link
                            key={tag.name}
                            to={`/blog?tag=${tag.name}`}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                                ${isActive
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                    : 'bg-stone-50 text-zinc-600 hover:bg-red-50 hover:text-red-600'
                                }
                            `}
                        >
                            #{tag.name}
                            <span className={`ml-1.5 opacity-60 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                                {tag.count}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================
// RECENT POSTS WIDGET
// ============================================
export const RecentPostsWidget = ({ posts, currentPostId }) => {
    const recentPosts = posts
        .filter(p => p.id !== currentPostId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4);

    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                    Bài viết mới nhất
                </h3>
            </div>

            <div className="space-y-6">
                {recentPosts.map(post => (
                    <Link
                        key={post.id}
                        to={`/blog/${post.slug}`}
                        className="group flex gap-4 items-start"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                                src={post.thumbnail}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-500 
                                    group-hover:scale-110"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-zinc-900 line-clamp-2 
                                group-hover:text-red-600 transition-colors leading-snug">
                                {post.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400 font-medium">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(post.date)}</span>
                                <span>•</span>
                                <span>{post.readTime} phút</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                to="/blog"
                className="flex items-center justify-center gap-2 mt-8 py-3 w-full 
                    bg-stone-50 text-zinc-600 text-xs font-bold rounded-xl 
                    hover:bg-red-50 hover:text-red-600 transition-all border border-transparent
                    hover:border-red-100"
            >
                Xem tất cả blog
                <ChevronRight className="w-3 h-3" />
            </Link>
        </div>
    );
};

export default {
    TagCloudWidget,
    RecentPostsWidget
};
