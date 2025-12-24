import React, { useEffect, useState } from 'react';

/**
 * Animated counter component with intersection observer
 * @param {number} end - Target number to count to
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} suffix - Suffix to append (e.g., '+', '%')
 */
export const Counter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        if (hasStarted) return;

        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        setHasStarted(true);
        return () => clearInterval(timer);
    }, [hasStarted, end, duration]);

    return <>{count.toLocaleString()}{suffix}</>;
};
