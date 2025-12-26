import React from 'react';
import { Helmet } from 'react-helmet-async';

// ============================================
// BLOG SEO COMPONENT
// ============================================
// Handles meta tags, Open Graph, Twitter Cards,
// and Schema.org structured data for blog posts
// ============================================

export const BlogSEO = ({
    title,
    description,
    image,
    url,
    author,
    datePublished,
    dateModified,
    category,
    tags,
    readTime,
    type = 'article' // 'article' | 'website'
}) => {
    const siteName = 'Skill Master';
    const siteUrl = 'https://skillmaster.vn';
    const defaultImage = `${siteUrl}/og-image.jpg`;

    const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
    const fullImage = image || defaultImage;
    const fullTitle = title ? `${title} | ${siteName}` : siteName;

    // Article Schema.org structured data
    const articleSchema = type === 'article' ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'description': description,
        'image': fullImage,
        'author': {
            '@type': 'Person',
            'name': author?.name || 'Skill Master Team',
        },
        'publisher': {
            '@type': 'Organization',
            'name': siteName,
            'logo': {
                '@type': 'ImageObject',
                'url': `${siteUrl}/logo.png`
            }
        },
        'datePublished': datePublished,
        'dateModified': dateModified || datePublished,
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': fullUrl
        },
        'articleSection': category,
        'keywords': tags?.join(', '),
        'wordCount': readTime ? readTime * 200 : undefined, // Estimate ~200 words per minute
        'timeRequired': readTime ? `PT${readTime}M` : undefined,
    } : null;

    // Blog listing page schema
    const blogSchema = type === 'website' ? {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': `${siteName} Blog`,
        'description': description,
        'url': fullUrl,
        'publisher': {
            '@type': 'Organization',
            'name': siteName,
            'logo': {
                '@type': 'ImageObject',
                'url': `${siteUrl}/logo.png`
            }
        }
    } : null;

    // Breadcrumb schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Trang chủ',
                'item': siteUrl
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Blog',
                'item': `${siteUrl}/blog`
            },
            ...(type === 'article' ? [{
                '@type': 'ListItem',
                'position': 3,
                'name': title,
                'item': fullUrl
            }] : [])
        ]
    };

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {tags && <meta name="keywords" content={tags.join(', ')} />}
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="vi_VN" />

            {type === 'article' && (
                <>
                    <meta property="article:published_time" content={datePublished} />
                    {dateModified && <meta property="article:modified_time" content={dateModified} />}
                    {author?.name && <meta property="article:author" content={author.name} />}
                    {category && <meta property="article:section" content={category} />}
                    {tags?.map((tag, i) => (
                        <meta key={i} property="article:tag" content={tag} />
                    ))}
                </>
            )}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Schema.org JSON-LD */}
            {articleSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(articleSchema)}
                </script>
            )}
            {blogSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(blogSchema)}
                </script>
            )}
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbSchema)}
            </script>
        </Helmet>
    );
};

// ============================================
// BLOG LIST PAGE SEO
// ============================================
export const BlogListSEO = ({ totalPosts, currentCategory }) => {
    const baseDescription = 'Kiến thức không giới hạn - Tips học tập, ôn thi IELTS, TOEIC và Tin học từ đội ngũ giảng viên Skill Master.';

    const title = currentCategory && currentCategory !== 'all'
        ? `Bài viết ${currentCategory.toUpperCase()}`
        : 'Blog & Tài nguyên';

    const description = currentCategory && currentCategory !== 'all'
        ? `Tổng hợp ${totalPosts} bài viết về ${currentCategory.toUpperCase()}. ${baseDescription}`
        : `Tổng hợp ${totalPosts} bài viết. ${baseDescription}`;

    return (
        <BlogSEO
            title={title}
            description={description}
            type="website"
        />
    );
};

export default BlogSEO;
