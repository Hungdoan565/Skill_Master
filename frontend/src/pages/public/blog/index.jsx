import React from 'react';
import { Helmet } from 'react-helmet-async';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';

export const BlogPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>Blog & Tài nguyên | Skill Master</title>
                <meta name="description" content="Kiến thức không giới hạn - Tips học tập, ôn thi IELTS, TOEIC và Tin học" />
            </Helmet>

            <PublicHeader />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 py-16">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-black mb-4">
                            Kiến thức không giới hạn
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Tips học tập, ôn thi IELTS, TOEIC và Tin học. Anh ngữ & Tin học.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mb-12">
                        <input
                            type="search"
                            placeholder="Tìm kiếm bài viết..."
                            className="w-full px-6 py-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-3 justify-center mb-12">
                        <button className="px-5 py-3 rounded-full bg-gray-900 text-white font-medium">
                            Tất cả <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">38</span>
                        </button>
                        <button className="px-5 py-3 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                            IELTS <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">18</span>
                        </button>
                        <button className="px-5 py-3 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                            TOEIC <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">15</span>
                        </button>
                        <button className="px-5 py-3 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                            Tin học <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">15</span>
                        </button>
                    </div>

                    {/* Featured Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6">Được đọc nhiều nhất</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Placeholder blog cards */}
                            {[1, 2, 3].map((i) => (
                                <article key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-video bg-gray-200"></div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                                            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">IELTS</span>
                                            <time>21 Dec 2025</time>
                                            <span>12 min đọc</span>
                                        </div>
                                        <h3 className="font-bold text-xl mb-2">
                                            Lộ trình tự học IELTS từ 5.0 lên 7.0 trong 6 tháng
                                        </h3>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default BlogPage;
