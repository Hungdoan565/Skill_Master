import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import { formatDate } from '../constants/blog-data';

// ============================================
// RELATED POSTS SECTION
// ============================================
export const RelatedPosts = ({ posts, currentCategory }) => {
    if (!posts || posts.length === 0) return null;

    return (
        <section className="py-16 bg-stone-50">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            Bài viết liên quan
                        </span>
                        <div className="hidden sm:block w-24 h-px bg-stone-300" />
                    </div>
                    <Link
                        to={`/blog?category=${currentCategory}`}
                        className="group flex items-center gap-2 text-sm font-medium text-red-600 
                            hover:text-red-700 transition-colors"
                    >
                        Xem thêm
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Posts Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.slug}`}
                            className="group bg-white rounded-2xl border border-stone-200 overflow-hidden
                                hover:shadow-lg hover:shadow-stone-200/50 hover:border-stone-300
                                hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="aspect-[16/10] overflow-hidden">
                                <img
                                    src={post.thumbnail}
                                    alt={post.title}
                                    className="w-full h-full object-cover 
                                        group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-5">
                                <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                    {post.category}
                                </span>
                                <h3 className="text-lg font-bold text-zinc-900 mt-2 mb-3 
                                    group-hover:text-red-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(post.date)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {post.readTime} phút
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RelatedPosts;
