import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEOHead - Unified SEO Component
 * Handles standard meta tags, Open Graph, Twitter Cards, and JSON-LD Structured Data
 */
const SEOHead = ({
    title,
    description,
    image,
    url,
    canonical,
    type = 'website', // website, article, course, etc.
    keywords,
    schema, // Optional JSON-LD object or array
    noindex = false,
    author,
    publishedTime,
    modifiedTime,
    section
}) => {
    const siteName = 'Skill Master';
    const siteUrl = 'https://skillmaster.vn'; // Base URL from env or constant
    const defaultDescription = 'Skill Master - Hệ thống đào tạo kỹ năng chuyên nghiệp hàng đầu Việt Nam.';
    const defaultImage = `${siteUrl}/og-image-default.jpg`;

    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const metaDescription = description || defaultDescription;
    const metaImage = image || defaultImage;
    const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
    const metaCanonical = canonical || metaUrl;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            {keywords && <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />}
            <link rel="canonical" href={metaCanonical} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph */}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={title || siteName} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:locale" content="vi_VN" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title || siteName} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* Article Specific Tags */}
            {type === 'article' && (
                <>
                    {publishedTime && <meta property="article:published_time" content={publishedTime} />}
                    {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
                    {author && <meta property="article:author" content={author} />}
                    {section && <meta property="article:section" content={section} />}
                </>
            )}

            {/* Structured Data (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEOHead;
