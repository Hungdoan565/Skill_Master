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
import { useReadingProgress } from './hooks/useBlogHooks';

// ============================================
// MOCK ARTICLE CONTENT
// ============================================
const MOCK_ARTICLE_CONTENT = `
<h2 id="gioi-thieu">Giới thiệu</h2>
<p>
    Trong bài viết này, chúng ta sẽ cùng tìm hiểu chi tiết về lộ trình học tập hiệu quả. Với kinh nghiệm nhiều năm 
    giảng dạy, tôi đã tổng hợp những phương pháp học tập khoa học nhất giúp bạn đạt được mục tiêu.
</p>

<blockquote>
    "Học không phải là việc ghi nhớ thông tin, mà là khơi dậy khả năng tư duy và sáng tạo." - Albert Einstein
</blockquote>

<h2 id="phuong-phap-hoc">Phương pháp học tập hiệu quả</h2>
<p>
    Việc học tập hiệu quả đòi hỏi sự kết hợp giữa lý thuyết và thực hành. Dưới đây là những bước quan trọng:
</p>

<h3 id="lap-ke-hoach">1. Lập kế hoạch học tập</h3>
<p>
    Đầu tiên, bạn cần xác định rõ mục tiêu học tập của mình. Mục tiêu cần cụ thể, đo lường được và có thời hạn rõ ràng.
</p>
<ul>
    <li>Xác định điểm số mục tiêu</li>
    <li>Phân bổ thời gian hợp lý cho từng kỹ năng</li>
    <li>Theo dõi tiến độ học tập hàng tuần</li>
</ul>

<h3 id="tai-lieu-hoc">2. Chọn tài liệu phù hợp</h3>
<p>
    Tài liệu học tập đóng vai trò quan trọng trong quá trình ôn luyện. Hãy chọn những nguồn tài liệu uy tín và phù hợp với trình độ hiện tại.
</p>

<pre><code>// Ví dụ cấu trúc học tập theo tuần
const weeklyPlan = {
    monday: ['Vocabulary', 'Reading'],
    tuesday: ['Listening', 'Speaking'],
    wednesday: ['Writing Task 1'],
    thursday: ['Grammar Review'],
    friday: ['Full Practice Test']
};</code></pre>

<h3 id="luyen-tap">3. Luyện tập đều đặn</h3>
<p>
    Không có con đường tắt nào dẫn đến thành công. Việc luyện tập đều đặn mỗi ngày sẽ giúp bạn củng cố kiến thức và phát triển kỹ năng.
</p>

<figure>
    <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800" alt="Study plan" />
    <figcaption>Lập kế hoạch học tập khoa học giúp tối ưu hiệu quả</figcaption>
</figure>

<h2 id="meo-hay">Mẹo hay khi học</h2>
<p>
    Dưới đây là một số mẹo nhỏ giúp bạn học tập hiệu quả hơn:
</p>
<ol>
    <li><strong>Pomodoro Technique:</strong> Học 25 phút, nghỉ 5 phút</li>
    <li><strong>Active Recall:</strong> Tự kiểm tra kiến thức thay vì đọc lại</li>
    <li><strong>Spaced Repetition:</strong> Ôn tập theo chu kỳ tăng dần</li>
    <li><strong>Mind Mapping:</strong> Sử dụng sơ đồ tư duy để ghi nhớ</li>
</ol>

<h2 id="ket-luan">Kết luận</h2>
<p>
    Học tập là một hành trình dài, đòi hỏi sự kiên trì và phương pháp đúng đắn. Hy vọng những chia sẻ trên sẽ giúp ích cho bạn trong quá trình chinh phục mục tiêu.
</p>
<p>
    Nếu bạn có bất kỳ câu hỏi nào, hãy để lại bình luận bên dưới. Chúc bạn học tập hiệu quả!
</p>
`;

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

                            {/* Article Content */}
                            <div ref={contentRef}>
                                <ArticleContent content={MOCK_ARTICLE_CONTENT} />
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
