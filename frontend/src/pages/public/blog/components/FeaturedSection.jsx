import React from 'react';
import { Link } from 'react-router-dom';
import { useInView } from '../hooks/useBlogHooks';
import { formatDate } from '../constants/blog-data';

// ============================================
// FEATURED SECTION - HERO STYLE
// ============================================
export const FeaturedSection = ({ posts }) => {
    const [ref, isInView] = useInView();

    if (posts.length === 0) return null;
    const mainPost = posts[0];
    const sidePosts = posts.slice(1, 3);

    return (
        <section className="py-16 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className={`flex items-center gap-4 mb-10 transition-all duration-700
                    ${isInView ? 'opacity-100' : 'opacity-0'}`}
                    ref={ref}
                >
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            Bài viết nổi bật
                        </span>
                    </div>
                    <div className="flex-1 h-px bg-stone-200" />
                </div>

                {/* Featured Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Main Featured Post */}
                    <Link
                        to={`/blog/${mainPost.slug}`}
                        className="group relative rounded-3xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:row-span-2"
                    >
                        <img
                            src={mainPost.thumbnail}
                            alt={mainPost.title}
                            className="absolute inset-0 w-full h-full object-cover 
                                group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                            <span className="inline-block px-3 py-1.5 bg-red-600 text-white 
                                text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                                {mainPost.category}
                            </span>
                            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 
                                group-hover:text-red-400 transition-colors leading-tight">
                                {mainPost.title}
                            </h3>
                            <p className="text-white/70 mb-4 line-clamp-2">{mainPost.excerpt}</p>
                            <div className="flex items-center gap-4">
                                <img
                                    src={mainPost.author.avatar}
                                    alt={mainPost.author.name}
                                    className="w-10 h-10 rounded-full border-2 border-white/30"
                                />
                                <div>
                                    <p className="text-white font-medium">{mainPost.author.name}</p>
                                    <p className="text-white/60 text-sm">{formatDate(mainPost.date)} • {mainPost.readTime} min</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Side Posts */}
                    <div className="space-y-6">
                        {sidePosts.map((post) => (
                            <Link
                                key={post.id}
                                to={`/blog/${post.slug}`}
                                className="group flex gap-6 p-4 bg-stone-50 rounded-2xl
                                    hover:bg-white hover:shadow-lg hover:shadow-stone-200/50 
                                    transition-all duration-300"
                            >
                                <div className="w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                                    <img
                                        src={post.thumbnail}
                                        alt={post.title}
                                        className="w-full h-full object-cover 
                                            group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                                        {post.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-zinc-900 mt-1 mb-2 
                                        group-hover:text-red-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                                        <span>{formatDate(post.date)}</span>
                                        <span>•</span>
                                        <span>{post.readTime} phút đọc</span>
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

export default FeaturedSection;
