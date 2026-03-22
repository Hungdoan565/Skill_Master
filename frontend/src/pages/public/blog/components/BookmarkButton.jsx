import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useBookmarks } from '../hooks/useAdvancedHooks';

// ============================================
// BOOKMARK BUTTON COMPONENT
// ============================================
// A reusable bookmark toggle button with animations
// Uses localStorage for persistence
// ============================================

export const BookmarkButton = ({
    postId,
    size = 'md', // 'sm' | 'md' | 'lg'
    variant = 'ghost', // 'ghost' | 'solid'
    showToast = true,
    className = ''
}) => {
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const bookmarked = isBookmarked(postId);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(postId);
    };

    return (
        <button
            onClick={handleClick}
            className={`
                ${sizeClasses[size]} rounded-full flex items-center justify-center
                transition-all duration-300 group/bookmark
                ${variant === 'solid'
                    ? bookmarked
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-muted text-muted-foreground/70 hover:bg-muted'
                    : bookmarked
                        ? 'text-red-600'
                        : 'text-zinc-300 hover:text-red-600'
                }
                ${className}
            `}
            aria-label={bookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
            aria-pressed={bookmarked}
        >
            {bookmarked ? (
                <BookmarkCheck
                    className={`${iconSizes[size]} fill-current 
                        group-hover/bookmark:scale-110 transition-transform`}
                />
            ) : (
                <Bookmark
                    className={`${iconSizes[size]} 
                        group-hover/bookmark:scale-110 transition-transform`}
                />
            )}
        </button>
    );
};

// ============================================
// BOOKMARKED POSTS SIDEBAR WIDGET
// ============================================
export const BookmarkedPostsWidget = ({ posts }) => {
    const { bookmarks, bookmarkCount } = useBookmarks();

    if (bookmarkCount === 0) return null;

    const bookmarkedPosts = posts.filter(post => bookmarks.includes(post.id));

    return (
        <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-red-600" />
                    Đã lưu
                </h3>
                <span className="text-xs font-medium text-muted-foreground/70 bg-muted px-2 py-1 rounded-full">
                    {bookmarkCount}
                </span>
            </div>
            <div className="space-y-4">
                {bookmarkedPosts.slice(0, 3).map(post => (
                    <a
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex gap-3 items-start"
                    >
                        <img
                            src={post.thumbnail}
                            alt={post.title}
                            className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground line-clamp-2 
                                group-hover:text-red-600 transition-colors">
                                {post.title}
                            </h4>
                            <span className="text-xs text-muted-foreground/70">{post.readTime} phút</span>
                        </div>
                    </a>
                ))}
            </div>
            {bookmarkCount > 3 && (
                <a
                    href="/bookmarks"
                    className="block mt-4 text-sm text-center text-red-600 hover:text-red-700 font-medium"
                >
                    Xem tất cả ({bookmarkCount})
                </a>
            )}
        </div>
    );
};

export default BookmarkButton;
