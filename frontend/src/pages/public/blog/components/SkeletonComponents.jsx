import React from 'react';

// ============================================
// SKELETON COMPONENTS FOR BLOG LOADING STATES
// ============================================

// Base shimmer animation
const shimmerClass = `
    relative overflow-hidden
    before:absolute before:inset-0 
    before:-translate-x-full before:animate-[shimmer_1.5s_infinite]
    before:bg-gradient-to-r before:from-transparent 
    before:via-white/20 before:to-transparent
`;

// Article Hero Skeleton
export const ArticleHeroSkeleton = () => (
    <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-end overflow-hidden bg-zinc-900">
        {/* Background placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900" />

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 pb-16 lg:pb-24 w-full">
            {/* Back link skeleton */}
            <div className={`w-32 h-6 bg-white/10 rounded-full mb-8 ${shimmerClass}`} />

            {/* Category badges */}
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-24 h-10 bg-white/10 rounded-full ${shimmerClass}`} />
                <div className={`w-20 h-10 bg-white/10 rounded-full ${shimmerClass}`} />
            </div>

            {/* Title skeleton */}
            <div className="space-y-4 max-w-4xl mb-8">
                <div className={`h-12 bg-white/10 rounded-xl w-full ${shimmerClass}`} />
                <div className={`h-12 bg-white/10 rounded-xl w-3/4 ${shimmerClass}`} />
            </div>

            {/* Meta row skeleton */}
            <div className="flex flex-wrap items-center gap-6">
                {/* Author */}
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-white/10 rounded-full ${shimmerClass}`} />
                    <div className="space-y-2">
                        <div className={`w-32 h-5 bg-white/10 rounded ${shimmerClass}`} />
                        <div className={`w-24 h-4 bg-white/10 rounded ${shimmerClass}`} />
                    </div>
                </div>

                <div className="hidden sm:block w-px h-12 bg-white/10" />

                {/* Stats */}
                <div className="flex items-center gap-6">
                    <div className={`w-28 h-5 bg-white/10 rounded ${shimmerClass}`} />
                    <div className={`w-24 h-5 bg-white/10 rounded ${shimmerClass}`} />
                    <div className={`w-28 h-5 bg-white/10 rounded ${shimmerClass}`} />
                </div>
            </div>
        </div>
    </section>
);

// Article Content Skeleton
export const ArticleContentSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Paragraph blocks */}
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
                {/* Heading */}
                {i % 2 === 0 && (
                    <div className={`h-8 bg-stone-200 rounded-lg w-2/3 ${shimmerClass}`} />
                )}
                {/* Lines */}
                <div className={`h-5 bg-stone-100 rounded w-full ${shimmerClass}`} />
                <div className={`h-5 bg-stone-100 rounded w-full ${shimmerClass}`} />
                <div className={`h-5 bg-stone-100 rounded w-5/6 ${shimmerClass}`} />
                <div className={`h-5 bg-stone-100 rounded w-4/5 ${shimmerClass}`} />
            </div>
        ))}

        {/* Image placeholder */}
        <div className={`h-64 bg-stone-200 rounded-2xl ${shimmerClass}`} />

        {/* More paragraphs */}
        {[5, 6].map((i) => (
            <div key={i} className="space-y-3">
                <div className={`h-5 bg-stone-100 rounded w-full ${shimmerClass}`} />
                <div className={`h-5 bg-stone-100 rounded w-11/12 ${shimmerClass}`} />
                <div className={`h-5 bg-stone-100 rounded w-full ${shimmerClass}`} />
            </div>
        ))}
    </div>
);

// Sidebar Skeleton
export const SidebarSkeleton = () => (
    <div className="space-y-8">
        {/* TOC Skeleton */}
        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 bg-stone-200 rounded-lg ${shimmerClass}`} />
                <div className={`w-20 h-5 bg-stone-200 rounded ${shimmerClass}`} />
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-8 bg-stone-100 rounded-lg ${shimmerClass}`} />
                ))}
            </div>
        </div>

        {/* Widget Skeleton */}
        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
            <div className={`w-32 h-5 bg-stone-200 rounded mb-4 ${shimmerClass}`} />
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <div className={`w-16 h-16 bg-stone-200 rounded-xl ${shimmerClass}`} />
                        <div className="flex-1 space-y-2">
                            <div className={`h-4 bg-stone-200 rounded w-full ${shimmerClass}`} />
                            <div className={`h-3 bg-stone-100 rounded w-2/3 ${shimmerClass}`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Comment Skeleton
export const CommentsSkeleton = () => (
    <div className="space-y-6">
        {/* Comment input skeleton */}
        <div className="flex gap-4">
            <div className={`w-12 h-12 bg-stone-200 rounded-full ${shimmerClass}`} />
            <div className={`flex-1 h-24 bg-stone-100 rounded-xl ${shimmerClass}`} />
        </div>

        {/* Comments list skeleton */}
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-stone-100">
                <div className={`w-10 h-10 bg-stone-200 rounded-full ${shimmerClass}`} />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-28 h-4 bg-stone-200 rounded ${shimmerClass}`} />
                        <div className={`w-16 h-3 bg-stone-100 rounded ${shimmerClass}`} />
                    </div>
                    <div className={`h-4 bg-stone-100 rounded w-full ${shimmerClass}`} />
                    <div className={`h-4 bg-stone-100 rounded w-4/5 ${shimmerClass}`} />
                </div>
            </div>
        ))}
    </div>
);

// Add shimmer keyframe to tailwind config or use inline style
// For now, we'll add it as a style tag in the component
export const ShimmerStyles = () => (
    <style>{`
        @keyframes shimmer {
            100% {
                transform: translateX(100%);
            }
        }
    `}</style>
);

export default {
    ArticleHeroSkeleton,
    ArticleContentSkeleton,
    SidebarSkeleton,
    CommentsSkeleton,
    ShimmerStyles
};
