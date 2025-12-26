import { useState, useEffect, useRef } from 'react';

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================
export const useInView = (options = {}) => {
    const ref = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, ...options });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return [ref, isInView];
};

// ============================================
// REDUCED MOTION HOOK
// ============================================
export const useReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        const handler = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return prefersReducedMotion;
};

// ============================================
// READING PROGRESS HOOK
// ============================================
export const useReadingProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const readProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setProgress(Math.min(100, Math.max(0, readProgress)));
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();

        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return progress;
};

// ============================================
// SCROLL VISIBILITY HOOK
// ============================================
export const useScrollVisibility = (threshold = 500) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > threshold);
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        toggleVisibility();

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [threshold]);

    return isVisible;
};

// ============================================
// BLOG FILTERS HOOK
// ============================================
export const useBlogFilters = (posts, postsPerPage = 6) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);

    // Process posts based on filters
    const processedPosts = (() => {
        let result = [...posts];

        // Filter by category
        if (activeFilter !== 'all') {
            result = result.filter(post => post.category === activeFilter);
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.excerpt.toLowerCase().includes(term) ||
                post.tags?.some(tag => tag.toLowerCase().includes(term))
            );
        }

        // Sort
        switch (sortBy) {
            case 'oldest':
                result.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'popular':
                result.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'readTime':
                result.sort((a, b) => a.readTime - b.readTime);
                break;
            default: // newest
                result.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return result;
    })();

    // Pagination
    const totalPages = Math.ceil(processedPosts.length / postsPerPage);
    const paginatedPosts = processedPosts.slice(
        (currentPage - 1) * postsPerPage,
        currentPage * postsPerPage
    );

    // Handlers
    const handleFilterChange = (filterId) => {
        setActiveFilter(filterId);
        setCurrentPage(1);
    };

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleClear = () => {
        setActiveFilter('all');
        setSearchTerm('');
        setCurrentPage(1);
    };

    return {
        activeFilter,
        searchTerm,
        sortBy,
        currentPage,
        processedPosts,
        paginatedPosts,
        totalPages,
        setActiveFilter: handleFilterChange,
        setSearchTerm: handleSearchChange,
        setSortBy,
        setCurrentPage,
        clearFilters: handleClear,
    };
};
