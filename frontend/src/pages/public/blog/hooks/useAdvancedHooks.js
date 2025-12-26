import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// COUNT-UP ANIMATION HOOK
// ============================================
// Animates a number from 0 to target when in view
// Usage: const count = useCountUp(1500, isInView, { duration: 2000 });
// ============================================
export const useCountUp = (target, shouldStart = true, options = {}) => {
    const { duration = 2000, startFrom = 0 } = options;
    const [count, setCount] = useState(startFrom);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!shouldStart || hasAnimated.current) return;

        hasAnimated.current = true;
        const startTime = performance.now();
        const diff = target - startFrom;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function: easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setCount(Math.floor(startFrom + diff * easeProgress));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [target, shouldStart, duration, startFrom]);

    return count;
};

// ============================================
// PARALLAX SCROLL HOOK
// ============================================
// Returns a Y offset based on scroll position
// Usage: const offset = useParallax(0.3); // 30% of scroll speed
// ============================================
export const useParallax = (speed = 0.5, maxOffset = 100) => {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const newOffset = Math.min(scrollY * speed, maxOffset);
            setOffset(newOffset);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed, maxOffset]);

    return offset;
};

// ============================================
// BOOKMARKS HOOK
// ============================================
// Manage bookmarked posts in localStorage
// ============================================
export const useBookmarks = () => {
    const STORAGE_KEY = 'skill_master_blog_bookmarks';

    const [bookmarks, setBookmarks] = useState(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    }, [bookmarks]);

    const addBookmark = useCallback((postId) => {
        setBookmarks(prev => {
            if (prev.includes(postId)) return prev;
            return [...prev, postId];
        });
    }, []);

    const removeBookmark = useCallback((postId) => {
        setBookmarks(prev => prev.filter(id => id !== postId));
    }, []);

    const toggleBookmark = useCallback((postId) => {
        setBookmarks(prev =>
            prev.includes(postId)
                ? prev.filter(id => id !== postId)
                : [...prev, postId]
        );
    }, []);

    const isBookmarked = useCallback((postId) => {
        return bookmarks.includes(postId);
    }, [bookmarks]);

    return {
        bookmarks,
        addBookmark,
        removeBookmark,
        toggleBookmark,
        isBookmarked,
        bookmarkCount: bookmarks.length
    };
};

// ============================================
// INFINITE SCROLL HOOK
// ============================================
// Detects when user scrolls near bottom
// ============================================
export const useInfiniteScroll = (callback, options = {}) => {
    const { threshold = 200, enabled = true } = options;
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const clientHeight = window.innerHeight;

            if (scrollHeight - scrollTop - clientHeight < threshold && !isLoading) {
                setIsLoading(true);
                Promise.resolve(callback()).finally(() => {
                    setIsLoading(false);
                });
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [callback, threshold, enabled, isLoading]);

    return { isLoading };
};

// ============================================
// MOUSE PARALLAX HOOK (for cards)
// ============================================
// Creates 3D tilt effect on hover
// ============================================
export const useMouseParallax = (intensity = 10) => {
    const ref = useRef(null);
    const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

    const handleMouseMove = useCallback((e) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * intensity;
        const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * intensity;

        setTransform({ rotateX, rotateY });
    }, [intensity]);

    const handleMouseLeave = useCallback(() => {
        setTransform({ rotateX: 0, rotateY: 0 });
    }, []);

    return {
        ref,
        style: {
            transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
            transition: 'transform 0.1s ease-out'
        },
        handlers: {
            onMouseMove: handleMouseMove,
            onMouseLeave: handleMouseLeave
        }
    };
};
