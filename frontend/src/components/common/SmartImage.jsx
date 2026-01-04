import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming shadcn utils exist, typically used in this stack

/**
 * SmartImage Component
 * 
 * Performance optimized image component with:
 * - Lazy loading (via native loading="lazy")
 * - Blur-up placeholder effect
 * - Error fallback handling
 * - Aspect ratio support
 * - Smooth transitions
 */
export const SmartImage = ({
    src,
    alt,
    className,
    aspectRatio = 'aspect-video', // default standard ratio
    fit = 'object-cover',
    priority = false, // if true, sets loading="eager"
    fallbackSrc = null, // optional custom fallback image URL
    containerClassName,
    ...props
}) => {
    const [isLoading, setIsLoading] = useState(!priority);
    const [isError, setIsError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    useEffect(() => {
        setCurrentSrc(src);
        setIsError(false);
        if (!priority) setIsLoading(true);
    }, [src, priority]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setIsError(true);
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-stone-100",
                aspectRatio,
                containerClassName
            )}
        >
            {/* Fallback / Error State */}
            {isError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center">
                    {fallbackSrc ? (
                        <img
                            src={fallbackSrc}
                            alt={alt || "Fallback"}
                            className={cn("w-full h-full", fit)}
                        />
                    ) : (
                        <>
                            <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs font-medium">Image not found</span>
                        </>
                    )}
                </div>
            )}

            {/* Main Image */}
            {!isError && (
                <img
                    src={currentSrc}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={cn(
                        "w-full h-full transition-all duration-500 ease-in-out",
                        fit,
                        isLoading ? "scale-105 blur-lg opacity-0" : "scale-100 blur-0 opacity-100",
                        className
                    )}
                    {...props}
                />
            )}

            {/* Loading Skeleton/Blur Placeholder (visible when loading) */}
            {isLoading && !isError && (
                <div className="absolute inset-0 bg-stone-200 animate-pulse" aria-hidden="true" />
            )}
        </div>
    );
};

export default SmartImage;
