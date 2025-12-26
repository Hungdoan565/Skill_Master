import React, { useRef, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PublicHeader from '@/components/layout/public-header';
import { Footer } from '@/pages/landing/components/footer';

// Components
import {
    ArticleHero,
    ArticleContent,
    TableOfContents,
    useTableOfContents,
    AuthorCard,
    RelatedPosts,
    FloatingSocialShare,
    SocialShare,
    NewsletterSection,
    BackToTopButton,
    ReadingProgressBar,
    Breadcrumbs,
    BlogSEO
} from './components';

// Data & Hooks
import { MOCK_POSTS, getRelatedPosts } from './constants/blog-data';
import { getArticleContent } from './constants/article-content';
import { useReadingProgress } from './hooks/useBlogHooks';

// ============================================
// BLOG DETAIL PAGE
// ============================================
const BlogDetailPage = () => {
    const { slug } = useParams();
    const contentRef = useRef(null);
    const readingProgress = useReadingProgress();

    // Find post by slug
    const post = useMemo(() =>
        MOCK_POSTS.find(p => p.slug === slug),
        [slug]
    );

    // Get article content for this post
    const articleContent = useMemo(() =>
        getArticleContent(slug),
        [slug]
    );

    // Get related posts
    const relatedPosts = useMemo(() =>
        post ? getRelatedPosts(post, MOCK_POSTS, 3) : [],
        [post]
    );

    // Extract headings for TOC
    const { headings, activeId } = useTableOfContents(contentRef);

    // 404 if post not found
    if (!post) {
        return <Navigate to="/blog" replace />;
    }

    // Share URL
    const shareUrl = typeof window !== 'undefined'
        ? window.location.href
        : `https://skillmaster.vn/blog/${slug}`;

    return (
        <div className="min-h-screen bg-white">
            {/* SEO */}
            <BlogSEO post={post} />

            {/* Reading Progress */}
            <ReadingProgressBar progress={readingProgress} />

            {/* Header */}
            <PublicHeader />

            {/* Breadcrumbs */}
            <Breadcrumbs items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Blog', href: '/blog' },
                { label: post.title }
            ]} />

            <main>
                {/* Hero */}
                <ArticleHero post={post} />

                {/* Article Layout */}
                <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
                    <div className="flex flex-col xl:flex-row gap-12">
                        {/* Floating Share (left) */}
                        <aside className="hidden lg:block w-16 flex-shrink-0">
                            <div className="sticky top-24">
                                <FloatingSocialShare
                                    url={shareUrl}
                                    title={post.title}
                                />
                            </div>
                        </aside>

                        {/* Main Content (center) */}
                        <article className="flex-1 max-w-3xl mx-auto xl:mx-0">
                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {post.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-4 py-2 bg-stone-100 text-zinc-600 text-sm 
                                                font-medium rounded-full hover:bg-red-50 
                                                hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Article Content - Dynamic based on slug */}
                            <div ref={contentRef}>
                                <ArticleContent content={articleContent} />
                            </div>

                            {/* Inline Share */}
                            <div className="mt-12 pt-8 border-t border-stone-200">
                                <p className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
                                    Chia sẻ bài viết
                                </p>
                                <SocialShare url={shareUrl} title={post.title} />
                            </div>

                            {/* Author Card */}
                            <AuthorCard author={post.author} />
                        </article>

                        {/* Table of Contents (right) */}
                        <aside className="hidden xl:block w-72 flex-shrink-0">
                            <TableOfContents headings={headings} activeId={activeId} />
                        </aside>
                    </div>
                </div>

                {/* Related Posts */}
                <section className="bg-stone-50 py-16">
                    <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                        <RelatedPosts
                            currentPost={post}
                            allPosts={MOCK_POSTS}
                        />
                    </div>
                </section>

                {/* Newsletter */}
                <NewsletterSection />
            </main>

            {/* Footer */}
            <Footer />

            {/* Back to Top */}
            <BackToTopButton />
        </div>
    );
};

export default BlogDetailPage;
