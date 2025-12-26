import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_POSTS, formatDate } from '../constants/blog-data';

// ============================================
// SEARCH OVERLAY COMPONENT
// ============================================
export const SearchOverlay = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Simple search logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const filtered = MOCK_POSTS.filter(post =>
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 5);
        setResults(filtered);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Search Header */}
                <div className="relative p-6 border-b border-stone-100">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm kiếm bài viết, chủ đề..."
                        className="w-full pl-12 pr-12 py-3 text-lg bg-transparent border-none focus:ring-0 text-zinc-900 placeholder:text-zinc-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && onClose()}
                    />
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden sm:block">
                        <span className="text-[10px] font-bold text-zinc-400 px-1.5 py-0.5 rounded border border-stone-200">
                            ESC
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    {!query.trim() ? (
                        <div className="py-8 text-center">
                            <TrendingUp className="w-12 h-12 text-stone-100 mx-auto mb-4" />
                            <p className="text-zinc-500 font-medium">Nhập từ khóa để bắt đầu tìm kiếm</p>

                            <div className="mt-8 flex flex-wrap justify-center gap-2">
                                {['IELTS', 'TOEIC', 'Excel', 'Writing'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setQuery(tag)}
                                        className="px-4 py-2 bg-stone-50 text-zinc-600 text-sm font-medium rounded-xl hover:bg-stone-100 transition-colors"
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            {results.map(post => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.slug}`}
                                    onClick={onClose}
                                    className="group flex gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-100"
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                        <img
                                            src={post.thumbnail}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-zinc-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                                            {post.title}
                                        </h4>
                                        <p className="text-xs text-zinc-500 line-clamp-1 mt-1">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                                            <span className="text-red-600">{post.category}</span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(post.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="w-5 h-5 text-zinc-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-zinc-500">
                            Không tìm thấy kết quả cho "<span className="font-semibold">{query}</span>"
                        </div>
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="p-4 bg-stone-50 text-center border-t border-stone-100">
                        <Link
                            to={`/blog?search=${query}`}
                            onClick={onClose}
                            className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest"
                        >
                            Xem tất cả kết quả
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
