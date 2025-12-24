import { useEffect, useRef, useState } from 'react';

/**
 * Intersection Observer hook for scroll animations
 * Triggers when element enters viewport
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} [ref, isInView] - Ref to attach to element and visibility state
 */
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
