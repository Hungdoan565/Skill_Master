import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Check, ChevronLeft, ChevronRight, Clock, Printer } from 'lucide-react';

// ============================================
// READING TIME PROGRESS
// ============================================
// Shows "3/12 phút đọc" based on scroll position
// ============================================
export const ReadingTimeProgress = ({ totalMinutes, progress }) => {
    const currentMinute = Math.max(1, Math.ceil((progress / 100) * totalMinutes));

    return (
        <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-600">
                <span className="font-semibold text-red-600">{currentMinute}</span>
                <span className="text-zinc-400">/{totalMinutes} phút</span>
            </span>
            {/* Mini progress bar */}
            <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// ============================================
// COPY LINK BUTTON
// ============================================
// Copies current URL to clipboard with toast feedback
// ============================================
export const CopyLinkButton = ({ url, className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`group relative flex items-center gap-2 px-4 py-2 
                bg-stone-100 hover:bg-stone-200 rounded-xl transition-all duration-300
                ${copied ? 'bg-green-50 text-green-600' : 'text-zinc-600'}
                ${className}`}
            aria-label={copied ? 'Đã sao chép' : 'Sao chép liên kết'}
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Đã sao chép!</span>
                </>
            ) : (
                <>
                    <Link2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Sao chép link</span>
                </>
            )}
        </button>
    );
};

// ============================================
// PRINT BUTTON
// ============================================
export const PrintButton = ({ className = '' }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <button
            onClick={handlePrint}
            className={`flex items-center gap-2 px-4 py-2 
                bg-stone-100 hover:bg-stone-200 text-zinc-600 
                rounded-xl transition-all duration-300 ${className}`}
            aria-label="In bài viết"
        >
            <Printer className="w-4 h-4" />
            <span className="text-sm font-medium">In bài viết</span>
        </button>
    );
};

// ============================================
// POST NAVIGATION (NEXT/PREVIOUS)
// ============================================
// Navigate between posts in same category
// ============================================
export const PostNavigation = ({ currentPost, allPosts }) => {
    // Get posts in same category, sorted by date
    const categoryPosts = useMemo(() => {
        return allPosts
            .filter(p => p.category === currentPost.category)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [currentPost, allPosts]);

    // Find current index
    const currentIndex = categoryPosts.findIndex(p => p.id === currentPost.id);

    // Get prev/next (newer = prev, older = next in sorted order)
    const prevPost = currentIndex > 0 ? categoryPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < categoryPosts.length - 1 ? categoryPosts[currentIndex + 1] : null;

    if (!prevPost && !nextPost) return null;

    return (
        <nav className="py-12 border-t border-stone-200" aria-label="Điều hướng bài viết">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Previous Post */}
                {prevPost ? (
                    <Link
                        to={`/blog/${prevPost.slug}`}
                        className="group flex items-start gap-4 p-6 bg-stone-50 rounded-2xl
                            hover:bg-white hover:shadow-lg hover:shadow-stone-200/50
                            border border-transparent hover:border-stone-200
                            transition-all duration-300"
                    >
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center
                            group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                Bài trước
                            </span>
                            <p className="text-zinc-900 font-medium mt-1 line-clamp-2
                                group-hover:text-red-600 transition-colors">
                                {prevPost.title}
                            </p>
                            <span className="text-xs text-zinc-400 mt-1 block">
                                {prevPost.readTime} phút đọc
                            </span>
                        </div>
                    </Link>
                ) : (
                    <div /> // Empty placeholder for grid
                )}

                {/* Next Post */}
                {nextPost ? (
                    <Link
                        to={`/blog/${nextPost.slug}`}
                        className="group flex items-start gap-4 p-6 bg-stone-50 rounded-2xl
                            hover:bg-white hover:shadow-lg hover:shadow-stone-200/50
                            border border-transparent hover:border-stone-200
                            transition-all duration-300 text-right md:flex-row-reverse"
                    >
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center
                            group-hover:bg-red-100 group-hover:text-red-600 transition-colors flex-shrink-0">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                Bài tiếp
                            </span>
                            <p className="text-zinc-900 font-medium mt-1 line-clamp-2
                                group-hover:text-red-600 transition-colors">
                                {nextPost.title}
                            </p>
                            <span className="text-xs text-zinc-400 mt-1 block">
                                {nextPost.readTime} phút đọc
                            </span>
                        </div>
                    </Link>
                ) : (
                    <div /> // Empty placeholder for grid
                )}
            </div>
        </nav>
    );
};

// ============================================
// ARTICLE TOOLBAR (Combined utilities)
// ============================================
// Sticky toolbar with copy, print, progress
// ============================================
export const ArticleToolbar = ({ url, totalMinutes, progress }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 300px
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40
            bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl
            shadow-xl shadow-stone-200/50 px-4 py-3
            flex items-center gap-4 transition-all duration-500
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        >
            <ReadingTimeProgress totalMinutes={totalMinutes} progress={progress} />
            <div className="w-px h-6 bg-stone-200" />
            <CopyLinkButton url={url} />
            <PrintButton />
        </div>
    );
};

export default {
    ReadingTimeProgress,
    CopyLinkButton,
    PrintButton,
    PostNavigation,
    ArticleToolbar
};
